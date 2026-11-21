// Regras de batalha, sem nada de tela. Gera uma lista de "eventos" que a cena de batalha toca em ordem.
import { GOLPES } from '../dados/golpes.js';
import { CRIATURAS } from '../dados/criaturas.js';
import { TIPOS, efetividade } from '../dados/tipos.js';
import { calcularStats, nomeDe } from './criatura.js';

export const NOMES_STATUS = {
  queimado: { curto: 'QUE', cor: '#e8642a', msg: 'ficou queimado' },
  paralisado: { curto: 'PAR', cor: '#d8b820', msg: 'ficou paralisado' },
  dormindo: { curto: 'DOR', cor: '#8890a0', msg: 'caiu no sono' },
  envenenado: { curto: 'VEN', cor: '#a050c0', msg: 'foi envenenado' },
};
const NOMES_STAT = { atq: 'Ataque', def: 'Defesa', vel: 'Velocidade' };

export function novoLutador(mon, lado) {
  return { mon, lado, estagios: { atq: 0, def: 0, vel: 0 }, sono: 0 };
}

const multEstagio = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

export function statEfetivo(l, k) {
  let v = calcularStats(l.mon)[k] * multEstagio(l.estagios[k]);
  if (k === 'atq' && l.mon.status === 'queimado') v *= 0.5;
  if (k === 'vel' && l.mon.status === 'paralisado') v *= 0.5;
  return Math.max(1, v);
}

const tiposDe = (l) => CRIATURAS[l.mon.especie].tipos;
const rotulo = (l) => (l.lado === 'inimigo' ? (l.selvagem ? `${nomeDe(l.mon)} selvagem` : `${nomeDe(l.mon)} inimigo`) : nomeDe(l.mon));

export function calcularDano(atk, def, golpe, rng) {
  const g = GOLPES[golpe];
  const nivel = atk.mon.nivel;
  const A = statEfetivo(atk, 'atq');
  const D = statEfetivo(def, 'def');
  const efet = efetividade(g.tipo, tiposDe(def));
  const stab = tiposDe(atk).includes(g.tipo) ? 1.5 : 1;
  const chanceCrit = g.critico ? 1 / 8 : 1 / 16;
  const critico = rng() < chanceCrit;
  const aleatorio = 0.85 + rng() * 0.15;
  let dano = (((2 * nivel) / 5 + 2) * g.poder * (A / D)) / 50 + 2;
  dano = Math.floor(dano * stab * efet * (critico ? 1.5 : 1) * aleatorio);
  if (efet > 0) dano = Math.max(1, dano);
  return { dano, efet, critico };
}

function aplicarStatus(alvo, status, eventos, rng) {
  if (alvo.mon.status || alvo.mon.pv <= 0) return false;
  // Imunidades simples por tipo
  const t = tiposDe(alvo);
  if (status === 'queimado' && t.includes('fogo')) return false;
  if (status === 'paralisado' && t.includes('eletrico')) return false;
  alvo.mon.status = status;
  if (status === 'dormindo') alvo.sono = 1 + Math.floor(rng() * 3);
  eventos.push({ t: 'status', lado: alvo.lado, status });
  eventos.push({ t: 'msg', texto: `${rotulo(alvo)} ${NOMES_STATUS[status].msg}!` });
  return true;
}

function aplicarEstagio(alvo, stat, n, eventos) {
  const antes = alvo.estagios[stat];
  const depois = Math.max(-6, Math.min(6, antes + n));
  if (depois === antes) {
    eventos.push({ t: 'msg', texto: `${NOMES_STAT[stat]} de ${rotulo(alvo)} não muda mais!` });
    return;
  }
  alvo.estagios[stat] = depois;
  const palavra = n > 0 ? (n > 1 ? 'subiu muito' : 'subiu') : (n < -1 ? 'caiu muito' : 'caiu');
  eventos.push({ t: 'estagio', lado: alvo.lado, subiu: n > 0 });
  eventos.push({ t: 'msg', texto: `${NOMES_STAT[stat]} de ${rotulo(alvo)} ${palavra}!` });
}

