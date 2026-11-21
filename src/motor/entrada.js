// Entrada unificada: teclado + botões de toque.
// Botões: cima, baixo, esq, dir, a, b, menu.

const TECLAS = {
  ArrowUp: 'cima', KeyW: 'cima',
  ArrowDown: 'baixo', KeyS: 'baixo',
  ArrowLeft: 'esq', KeyA: 'esq',
  ArrowRight: 'dir', KeyD: 'dir',
  KeyZ: 'a', Space: 'a', KeyJ: 'a',
  KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b',
  Enter: 'menu', KeyM: 'menu', KeyC: 'menu',
};
const DIRECOES = ['cima', 'baixo', 'esq', 'dir'];

const segurados = new Map(); // botão -> contador de fontes segurando
const ordemDirecoes = []; // última direção apertada por último
let pendentes = new Set();
let doFrame = new Set();
const repeticao = {}; // direção -> ms segurando

function apertar(btn) {
  const n = segurados.get(btn) || 0;
  segurados.set(btn, n + 1);
  if (n === 0) {
    pendentes.add(btn);
    if (DIRECOES.includes(btn)) {
      const i = ordemDirecoes.indexOf(btn);
      if (i >= 0) ordemDirecoes.splice(i, 1);
      ordemDirecoes.push(btn);
      repeticao[btn] = 0;
    }
  }
}
function soltar(btn) {
  const n = segurados.get(btn) || 0;
  if (n <= 1) {
    segurados.delete(btn);
    const i = ordemDirecoes.indexOf(btn);
    if (i >= 0) ordemDirecoes.splice(i, 1);
  } else segurados.set(btn, n - 1);
}

function ligarToque() {
  const marcar = (el, ativo) => el && el.classList.toggle('ativa', ativo);

  // Botões A, B, MENU
  document.querySelectorAll('#controles .botao').forEach((el) => {
    const btn = el.dataset.btn;
    let ativo = false;
    const on = (e) => { e.preventDefault(); if (!ativo) { ativo = true; apertar(btn); marcar(el, true); } };
    const off = (e) => { e?.preventDefault?.(); if (ativo) { ativo = false; soltar(btn); marcar(el, false); } };
    el.addEventListener('pointerdown', (e) => { el.setPointerCapture?.(e.pointerId); on(e); });
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
  });

  // D-pad: a direção é calculada pela posição do dedo, então dá para deslizar.
  const dpad = document.getElementById('dpad');
  if (!dpad) return;
  let atual = null;
  const setas = {};
  dpad.querySelectorAll('.seta').forEach((s) => (setas[s.dataset.dir] = s));
  const definir = (dir) => {
    if (dir === atual) return;
    if (atual) { soltar(atual); marcar(setas[atual], false); }
    atual = dir;
    if (atual) { apertar(atual); marcar(setas[atual], true); }
  };
  const direcaoDe = (e) => {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) return atual; // zona morta no centro
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy > 0 ? 'baixo' : 'cima');
  };
  dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); dpad.setPointerCapture?.(e.pointerId); definir(direcaoDe(e)); });
  dpad.addEventListener('pointermove', (e) => { if (atual) definir(direcaoDe(e)); });
  const fim = () => definir(null);
  dpad.addEventListener('pointerup', fim);
  dpad.addEventListener('pointercancel', fim);
  dpad.addEventListener('lostpointercapture', fim);
}

export const Entrada = {
  iniciar(game) {
    window.addEventListener('keydown', (e) => {
      const btn = TECLAS[e.code];
      if (!btn) return;
      if (document.activeElement?.tagName === 'INPUT') return;
      e.preventDefault();
      if (!e.repeat) apertar(btn);
    });
    window.addEventListener('keyup', (e) => {
      const btn = TECLAS[e.code];
      if (btn) soltar(btn);
    });
    window.addEventListener('blur', () => { segurados.clear(); ordemDirecoes.length = 0; });
    ligarToque();

    game.events.on('prestep', (_t, dt) => {
      doFrame = pendentes;
      pendentes = new Set();
      // Repetição automática das direções seguradas (para menus)
      for (const d of DIRECOES) {
        if (!segurados.has(d)) continue;
        const antes = repeticao[d] || 0;
        const agora = antes + dt;
        repeticao[d] = agora;
        if (agora > 320) {
          const passos = Math.floor((agora - 320) / 110) - Math.floor(Math.max(0, antes - 320) / 110);
          if (passos > 0 || antes <= 320) doFrame.add(d);
        }
      }
    });
  },
  apertou(btn) { return doFrame.has(btn); },
  consumir(btn) { doFrame.delete(btn); },
  consumirTudo() { doFrame.clear(); },
  segurando(btn) { return segurados.has(btn); },
  direcaoSegurada() { return ordemDirecoes[ordemDirecoes.length - 1] || null; },
  // Para testes automáticos
  _apertar: apertar,
  _soltar: soltar,
};
