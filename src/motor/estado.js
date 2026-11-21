// Estado do jogo (o "save"). Fica no localStorage do navegador.
import { criarCriatura, curarTotal } from './criatura.js';

const CHAVE = 'encantados_save_v1';

export const estado = {};

export function novoJogo(nome) {
  Object.keys(estado).forEach((k) => delete estado[k]);
  Object.assign(estado, {
    versao: 1,
    nome: nome || 'Jogador',
    rival: 'Caio',
    mapa: 'casaJogador',
    x: 7, y: 2, dir: 'esq',
    time: [],
    caixa: [],
    bolsa: { cha: 2 },
    moedas: 3000,
    flags: {},
    vistos: {},
    capturados: {},
    ultimaCura: { mapa: 'casaJogador', x: 4, y: 5, dir: 'cima' },
    tempoJogado: 0,
    inicio: Date.now(),
  });
}

export function existeSave() {
  try { return !!localStorage.getItem(CHAVE); } catch { return false; }
}

export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch (e) {
    console.warn('Não foi possível salvar', e);
    return false;
  }
}

export function carregar() {
  try {
    const txt = localStorage.getItem(CHAVE);
    if (!txt) return false;
    const dados = JSON.parse(txt);
    Object.keys(estado).forEach((k) => delete estado[k]);
    Object.assign(estado, dados);
    return true;
  } catch (e) {
    console.warn('Save corrompido', e);
    return false;
  }
}

export function apagarSave() {
  try { localStorage.removeItem(CHAVE); } catch { /* nada */ }
}

// ── Ajudantes ─────────────────────────────────────────
export const flag = (k) => !!estado.flags[k];
export const marcarFlag = (k, v = true) => { estado.flags[k] = v; };

export function marcarVisto(especie) { estado.vistos[especie] = true; }
export function marcarCapturado(especie) { estado.vistos[especie] = true; estado.capturados[especie] = true; }

export function darItem(id, qtd = 1) {
  estado.bolsa[id] = (estado.bolsa[id] || 0) + qtd;
}
export function usarItem(id) {
  if (!estado.bolsa[id]) return false;
  estado.bolsa[id] -= 1;
  if (estado.bolsa[id] <= 0) delete estado.bolsa[id];
  return true;
}

/** Adiciona ao time ou, se estiver cheio, à caixa. Retorna 'time' ou 'caixa'. */
export function adicionarCriatura(mon) {
  marcarCapturado(mon.especie);
  if (estado.time.length < 6) { estado.time.push(mon); return 'time'; }
  estado.caixa.push(mon);
  return 'caixa';
}

export function darCriatura(especie, nivel) {
  const mon = criarCriatura(especie, nivel);
  return { mon, onde: adicionarCriatura(mon) };
}

export function curarTime() {
  for (const m of estado.time) curarTotal(m);
}

export const timeVivo = () => estado.time.some((m) => m.pv > 0);
export const primeiroVivo = () => estado.time.findIndex((m) => m.pv > 0);
