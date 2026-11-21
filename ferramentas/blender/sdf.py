"""
Modelagem dos Encantados por "massinha digital" (campos de distância, SDF).

Cada criatura é uma lista de partes (elipsoides, cones arredondados, tubos) que se fundem
suavemente, como massinha de modelar. O resultado vira uma malha 3D com cor por vértice,
que o Blender renderiza (ver render.py).

Eixos: +X = frente da criatura, +Z = cima, ±Y = lados (sym=True espelha a parte nos dois lados).
"""
import numpy as np
from skimage import measure


def hexrgb(h):
    """'#rrggbb' -> cor linear (o Blender trabalha em espaço linear)."""
    if not isinstance(h, str):
        return np.asarray(h, dtype=np.float32)
    h = h.lstrip('#')
    c = np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


def matriz_rot(graus):
    rx, ry, rz = np.radians(graus)
    cx, sx, cy, sy, cz, sz = np.cos(rx), np.sin(rx), np.cos(ry), np.sin(ry), np.cos(rz), np.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return (Rz @ Ry @ Rx).astype(np.float32)


# ── distâncias ────────────────────────────────────────────
def d_elipsoide(P, c, r, R):
    q = (P - c) @ R
    k0 = np.linalg.norm(q / r, axis=-1)
    k1 = np.linalg.norm(q / (r * r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)


def d_cone(P, a, b, r1, r2):
    """Cone arredondado (cápsula com raios diferentes nas pontas)."""
    ba = b - a
    l2 = float(ba @ ba)
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = P - a
    y = pa @ ba
    z = y - l2
    w = pa * l2 - ba * y[..., None]
    x2 = np.einsum('...i,...i->...', w, w)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d1 = np.sqrt(x2 + z2) * il2 - r2
    d2 = np.sqrt(x2 + y2) * il2 - r1
    d3 = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d1, np.where(np.sign(y) * a2 * y2 < k, d2, d3))


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


# ── partes ────────────────────────────────────────────────
class Parte:
    def __init__(self, tipo, cor, k, camada, modo, dados, escala=None, borda=0.0, pelo=None):
        self.tipo, self.k, self.camada, self.modo, self.d = tipo, k, camada, modo, dados
        self.cor = cor if (callable(cor) or cor is None) else hexrgb(cor)
        self.pelo = pelo  # comprimento relativo do pelo nesta parte (None = não mexe; sólidos usam 1)
        self.escala = None if escala is None else np.asarray(escala, dtype=np.float32)
        self.borda = borda  # largura da transição de cor (0 = borda seca)

    def dist(self, P):
        if self.escala is not None:  # achata/estica em torno do centro da parte
            c = self.centro()
            P = c + (P - c) / self.escala
        if self.tipo == 'elipsoide':
            d = d_elipsoide(P, self.d['c'], self.d['r'], self.d['R'])
        else:
            pts, rs = self.d['pts'], self.d['rs']
            d = None
            for i in range(len(pts) - 1):
                di = d_cone(P, pts[i], pts[i + 1], rs[i], rs[i + 1])
                d = di if d is None else np.minimum(d, di)
        if self.escala is not None:
            d = d * float(self.escala.min())
        return d.astype(np.float32)

    def centro(self):
        if self.tipo == 'elipsoide':
            return self.d['c']
        return self.d['pts'].mean(axis=0)

    def limites(self):
        if self.tipo == 'elipsoide':
            r = float(self.d['r'].max())
            lo, hi = self.d['c'] - r, self.d['c'] + r
        else:
            r = float(max(self.d['rs']))
            lo, hi = self.d['pts'].min(axis=0) - r, self.d['pts'].max(axis=0) + r
        if self.escala is not None:
            c = self.centro()
            m = float(self.escala.max())
            lo, hi = c + (lo - c) * m, c + (hi - c) * m
        return lo, hi

    def cor_em(self, P):
        if callable(self.cor):
            return np.asarray(self.cor(P), dtype=np.float32)
        return self.cor