/** Executa um golpe de atk em def. Adiciona eventos. */
export function usarGolpe(atk, def, golpeId, eventos, rng = Math.random) {
  const g = GOLPES[golpeId];
  const slot = atk.mon.golpes.find((x) => x.id === golpeId);

  // Problemas que impedem de agir
  if (atk.mon.status === 'dormindo') {
    atk.sono -= 1;
    if (atk.sono <= 0) {
      atk.mon.status = null;
      eventos.push({ t: 'status', lado: atk.lado, status: null });
      eventos.push({ t: 'msg', texto: `${rotulo(atk)} acordou!` });
    } else {
      eventos.push({ t: 'msg', texto: `${rotulo(atk)} está dormindo...` });
      return;
    }
  }
  if (atk.mon.status === 'paralisado' && rng() < 0.25) {
    eventos.push({ t: 'msg', texto: `${rotulo(atk)} está paralisado e não consegue se mexer!` });
    return;
  }

  if (slot) slot.pp = Math.max(0, slot.pp - 1);
  eventos.push({ t: 'msg', texto: `${rotulo(atk)} usou ${g.nome}!` });

  const efeito = g.efeito || {};
  const miraEmSi = efeito.alvo === 'eu' || efeito.cura;

  if (!miraEmSi && g.precisao != null && rng() * 100 >= g.precisao) {
    eventos.push({ t: 'msg', texto: 'Mas errou!' });
    return;
  }

  if (g.poder > 0) {
    const { dano, efet, critico } = calcularDano(atk, def, golpeId, rng);
    if (efet === 0) {
      eventos.push({ t: 'msg', texto: `Não tem efeito em ${rotulo(def)}...` });
      return;
    }
    eventos.push({ t: 'anim', lado: atk.lado, tipo: g.tipo });
    const real = Math.min(def.mon.pv, dano);
    def.mon.pv -= real;
    eventos.push({ t: 'pv', lado: def.lado, pv: def.mon.pv, efet });
    if (critico) eventos.push({ t: 'msg', texto: 'Um golpe crítico!' });
    if (efet > 1) eventos.push({ t: 'msg', texto: 'Foi super efetivo!' });
    if (efet < 1) eventos.push({ t: 'msg', texto: 'Não foi muito efetivo...' });
    if (efeito.drena && real > 0) {
      const cura = Math.max(1, Math.floor(real * efeito.drena));
      const max = calcularStats(atk.mon).pv;
      atk.mon.pv = Math.min(max, atk.mon.pv + cura);
      eventos.push({ t: 'pv', lado: atk.lado, pv: atk.mon.pv });
      eventos.push({ t: 'msg', texto: `${rotulo(def)} teve a energia sugada!` });
    }
    if (def.mon.pv <= 0) {
      eventos.push({ t: 'desmaio', lado: def.lado });
      eventos.push({ t: 'msg', texto: `${rotulo(def)} desmaiou!` });
      return;
    }
    const chance = efeito.chance ?? 100;
    if (efeito.status && rng() * 100 < chance) aplicarStatus(def, efeito.status, eventos, rng);
    if (efeito.stat && rng() * 100 < chance) aplicarEstagio(efeito.alvo === 'eu' ? atk : def, efeito.stat, efeito.estagios, eventos);
    return;
  }

  // Golpes de status
  eventos.push({ t: 'anim', lado: atk.lado, tipo: g.tipo, status: true });
  if (efeito.cura) {
    const max = calcularStats(atk.mon).pv;
    if (atk.mon.pv >= max) { eventos.push({ t: 'msg', texto: 'Mas os PV já estão cheios!' }); return; }
    atk.mon.pv = Math.min(max, atk.mon.pv + Math.floor(max * efeito.cura));
    eventos.push({ t: 'pv', lado: atk.lado, pv: atk.mon.pv });
    eventos.push({ t: 'msg', texto: `${rotulo(atk)} recuperou energia!` });
  } else if (efeito.status) {
    if (!aplicarStatus(def, efeito.status, eventos, rng)) eventos.push({ t: 'msg', texto: 'Mas não funcionou!' });
  } else if (efeito.stat) {
    aplicarEstagio(efeito.alvo === 'eu' ? atk : def, efeito.stat, efeito.estagios, eventos);
  }
}

