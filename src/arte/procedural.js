// Arte provisória gerada por código.
// Se existir uma imagem de verdade com a mesma chave (carregada pelo manifesto), ela tem prioridade
// e nada aqui é desenhado para aquela chave.
import { CRIATURAS } from '../dados/criaturas.js';

const TILE = 16;

function rngSemente(s) {
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexParaRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbParaHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function ajustar(h, f) {
  const [r, g, b] = hexParaRgb(h);
  return f >= 1 ? rgbParaHex([r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)]) : rgbParaHex([r * f, g * f, b * f]);
}

function novaTextura(scene, chave, w, h, desenhar) {
  if (scene.textures.exists(chave)) return false;
  const tex = scene.textures.createCanvas(chave, w, h);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  desenhar(ctx, w, h);
  tex.refresh();
  return tex;
}

const px = (ctx, x, y, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, 1, 1); };
const ret = (ctx, x, y, w, h, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, w, h); };

// ═══════════════════════════════════════════════════════
// TILES
// ═══════════════════════════════════════════════════════
const C = {
  grama: '#7cc45c', gramaEsc: '#5ea844', gramaClara: '#a4dc78',
  mato: '#4f9a3c', matoEsc: '#2f6e28', matoClaro: '#86c860',
  terra: '#dcc392', terraEsc: '#bfa16c', terraClara: '#ecdcb4',
  agua: '#5a96e0', aguaClara: '#9cc8f4', aguaEsc: '#3f74c0',
  tronco: '#7a5232', troncoEsc: '#523420',
  folha: '#3f8a3a', folhaEsc: '#245a26', folhaClara: '#6ab84e',
  contorno: '#1e2a22',
};

function fundoGrama(ctx, semente) {
  const r = rngSemente(semente);
  ret(ctx, 0, 0, 16, 16, C.grama);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 14) + 1;
    px(ctx, x, y, C.gramaEsc); px(ctx, x + 1, y - 1, C.gramaEsc);
  }
  for (let i = 0; i < 4; i++) px(ctx, Math.floor(r() * 16), Math.floor(r() * 16), C.gramaClara);
}