class Modelo:
    """Lista de partes. Use os métodos para adicionar; `sym=True` espelha em Y."""

    def __init__(self):
        self.partes = []
        self.olhos = []

    def _add(self, tipo, cor, k, camada, modo, dados, sym, escala, borda, pelo=None):
        self.partes.append(Parte(tipo, cor, k, camada, modo, dados, escala, borda, pelo))
        if sym:
            self.partes.append(Parte(tipo, cor, k, camada, modo, self._espelhar(tipo, dados), escala, borda, pelo))

    @staticmethod
    def _espelhar(tipo, d):
        if tipo == 'elipsoide':
            rx, ry, rz = d['rot']
            c = d['c'] * np.array([1, -1, 1], dtype=np.float32)
            rot = (-rx, ry, -rz)
            return {'c': c, 'r': d['r'], 'rot': rot, 'R': matriz_rot(rot)}
        return {'pts': d['pts'] * np.array([1, -1, 1], dtype=np.float32), 'rs': d['rs']}

    def bola(self, c, r, cor, rot=(0, 0, 0), k=0.06, sym=False, camada='corpo', modo='solido', escala=None, borda=0.0, pelo=None):
        """Elipsoide. r pode ser um número ou (rx, ry, rz). rot em graus (x, y, z)."""
        r = np.full(3, r, dtype=np.float32) if np.isscalar(r) else np.asarray(r, dtype=np.float32)
        dados = {'c': np.asarray(c, dtype=np.float32), 'r': r, 'rot': tuple(rot), 'R': matriz_rot(rot)}
        self._add('elipsoide', cor, k, camada, modo, dados, sym, escala, borda, pelo)
        return self

    def tubo(self, pts, rs, cor, k=0.06, sym=False, camada='corpo', modo='solido', escala=None, borda=0.0, pelo=None):
        """Tubo passando pelos pontos, com um raio em cada ponto (pernas, caudas, focinhos, chifres)."""
        pts = np.asarray(pts, dtype=np.float32)
        rs = [float(rs)] * len(pts) if np.isscalar(rs) else [float(x) for x in rs]
        self._add('tubo', cor, k, camada, modo, {'pts': pts, 'rs': rs}, sym, escala, borda, pelo)
        return self

    def pinta(self, c, r, cor, rot=(0, 0, 0), sym=False, camada='corpo', borda=0.0, pelo=None):
        """Pinta a superfície que estiver dentro deste elipsoide (manchas, barriga, meias).
        cor=None com pelo=x muda só o comprimento do pelo naquela região."""
        return self.bola(c, r, cor, rot=rot, sym=sym, camada=camada, modo='pinta', borda=borda, pelo=pelo)

    def pinta_tubo(self, pts, rs, cor, sym=False, camada='corpo', borda=0.0, pelo=None):
        return self.tubo(pts, rs, cor, sym=sym, camada=camada, modo='pinta', borda=borda, pelo=pelo)

    def corta(self, c, r, rot=(0, 0, 0), k=0.03, sym=False, camada='corpo', cor='#3a1418'):
        """Escava a forma (boca aberta, narinas). A cor vale para o interior do corte."""
        return self.bola(c, r, cor, rot=rot, k=k, sym=sym, camada=camada, modo='corta')

    def olho(self, c, r, sym=True, cor='#140e0c', brilho=True, iris='#7a4a1e', rot=(0, 0, 0)):
        """Olho brilhante. c = centro, r = raio ou (rx, ry, rz)."""
        r3 = (r, r, r) if np.isscalar(r) else tuple(r)
        self.olhos.append({'c': tuple(c), 'r': r3, 'cor': cor, 'brilho': brilho, 'iris': iris, 'rot': tuple(rot)})
        if sym:
            self.olhos.append({'c': (c[0], -c[1], c[2]), 'r': r3, 'cor': cor, 'brilho': brilho, 'iris': iris,
                               'rot': (-rot[0], rot[1], -rot[2])})
        return self

    # ── geração da malha ──
    def camadas(self):
        nomes = []
        for p in self.partes:
            if p.camada not in nomes:
                nomes.append(p.camada)
        return nomes

    def campo(self, P, camada):
        d = None
        for p in self.partes:
            if p.camada != camada or p.modo == 'pinta':
                continue
            di = p.dist(P)
            if p.modo == 'corta':
                if d is not None:
                    d = smax(d, -di, p.k)
                continue
            d = di if d is None else smin(d, di, p.k)
        return d

    def cores(self, V, camada):
        """Retorna (cores Nx3, pelo N) nos vértices."""
        cor = np.zeros((len(V), 3), dtype=np.float32)
        pelo = np.ones(len(V), dtype=np.float32)
        d = np.full(len(V), 1e9, dtype=np.float32)
        for p in self.partes:
            if p.camada != camada:
                continue
            di = p.dist(V)
            if p.modo == 'pinta' and p.pelo is not None:
                wp = np.clip(0.5 - di / 0.05, 0, 1)
                pelo = pelo * (1 - wp) + p.pelo * wp
            if p.cor is None:
                continue
            if p.modo == 'solido':
                wp = np.clip(0.5 + 0.5 * (d - di) / 0.06, 0, 1)
                pelo = pelo * (1 - wp) + (1.0 if p.pelo is None else p.pelo) * wp
            ci = p.cor_em(V)
            if p.modo == 'pinta':
                w = (di < 0).astype(np.float32) if p.borda <= 0 else np.clip(0.5 - di / p.borda, 0, 1)
            elif p.modo == 'corta':
                w = (di < 0.004).astype(np.float32)
            else:
                w = (di < d).astype(np.float32) if p.borda <= 0 else np.clip(0.5 + 0.5 * (d - di) / p.borda, 0, 1)
                d = smin(d, di, p.k)
            cor = cor * (1 - w[:, None]) + ci * w[:, None]
        return cor, pelo

    def malha(self, camada, n=150):
        """Retorna (vertices, faces, cores) da camada."""
        partes = [p for p in self.partes if p.camada == camada and p.modo == 'solido']
        lo = np.min([p.limites()[0] for p in partes], axis=0) - 0.08
        hi = np.max([p.limites()[1] for p in partes], axis=0) + 0.08
        passo = float((hi - lo).max()) / n
        dims = np.maximum(8, np.ceil((hi - lo) / passo).astype(int) + 1)
        eixos = [lo[i] + passo * np.arange(dims[i], dtype=np.float32) for i in range(3)]
        campo = np.empty(tuple(dims), dtype=np.float32)
        yz = np.stack(np.meshgrid(eixos[1], eixos[2], indexing='ij'), axis=-1).reshape(-1, 2)
        for i, x in enumerate(eixos[0]):  # fatia por fatia para gastar pouca memória
            P = np.concatenate([np.full((len(yz), 1), x, dtype=np.float32), yz], axis=1)
            campo[i] = self.campo(P, camada).reshape(dims[1], dims[2])
        v, f, _, _ = measure.marching_cubes(campo, level=0.0, spacing=(passo, passo, passo))
        v = (v + lo).astype(np.float32)
        cores, pelo = self.cores(v, camada)
        vol = np.einsum("ij,ij->i", v[f[:, 0]], np.cross(v[f[:, 1]], v[f[:, 2]])).sum()
        if vol < 0:  # garante as faces viradas para fora (o pelo nasce na direção da normal)
            f = f[:, ::-1].copy()
        return v, f, cores, pelo
