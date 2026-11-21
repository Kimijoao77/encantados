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
    lar, lar2, creme, preto = '#f0822c', '#d9641c', '#fff0d8', '#2b2126'
    # corpo e peito
    m.bola((-0.02, 0, 0.60), (0.36, 0.25, 0.25), lar, k=0.1)
    m.bola((0.20, 0, 0.60), (0.20, 0.21, 0.22), lar, k=0.12)
    m.pinta((0.34, 0, 0.52), (0.16, 0.17, 0.2), creme, borda=0.03)
    # pernas compridas e pretas (marca registrada do lobo-guará)
    for x in (0.20, -0.24):
        m.tubo([(x, 0.13, 0.52), (x + 0.01, 0.135, 0.28), (x + 0.02, 0.135, 0.07)], [0.085, 0.06, 0.055], preto, sym=True, k=0.07)
        m.bola((x + 0.07, 0.135, 0.05), (0.10, 0.07, 0.055), preto, sym=True, k=0.04)
    # cabeça grande
    m.bola((0.36, 0, 1.07), (0.37, 0.36, 0.33), lar, k=0.1)
    m.bola((0.40, 0.2, 0.98), (0.14, 0.12, 0.12), lar, sym=True, k=0.1)  # bochechas
    m.tubo([(0.58, 0, 0.98), (0.84, 0, 0.94)], [0.15, 0.085], lar, k=0.1)  # focinho
    m.pinta((0.72, 0, 0.87), (0.3, 0.26, 0.11), creme, borda=0.02)
    m.pinta((0.52, 0.23, 0.9), (0.14, 0.1, 0.1), creme, sym=True, borda=0.03)
    m.bola((0.915, 0, 0.965), (0.05, 0.06, 0.045), preto, k=0.01, camada='liso')
    # orelhas enormes
    m.bola((0.26, 0.25, 1.50), (0.075, 0.16, 0.30), lar2, rot=(18, -6, 12), sym=True, k=0.07)
    m.pinta((0.325, 0.255, 1.50), (0.06, 0.105, 0.225), creme, rot=(18, -6, 12), sym=True, borda=0.02)
    m.pinta((0.235, 0.335, 1.76), 0.11, preto, sym=True, borda=0.03)
    # cauda fofa com ponta branca
    m.tubo([(-0.32, 0, 0.66), (-0.56, 0, 0.80), (-0.68, 0, 1.02)], [0.10, 0.15, 0.11], lar, k=0.08)
    m.bola((-0.70, 0, 1.10), 0.115, '#fffaf0', k=0.06)
    # crina de fogo na nuca e nas costas
    chama(m, (0.06, 0, 1.28), (-0.10, 0, 1.70), 0.13, curva=(-0.05, 0, 0))
    chama(m, (-0.04, 0, 1.02), (-0.30, 0, 1.36), 0.12, curva=(-0.04, 0, 0))
    chama(m, (-0.14, 0, 0.84), (-0.42, 0, 1.06), 0.10, curva=(-0.02, 0, 0.02))
    # rosto
    m.olho((0.635, 0.18, 1.115), (0.034, 0.085, 0.118), rot=(0, 0, 30))
    m.pinta_tubo([(0.80, 0, 0.885), (0.70, 0.10, 0.868), (0.62, 0.15, 0.895)], 0.016, '#5a2a1c', sym=True)  # sorriso
    m.tamanho = 0.86
    return m


def ariri():
    """Filhote de ariranha de água, sentado, segurando uma bolha."""
    m = Modelo()
    mar, mar2, creme, azul = '#8a5a3a', '#6e4429', '#f6e3b8', '#4aa6f0'
    m.tubo([(-0.02, 0, 0.28), (0.02, 0, 0.56), (0.07, 0, 0.82)], [0.31, 0.28, 0.22], mar, k=0.1)
    m.pinta((0.24, 0, 0.62), (0.17, 0.19, 0.34), creme, borda=0.03)
    # cabeça
    m.bola((0.11, 0, 1.12), (0.33, 0.35, 0.29), mar, k=0.1)
    m.bola((0.37, 0, 1.05), (0.14, 0.21, 0.12), creme, k=0.07)
    m.bola((0.495, 0, 1.085), (0.045, 0.065, 0.04), '#2a1c1a', k=0.01, camada='liso')
    m.bola((0.0, 0.29, 1.31), (0.06, 0.075, 0.075), mar2, sym=True, k=0.04)
    m.pinta_tubo([(0.47, 0, 1.0), (0.42, 0.09, 0.985), (0.36, 0.14, 1.0)], 0.014, '#5a2a1c', sym=True)
    # gota d'água no topo da cabeça
    m.tubo([(0.06, 0, 1.36), (0.0, 0, 1.52), (-0.09, 0, 1.63)], [0.10, 0.07, 0.012], azul, k=0.05, camada='liso')
    # braços e pés
    m.tubo([(0.10, 0.23, 0.76), (0.27, 0.19, 0.66), (0.38, 0.13, 0.66)], [0.085, 0.07, 0.065], mar, sym=True, k=0.06)
    m.bola((0.24, 0.21, 0.06), (0.17, 0.10, 0.06), mar2, sym=True, k=0.05)
    # cauda achatada, com a ponta azul
    m.tubo([(-0.20, 0, 0.18), (-0.55, 0, 0.10), (-0.80, 0, 0.12)], [0.18, 0.14, 0.09], mar, k=0.1, escala=(1, 1.25, 0.65))
    m.bola((-0.90, 0, 0.13), (0.13, 0.12, 0.06), azul, k=0.06)
    # bolha
    m.bola((0.50, 0, 0.68), 0.17, '#9adcff', camada='asa_bolha', k=0)
    m.bola((0.56, 0.06, 0.76), 0.04, '#ffffff', camada='luz_bolha', k=0)
    m.olho((0.365, 0.18, 1.185), (0.034, 0.075, 0.095), rot=(0, 0, 30))
    m.tamanho = 0.86
    return m