function desenharTiles(scene) {
  const t = (chave, fn) => novaTextura(scene, 'tile_' + chave, TILE, TILE, fn);

  t('grama', (ctx) => fundoGrama(ctx, 11));
  t('grama2', (ctx) => fundoGrama(ctx, 47));

  t('mato', (ctx) => {
    ret(ctx, 0, 0, 16, 16, C.mato);
    const tufo = (x, y) => {
      for (let i = 0; i < 6; i++) px(ctx, x + Math.floor(i / 2) - 1, y - i, i < 2 ? C.matoEsc : C.mato);
      for (let i = 0; i < 6; i++) px(ctx, x + 2 - Math.floor(i / 3), y - i, C.matoEsc);
      px(ctx, x + 1, y - 6, C.matoClaro); px(ctx, x - 1, y - 5, C.matoClaro); px(ctx, x + 3, y - 4, C.matoClaro);
    };
    tufo(2, 7); tufo(10, 7); tufo(6, 15); tufo(14, 15);
    for (let x = 0; x < 16; x += 2) { px(ctx, x, 7, C.matoEsc); px(ctx, x + 1, 15, C.matoEsc); }
  });
  // Parte de cima do mato, desenhada por cima dos pés do personagem
  novaTextura(scene, 'tile_mato_topo', 16, 16, (ctx) => {
    for (let x = 0; x < 16; x++) {
      const h = 3 + ((x * 7) % 4);
      for (let y = 16 - h; y < 16; y++) px(ctx, x, y, y === 16 - h ? C.matoClaro : (x % 3 === 0 ? C.matoEsc : C.mato));
    }
  });

  t('caminho', (ctx) => {
    const r = rngSemente(5);
    ret(ctx, 0, 0, 16, 16, C.terra);
    for (let i = 0; i < 9; i++) px(ctx, Math.floor(r() * 16), Math.floor(r() * 16), C.terraEsc);
    for (let i = 0; i < 6; i++) px(ctx, Math.floor(r() * 16), Math.floor(r() * 16), C.terraClara);
  });

  t('areia', (ctx) => {
    const r = rngSemente(9);
    ret(ctx, 0, 0, 16, 16, '#ead9a6');
    for (let i = 0; i < 10; i++) px(ctx, Math.floor(r() * 16), Math.floor(r() * 16), '#d6c08a');
  });

  t('flores', (ctx) => {
    fundoGrama(ctx, 23);
    const flor = (x, y, cor) => {
      px(ctx, x, y - 1, cor); px(ctx, x - 1, y, cor); px(ctx, x + 1, y, cor); px(ctx, x, y + 1, cor);
      px(ctx, x, y, '#f8e060');
    };
    flor(4, 4, '#f05858'); flor(11, 6, '#ffffff'); flor(6, 11, '#f8a8d0'); flor(12, 13, '#f05858');
  });

  t('arvore', (ctx) => {
    fundoGrama(ctx, 31);
    ret(ctx, 6, 11, 4, 5, C.tronco); ret(ctx, 6, 11, 1, 5, C.troncoEsc);
    ctx.fillStyle = C.contorno; ctx.beginPath(); ctx.arc(8, 7, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.folhaEsc; ctx.beginPath(); ctx.arc(8, 7, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.folha; ctx.beginPath(); ctx.arc(7.5, 6.5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.folhaClara; ctx.beginPath(); ctx.arc(6, 4.5, 2.5, 0, Math.PI * 2); ctx.fill();
    px(ctx, 10, 8, C.folhaEsc); px(ctx, 4, 9, C.folhaEsc); px(ctx, 11, 4, C.folhaClara);
  });

  t('araucaria', (ctx) => {
    fundoGrama(ctx, 37);
    ret(ctx, 7, 5, 2, 11, C.tronco); ret(ctx, 7, 5, 1, 11, C.troncoEsc);
    const camada = (y, larg, alt) => {
      ret(ctx, 8 - larg / 2, y, larg, alt, C.folhaEsc);
      ret(ctx, 8 - larg / 2 + 1, y, larg - 2, alt - 1, '#3c7a34');
      ret(ctx, 8 - larg / 2 + 2, y, larg - 5, 1, C.folhaClara);
    };
    // copa em forma de taça (candelabro)
    ret(ctx, 0, 1, 16, 1, C.contorno);
    camada(1, 16, 4);
    ret(ctx, 1, 0, 3, 1, '#3c7a34'); ret(ctx, 12, 0, 3, 1, '#3c7a34');
    ret(ctx, 5, 5, 1, 1, C.tronco); ret(ctx, 10, 5, 1, 1, C.tronco);
    camada(7, 10, 3);
    ret(ctx, 6, 7, 1, 1, C.contorno);
  });

  const aguaFrame = (ctx, desloc) => {
    ret(ctx, 0, 0, 16, 16, C.agua);
    for (let y = 2; y < 16; y += 5) {
      const x0 = ((y * 3 + desloc) % 12);
      ret(ctx, x0, y, 4, 1, C.aguaClara);
      ret(ctx, (x0 + 8) % 16, y + 2, 3, 1, C.aguaEsc);
    }
  };
  t('agua', (ctx) => aguaFrame(ctx, 0));
  t('agua2', (ctx) => aguaFrame(ctx, 3));

  t('cerca', (ctx) => {
    fundoGrama(ctx, 41);
    const madeira = '#b07a48', esc = '#6e4a2a';
    ret(ctx, 0, 5, 16, 2, madeira); ret(ctx, 0, 7, 16, 1, esc);
    ret(ctx, 0, 10, 16, 2, madeira); ret(ctx, 0, 12, 16, 1, esc);
    for (const x of [2, 12]) { ret(ctx, x, 3, 3, 12, madeira); ret(ctx, x + 2, 3, 1, 12, esc); ret(ctx, x, 3, 3, 1, '#d09a68'); }
  });

  t('rocha', (ctx) => {
    fundoGrama(ctx, 43);
    ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.ellipse(8, 10, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a8a94'; ctx.beginPath(); ctx.ellipse(8, 9.5, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b4b4be'; ctx.beginPath(); ctx.ellipse(6.5, 8, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  });

  t('placa', (ctx) => {
    fundoGrama(ctx, 53);
    ret(ctx, 7, 9, 2, 7, '#6e4a2a');
    ret(ctx, 1, 2, 14, 9, '#4a2e18'); ret(ctx, 2, 3, 12, 7, '#c89860');
    ret(ctx, 4, 5, 8, 1, '#8a6038'); ret(ctx, 4, 7, 6, 1, '#8a6038');
  });

  const telhado = (cor) => (ctx) => {
    ret(ctx, 0, 0, 16, 16, cor);
    for (let y = 3; y < 16; y += 4) ret(ctx, 0, y, 16, 1, ajustar(cor, 0.72));
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) ret(ctx, x, y, 1, 3, ajustar(cor, 0.82));
    ret(ctx, 0, 0, 16, 1, ajustar(cor, 1.25));
  };
  t('telhado', telhado('#c4583c'));
  t('telhadoAzul', telhado('#4a74c4'));
  t('telhadoVermelho', telhado('#d84a5a'));

  const parede = (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#f2e4c4');
    for (let y = 3; y < 16; y += 4) ret(ctx, 0, y, 16, 1, '#dccaa2');
    ret(ctx, 0, 0, 16, 2, '#7a4a34');
    ret(ctx, 0, 14, 16, 2, '#b0987a');
  };
  t('parede', parede);
  t('janela', (ctx) => {
    parede(ctx);
    ret(ctx, 3, 4, 10, 8, '#ffffff'); ret(ctx, 4, 5, 8, 6, '#78b0e8');
    ret(ctx, 7, 5, 2, 6, '#ffffff'); ret(ctx, 4, 7, 8, 1, '#ffffff');
    ret(ctx, 5, 6, 2, 1, '#c0e0ff');
  });
  t('porta', (ctx) => {
    parede(ctx);
    ret(ctx, 3, 3, 10, 13, '#4a2e18'); ret(ctx, 4, 4, 8, 12, '#9a6a3e');
    ret(ctx, 4, 4, 8, 1, '#b8844e'); ret(ctx, 10, 10, 1, 2, '#f8d878');
  });

  t('nevoa', (ctx) => {
    fundoGrama(ctx, 61);
    ctx.fillStyle = 'rgba(232,238,246,0.85)'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(5, 6, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, 12, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
  });

  // Interiores
  t('piso', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#d8a86c');
    for (let y = 0; y < 16; y += 4) ret(ctx, 0, y + 3, 16, 1, '#b88a52');
    ret(ctx, 5, 0, 1, 3, '#b88a52'); ret(ctx, 12, 4, 1, 3, '#b88a52'); ret(ctx, 3, 8, 1, 3, '#b88a52'); ret(ctx, 9, 12, 1, 3, '#b88a52');
  });
  t('paredeInt', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#f0e2c2');
    for (let x = 1; x < 16; x += 4) ret(ctx, x, 0, 2, 12, '#e4d2ac');
    ret(ctx, 0, 12, 16, 4, '#9a6a44'); ret(ctx, 0, 12, 16, 1, '#c08a5a');
  });
  t('tapete', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#c04848');
    ret(ctx, 1, 1, 14, 14, '#d86060'); ret(ctx, 3, 3, 10, 10, '#c04848');
    ret(ctx, 5, 5, 6, 6, '#f0c060');
  });
  t('saida', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#d8a86c');
    ret(ctx, 1, 2, 14, 12, '#6a8a4a');
    for (let x = 2; x < 14; x += 2) ret(ctx, x, 3, 1, 10, '#82a462');
  });
  t('cama', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#d8a86c');
    ret(ctx, 1, 0, 14, 16, '#4a2e18'); ret(ctx, 2, 1, 12, 14, '#ffffff');
    ret(ctx, 2, 6, 12, 9, '#5a8ad8'); ret(ctx, 2, 6, 12, 1, '#8ab0f0');
    ret(ctx, 4, 2, 8, 3, '#e8e8f0');
  });
  t('mesa', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#d8a86c');
    ret(ctx, 0, 2, 16, 10, '#6e4426'); ret(ctx, 0, 2, 16, 8, '#a8743e'); ret(ctx, 0, 2, 16, 1, '#c8945a');
    ret(ctx, 1, 12, 2, 4, '#6e4426'); ret(ctx, 13, 12, 2, 4, '#6e4426');
  });
  t('balcao', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#7a4a34');
    ret(ctx, 0, 0, 16, 6, '#e8e0d0'); ret(ctx, 0, 5, 16, 1, '#b8b0a0');
    ret(ctx, 0, 6, 16, 10, '#c45c4c'); ret(ctx, 0, 10, 16, 1, '#a84a3c');
  });
  t('estante', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#5a3820');
    ret(ctx, 1, 1, 14, 14, '#8a5a34');
    for (const y of [1, 6, 11]) {
      ret(ctx, 1, y + 4, 14, 1, '#5a3820');
      const cores = ['#c84848', '#4870c8', '#e0b040', '#58a058', '#a058b0'];
      for (let x = 2; x < 14; x += 2) ret(ctx, x, y, 2, 4, cores[(x + y) % 5]);
    }
  });
  t('vaso', (ctx) => {
    ret(ctx, 0, 0, 16, 16, '#d8a86c');
    ret(ctx, 4, 10, 8, 6, '#b8603c'); ret(ctx, 4, 10, 8, 1, '#d8805c');
    ctx.fillStyle = '#3f8a3a'; ctx.beginPath(); ctx.ellipse(8, 6, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6ab84e'; ctx.beginPath(); ctx.ellipse(6, 4, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  });
  t('vazio', (ctx) => ret(ctx, 0, 0, 16, 16, '#101418'));
}

// ═══════════════════════════════════════════════════════
// PERSONAGENS (16x16, 12 quadros: baixo×3, cima×3, esq×3, dir×3)
// ═══════════════════════════════════════════════════════
const MOLDES = {
  frente: [
    '................',
    '....kkkkkkkk....',
    '...khhhhhhhhk...',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khsssssssshk..',
    '..kssksssskssk..',
    '..kssssssssssk..',
    '...kssssssssk...',
    '...kcccccccck...',
    '..ksccccccccsk..',
    '..ksccccccccsk..',
    '...kcccccccck...',
    '...kppppppppk...',
    '...kppk..kppk...',
    '...kbbk..kbbk...',
  ],
  frenteAndando: [
    '................',
    '....kkkkkkkk....',
    '...khhhhhhhhk...',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khsssssssshk..',
    '..kssksssskssk..',
    '..kssssssssssk..',
    '...kssssssssk...',
    '...kcccccccck...',
    '..ksccccccccsk..',
    '..kscccccccck...',
    '...kcccccccck...',
    '...kppppppppk...',
    '...kppk..kpk....',
    '...kbbk...k.....',
  ],
  costas: [
    '................',
    '....kkkkkkkk....',
    '...khhhhhhhhk...',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..kshhhhhhhhsk..',
    '...kssssssssk...',
    '...kcccccccck...',
    '..ksccccccccsk..',
    '..ksccccccccsk..',
    '...kcccccccck...',
    '...kppppppppk...',
    '...kppk..kppk...',
    '...kbbk..kbbk...',
  ],
  costasAndando: [
    '................',
    '....kkkkkkkk....',
    '...khhhhhhhhk...',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..kshhhhhhhhsk..',
    '...kssssssssk...',
    '...kcccccccck...',
    '..ksccccccccsk..',
    '...kccccccccsk..',
    '...kcccccccck...',
    '...kppppppppk...',
    '....kpk..kppk...',
    '.....k...kbbk...',
  ],
  lado: [
    '................',
    '.....kkkkkkk....',
    '....khhhhhhhk...',
    '...khhhhhhhhhk..',
    '...khhhhhhhhhk..',
    '...ksssshhhhhk..',
    '...ksksshhhhhk..',
    '...kssssshhhhk..',
    '....ksssssssk...',
    '....kcccccck....',
    '....kccsscck....',
    '....kccsscck....',
    '....kcccccck....',
    '....kppppppk....',
    '.....kppppk.....',
    '.....kbbbbk.....',
  ],
  ladoAndando: [
    '................',
    '.....kkkkkkk....',
    '....khhhhhhhk...',
    '...khhhhhhhhhk..',
    '...khhhhhhhhhk..',
    '...ksssshhhhhk..',
    '...ksksshhhhhk..',
    '...kssssshhhhk..',
    '....ksssssssk...',
    '....kcccccck....',
    '....kcsscccsk...',
    '....kcsscccck...',
    '....kcccccck....',
    '....kppppppk....',
    '....kpk..kpk....',
    '...kbk....kbk...',
  ],
};

export const PALETAS_PERSONAGEM = {
  jogador:    { h: '#d83c3c', s: '#f4c8a0', c: '#3c78d8', p: '#3a3a52', b: '#4a2e1a' },
  rival:      { h: '#5a3a22', s: '#e8b48a', c: '#2fa070', p: '#2a2a3a', b: '#1a1a1a' },
  professora: { h: '#c8c8d0', s: '#f0c8a0', c: '#f8f8f8', p: '#6a5a8a', b: '#3a2a2a' },
  mae:        { h: '#7a4a2a', s: '#f0c49c', c: '#e87aa0', p: '#5a6aa0', b: '#3a2a2a' },
  enfermeira: { h: '#e88ab0', s: '#f4d0b0', c: '#ffffff', p: '#f0a0c0', b: '#ffffff' },
  vendedor:   { h: '#2a2a2a', s: '#c89068', c: '#3a9a5a', p: '#4a3a2a', b: '#2a1a10' },
  velho:      { h: '#e8e8e8', s: '#e0b08a', c: '#8a6a4a', p: '#4a4a4a', b: '#2a1a10' },
  crianca:    { h: '#e0b030', s: '#f4c8a0', c: '#f08030', p: '#3a6ab0', b: '#c03030' },
  menina:     { h: '#3a2010', s: '#b87a50', c: '#d84a8a', p: '#4a4a6a', b: '#2a1a10' },
  roceiro:    { h: '#c8a050', s: '#d0986a', c: '#c84040', p: '#3a5a9a', b: '#4a2e1a' },
  vo:         { h: '#f0f0f0', s: '#d8a880', c: '#8a5aa0', p: '#5a4a6a', b: '#2a1a10' },
  guarda:     { h: '#2a2a3a', s: '#c89068', c: '#5a6a3a', p: '#3a3a2a', b: '#1a1a1a' },
};

function desenharMolde(ctx, molde, pal, ox, espelhar) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = molde[y][espelhar ? 15 - x : x];
      if (ch === '.') continue;
      const cor = ch === 'k' ? '#202028' : pal[ch];
      if (cor) px(ctx, ox + x, y, cor);
    }
  }
}

