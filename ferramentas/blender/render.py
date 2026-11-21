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
TAM_FINAL = 192
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


def mat_pele(nome, rugosidade=0.55, verniz=0.0, brilho_sheen=0.25):
    m, nt = _material(nome)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    c = nt.nodes.new('ShaderNodeVertexColor')
    c.layer_name = 'Cor'
    nt.links.new(c.outputs['Color'], b.inputs['Base Color'])
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
        return mat_asa(camada, alfa=0.7, emissao=0.9)
    if camada.startswith('asa'):
        return mat_asa(camada)
    if camada.startswith('fantasma'):
        return mat_asa(camada, alfa=0.8)
    if camada.startswith('liso'):
        return mat_pele(camada, rugosidade=0.25, verniz=0.5, brilho_sheen=0.0)
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
    ob.data.materials.append(mat_simples(f'olho{i}', o['cor'], rugosidade=0.08))
    lado = 1.0 if c[1] >= 0 else -1.0
    if o.get('iris'):
        d = np.array([0.75, 0.55 * lado, 0.05])
        d /= np.linalg.norm(d)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1, location=tuple(c + d * r * 0.35))
        ir = bpy.context.object
        ir.scale = tuple(r * 0.78)
        bpy.ops.object.shade_smooth()
        ir.data.materials.append(mat_simples(f'iris{i}', o['iris'], rugosidade=0.1))
    if o.get('brilho', True):
        branco = mat_simples(f'brilho{i}', '#ffffff', rugosidade=0.3, emissao=1.6)
        for (dx, dy, dz, s) in ((0.62, 0.42, 0.62, 0.30), (0.80, 0.50, -0.30, 0.15)):
            d = np.array([dx, dy * lado, dz])
            d /= np.linalg.norm(d)
            pos = c + d * r * 0.86
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=float(r.max() * s), location=tuple(pos))
            hl = bpy.context.object
            bpy.ops.object.shade_smooth()
            hl.data.materials.append(branco)


def montar(modelo, n):
    lo, hi = np.full(3, 1e9), np.full(3, -1e9)
    for camada in modelo.camadas():
        v, f, cores = modelo.malha(camada, n=n if camada == 'corpo' else max(70, n * 2 // 3))
        criar_malha(camada, v, f, cores, material_da_camada(camada))
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
    cam.data.ortho_scale = raio * 2.15
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


def renderizar(nome, previa=False):
    modelo = modelos.MODELOS[nome]()
    res = 384 if previa else 720
    sc = nova_cena(amostras=12 if previa else 64, resolucao=res)
    lo, hi = montar(modelo, n=110 if previa else 170)
    pivo, cam = camera_e_luzes(sc, lo, hi)
    escala = getattr(modelo, 'tamanho', 1.0)
    saidas = {}
    vistas = ('frente', 'costas', 'lado') if previa else ('frente', 'costas')
    for vista in vistas:
        apontar(pivo, cam, vista)
        bruto = f'/tmp/render_{nome}_{vista}.png'
        sc.render.filepath = bruto
        bpy.ops.render.render(write_still=True)
        saidas[vista] = finalizar(bruto, tamanho=256 if previa else TAM_FINAL, ocupa=0.94 * escala)
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
            s = renderizar(nome, previa=True)
            folha = Image.new('RGBA', (256 * 3, 256), (150, 200, 130, 255))
            for i, v in enumerate(('frente', 'costas', 'lado')):
                folha.alpha_composite(s[v], (256 * i, 0))
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
