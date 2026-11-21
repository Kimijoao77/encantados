#!/usr/bin/env python3
"""
Padroniza as imagens geradas pelo GPT/Gemini para o jogo.

Coloque as imagens em:
  arte_bruta/criaturas/<id>.png          (frente, ex.: guarito.png)
  arte_bruta/criaturas/<id>_costas.png   (opcional, vista de costas)

Rode:
  python3 ferramentas/processar_arte.py

O que o script faz com cada imagem:
  1. tira o fundo (branco ou de cor lisa)
  2. corta as sobras e centraliza a criatura com os pés embaixo
  3. reduz para 64x64 pixels
  4. limita a paleta de cores (visual de pixel art consistente)
  5. coloca um contorno escuro de 1 pixel
  6. salva em assets/criaturas/ e registra em assets/manifest.json

Precisa da biblioteca Pillow (pip install pillow).
"""
import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / 'arte_bruta' / 'criaturas'
SAIDA = RAIZ / 'assets' / 'criaturas'
MANIFESTO = RAIZ / 'assets' / 'manifest.json'

TAMANHO = 64          # sprite final 64x64
MAX_CRIATURA = 60     # maior lado da criatura dentro do quadro
CORES = 24            # cores máximas por sprite
TOLERANCIA = 48       # quão parecido com o fundo um pixel precisa ser para sumir
CONTORNO = (24, 24, 32, 255)


def distancia(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def remover_fundo(img):
    """Se a imagem não tem transparência, apaga o fundo a partir das bordas (flood fill)."""
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    cantos = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    if sum(1 for c in cantos if c[3] < 20) >= 3:
        return img  # já vem com fundo transparente
    fundo = max(set(cantos), key=cantos.count)
    visto = bytearray(w * h)
    fila = deque()
    for x in range(w):
        fila.append((x, 0)); fila.append((x, h - 1))
    for y in range(h):
        fila.append((0, y)); fila.append((w - 1, y))
    while fila:
        x, y = fila.popleft()
        i = y * w + x
        if visto[i]:
            continue
        visto[i] = 1
        c = px[x, y]
        if c[3] < 20 or distancia(c, fundo) <= TOLERANCIA:
            px[x, y] = (0, 0, 0, 0)
            if x > 0: fila.append((x - 1, y))
            if x < w - 1: fila.append((x + 1, y))
            if y > 0: fila.append((x, y - 1))
            if y < h - 1: fila.append((x, y + 1))
    return img


def enquadrar(img):
    """Corta as sobras e põe a criatura num quadro TAMANHOxTAMANHO, centralizada e com os pés embaixo."""
    caixa = img.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
    if not caixa:
        raise ValueError('imagem vazia depois de tirar o fundo')
    img = img.crop(caixa)
    w, h = img.size
    escala = MAX_CRIATURA / max(w, h)
    nw, nh = max(1, round(w * escala)), max(1, round(h * escala))
    # Reduz em etapas para manter detalhes (evita serrilhado feio)
    while img.width > nw * 2:
        img = img.resize((img.width // 2, img.height // 2), Image.BOX)
    img = img.resize((nw, nh), Image.LANCZOS)
    quadro = Image.new('RGBA', (TAMANHO, TAMANHO), (0, 0, 0, 0))
    quadro.paste(img, ((TAMANHO - nw) // 2, TAMANHO - 2 - nh), img)
    return quadro


def pixelar(img):
    """Alfa duro (sem meio-transparente) e paleta limitada."""
    alfa = img.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    rgb = img.convert('RGB')
    q = rgb.quantize(colors=CORES, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = q.convert('RGBA')
    out.putalpha(alfa)
    return out


def contornar(img):
    w, h = img.size
    px = img.load()
    solido = lambda x, y: 0 <= x < w and 0 <= y < h and px[x, y][3] == 255
    borda = [(x, y) for y in range(h) for x in range(w)
             if not solido(x, y) and (solido(x - 1, y) or solido(x + 1, y) or solido(x, y - 1) or solido(x, y + 1))]
    for x, y in borda:
        px[x, y] = CONTORNO
    return img


def processar(arquivo):
    img = Image.open(arquivo)
    img = remover_fundo(img)
    img = enquadrar(img)
    img = pixelar(img)
    img = contornar(img)
    return img


def main():
    if not ENTRADA.exists():
        print(f'Pasta {ENTRADA} não existe. Nada a fazer.')
        return 0
    SAIDA.mkdir(parents=True, exist_ok=True)
    manifesto = {'texturas': {}}
    if MANIFESTO.exists():
        manifesto = json.loads(MANIFESTO.read_text(encoding='utf-8') or '{}')
        manifesto.setdefault('texturas', {})
    feitos, erros = 0, 0
    for arq in sorted(ENTRADA.iterdir()):
        if arq.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            continue
        nome = arq.stem.lower().strip().replace(' ', '_').replace('-', '_')
        try:
            img = processar(arq)
        except Exception as e:  # noqa: BLE001
            print(f'  ✗ {arq.name}: {e}')
            erros += 1
            continue
        destino = SAIDA / f'{nome}.png'
        img.save(destino)
        manifesto['texturas'][f'criatura_{nome}'] = f'assets/criaturas/{nome}.png'
        print(f'  ✓ {arq.name} -> {destino.relative_to(RAIZ)}')
        feitos += 1
    MANIFESTO.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Pronto: {feitos} imagem(ns) processada(s), {erros} erro(s).')
    return 1 if erros else 0


if __name__ == '__main__':
    sys.exit(main())