export function gerarPersonagem(scene, nome, pal) {
  const chave = 'pers_' + nome;
  if (scene.textures.exists(chave)) return;
  const quadros = [
    ['frente', false], ['frenteAndando', false], ['frenteAndando', true],
    ['costas', false], ['costasAndando', false], ['costasAndando', true],
    ['lado', false], ['ladoAndando', false], ['lado', false],
    ['lado', true], ['ladoAndando', true], ['lado', true],
  ];
  const tex = scene.textures.createCanvas(chave, 16 * quadros.length, 16);
  const ctx = tex.getContext();
  quadros.forEach(([m, esp], i) => desenharMolde(ctx, MOLDES[m], pal, i * 16, esp));
  tex.refresh();
  quadros.forEach((_, i) => tex.add(i, 0, i * 16, 0, 16, 16));
}

// Retrato grande para cenas (ex.: professora na introdução) = personagem ampliado
// (só usamos o quadro 0 com setScale).

// ═══════════════════════════════════════════════════════
// CRIATURAS (desenhadas em 32x32, ampliadas para 64x64)
// ═══════════════════════════════════════════════════════
const FORMAS_QUAD = {
  quadrupede: { corpo: [9, 5], perna: 8, cabeca: 5, focinho: 3, orelha: 'grandes', cauda: 'peluda' },
  lontra:     { corpo: [10, 5], perna: 3, cabeca: 5, focinho: 2, orelha: 'redondas', cauda: 'remo' },
  capivara:   { corpo: [10, 7], perna: 3, cabeca: 6, focinho: 3, orelha: 'redondas', cauda: 'nenhuma' },
  tamandua:   { corpo: [9, 6], perna: 4, cabeca: 3, focinho: 7, orelha: 'redondas', cauda: 'bandeira' },
  boi:        { corpo: [10, 7], perna: 6, cabeca: 5, focinho: 3, orelha: 'chifres', cauda: 'curta' },
  quati:      { corpo: [8, 4], perna: 4, cabeca: 4, focinho: 4, orelha: 'redondas', cauda: 'listrada' },
  porco:      { corpo: [9, 6], perna: 3, cabeca: 5, focinho: 3, orelha: 'pontudas', cauda: 'curta' },
  felino:     { corpo: [10, 5], perna: 6, cabeca: 5, focinho: 1, orelha: 'redondas', cauda: 'longa' },
  equino:     { corpo: [10, 6], perna: 8, cabeca: 4, focinho: 3, orelha: 'pontudas', cauda: 'longa' },
  tatu:       { corpo: [10, 7], perna: 2, cabeca: 3, focinho: 4, orelha: 'pontudas', cauda: 'curta', casco: true },
  jacare:     { corpo: [11, 4], perna: 2, cabeca: 4, focinho: 7, orelha: 'nenhuma', cauda: 'jacare' },
};

