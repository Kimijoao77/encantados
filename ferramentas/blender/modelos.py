"""
Modelos 3D dos Encantados (em "massinha digital"; ver sdf.py).
Eixos: +X = frente, +Z = cima, ±Y = lados. Os pés ficam em z = 0.
"""
import numpy as np
from sdf import Modelo, hexrgb


def degrade_z(z0, z1, cores):
    """Cor que muda com a altura (ex.: chama amarela embaixo e vermelha na ponta)."""
    cs = np.stack([hexrgb(c) for c in cores])

    def f(P):
        t = np.clip((P[:, 2] - z0) / (z1 - z0), 0, 1) * (len(cs) - 1)
        i = np.minimum(t.astype(int), len(cs) - 2)
        w = (t - i)[:, None]
        return cs[i] * (1 - w) + cs[i + 1] * w
    return f


def chama(m, base, ponta, raio, camada='fogo', cores=('#fff3a0', '#ffc02e', '#ff7a1a', '#e8361a'), curva=(0, 0, 0)):
    """Labareda em forma de gota, da base até a ponta."""
    b, p = np.array(base, dtype=float), np.array(ponta, dtype=float)
    meio = b + (p - b) * 0.45 + np.array(curva, dtype=float)
    m.tubo([b, meio, p], [raio, raio * 0.72, raio * 0.08], degrade_z(min(b[2], p[2]), max(b[2], p[2]), cores),
           camada=camada, k=0.05)


