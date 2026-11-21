import { ITENS } from '../dados/itens.js';
import { pvMax, nomeDe } from './criatura.js';

/** Verifica se um item pode ser usado neste Encantado. Retorna null se pode, ou o motivo. */
export function motivoNaoUsar(itemId, mon) {
  const it = ITENS[itemId];
  if (it.tipo === 'cura') {
    if (mon.pv <= 0) return 'Está desmaiado. Precisa de uma Canjica.';
    if (mon.pv >= pvMax(mon)) return 'Os PV já estão cheios.';
  }
  if (it.tipo === 'status' && !mon.status) return 'Não tem nenhum problema para curar.';
  if (it.tipo === 'reviver' && mon.pv > 0) return 'Não está desmaiado.';
  if (it.tipo === 'captura') return 'Só funciona em batalha contra Encantados selvagens.';
  return null;
}

/** Aplica o item. Retorna a mensagem. */
export function aplicarItem(itemId, mon) {
  const it = ITENS[itemId];
  const nome = nomeDe(mon);
  if (it.tipo === 'cura') {
    const antes = mon.pv;
    mon.pv = Math.min(pvMax(mon), mon.pv + it.cura);
    return `${nome} recuperou ${mon.pv - antes} PV!`;
  }
  if (it.tipo === 'status') {
    mon.status = null;
    return `${nome} está curado!`;
  }
  if (it.tipo === 'reviver') {
    mon.pv = Math.floor(pvMax(mon) / 2);
    mon.status = null;
    return `${nome} se levantou!`;
  }
  return '';
}