function el(ctx, cx, cy, rx, ry, cor) {
  ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); ctx.fill();
}
function tri(ctx, pts, cor) {
  ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); ctx.fill();
}
function olho(ctx, x, y, grande) {
  if (grande) { ret(ctx, x - 1, y - 1, 3, 3, '#ffffff'); ret(ctx, x, y, 2, 2, '#101010'); px(ctx, x, y, '#ffffff'); }
  else { ret(ctx, x, y, 2, 2, '#101010'); px(ctx, x, y, '#ffffff'); }
}

function desenharQuadrupede(ctx, f, cores, marcas) {
  const [c1, c2, c3] = cores;
  const chao = 30;
  const [rx, ry] = f.corpo;
  const cyCorpo = chao - f.perna - ry + 2;
  const cxCorpo = 17;
  const xCab = cxCorpo - rx + 1;
  const yCab = cyCorpo - ry - 1;
  // cauda (atrás)
  const xCauda = cxCorpo + rx;
  if (f.cauda === 'peluda') { el(ctx, xCauda + 2, cyCorpo - 1, 3, 4, c1); el(ctx, xCauda + 3, cyCorpo + 2, 2, 2, marcas.includes('cauda') ? c3 : '#f0f0f0'); }
  if (f.cauda === 'longa') { tri(ctx, [xCauda - 1, cyCorpo - 2, xCauda + 6, cyCorpo - 7, xCauda + 7, cyCorpo - 5, xCauda, cyCorpo + 1], c1); }
  if (f.cauda === 'remo') { el(ctx, xCauda + 3, cyCorpo + 2, 5, 2, c1); }
  if (f.cauda === 'curta') { el(ctx, xCauda + 1, cyCorpo - 2, 2, 2, c1); }
  if (f.cauda === 'bandeira') { el(ctx, xCauda + 3, cyCorpo - 3, 4, 7, c1); el(ctx, xCauda + 4, cyCorpo - 3, 2, 5, ajustar(c1, 0.8)); }
  if (f.cauda === 'listrada') { for (let i = 0; i < 4; i++) el(ctx, xCauda + 2 + i * 1.5, cyCorpo - 2 - i * 2.5, 2.2, 1.8, i % 2 ? c2 : c1); }
  if (f.cauda === 'jacare') { tri(ctx, [xCauda - 3, cyCorpo - 3, xCauda + 8, cyCorpo + 3, xCauda - 3, cyCorpo + 3], c1); }
  // pernas
  const yPerna = cyCorpo + ry - 3;
  const xs = [cxCorpo - rx + 2, cxCorpo - rx + 5, cxCorpo + rx - 6, cxCorpo + rx - 3];
  xs.forEach((x, i) => ret(ctx, x, yPerna, 2, chao - yPerna, i % 2 ? ajustar(c2, 0.85) : c2));
  // corpo
  el(ctx, cxCorpo, cyCorpo, rx, ry, c1);
  el(ctx, cxCorpo - 1, cyCorpo - ry / 3, rx - 2, ry / 2, ajustar(c1, 1.18));
  if (f.casco || marcas.includes('faixas')) {
    el(ctx, cxCorpo, cyCorpo - 1, rx, ry - 1, c2);
    for (let x = cxCorpo - rx + 3; x < cxCorpo + rx - 1; x += 3) ret(ctx, x, cyCorpo - ry + 1, 1, ry * 2 - 3, ajustar(c2, 0.75));
    el(ctx, cxCorpo - 2, cyCorpo - ry + 2, rx - 4, 1.5, ajustar(c2, 1.25));
  }
  if (marcas.includes('manchas') || marcas.includes('rosetas')) {
    const r = rngSemente(7);
    for (let i = 0; i < 6; i++) el(ctx, cxCorpo - rx + 3 + r() * (rx * 2 - 6), cyCorpo - ry / 2 + r() * ry, 1.5, 1.2, c2);
  }
  if (marcas.includes('faixaDiagonal')) tri(ctx, [cxCorpo - 6, cyCorpo - ry + 1, cxCorpo - 3, cyCorpo - ry + 1, cxCorpo + 4, cyCorpo + ry - 1, cxCorpo + 1, cyCorpo + ry - 1], c2);
  if (marcas.includes('escamas') || marcas.includes('espinhos')) for (let x = cxCorpo - rx + 2; x < cxCorpo + rx; x += 3) tri(ctx, [x, cyCorpo - ry + 1, x + 1.5, cyCorpo - ry - 2, x + 3, cyCorpo - ry + 1], ajustar(c1, 0.7));
  if (marcas.includes('crina') || marcas.includes('crinaFogo')) for (let x = cxCorpo - rx + 1; x < cxCorpo + 2; x += 3) tri(ctx, [x, cyCorpo - ry + 2, x + 1.5, cyCorpo - ry - 3, x + 3, cyCorpo - ry + 2], c3);
  if (marcas.includes('manchaPeito')) el(ctx, cxCorpo - rx + 3, cyCorpo + 1, 3, 3, c2);
  if (marcas.includes('colar')) ret(ctx, xCab + 3, yCab + f.cabeca + 1, 3, 4, c2);
  // cabeça
  if (marcas.includes('fogoCabeca')) {
    el(ctx, xCab, yCab + 2, 4, 5, c2);
    el(ctx, xCab - 1, yCab, 3, 4, c3);
    tri(ctx, [xCab - 4, yCab, xCab - 1, yCab - 8, xCab + 3, yCab], c2);
    return;
  }
  el(ctx, xCab, yCab, f.cabeca, f.cabeca - 0.5, c1);
  if (f.focinho > 0) {
    el(ctx, xCab - f.cabeca + 1 - f.focinho / 2, yCab + 2, f.focinho / 1.2 + 1, Math.max(1.5, f.cabeca / 2.5), f.focinho > 5 ? c1 : ajustar(c1, 1.2));
    ret(ctx, Math.round(xCab - f.cabeca - f.focinho / 1.2), Math.round(yCab + 1), 2, 2, '#202020');
  }
  // orelhas
  if (f.orelha === 'grandes') { tri(ctx, [xCab - 2, yCab - 3, xCab - 1, yCab - 11, xCab + 2, yCab - 3], c1); tri(ctx, [xCab + 1, yCab - 3, xCab + 4, yCab - 10, xCab + 5, yCab - 2], ajustar(c1, 0.8)); }
  if (f.orelha === 'pontudas') { tri(ctx, [xCab - 1, yCab - 3, xCab, yCab - 7, xCab + 2, yCab - 3], c1); tri(ctx, [xCab + 2, yCab - 3, xCab + 4, yCab - 6, xCab + 5, yCab - 2], ajustar(c1, 0.8)); }
  if (f.orelha === 'redondas') { el(ctx, xCab - 1, yCab - f.cabeca + 1, 1.8, 1.8, c1); el(ctx, xCab + 3, yCab - f.cabeca + 1.5, 1.8, 1.8, ajustar(c1, 0.8)); }
  if (f.orelha === 'chifres') { tri(ctx, [xCab - 3, yCab - 3, xCab - 5, yCab - 8, xCab - 1, yCab - 4], '#f0e8d0'); tri(ctx, [xCab + 2, yCab - 4, xCab + 4, yCab - 9, xCab + 4, yCab - 3], '#d8d0b8'); }
  if (marcas.includes('gorro')) tri(ctx, [xCab - 4, yCab - 3, xCab + 1, yCab - 13, xCab + 4, yCab - 3], c3);
  if (marcas.includes('crinaFogo')) tri(ctx, [xCab, yCab - 4, xCab + 3, yCab - 10, xCab + 5, yCab - 3], c3);
  olho(ctx, Math.round(xCab - 2), Math.round(yCab - 1), true);
}