/** Dano de queimadura/veneno no fim do turno. */
export function fimDeTurno(l, eventos) {
  if (l.mon.pv <= 0) return;
  const st = l.mon.status;
  if (st !== 'queimado' && st !== 'envenenado') return;
  const max = calcularStats(l.mon).pv;
  const dano = Math.max(1, Math.floor(max / (st === 'queimado' ? 16 : 8)));
  l.mon.pv = Math.max(0, l.mon.pv - dano);
  eventos.push({ t: 'msg', texto: `${rotulo(l)} sofre com ${st === 'queimado' ? 'a queimadura' : 'o veneno'}!` });
  eventos.push({ t: 'pv', lado: l.lado, pv: l.mon.pv });
  if (l.mon.pv <= 0) {
    eventos.push({ t: 'desmaio', lado: l.lado });
    eventos.push({ t: 'msg', texto: `${rotulo(l)} desmaiou!` });
  }
}

/** Quem age primeiro entre dois golpes. Retorna true se o jogador age primeiro. */
export function jogadorPrimeiro(jog, ini, golpeJog, golpeIni, rng = Math.random) {
  const pj = GOLPES[golpeJog]?.prioridade || 0;
  const pi = GOLPES[golpeIni]?.prioridade || 0;
  if (pj !== pi) return pj > pi;
  const vj = statEfetivo(jog, 'vel');
  const vi = statEfetivo(ini, 'vel');
  if (vj !== vi) return vj > vi;
  return rng() < 0.5;
}

/** IA do inimigo. Selvagem: aleatório. Treinador: prefere o golpe que mais machuca. */
export function escolherGolpeInimigo(ini, jog, deTreinador, rng = Math.random) {
  const disponiveis = ini.mon.golpes.filter((g) => g.pp > 0);
  if (!disponiveis.length) return 'investida';
  if (!deTreinador || rng() < 0.25) return disponiveis[Math.floor(rng() * disponiveis.length)].id;
  let melhor = disponiveis[0].id, nota = -1;
  for (const g of disponiveis) {
    const d = GOLPES[g.id];
    let n;
    if (d.poder > 0) {
      const stab = CRIATURAS[ini.mon.especie].tipos.includes(d.tipo) ? 1.5 : 1;
      n = d.poder * stab * efetividade(d.tipo, CRIATURAS[jog.mon.especie].tipos) * ((d.precisao ?? 100) / 100);
    } else {
      n = d.efeito?.status && !jog.mon.status ? 45 : 20;
      if (d.efeito?.cura) n = ini.mon.pv < calcularStats(ini.mon).pv / 2 ? 80 : 0;
    }
    n *= 0.85 + rng() * 0.3;
    if (n > nota) { nota = n; melhor = g.id; }
  }
  return melhor;
}

/** Chance de captura. Retorna { capturou, balancos } */
export function tentarCaptura(alvo, bonus, rng = Math.random) {
  const max = calcularStats(alvo.mon).pv;
  const taxa = CRIATURAS[alvo.mon.especie].captura;
  let a = ((3 * max - 2 * alvo.mon.pv) * taxa * bonus) / (3 * max);
  if (alvo.mon.status === 'dormindo') a *= 2;
  else if (alvo.mon.status) a *= 1.5;
  const p = Math.min(1, a / 255);
  if (rng() < p) return { capturou: true, balancos: 3 };
  // Cada balanço tem chance p^(1/4) de passar
  const pb = Math.pow(p, 0.25);
  let balancos = 0;
  while (balancos < 3 && rng() < pb) balancos++;
  return { capturou: false, balancos: Math.min(balancos, 2) };
}

/** Chance de fugir de batalha selvagem. */
export function tentarFugir(jog, ini, tentativas, rng = Math.random) {
  const vj = statEfetivo(jog, 'vel');
  const vi = statEfetivo(ini, 'vel');
  if (vj >= vi) return true;
  const f = ((vj * 128) / vi + 30 * tentativas) % 256;
  return rng() * 256 < f;
}

export { TIPOS };
