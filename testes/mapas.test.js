import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPAS, LEGENDA } from '../src/dados/mapas.js';
import { CRIATURAS } from '../src/dados/criaturas.js';

const tileEm = (m, x, y) => LEGENDA[m.tiles[y]?.[x]];

test('mapas bem formados', () => {
  for (const [id, m] of Object.entries(MAPAS)) {
    const w = m.tiles[0].length;
    m.tiles.forEach((linha, y) => {
      assert.equal(linha.length, w, `${id} linha ${y} tem ${linha.length}, esperado ${w}`);
      for (const ch of linha) assert.ok(LEGENDA[ch], `${id}: caractere desconhecido '${ch}'`);
    });
    for (const [pos, p] of Object.entries(m.portas || {})) {
      const [x, y] = pos.split(',').map(Number);
      assert.ok(!tileEm(m, x, y).solido, `${id}: porta em ${pos} é sólida`);
      const dest = MAPAS[p.para];
      assert.ok(dest, `${id}: destino ${p.para}`);
      assert.ok(!tileEm(dest, p.x, p.y).solido, `${id}->${p.para}: chegada ${p.x},${p.y} é sólida`);
    }
    for (const n of m.npcs || []) {
      assert.ok(tileEm(m, n.x, n.y) && !tileEm(m, n.x, n.y).solido, `${id}: npc ${n.id} em tile sólido`);
      for (const [esp] of n.treinador?.time || []) assert.ok(CRIATURAS[esp]);
    }
    for (const [esp] of m.encontros?.lista || []) assert.ok(CRIATURAS[esp], esp);
    for (const [lado, s] of Object.entries(m.saidas || {})) assert.ok(MAPAS[s.para], `${id} saída ${lado}`);
  }
});

test('saídas norte/sul batem', () => {
  const v = MAPAS.vila, r = MAPAS.rota1;
  for (let x = 0; x < v.tiles[0].length; x++) {
    if (tileEm(v, x, 0).solido) continue;
    const xr = x + v.saidas.norte.dx;
    assert.ok(!tileEm(r, xr, r.tiles.length - 1).solido, `vila x=${x} -> rota x=${xr}`);
  }
});