# ═══════════════════════════════════════════════════════
# INICIAIS
# ═══════════════════════════════════════════════════════
def guarito():
    """Filhote de lobo-guará de fogo."""
    m = Modelo()
    lar, lar2, creme, preto, escuro = '#f0822c', '#d2601a', '#fff0d8', '#2b2126', '#4a2c22'
    m.pelo = {'comprimento': 0.07}
    # tronco, peito e quadril
    m.bola((-0.02, 0, 0.60), (0.36, 0.24, 0.24), lar, k=0.1)
    m.bola((0.20, 0, 0.61), (0.20, 0.21, 0.23), lar, k=0.12, pelo=1.3)
    m.bola((-0.22, 0.12, 0.56), (0.17, 0.11, 0.18), lar, sym=True, k=0.08)
    m.pinta((0.36, 0, 0.52), (0.17, 0.17, 0.22), creme, borda=0.04, pelo=1.5)
    m.pinta_tubo([(0.05, 0, 0.86), (-0.15, 0, 0.84), (-0.34, 0, 0.74)], 0.085, escuro, borda=0.05)  # faixa escura no dorso
    # pernas compridas e pretas, com cotovelo e joelho
    m.tubo([(0.20, 0.13, 0.52), (0.17, 0.135, 0.34), (0.21, 0.135, 0.13)], [0.085, 0.058, 0.05], preto, sym=True, k=0.07, pelo=0.3)
    m.tubo([(-0.24, 0.15, 0.50), (-0.19, 0.15, 0.36), (-0.31, 0.15, 0.20), (-0.27, 0.15, 0.09)], [0.09, 0.07, 0.052, 0.05], preto, sym=True, k=0.07, pelo=0.3)
    for x in (0.21, -0.27):
        m.bola((x + 0.05, 0.135 if x > 0 else 0.15, 0.05), (0.095, 0.072, 0.052), preto, sym=True, k=0.04, pelo=0.2)
        for dy in (-0.045, 0.0, 0.045):  # dedinhos
            m.bola((x + 0.135, (0.135 if x > 0 else 0.15) + dy, 0.035), (0.03, 0.024, 0.03), '#3a2e34', sym=True, k=0.012, pelo=0.0)
    # cabeça
    m.bola((0.36, 0, 1.07), (0.37, 0.36, 0.33), lar, k=0.1, pelo=0.55)
    m.bola((0.40, 0.2, 0.98), (0.14, 0.12, 0.12), lar, sym=True, k=0.1, pelo=0.8)
    m.tubo([(0.58, 0, 0.98), (0.84, 0, 0.94)], [0.15, 0.085], lar, k=0.1, pelo=0.2)
    m.tubo([(0.40, 0.27, 0.99), (0.36, 0.40, 0.90)], [0.10, 0.012], lar, sym=True, k=0.06, pelo=1.0)   # tufos da bochecha
    m.tubo([(0.42, 0.25, 0.92), (0.42, 0.34, 0.80)], [0.09, 0.012], creme, sym=True, k=0.06, pelo=1.0)
    m.pinta((0.72, 0, 0.87), (0.3, 0.26, 0.11), creme, borda=0.02)
    m.pinta((0.52, 0.23, 0.9), (0.14, 0.1, 0.1), creme, sym=True, borda=0.03)
    m.pinta((0.80, 0, 1.02), (0.13, 0.07, 0.05), escuro, borda=0.03)                 # focinho escuro em cima
    m.pinta((0.60, 0.13, 1.285), (0.05, 0.035, 0.03), creme, sym=True, rot=(0, 0, 30), borda=0.02)  # sobrancelhas
    m.pinta((0.62, 0.18, 1.115), (0.09, 0.12, 0.15), None, sym=True, pelo=0.12)       # pelo curto em volta dos olhos
    m.bola((0.915, 0, 0.965), (0.05, 0.06, 0.045), preto, k=0.01, camada='liso')
    # orelhas enormes
    m.bola((0.26, 0.25, 1.50), (0.075, 0.16, 0.30), lar2, rot=(18, -6, 12), sym=True, k=0.07, pelo=0.3)
    m.pinta((0.325, 0.255, 1.50), (0.06, 0.105, 0.225), creme, rot=(18, -6, 12), sym=True, borda=0.02, pelo=0.5)
    m.pinta((0.34, 0.255, 1.46), (0.05, 0.06, 0.14), '#f4b8a0', rot=(18, -6, 12), sym=True, borda=0.03, pelo=0.1)
    m.pinta((0.235, 0.335, 1.76), 0.11, preto, sym=True, borda=0.03)
    # cauda bem peluda com ponta branca
    m.tubo([(-0.32, 0, 0.66), (-0.56, 0, 0.80), (-0.69, 0, 1.02)], [0.10, 0.15, 0.11], lar, k=0.08, pelo=1.6)
    m.bola((-0.71, 0, 1.11), 0.11, '#fffaf0', k=0.06, pelo=1.6)
    # crina de fogo: labaredas grandes e pequenas
    chama(m, (0.08, 0, 1.30), (-0.10, 0, 1.76), 0.135, curva=(-0.07, 0, 0))
    chama(m, (0.00, 0.07, 1.20), (-0.20, 0.13, 1.52), 0.085, curva=(-0.04, 0.02, 0))
    chama(m, (0.00, -0.07, 1.20), (-0.20, -0.13, 1.52), 0.085, curva=(-0.04, -0.02, 0))
    chama(m, (-0.05, 0, 1.03), (-0.32, 0, 1.42), 0.125, curva=(-0.05, 0, 0))
    chama(m, (-0.16, 0, 0.86), (-0.46, 0, 1.12), 0.10, curva=(-0.02, 0, 0.03))
    chama(m, (-0.76, 0, 1.16), (-0.92, 0, 1.44), 0.075, curva=(-0.05, 0, 0))             # chaminha na ponta da cauda
    # miolo claro das chamas
    for (b, p_, r) in (((0.06, 0, 1.30), (-0.05, 0, 1.56), 0.07), ((-0.07, 0, 1.04), (-0.22, 0, 1.26), 0.06)):
        m.tubo([b, p_], [r, r * 0.1], '#fffbe0', camada='fogo_miolo', k=0.03)
    m.olho((0.635, 0.18, 1.115), (0.034, 0.085, 0.118), rot=(0, 0, 30), iris='#c86a14')
    m.tamanho = 0.9
    return m


