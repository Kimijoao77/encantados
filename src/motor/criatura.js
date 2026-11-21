import { CRIATURAS } from '../dados/criaturas.js';
import { GOLPES } from '../dados/golpes.js';

let contador = 0;
const uid = () => Date.now().toString(36) + (contador++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

export const xpParaNivel = (n) => n <= 1 ? 0 : n * n * n;

export function calcularStats(mon) {
  const e = CRIATURAS[mon.especie];
  const n = mon.nivel;
  const f = (k) => Math.floor(((2 * e.base[k] + mon.dv[k]) * n) / 100);
  return {
    pv: f('pv') + n + 10,
    atq: f('atq') + 5,
    def: f('def') + 5,
    vel: f('vel') + 5,
  };
}

export function golpesIniciais(especie, nivel) {
  const lista = CRIATURAS[especie].golpes.filter(([nv]) => nv <= nivel).map(([, g]) => g);
  const unicos = [...new Set(lista)];
  return unicos.slice(-4).map((id) => ({ id, pp: GOLPES[id].pp }));
}

export function criarCriatura(especie, nivel, rng = Math.random) {
  if (!CRIATURAS[especie]) throw new Error('Espécie desconhecida: ' + especie);
  const dv = { pv: 0, atq: 0, def: 0, vel: 0 };
  for (const k of Object.keys(dv)) dv[k] = Math.floor(rng() * 16);
  const mon = {
    uid: uid(),
    especie,
    apelido: null,
    nivel,
    xp: xpParaNivel(nivel),
    dv,
    golpes: golpesIniciais(especie, nivel),
    status: null,
    pv: 0,
  };
  mon.pv = calcularStats(mon).pv;
  return mon;
}

export const nomeDe = (mon) => mon.apelido || CRIATURAS[mon.especie].nome;
export const especieDe = (mon) => CRIATURAS[mon.especie];
export const pvMax = (mon) => calcularStats(mon).pv;

export function curarTotal(mon) {
  mon.pv = pvMax(mon);
  mon.status = null;
  for (const g of mon.golpes) g.pp = GOLPES[g.id].pp;
}

/**
 * Dá XP a um Encantado. Retorna eventos:
 * { t: 'nivel', nivel }, { t: 'aprende', golpe } , { t: 'aprenderCheio', golpe }, { t: 'evolui', para }
 * A evolução só é marcada; quem chama decide quando aplicar (depois da batalha).
 */
export function ganharXp(mon, qtd) {
  const eventos = [];
  if (mon.nivel >= 100) return eventos;
  mon.xp += qtd;
  while (mon.nivel < 100 && mon.xp >= xpParaNivel(mon.nivel + 1)) {
    const antes = pvMax(mon);
    mon.nivel += 1;
    const depois = pvMax(mon);
    if (mon.pv > 0) mon.pv += depois - antes;
    eventos.push({ t: 'nivel', nivel: mon.nivel });
    for (const [nv, g] of CRIATURAS[mon.especie].golpes) {
      if (nv !== mon.nivel || mon.golpes.some((x) => x.id === g)) continue;
      if (mon.golpes.length < 4) {
        mon.golpes.push({ id: g, pp: GOLPES[g].pp });
        eventos.push({ t: 'aprende', golpe: g });
      } else {
        eventos.push({ t: 'aprenderCheio', golpe: g });
      }
    }
  }
  const evo = CRIATURAS[mon.especie].evolui;
  if (evo && mon.nivel >= evo.nivel) eventos.push({ t: 'evolui', para: evo.para });
  return eventos;
}

export function evoluir(mon, para) {
  const antes = pvMax(mon);
  mon.especie = para;
  const depois = pvMax(mon);
  if (mon.pv > 0) mon.pv += depois - antes;
  // Aprende golpes de nível exatamente igual ao atual na nova forma, se houver espaço
  const novos = [];
  for (const [nv, g] of CRIATURAS[para].golpes) {
    if (nv === mon.nivel && !mon.golpes.some((x) => x.id === g)) {
      if (mon.golpes.length < 4) { mon.golpes.push({ id: g, pp: GOLPES[g].pp }); novos.push({ t: 'aprende', golpe: g }); }
      else novos.push({ t: 'aprenderCheio', golpe: g });
    }
  }
  return novos;
}

export function xpDerrota(derrotado, deTreinador) {
  const base = CRIATURAS[derrotado.especie].xp;
  return Math.max(1, Math.floor((base * derrotado.nivel) / 7 * (deTreinador ? 1.5 : 1)));
}
