// Ajudantes de desenho compartilhados pelas telas.
import { TIPOS } from '../dados/tipos.js';

export const FONTE = 'Pixelify Sans';

export function estilo(tam = 24, cor = '#303840', extra = {}) {
  return {
    fontFamily: FONTE,
    fontSize: tam + 'px',
    color: cor,
    shadow: cor === '#ffffff' || cor === '#f8f8f0'
      ? { offsetX: 2, offsetY: 2, color: '#303840', fill: true }
      : { offsetX: 2, offsetY: 2, color: '#d4d4cc', fill: true },
    ...extra,
  };
}

/** Caixa no estilo GBA: borda escura, fundo claro, filete interno. */
export function caixa(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  const borda = opts.borda ?? 0x384858;
  const fundo = opts.fundo ?? 0xf8f8f0;
  const filete = opts.filete ?? 0xa8b8c8;
  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(x + 3, y + 4, w, h, 10);
  g.fillStyle(borda);
  g.fillRoundedRect(x, y, w, h, 10);
  g.fillStyle(fundo);
  g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 7);
  if (filete !== null) {
    g.lineStyle(2, filete);
    g.strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 4);
  }
  return g;
}

export const corPV = (f) => (f > 0.5 ? 0x58d058 : f > 0.2 ? 0xf8c030 : 0xf05050);

/** Barra de PV. Retorna um objeto com .definir(fração). */
export function barraPV(scene, x, y, w, h = 10) {
  const g = scene.add.graphics();
  const desenhar = (f) => {
    g.clear();
    g.fillStyle(0x384858); g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 4);
    g.fillStyle(0x506070); g.fillRect(x, y, w, h);
    const larg = Math.max(0, Math.round(w * f));
    if (larg > 0) {
      g.fillStyle(corPV(f)); g.fillRect(x, y, larg, h);
      g.fillStyle(0xffffff, 0.35); g.fillRect(x, y, larg, Math.max(2, Math.floor(h / 3)));
    }
  };
  desenhar(1);
  return { g, definir: desenhar };
}

/** Selo colorido com o nome do tipo. */
export function seloTipo(scene, x, y, tipo, tam = 16) {
  const t = TIPOS[tipo];
  const txt = scene.add.text(0, 0, t.nome.toUpperCase(), estilo(tam, '#ffffff', { fontStyle: '700' })).setOrigin(0.5);
  const w = Math.max(64, txt.width + 16), h = tam + 10;
  const g = scene.add.graphics();
  const cor = parseInt(t.cor.slice(1), 16);
  g.fillStyle(0x202830); g.fillRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 7);
  g.fillStyle(cor); g.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
  const c = scene.add.container(x, y, [g, txt]);
  c.largura = w;
  return c;
}

/**
 * Desenha um Encantado. `escala` é relativa a um sprite de 64 px (escala 3 = 192 px na tela),
 * então funciona igual para a arte provisória (64 px) e para a arte renderizada (192 px).
 */
export function criatura(scene, x, y, id, escala = 1) {
  const px = 64 * escala;
  const mini = `criatura_${id}_mini`;
  const chave = px <= 100 && scene.textures.exists(mini) ? mini : 'criatura_' + id;
  const img = scene.add.image(x, y, chave);
  img.setScale(px / img.width);
  return img;
}