def ariri():
    """Filhote de ariranha de água, sentado, segurando uma bolha."""
    m = Modelo()
    mar, mar2, creme, azul, pele = '#8a5a3a', '#6a4028', '#f6e3b8', '#4aa6f0', '#4a3026'
    m.pelo = {'comprimento': 0.042, 'fios': 5500, 'mechas': 0.7, 'penteado': (-0.3, 0, -0.75), 'bagunca': 0.012}
    m.tubo([(-0.02, 0, 0.28), (0.02, 0, 0.56), (0.07, 0, 0.82)], [0.31, 0.28, 0.22], mar, k=0.1)
    m.pinta((0.26, 0, 0.62), (0.17, 0.19, 0.36), creme, borda=0.04, pelo=1.3)
    m.pinta((-0.2, 0, 0.6), (0.22, 0.24, 0.5), mar2, borda=0.12)                      # costas mais escuras
    # cabeça
    m.bola((0.11, 0, 1.12), (0.33, 0.35, 0.29), mar, k=0.1, pelo=0.9)
    m.bola((0.37, 0, 1.05), (0.14, 0.21, 0.12), creme, k=0.07, pelo=0.5)
    m.bola((0.16, 0.24, 1.04), (0.14, 0.12, 0.13), mar, sym=True, k=0.08, pelo=1.2)   # bochechas
    m.pinta((0.30, 0.0, 0.92), (0.2, 0.26, 0.1), creme, borda=0.04)                   # queixo e garganta claros
    m.bola((0.495, 0, 1.085), (0.05, 0.07, 0.042), '#2a1c1a', k=0.01, camada='liso')
    m.bola((0.0, 0.29, 1.31), (0.06, 0.08, 0.08), mar2, sym=True, k=0.04, pelo=0.4)
    m.pinta((0.03, 0.3, 1.31), (0.04, 0.05, 0.05), '#d49a8a', sym=True, borda=0.02, pelo=0.1)
    for dz in (0.0, 0.035):  # pontinhos dos bigodes
        for dy in (0.10, 0.15):
            m.pinta((0.46, dy, 1.02 + dz), 0.012, mar2, sym=True)
    m.pinta((0.37, 0.18, 1.185), (0.08, 0.1, 0.12), None, sym=True, pelo=0.2)
    # gota d'água no topo da cabeça
    m.tubo([(0.06, 0, 1.36), (0.0, 0, 1.54), (-0.09, 0, 1.66)], [0.10, 0.075, 0.012], azul, k=0.05, camada='liso_agua')
    m.pinta((0.03, 0.03, 1.46), (0.03, 0.03, 0.07), '#c8ecff', camada='liso_agua', borda=0.02)
    # braços, mãos e pés com membranas
    m.tubo([(0.10, 0.23, 0.76), (0.27, 0.19, 0.66), (0.38, 0.13, 0.66)], [0.085, 0.07, 0.06], mar, sym=True, k=0.06, pelo=0.7)
    m.bola((0.41, 0.12, 0.66), (0.055, 0.05, 0.06), pele, sym=True, k=0.03, pelo=0.0)
    m.bola((0.24, 0.21, 0.06), (0.17, 0.11, 0.055), pele, sym=True, k=0.05, pelo=0.0)
    for dy in (-0.06, 0.0, 0.06):
        m.bola((0.40, 0.21 + dy, 0.04), (0.035, 0.028, 0.03), pele, sym=True, k=0.02, pelo=0.0)
    m.bola((0.05, 0.2, 0.2), (0.2, 0.14, 0.17), mar, sym=True, k=0.08)                # coxas
    # cauda achatada, com a ponta azul
    m.tubo([(-0.20, 0, 0.18), (-0.55, 0, 0.10), (-0.80, 0, 0.12)], [0.18, 0.14, 0.09], mar, k=0.1, escala=(1, 1.25, 0.65))
    m.bola((-0.90, 0, 0.13), (0.14, 0.13, 0.055), azul, k=0.06, pelo=0.0)
    # bolha
    m.bola((0.52, 0, 0.68), 0.17, '#9adcff', camada='asa_bolha', k=0)
    m.bola((0.585, 0.06, 0.765), 0.04, '#ffffff', camada='luz_bolha', k=0)
    m.bola((0.47, -0.07, 0.60), 0.02, '#ffffff', camada='luz_bolha', k=0)
    m.olho((0.365, 0.18, 1.185), (0.034, 0.075, 0.095), rot=(0, 0, 30), iris='#5a3a1a')
    m.tamanho = 0.88
    return m