function desenharAve(ctx, forma, cores, marcas) {
  const [c1, c2, c3] = cores;
  if (forma === 'coruja') {
    if (marcas.includes('pernas')) { ret(ctx, 12, 24, 2, 6, '#e0c060'); ret(ctx, 18, 24, 2, 6, '#e0c060'); }
    el(ctx, 16, 18, 9, 9, c1);
    el(ctx, 16, 21, 6, 6, c2);
    const r = rngSemente(3);
    for (let i = 0; i < 8; i++) px(ctx, 9 + Math.floor(r() * 14), 12 + Math.floor(r() * 12), '#ffffff');
    if (marcas.includes('tufos')) { tri(ctx, [8, 11, 9, 4, 12, 10], c1); tri(ctx, [20, 10, 23, 4, 24, 11], c1); }
    el(ctx, 12, 14, 3.5, 3.5, '#ffffff'); el(ctx, 20, 14, 3.5, 3.5, '#ffffff');
    el(ctx, 12, 14, 2.5, 2.5, c3); el(ctx, 20, 14, 2.5, 2.5, c3);
    ret(ctx, 11, 13, 2, 2, '#101010'); ret(ctx, 19, 13, 2, 2, '#101010');
    tri(ctx, [15, 16, 17, 16, 16, 19], '#e0a020');
    return;
  }
  if (forma === 'morcego') {
    tri(ctx, [16, 14, 1, 8, 4, 22, 9, 19, 12, 23], ajustar(c3, 0.8));
    tri(ctx, [16, 14, 31, 8, 28, 22, 23, 19, 20, 23], c3);
    el(ctx, 16, 18, 5, 7, c1);
    tri(ctx, [11, 13, 11, 3, 15, 12], c1); tri(ctx, [17, 12, 21, 3, 21, 13], c1);
    olho(ctx, 13, 15, true); olho(ctx, 18, 15, true);
    px(ctx, 15, 20, '#ffffff'); px(ctx, 17, 20, '#ffffff');
    return;
  }
  if (forma === 'mariposa') {
    el(ctx, 9, 13, 7, 6, c2); el(ctx, 23, 13, 7, 6, ajustar(c2, 0.9));
    el(ctx, 10, 22, 5, 4, ajustar(c2, 0.85)); el(ctx, 22, 22, 5, 4, ajustar(c2, 0.8));
    if (marcas.includes('olhosNasAsas')) { el(ctx, 9, 13, 2.5, 2.5, c1); el(ctx, 23, 13, 2.5, 2.5, c1); px(ctx, 9, 13, c3); px(ctx, 23, 13, c3); }
    el(ctx, 16, 18, 3, 8, c1);
    tri(ctx, [15, 10, 10, 2, 12, 2, 16, 9], c1); tri(ctx, [17, 10, 22, 2, 20, 2, 16, 9], c1);
    olho(ctx, 15, 11, false);
    return;
  }
  // ave comum (gralha)
  ret(ctx, 13, 25, 1, 5, '#303030'); ret(ctx, 18, 25, 1, 5, '#303030');
  tri(ctx, [21, 18, 30, 24, 29, 27, 21, 22], marcas.includes('cauda') ? ajustar(c1, 0.75) : c1);
  el(ctx, 16, 19, 8, 7, c1);
  el(ctx, 18, 19, 6, 4.5, ajustar(c1, 0.78));
  el(ctx, 13, 22, 4, 3.5, c3);
  el(ctx, 12, 11, 6, 5.5, c2);
  if (marcas.includes('topete')) { tri(ctx, [10, 7, 13, 0, 15, 7], c2); tri(ctx, [13, 7, 17, 2, 17, 8], c2); }
  tri(ctx, [6, 11, 1, 13, 6, 14], '#303030');
  olho(ctx, 9, 10, true);
}

