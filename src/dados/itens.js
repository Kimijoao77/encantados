// Itens da bolsa.
// tipo: 'captura' (usa em batalha contra selvagem), 'cura' (PV), 'status' (cura problemas), 'reviver'.

export const ITENS = {
  patua:       { nome: 'Patuá', tipo: 'captura', bonus: 1, preco: 200, desc: 'Amuleto que prende um Encantado selvagem.' },
  patuaForte:  { nome: 'Patuá Bento', tipo: 'captura', bonus: 1.5, preco: 600, desc: 'Patuá abençoado. Captura melhor.' },
  cha:         { nome: 'Chá de Cura', tipo: 'cura', cura: 20, preco: 300, desc: 'Recupera 20 PV.' },
  chaForte:    { nome: 'Chá Forte', tipo: 'cura', cura: 60, preco: 700, desc: 'Recupera 60 PV.' },
  garrafada:   { nome: 'Garrafada', tipo: 'status', preco: 250, desc: 'Remédio do mato. Cura queimadura, veneno, paralisia e sono.' },
  canjica:     { nome: 'Canjica', tipo: 'reviver', preco: 1500, desc: 'Reanima um Encantado desmaiado com metade dos PV.' },
};
