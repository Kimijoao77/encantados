import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRIATURAS } from '../src/dados/criaturas.js';
import { GOLPES } from '../src/dados/golpes.js';
import { TIPOS } from '../src/dados/tipos.js';
import { criarCriatura, ganharXp, evoluir, pvMax } from '../src/motor/criatura.js';
import { novoLutador, usarGolpe, tentarCaptura, calcularDano } from '../src/motor/batalha.js';

test('dados consistentes', () => {
  const nums = new Set();
  for (const [id, c] of Object.entries(CRIATURAS)) {
    assert.ok(!nums.has(c.num), 'número repetido ' + c.num); nums.add(c.num);
    for (const t of c.tipos) assert.ok(TIPOS[t], `${id}: tipo ${t}`);
    for (const [, g] of c.golpes) assert.ok(GOLPES[g], `${id}: golpe ${g}`);
    if (c.evolui) assert.ok(CRIATURAS[c.evolui.para], `${id}: evolui para ${c.evolui.para}`);
    for (const k of ['pv', 'atq', 'def', 'vel']) assert.ok(c.base[k] > 0, `${id}: base ${k}`);
    assert.ok(c.aparencia && c.desc && c.forma, `${id}: textos`);
  }
  for (const [id, g] of Object.entries(GOLPES)) assert.ok(TIPOS[g.tipo], `golpe ${id}`);
});

test('criar, lutar, ganhar xp e evoluir', () => {
  const a = criarCriatura('guarito', 5);
  const b = criarCriatura('brotojabi', 5);
  assert.ok(a.golpes.length >= 2 && a.golpes.length <= 4);
  const la = novoLutador(a, 'jogador'), lb = novoLutador(b, 'inimigo');
  const ev = [];
  usarGolpe(la, lb, 'brasa', ev, () => 0.5);
  assert.ok(b.pv < pvMax(b), 'brasa causou dano');
  assert.ok(ev.some(e => e.t === 'msg' && e.texto.includes('super efetivo')));
  const evs = ganharXp(a, 5000);
  assert.ok(a.nivel > 15);
  const evo = evs.find(e => e.t === 'evolui');
  assert.equal(evo.para, 'guarabrasa');
  evoluir(a, evo.para);
  assert.equal(a.especie, 'guarabrasa');
});

test('captura fica mais fácil com pouco PV', () => {
  const m = criarCriatura('capivi', 4);
  const l = novoLutador(m, 'inimigo');
  let ok1 = 0, ok2 = 0;
  for (let i = 0; i < 2000; i++) if (tentarCaptura(l, 1).capturou) ok1++;
  m.pv = 1;
  for (let i = 0; i < 2000; i++) if (tentarCaptura(l, 1).capturou) ok2++;
  assert.ok(ok2 > ok1);
});

test('dano de nível 5 é razoável', () => {
  const a = novoLutador(criarCriatura('guarito', 5), 'jogador');
  const b = novoLutador(criarCriatura('capivi', 5), 'inimigo');
  const { dano } = calcularDano(a, b, 'arranhao', () => 0.5);
  assert.ok(dano >= 2 && dano <= 12, 'dano ' + dano);
});
