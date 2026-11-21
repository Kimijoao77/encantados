// Tipos dos Encantados e tabela de vantagens.
// TABELA[atacante][defensor] = multiplicador (2 = super efetivo, 0.5 = pouco efetivo, 0 = sem efeito).
// Tudo o que não aparece aqui vale 1.

export const TIPOS = {
  fera:     { nome: 'Fera',     cor: '#b8a27a' },
  fogo:     { nome: 'Fogo',     cor: '#f08030' },
  agua:     { nome: 'Água',     cor: '#4f8fe8' },
  planta:   { nome: 'Planta',   cor: '#5fb64a' },
  eletrico: { nome: 'Elétrico', cor: '#f2c92e' },
  terra:    { nome: 'Terra',    cor: '#c19a55' },
  vento:    { nome: 'Vento',    cor: '#8fc6e6' },
  inseto:   { nome: 'Inseto',   cor: '#a3b52b' },
  espirito: { nome: 'Espírito', cor: '#7a5fb0' },
  nevoa:    { nome: 'Névoa',    cor: '#9aa7b8' },
  lenda:    { nome: 'Lenda',    cor: '#d4485a' },
};

const T = {
  fera:     { terra: 0.5, espirito: 0 },
  fogo:     { planta: 2, inseto: 2, nevoa: 2, fogo: 0.5, agua: 0.5, terra: 0.5, lenda: 0.5 },
  agua:     { fogo: 2, terra: 2, agua: 0.5, planta: 0.5, lenda: 0.5 },
  planta:   { agua: 2, terra: 2, fogo: 0.5, planta: 0.5, inseto: 0.5, vento: 0.5 },
  eletrico: { agua: 2, vento: 2, eletrico: 0.5, planta: 0.5, terra: 0 },
  terra:    { fogo: 2, eletrico: 2, planta: 0.5, inseto: 0.5, vento: 0 },
  vento:    { planta: 2, inseto: 2, nevoa: 2, eletrico: 0.5, terra: 0.5 },
  inseto:   { planta: 2, lenda: 2, fogo: 0.5, vento: 0.5, espirito: 0.5 },
  espirito: { espirito: 2, lenda: 2, nevoa: 0.5, fera: 0 },
  nevoa:    { espirito: 2, fera: 2, fogo: 0.5, vento: 0.5, nevoa: 0.5 },
  lenda:    { fera: 2, nevoa: 2, lenda: 0.5, inseto: 0.5 },
};

export function efetividade(tipoAtaque, tiposDefensor) {
  let m = 1;
  for (const d of tiposDefensor) {
    const v = T[tipoAtaque]?.[d];
    if (v !== undefined) m *= v;
  }
  return m;
}