function desenharOutro(ctx, forma, cores, marcas) {
  const [c1, c2, c3] = cores;
  switch (forma) {
    case 'inseto': {
      if (marcas.includes('brilho')) { el(ctx, 22, 21, 9, 8, ajustar(c3, 1.1) + '66'); }
      el(ctx, 12, 9, 7, 5, 'rgba(255,255,255,0.85)'); el(ctx, 20, 8, 6, 5, 'rgba(230,240,255,0.85)');
      el(ctx, 22, 21, 7, 6, c2);
      if (marcas.includes('listras')) for (let x = 18; x < 29; x += 3) ret(ctx, x, 16, 1, 11, c1);
      el(ctx, 14, 18, 5, 5, c1);
      el(ctx, 8, 15, 5, 5, c1);
      ret(ctx, 9, 21, 1, 7, '#202020'); ret(ctx, 13, 22, 1, 7, '#202020'); ret(ctx, 17, 22, 1, 6, '#202020');
      tri(ctx, [6, 11, 1, 3, 3, 3, 7, 10], '#202020'); tri(ctx, [9, 10, 9, 2, 11, 3, 10, 10], '#202020');
      if (marcas.includes('coroa')) tri(ctx, [4, 11, 6, 6, 8, 10, 10, 5, 12, 11], '#f8d040');
      olho(ctx, 6, 14, true);
      if (marcas.includes('raio')) tri(ctx, [26, 10, 29, 14, 27, 14, 30, 19, 25, 13, 27, 13], c3);
      break;
    }
    case 'lagarta': {
      for (let i = 4; i >= 0; i--) {
        const x = 26 - i * 4.5, y = 22 - Math.sin(i * 0.9) * 3;
        el(ctx, x, y, 4.5, 4.5, i % 2 ? c1 : ajustar(c1, 0.9));
        if (marcas.includes('pelos')) { tri(ctx, [x - 2, y - 3, x, y - 8, x + 2, y - 3], c3); tri(ctx, [x + 1, y - 3, x + 3, y - 7, x + 4, y - 2], c2); }
      }
      el(ctx, 5, 18, 5, 5, c2);
      olho(ctx, 3, 16, true);
      break;
    }
    case 'jabuti': {
      ret(ctx, 9, 24, 4, 6, c1); ret(ctx, 21, 24, 4, 6, c1);
      el(ctx, 6, 20, 4.5, 4, c1); olho(ctx, 4, 18, true);
      el(ctx, 17, 19, 11, 8, c2);
      el(ctx, 17, 23, 11, 3, ajustar(c2, 0.7));
      for (const [x, y] of [[12, 16], [17, 14], [22, 16], [14, 20], [20, 20]]) { el(ctx, x, y, 2.5, 2, ajustar(c2, 1.25)); }
      if (marcas.includes('arbusto')) { el(ctx, 14, 11, 5, 3, c3); el(ctx, 20, 12, 4, 3, ajustar(c3, 0.8)); }
      if (marcas.includes('arvore')) { ret(ctx, 16, 2, 2, 10, '#6a4a2a'); el(ctx, 17, 3, 9, 2.5, c3); el(ctx, 17, 7, 6, 2, ajustar(c3, 0.8)); }
      if (marcas.includes('broto')) { ret(ctx, 17, 6, 1, 6, '#3a7a2a'); el(ctx, 14, 6, 3, 1.8, c3); el(ctx, 20, 5, 3, 1.8, c3); }
      break;
    }
    case 'sapo': {
      el(ctx, 16, 22, 12, 7, c1);
      el(ctx, 16, 25, 8, 4, c2);
      el(ctx, 8, 27, 4, 2.5, ajustar(c1, 0.85)); el(ctx, 24, 27, 4, 2.5, ajustar(c1, 0.85));
      el(ctx, 10, 14, 4, 4, c1); el(ctx, 22, 14, 4, 4, c1);
      olho(ctx, 10, 13, true); olho(ctx, 22, 13, true);
      ret(ctx, 10, 20, 12, 1, '#202020');
      if (marcas.includes('verrugas')) for (const [x, y] of [[7, 19], [25, 20], [13, 17], [20, 18], [27, 23]]) px(ctx, x, y, ajustar(c1, 0.65));
      el(ctx, 27, 9, 3, 2, c3 + 'cc'); el(ctx, 30, 6, 2, 1.5, c3 + 'aa');
      break;
    }
    case 'peixe': {
      tri(ctx, [23, 16, 31, 9, 31, 23], c2);
      el(ctx, 15, 16, 11, 6.5, c1);
      el(ctx, 14, 19, 9, 3, ajustar(c1, 1.25));
      tri(ctx, [12, 10, 18, 4, 20, 11], marcas.includes('barbatanas') ? c3 : c2);
      tri(ctx, [13, 21, 17, 27, 19, 21], ajustar(c2, 0.9));
      if (marcas.includes('cabelo')) { tri(ctx, [16, 11, 28, 2, 24, 12], c3); }
      olho(ctx, 8, 14, true);
      ret(ctx, 4, 17, 3, 1, '#202020');
      break;
    }
    case 'serpente': {
      el(ctx, 16, 26, 12, 4.5, c1); el(ctx, 16, 25, 10, 2, c2);
      el(ctx, 17, 20, 9, 4, ajustar(c1, 0.92)); el(ctx, 17, 19, 7, 1.5, c2);
      el(ctx, 15, 14, 7, 3.5, c1);
      tri(ctx, [20, 12, 22, 5, 25, 13], c2); tri(ctx, [9, 25, 3, 18, 12, 22], c2);
      el(ctx, 11, 8, 6, 4.5, c1);
      ret(ctx, 8, 6, 3, 3, c3); ret(ctx, 13, 6, 3, 3, c3); px(ctx, 9, 7, '#ffffff'); px(ctx, 14, 7, '#ffffff');
      tri(ctx, [5, 10, 1, 12, 5, 12], '#f04040');
      break;
    }
    case 'preguica': {
      ret(ctx, 0, 3, 32, 2, '#5a4030');
      ret(ctx, 9, 4, 2, 9, c1); ret(ctx, 21, 4, 2, 9, c1);
      el(ctx, 16, 19, 8, 10, c1);
      el(ctx, 16, 14, 6, 5, c2);
      el(ctx, 16, 14, 4.5, 3.5, ajustar(c1, 1.2));
      olho(ctx, 13, 13, false); olho(ctx, 18, 13, false);
      ret(ctx, 15, 16, 2, 1, '#303040');
      el(ctx, 16, 30, 6, 2, c3 + '88');
      break;
    }
    default:
      el(ctx, 16, 18, 10, 10, c1);
      olho(ctx, 12, 15, true); olho(ctx, 19, 15, true);
  }
}

