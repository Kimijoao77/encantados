#!/usr/bin/env python3
"""
Renderiza os Encantados no Blender e gera os sprites do jogo.

Uso:
  python3 ferramentas/blender/render.py guarito ariri        # só esses
  python3 ferramentas/blender/render.py --todos              # todos os que têm modelo
  python3 ferramentas/blender/render.py guarito --previa     # rápido, só para conferir (salva em /tmp/previa)

Precisa de: pip install bpy scikit-image pillow numpy
Saída: assets/criaturas/<id>.png (frente), <id>_costas.png (costas) e atualiza assets/manifest.json
"""
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from PIL import Image, ImageFilter

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
sys.path.insert(0, str(AQUI))
from sdf import hexrgb  # noqa: E402
import modelos  # noqa: E402

SAIDA = RAIZ / 'assets' / 'criaturas'
MANIFESTO = RAIZ / 'assets' / 'manifest.json'
TAM_FINAL = 256
CONTORNO = (34, 28, 44)


# ── materiais ─────────────────────────────────────────────
def _material(nome):
    m = bpy.data.materials.new(nome)
    try:
        m.use_nodes = True
    except Exception:  # noqa: BLE001
        pass
    nt = m.node_tree
    nt.nodes.clear()
    return m, nt


def _cor_detalhada(nt, atributo='Cor', ruido=0.10, escala_ruido=9.0):
    """Cor do vértice + manchinhas sutis + escurecimento nas dobras (oclusão). Tira o ar de plástico liso."""
    c = nt.nodes.new('ShaderNodeAttribute')
    c.attribute_name = atributo
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = escala_ruido
    n.inputs['Detail'].default_value = 3.0
    hsv = nt.nodes.new('ShaderNodeHueSaturation')
    mapa = nt.nodes.new('ShaderNodeMapRange')
    mapa.inputs['From Min'].default_value, mapa.inputs['From Max'].default_value = 0.3, 0.7
    mapa.inputs['To Min'].default_value, mapa.inputs['To Max'].default_value = 1.0 - ruido, 1.0 + ruido
    nt.links.new(n.outputs['Fac'], mapa.inputs['Value'])
    nt.links.new(mapa.outputs['Result'], hsv.inputs['Value'])
    nt.links.new(c.outputs['Color'], hsv.inputs['Color'])
    ao = nt.nodes.new('ShaderNodeAmbientOcclusion')
    ao.inputs['Distance'].default_value = 0.25
    ao.samples = 4
    rampa = nt.nodes.new('ShaderNodeMapRange')
    rampa.inputs['From Min'].default_value, rampa.inputs['From Max'].default_value = 0.35, 0.95
    rampa.inputs['To Min'].default_value, rampa.inputs['To Max'].default_value = 0.45, 1.0
    nt.links.new(ao.outputs['AO'], rampa.inputs['Value'])
    mult = nt.nodes.new('ShaderNodeMix')
    mult.data_type, mult.blend_type = 'RGBA', 'MULTIPLY'
    mult.inputs['Factor'].default_value = 1.0
    nt.links.new(hsv.outputs['Color'], mult.inputs['A'])
    nt.links.new(rampa.outputs['Result'], mult.inputs['B'])
    return mult.outputs['Result']


def mat_pele(nome, rugosidade=0.55, verniz=0.0, brilho_sheen=0.25, relevo=None):
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(_cor_detalhada(nt), b.inputs['Base Color'])
    if relevo:  # 'escamas' ou 'couro'
        tex = nt.nodes.new('ShaderNodeTexVoronoi')
        tex.feature = 'DISTANCE_TO_EDGE' if relevo == 'escamas' else 'F1'
        tex.inputs['Scale'].default_value = 26.0 if relevo == 'escamas' else 40.0
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.55 if relevo == 'escamas' else 0.25
        bump.inputs['Distance'].default_value = 0.02
        nt.links.new(tex.outputs['Distance'], bump.inputs['Height'])
        nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = rugosidade
    b.inputs['Coat Weight'].default_value = verniz
    b.inputs['Sheen Weight'].default_value = brilho_sheen
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m