def brotojabi():
    """Filhote de jabuti de planta, com um broto no casco."""
    m = Modelo()
    verde, verde2, casco, casco2, claro, lar = '#86c45a', '#5f9a3e', '#b07a3a', '#8a5626', '#ecc874', '#f28a2e'
    # casco
    m.bola((-0.06, 0, 0.50), (0.50, 0.45, 0.37), casco, k=0.05)
    m.bola((-0.06, 0, 0.34), (0.55, 0.50, 0.13), casco2, k=0.06)
    m.bola((-0.06, 0, 0.27), (0.42, 0.36, 0.14), '#f3e2ae', k=0.05)
    for (x, y, z, r) in [(-0.06, 0, 0.84, 0.15), (0.24, 0, 0.74, 0.13), (-0.36, 0, 0.74, 0.13),
                         (0.10, 0.27, 0.68, 0.13), (-0.22, 0.27, 0.68, 0.13)]:
        m.pinta((x, y, z), r, claro, sym=(y != 0), borda=0.02)
        m.pinta((x, y, z), r * 0.5, casco, sym=(y != 0), borda=0.02)
    # pescoço e cabeça
    m.tubo([(0.30, 0, 0.40), (0.52, 0, 0.58)], [0.15, 0.14], verde, k=0.08)
    m.bola((0.62, 0, 0.70), (0.26, 0.25, 0.23), verde, k=0.08)
    m.pinta((0.60, 0.0, 0.92), (0.14, 0.12, 0.06), lar, borda=0.02)
    m.pinta((0.56, 0.24, 0.62), 0.07, lar, sym=True, borda=0.02)
    m.pinta_tubo([(0.87, 0, 0.63), (0.80, 0.10, 0.61), (0.72, 0.17, 0.64)], 0.015, '#2f5a22', sym=True)
    # pernas gordinhas
    for x in (0.26, -0.36):
        m.tubo([(x, 0.30, 0.32), (x + 0.03, 0.34, 0.10)], [0.14, 0.125], verde2, sym=True, k=0.05)
        m.pinta((x + 0.10, 0.36, 0.14), 0.06, lar, sym=True, borda=0.02)
    m.tubo([(-0.50, 0, 0.32), (-0.68, 0, 0.24)], [0.08, 0.02], verde2, k=0.05)
    # broto
    m.tubo([(-0.06, 0, 0.84), (-0.04, 0, 1.02), (-0.06, 0, 1.16)], [0.035, 0.03, 0.028], '#4f9a34', k=0.03, camada='folha')
    m.bola((0.14, 0, 1.24), (0.24, 0.13, 0.035), '#74d94a', rot=(0, -24, 0), k=0.03, camada='folha')
    m.bola((-0.27, 0, 1.25), (0.25, 0.13, 0.035), '#74d94a', rot=(0, 26, 0), k=0.03, camada='folha')
    m.pinta((0.14, 0, 1.24), (0.22, 0.014, 0.06), '#4f9a34', rot=(0, -24, 0), camada='folha')
    m.pinta((-0.27, 0, 1.25), (0.23, 0.014, 0.06), '#4f9a34', rot=(0, 26, 0), camada='folha')
    m.olho((0.79, 0.155, 0.76), (0.034, 0.07, 0.09), rot=(0, 0, 32))
    m.tamanho = 0.86
    return m


MODELOS = {
    'guarito': guarito,
    'ariri': ariri,
    'brotojabi': brotojabi,
}