function contornar(ctx, w, h, cor = [24, 24, 32]) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  // Limiar: pixel ou é sólido ou transparente (visual de pixel art)
  for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] >= 110 ? 255 : 0;
  const solido = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] === 255;
  const borda = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (solido(x, y)) continue;
    if (solido(x - 1, y) || solido(x + 1, y) || solido(x, y - 1) || solido(x, y + 1)) borda.push((y * w + x) * 4);
  }
  for (const i of borda) { d[i] = cor[0]; d[i + 1] = cor[1]; d[i + 2] = cor[2]; d[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}

export function gerarCriatura(scene, id) {
  const chave = 'criatura_' + id;
  if (scene.textures.exists(chave)) return;
  const c = CRIATURAS[id];
  const tmp = document.createElement('canvas');
  tmp.width = 32; tmp.height = 32;
  const ctx = tmp.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const forma = c.forma;
  if (FORMAS_QUAD[forma]) desenharQuadrupede(ctx, FORMAS_QUAD[forma], c.cores, c.marcas || []);
  else if (['ave', 'coruja', 'morcego', 'mariposa'].includes(forma)) desenharAve(ctx, forma, c.cores, c.marcas || []);
  else desenharOutro(ctx, forma, c.cores, c.marcas || []);
  contornar(ctx, 32, 32);
  const tex = scene.textures.createCanvas(chave, 64, 64);
  const out = tex.getContext();
  out.imageSmoothingEnabled = false;
  if (c.marcas?.includes('fantasma')) out.globalAlpha = 0.8;
  out.drawImage(tmp, 0, 0, 64, 64);
  tex.refresh();
}

// ═══════════════════════════════════════════════════════
// ÍCONES E EFEITOS
// ═══════════════════════════════════════════════════════
function desenharIcones(scene) {
  novaTextura(scene, 'icone_patua', 16, 16, (ctx) => {
    ret(ctx, 7, 1, 2, 4, '#3a2a1a');
    el(ctx, 8, 10, 6, 5.5, '#202028');
    el(ctx, 8, 10, 5, 4.5, '#c8343c');
    el(ctx, 6.5, 8.5, 2, 1.5, '#f07078');
    ret(ctx, 3, 6, 10, 2, '#f0d060'); ret(ctx, 3, 7, 10, 1, '#b89a30');
    ret(ctx, 7, 9, 2, 3, '#f8f0d0');
  });
  novaTextura(scene, 'icone_item', 16, 16, (ctx) => {
    el(ctx, 8, 9, 6, 6, '#202028'); el(ctx, 8, 9, 5, 5, '#6ac05a'); el(ctx, 6, 7, 2, 1.5, '#b0f0a0');
  });
  novaTextura(scene, 'exclamacao', 10, 14, (ctx) => {
    ret(ctx, 0, 0, 10, 14, '#202028'); ret(ctx, 1, 1, 8, 12, '#ffffff');
    ret(ctx, 4, 2, 2, 6, '#d03030'); ret(ctx, 4, 10, 2, 2, '#d03030');
  });
  novaTextura(scene, 'particula', 4, 4, (ctx) => ret(ctx, 0, 0, 4, 4, '#ffffff'));
  novaTextura(scene, 'brilho', 8, 8, (ctx) => {
    ret(ctx, 3, 0, 2, 8, '#ffffff'); ret(ctx, 0, 3, 8, 2, '#ffffff'); ret(ctx, 2, 2, 4, 4, '#fff6a0');
  });
  novaTextura(scene, 'sombra', 16, 6, (ctx) => el(ctx, 8, 3, 7, 2.5, 'rgba(0,0,0,0.28)'));
}

export function gerarTudo(scene) {
  desenharTiles(scene);
  for (const [nome, pal] of Object.entries(PALETAS_PERSONAGEM)) gerarPersonagem(scene, nome, pal);
  for (const id of Object.keys(CRIATURAS)) gerarCriatura(scene, id);
  desenharIcones(scene);
}