def mat_fogo(nome, forca=2.6):
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    e = nt.nodes.new('ShaderNodeEmission')
    c = nt.nodes.new('ShaderNodeVertexColor')
    c.layer_name = 'Cor'
    nt.links.new(c.outputs['Color'], e.inputs['Color'])
    e.inputs['Strength'].default_value = forca
    nt.links.new(e.outputs['Emission'], out.inputs['Surface'])
    return m


def mat_asa(nome, alfa=0.55, emissao=0.0):
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    c = nt.nodes.new('ShaderNodeVertexColor')
    c.layer_name = 'Cor'
    nt.links.new(c.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.25
    b.inputs['Alpha'].default_value = alfa
    if emissao:
        nt.links.new(c.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = emissao
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m


def mat_pelo(nome):
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    c = nt.nodes.new('ShaderNodeAttribute')
    c.attribute_name = 'CorC'
    # raiz mais escura, ponta mais clara: dá volume ao pelo
    info = nt.nodes.new('ShaderNodeHairInfo')
    rampa = nt.nodes.new('ShaderNodeMapRange')
    rampa.inputs['To Min'].default_value, rampa.inputs['To Max'].default_value = 0.62, 1.18
    nt.links.new(info.outputs['Intercept'], rampa.inputs['Value'])
    # cada mecha um pouco mais clara ou escura que a vizinha
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    mapa = nt.nodes.new('ShaderNodeMapping')
    mapa.inputs['Scale'].default_value = (9.0, 30.0, 14.0)
    nt.links.new(geo.outputs['Position'], mapa.inputs['Vector'])
    ruido = nt.nodes.new('ShaderNodeTexNoise')
    ruido.inputs['Scale'].default_value = 1.0
    ruido.inputs['Detail'].default_value = 2.0
    nt.links.new(mapa.outputs['Vector'], ruido.inputs['Vector'])
    sorte = nt.nodes.new('ShaderNodeMapRange')
    sorte.inputs['From Min'].default_value, sorte.inputs['From Max'].default_value = 0.3, 0.7
    sorte.inputs['To Min'].default_value, sorte.inputs['To Max'].default_value = 0.72, 1.22
    nt.links.new(ruido.outputs['Fac'], sorte.inputs['Value'])
    vezes = nt.nodes.new('ShaderNodeMath')
    vezes.operation = 'MULTIPLY'
    nt.links.new(rampa.outputs['Result'], vezes.inputs[0])
    nt.links.new(sorte.outputs['Result'], vezes.inputs[1])
    hsv = nt.nodes.new('ShaderNodeHueSaturation')
    nt.links.new(c.outputs['Color'], hsv.inputs['Color'])
    nt.links.new(vezes.outputs['Value'], hsv.inputs['Value'])
    nt.links.new(hsv.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.5
    b.inputs['Sheen Weight'].default_value = 0.3
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m


def mat_olho(nome, cor, iris):
    """Olho com pupila, íris colorida e borda escura (o polo +X do olho é para onde ele olha)."""
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
    r = nt.nodes.new('ShaderNodeValToRGB')
    r.color_ramp.interpolation = 'LINEAR'
    escuro = tuple(float(x) for x in hexrgb(cor)) + (1.0,)
    ir = tuple(float(x) for x in hexrgb(iris)) + (1.0,)
    ir_claro = tuple(min(1.0, float(x) * 2.2 + 0.03) for x in hexrgb(iris)) + (1.0,)
    e = r.color_ramp.elements
    e[0].position, e[0].color = 0.0, escuro
    e[1].position, e[1].color = 0.50, escuro
    for pos, corx in ((0.54, ir), (0.80, ir_claro), (0.83, (0, 0, 0, 1)), (1.0, (0, 0, 0, 1))):
        el = e.new(pos)
        el.color = corx
    nt.links.new(sep.outputs['X'], r.inputs['Fac'])
    # reflexos brancos pintados (um grande em cima, um pequeno embaixo)
    norm = nt.nodes.new('ShaderNodeVectorMath')
    norm.operation = 'NORMALIZE'
    nt.links.new(tc.outputs['Object'], norm.inputs[0])
    total = None
    for direcao, limite in (((0.84, 0.0, 0.54), 0.955), ((0.88, 0.0, -0.47), 0.99)):
        dot = nt.nodes.new('ShaderNodeVectorMath')
        dot.operation = 'DOT_PRODUCT'
        nt.links.new(norm.outputs['Vector'], dot.inputs[0])
        dot.inputs[1].default_value = direcao
        maior = nt.nodes.new('ShaderNodeMath')
        maior.operation = 'GREATER_THAN'
        maior.inputs[1].default_value = limite
        nt.links.new(dot.outputs['Value'], maior.inputs[0])
        if total is None:
            total = maior.outputs['Value']
        else:
            soma = nt.nodes.new('ShaderNodeMath')
            soma.operation = 'MAXIMUM'
            nt.links.new(total, soma.inputs[0])
            nt.links.new(maior.outputs['Value'], soma.inputs[1])
            total = soma.outputs['Value']
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    nt.links.new(total, mix.inputs['Factor'])
    nt.links.new(r.outputs['Color'], mix.inputs['A'])
    mix.inputs['B'].default_value = (1, 1, 1, 1)
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    nt.links.new(total, b.inputs['Emission Strength'])
    b.inputs['Emission Color'].default_value = (1, 1, 1, 1)
    b.inputs['Roughness'].default_value = 0.06
    b.inputs['Coat Weight'].default_value = 1.0
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m


def mat_bolha(nome):
    """Bolha d'água: azul clarinho, meio transparente, mais opaca nas bordas."""
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (0.45, 0.78, 1.0, 1.0)
    e.inputs['Strength'].default_value = 1.0
    t = nt.nodes.new('ShaderNodeBsdfTransparent')
    lw = nt.nodes.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.35
    faixa = nt.nodes.new('ShaderNodeMapRange')
    faixa.inputs['To Min'].default_value, faixa.inputs['To Max'].default_value = 0.25, 0.95
    nt.links.new(lw.outputs['Facing'], faixa.inputs['Value'])
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(faixa.outputs['Result'], mix.inputs['Fac'])
    nt.links.new(t.outputs['BSDF'], mix.inputs[1])
    nt.links.new(e.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return m


def mat_simples(nome, cor, rugosidade=0.12, emissao=0.0):
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    rgb = tuple(float(x) for x in hexrgb(cor)) + (1.0,)
    b.inputs['Base Color'].default_value = rgb
    b.inputs['Roughness'].default_value = rugosidade
    b.inputs['Coat Weight'].default_value = 0.6
    if emissao:
        b.inputs['Emission Color'].default_value = rgb
        b.inputs['Emission Strength'].default_value = emissao
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m


def material_da_camada(camada):
    if camada.startswith('fogo'):
        return mat_fogo(camada)
    if camada.startswith('luz'):
        return mat_fogo(camada, forca=1.6)
    if camada.startswith('asa_bolha'):
        return mat_bolha(camada)
    if camada.startswith('asa'):
        return mat_asa(camada)
    if camada.startswith('fantasma'):
        return mat_asa(camada, alfa=0.8)
    if camada.startswith('liso'):
        return mat_pele(camada, rugosidade=0.25, verniz=0.5, brilho_sheen=0.0)
    if camada.startswith('escama'):
        return mat_pele(camada, rugosidade=0.45, relevo='escamas')
    if camada.startswith('couro'):
        return mat_pele(camada, rugosidade=0.6, relevo='couro')
    return mat_pele(camada)


# ── cena ──────────────────────────────────────────────────
def nova_cena(amostras, resolucao):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = amostras
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = resolucao
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    for vt in ('Standard',):
        try:
            sc.view_settings.view_transform = vt
        except Exception:  # noqa: BLE001
            pass
    w = bpy.data.worlds.new('mundo')
    try:
        w.use_nodes = True
    except Exception:  # noqa: BLE001
        pass
    bg = next(n for n in w.node_tree.nodes if n.bl_idname == 'ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.82, 0.88, 1.0, 1.0)
    bg.inputs['Strength'].default_value = 0.75
    sc.world = w
    return sc


def criar_pelo(ob, pelo, cfg):
    """Pelo de verdade (fios) nascendo da malha, com a cor da pele embaixo."""
    me = ob.data
    n = len(me.vertices)
    pt = np.zeros(n * 4, dtype=np.float32)
    me.color_attributes['Cor'].data.foreach_get('color', pt)
    pt = pt.reshape(-1, 4)
    li = np.zeros(len(me.loops), dtype=np.int32)
    me.loops.foreach_get('vertex_index', li)
    ca = me.color_attributes.new(name='CorC', type='BYTE_COLOR', domain='CORNER')
    ca.data.foreach_set('color', pt[li].ravel())
    maximo = max(float(pelo.max()), 1e-3)
    gl = ob.vertex_groups.new(name='pelo_comp')
    gd = ob.vertex_groups.new(name='pelo_dens')
    pesos = np.clip(pelo / maximo, 0, 1)
    for nivel in np.unique(np.round(pesos, 2)):
        idx = np.nonzero(np.round(pesos, 2) == nivel)[0].tolist()
        gl.add(idx, float(nivel), 'REPLACE')
        gd.add(idx, 1.0 if nivel > 0.03 else 0.0, 'REPLACE')
    me.materials.append(mat_pelo('pelo'))
    ob.modifiers.new('pelo', 'PARTICLE_SYSTEM')
    ps = ob.particle_systems[-1]
    st = ps.settings
    st.type = 'HAIR'
    st.count = cfg.get('fios', 4500)
    st.hair_step = 3
    comp = cfg.get('comprimento', 0.06) * maximo
    st.normal_factor = comp / 4.0 * 0.75          # o Blender usa comprimento = 4 x velocidade
    penteado = np.array(cfg.get('penteado', (-0.55, 0, -0.45)), dtype=float)
    st.object_align_factor = tuple(penteado * comp / 4.0)
    st.child_type = 'INTERPOLATED'
    st.rendered_child_count = cfg.get('filhos', 24)
    st.child_percent = cfg.get('filhos', 24)
    st.clump_factor = cfg.get('mechas', 0.8)
    st.clump_shape = 0.45
    st.child_radius = cfg.get('raio_mecha', 0.04)
    st.child_roundness = 0.6
    st.roughness_1 = cfg.get('bagunca', 0.02)
    st.roughness_1_size = 0.6
    st.roughness_endpoint = cfg.get('bagunca', 0.02)
    st.material = len(me.materials)
    st.root_radius, st.tip_radius = 1.0, 0.15
    st.radius_scale = cfg.get('grossura', 0.007)
    ps.vertex_group_length = 'pelo_comp'
    ps.vertex_group_density = 'pelo_dens'


def criar_malha(nome, v, f, cores, material, suavizar=6):
    me = bpy.data.meshes.new(nome)
    me.from_pydata(v.tolist(), [], f.tolist())
    me.update()
    attr = me.color_attributes.new(name='Cor', type='FLOAT_COLOR', domain='POINT')
    rgba = np.concatenate([cores, np.ones((len(cores), 1), dtype=np.float32)], axis=1)
    attr.data.foreach_set('color', rgba.ravel())
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    ob = bpy.data.objects.new(nome, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    if suavizar:  # tira os degrauzinhos do marching cubes sem derreter a forma
        mod = ob.modifiers.new('suave', 'CORRECTIVE_SMOOTH')
        mod.iterations = suavizar
        mod.factor = 0.5
    return ob


def criar_olho(i, o):
    c, r = np.array(o['c'], dtype=float), np.array(o['r'], dtype=float)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=1, location=tuple(c))
    ob = bpy.context.object
    ob.scale = tuple(r)
    ob.rotation_euler = tuple(math.radians(a) for a in o['rot'])
    bpy.ops.object.shade_smooth()
    if o.get('iris'):
        ob.data.materials.append(mat_olho(f'olho{i}', o['cor'], o['iris']))
    else:
        ob.data.materials.append(mat_simples(f'olho{i}', o['cor'], rugosidade=0.08))
    lado = 1.0 if c[1] >= 0 else -1.0
    if o.get('brilho', True) and not o.get('iris'):
        branco = mat_simples(f'brilho{i}', '#ffffff', rugosidade=0.3, emissao=1.6)
        for (dx, dy, dz, s) in ((0.70, 0.38, 0.60, 0.27), (0.85, 0.45, -0.28, 0.12)):
            d = np.array([dx, dy * lado, dz])
            d /= np.linalg.norm(d)
            pos = c + d * r * 0.86
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=float(r.max() * s), location=tuple(pos))
            hl = bpy.context.object
            bpy.ops.object.shade_smooth()
            hl.data.materials.append(branco)


def montar(modelo, n):
    lo, hi = np.full(3, 1e9), np.full(3, -1e9)
    cfg_pelo = getattr(modelo, 'pelo', None)
    for camada in modelo.camadas():
        v, f, cores, pelo = modelo.malha(camada, n=n if camada == 'corpo' else max(70, n * 2 // 3))
        ob = criar_malha(camada, v, f, cores, material_da_camada(camada))
        if cfg_pelo and camada == 'corpo':
            criar_pelo(ob, pelo, cfg_pelo)
        lo, hi = np.minimum(lo, v.min(axis=0)), np.maximum(hi, v.max(axis=0))
    for i, o in enumerate(modelo.olhos):
        criar_olho(i, o)
    return lo, hi


def camera_e_luzes(sc, lo, hi):
    centro = (lo + hi) / 2
    raio = float(np.linalg.norm(hi - lo)) / 2
    pivo = bpy.data.objects.new('pivo', None)
    pivo.location = tuple(centro)
    bpy.context.collection.objects.link(pivo)

    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = raio * 1.75
    cam.data.clip_end = 100
    bpy.context.collection.objects.link(cam)
    cam.parent = pivo
    sc.camera = cam

    def luz(nome, energia, rot, angulo, cor=(1, 1, 1)):
        d = bpy.data.lights.new(nome, 'SUN')
        d.energy, d.angle, d.color = energia, math.radians(angulo), cor
        ob = bpy.data.objects.new(nome, d)
        ob.rotation_euler = tuple(math.radians(a) for a in rot)
        bpy.context.collection.objects.link(ob)
        ob.parent = pivo
        return ob

    # direções relativas à câmera (que olha de -Y para +Y no espaço do pivô)
    luz('principal', 3.4, (52, 0, -38), 18, (1.0, 0.97, 0.92))
    luz('preenche', 0.9, (70, 0, 55), 40, (0.85, 0.92, 1.0))
    luz('contra', 2.2, (-58, 0, 150), 12, (1.0, 0.98, 0.95))
    return pivo, cam


def apontar(pivo, cam, vista):
    """vista: 'frente' (inimigo: olha para a esquerda da tela) ou 'costas' (seu Encantado: olha para a direita)."""
    ang, elev = (145, 14) if vista == 'frente' else (-38, 22)
    if vista == 'lado':
        ang, elev = 180, 5
    pivo.rotation_euler = (0, 0, math.radians(ang))
    dist = 20
    e = math.radians(elev)
    cam.location = (0, -dist * math.cos(e), dist * math.sin(e))
    cam.rotation_euler = (math.radians(90 - elev), 0, 0)


# ── pós-processamento ─────────────────────────────────────
def finalizar(arquivo, tamanho=TAM_FINAL, ocupa=0.94):
    """Corta as sobras, põe contorno escuro, centraliza com os pés embaixo e reduz."""
    img = Image.open(arquivo).convert('RGBA')
    caixa = img.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    img = img.crop(caixa)
    w, h = img.size
    lado = int(max(w, h) / ocupa) + 16
    quadro = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    quadro.paste(img, ((lado - w) // 2, lado - 8 - h - int(lado * 0.01)), img)
    esp = max(3, round(lado * 0.011)) | 1
    alfa = quadro.getchannel('A')
    gordo = alfa.filter(ImageFilter.MaxFilter(esp * 2 + 1)).filter(ImageFilter.GaussianBlur(0.8))
    contorno = Image.new('RGBA', quadro.size, CONTORNO + (0,))
    contorno.putalpha(gordo.point(lambda a: min(255, int(a * 1.3))))
    final = Image.alpha_composite(contorno, quadro)
    return final.resize((tamanho, tamanho), Image.LANCZOS)


def renderizar(nome, previa=False, so_frente=False):
    modelo = modelos.MODELOS[nome]()
    res = 560 if previa else 720
    sc = nova_cena(amostras=16 if previa else 56, resolucao=res)
    lo, hi = montar(modelo, n=110 if previa else 170)
    pivo, cam = camera_e_luzes(sc, lo, hi)
    escala = getattr(modelo, 'tamanho', 1.0)
    saidas = {}
    vistas = ('frente', 'costas', 'lado') if previa else ('frente', 'costas')
    if so_frente:
        vistas = ('frente',)
    for vista in vistas:
        apontar(pivo, cam, vista)
        bruto = f'/tmp/render_{nome}_{vista}.png'
        sc.render.filepath = bruto
        bpy.ops.render.render(write_still=True)
        saidas[vista] = finalizar(bruto, tamanho=384 if previa else TAM_FINAL, ocupa=0.94 * escala)
    return saidas


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    previa = '--previa' in sys.argv
    nomes = list(modelos.MODELOS) if '--todos' in sys.argv else args
    if not nomes:
        print(__doc__)
        return
    if previa:
        Path('/tmp/previa').mkdir(exist_ok=True)
        for nome in nomes:
            s = renderizar(nome, previa=True, so_frente='--frente' in sys.argv)
            folha = Image.new('RGBA', (384 * len(s), 384), (150, 200, 130, 255))
            for i, v in enumerate(s):
                folha.alpha_composite(s[v], (384 * i, 0))
            folha.save(f'/tmp/previa/{nome}.png')
            print('prévia:', f'/tmp/previa/{nome}.png')
        return
    SAIDA.mkdir(parents=True, exist_ok=True)
    manifesto = json.loads(MANIFESTO.read_text(encoding='utf-8')) if MANIFESTO.exists() else {}
    manifesto.setdefault('texturas', {})
    for nome in nomes:
        s = renderizar(nome)
        s['frente'].save(SAIDA / f'{nome}.png')
        s['costas'].save(SAIDA / f'{nome}_costas.png')
        s['frente'].resize((72, 72), Image.LANCZOS).save(SAIDA / f'{nome}_mini.png')
        manifesto['texturas'][f'criatura_{nome}'] = f'assets/criaturas/{nome}.png'
        manifesto['texturas'][f'criatura_{nome}_mini'] = f'assets/criaturas/{nome}_mini.png'
        manifesto['texturas'][f'criatura_{nome}_costas'] = f'assets/criaturas/{nome}_costas.png'
        print('✓', nome)
    MANIFESTO.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