def brotojabi():
    """Filhote de jabuti de planta, com um broto no casco."""
    m = Modelo()
    verde, verde2, casco, casco2, claro, lar = '#86c45a', '#5f9a3e', '#b9843e', '#6e4420', '#f0d27e', '#f28a2e'
    # casco: base escura + placas em relevo
    C, RC = np.array([-0.06, 0, 0.50]), np.array([0.50, 0.45, 0.37])
    m.bola(C, RC, casco2, k=0.05, camada='liso_casco')
    m.bola((-0.06, 0, 0.34), (0.56, 0.51, 0.12), casco2, k=0.05, camada='liso_casco')
    m.bola((-0.06, 0, 0.26), (0.42, 0.36, 0.14), '#f3e2ae', k=0.05, camada='liso_casco')
    placas = [(0, 0, 1, 0.17)] + [(0.62 * np.cos(a), 0.62 * np.sin(a), 0.62, 0.15) for a in np.radians([0, 60, 120, 180, 240, 300])]
    placas += [(0.95 * np.cos(a), 0.95 * np.sin(a), 0.2, 0.105) for a in np.radians(np.arange(15, 360, 30))]
    for (dx, dy, dz, r) in placas:
        d = np.array([dx, dy, dz]) / np.linalg.norm([dx, dy, dz])
        p = C + d * RC * 0.985
        m.bola(p, (r, r, r * 0.26), casco, k=0.012, camada='liso_casco',
               rot=(float(np.degrees(np.arctan2(-d[1], d[2]))), float(np.degrees(np.arcsin(np.clip(d[0], -1, 1)))), 0))
        m.pinta(p + d * 0.02, r * 0.5, claro, camada='liso_casco', borda=0.06)
    # pescoço e cabeça
    m.tubo([(0.30, 0, 0.40), (0.52, 0, 0.58)], [0.15, 0.14], verde, k=0.08, camada='escama')
    m.bola((0.62, 0, 0.70), (0.26, 0.25, 0.23), verde, k=0.08, camada='escama')
    m.bola((0.80, 0, 0.64), (0.11, 0.15, 0.09), verde, k=0.06, camada='escama')             # bico
    m.pinta((0.60, 0.0, 0.92), (0.15, 0.13, 0.06), lar, borda=0.02, camada='escama')
    m.pinta((0.54, 0.25, 0.60), 0.075, lar, sym=True, borda=0.02, camada='escama')
    m.pinta((0.72, 0.0, 0.52), (0.2, 0.2, 0.08), '#c8e89a', borda=0.04, camada='escama')    # queixo claro
    m.pinta((0.905, 0.035, 0.67), 0.012, '#2f5a22', sym=True, camada='escama')              # narinas
    m.pinta_tubo([(0.90, 0, 0.60), (0.83, 0.11, 0.585), (0.74, 0.18, 0.62)], 0.013, '#2f5a22', sym=True, camada='escama')
    # pernas gordinhas com unhas
    for x in (0.26, -0.36):
        m.tubo([(x, 0.30, 0.32), (x + 0.03, 0.34, 0.10)], [0.14, 0.125], verde2, sym=True, k=0.05, camada='escama')
        for (ox, oy) in ((0.10, 0.02), (0.06, 0.09), (0.11, -0.05)):
            m.pinta((x + ox, 0.34 + oy, 0.20), 0.045, lar, sym=True, borda=0.02, camada='escama')
        for dy in (-0.06, 0.0, 0.06):
            m.bola((x + 0.14, 0.34 + dy, 0.035), (0.035, 0.028, 0.035), '#f6ecd0', sym=True, k=0.01, camada='liso_unha')
    m.tubo([(-0.50, 0, 0.32), (-0.68, 0, 0.24)], [0.08, 0.02], verde2, k=0.05, camada='escama')
    # broto com folhas e uma florzinha
    m.tubo([(-0.06, 0, 0.84), (-0.04, 0, 1.02), (-0.06, 0, 1.18)], [0.04, 0.032, 0.03], '#4f9a34', k=0.03, camada='folha')
    for (cx, ang, comp) in ((0.15, -24, 0.25), (-0.28, 26, 0.26)):
        m.bola((cx, 0, 1.26), (comp, 0.14, 0.03), '#74d94a', rot=(0, ang, 0), k=0.03, camada='folha')
        m.pinta((cx, 0, 1.26), (comp * 0.95, 0.014, 0.07), '#3f8a2a', rot=(0, ang, 0), camada='folha')
        for t in (-0.5, 0.0, 0.5):
            for lado in (1, -1):
                m.pinta((cx + t * comp * 0.8, 0.05 * lado, 1.26 - t * comp * 0.8 * np.tan(np.radians(ang))), (0.012, 0.07, 0.06), '#58b83a',
                        rot=(0, ang, 35 * lado), camada='folha')
    m.bola((-0.06, 0, 1.2), 0.05, '#ffd84a', k=0.02, camada='folha')
    m.olho((0.79, 0.155, 0.76), (0.034, 0.07, 0.09), rot=(0, 0, 32), iris='#8a4a14')
    m.tamanho = 0.9
    return m


MODELOS = {
    'guarito': guarito,
    'ariri': ariri,
    'brotojabi': brotojabi,
}
