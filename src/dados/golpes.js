// Golpes. poder 0 = golpe de status.
// efeito: { status, chance } | { alvo: 'eu'|'oponente', stat, estagios, chance } | { drena } | { cura }
// prioridade: golpes com prioridade maior agem primeiro. critico: chance alta de acerto crítico.

export const GOLPES = {
  // Fera
  investida:     { nome: 'Investida', tipo: 'fera', poder: 40, precisao: 100, pp: 35, desc: 'Avança com o corpo todo.' },
  arranhao:      { nome: 'Arranhão', tipo: 'fera', poder: 40, precisao: 100, pp: 35, desc: 'Arranha com garras afiadas.' },
  rugido:        { nome: 'Rugido', tipo: 'fera', poder: 0, precisao: 100, pp: 40, efeito: { alvo: 'oponente', stat: 'atq', estagios: -1 }, desc: 'Assusta e baixa o Ataque do oponente.' },
  endurecer:     { nome: 'Endurecer', tipo: 'fera', poder: 0, precisao: null, pp: 30, efeito: { alvo: 'eu', stat: 'def', estagios: 1 }, desc: 'Retesa os músculos e sobe a Defesa.' },
  ataqueRapido:  { nome: 'Ataque Rápido', tipo: 'fera', poder: 40, precisao: 100, pp: 30, prioridade: 1, desc: 'Sempre ataca primeiro.' },
  mordida:       { nome: 'Mordida', tipo: 'fera', poder: 60, precisao: 100, pp: 25, desc: 'Morde com força.' },
  cabecada:      { nome: 'Cabeçada', tipo: 'fera', poder: 75, precisao: 90, pp: 15, desc: 'Uma cabeçada pesada.' },
  estouro:       { nome: 'Estouro da Boiada', tipo: 'fera', poder: 95, precisao: 85, pp: 10, desc: 'Avança como uma boiada inteira.' },

  // Fogo
  brasa:         { nome: 'Brasa', tipo: 'fogo', poder: 40, precisao: 100, pp: 25, efeito: { status: 'queimado', chance: 10 }, desc: 'Lança brasas. Pode queimar.' },
  linguaDeFogo:  { nome: 'Língua de Fogo', tipo: 'fogo', poder: 65, precisao: 100, pp: 15, efeito: { status: 'queimado', chance: 10 }, desc: 'Uma chama comprida. Pode queimar.' },
  labareda:      { nome: 'Labareda', tipo: 'fogo', poder: 95, precisao: 85, pp: 5, efeito: { status: 'queimado', chance: 20 }, desc: 'Fogo intenso. Pode queimar.' },
  fogoFatuo:     { nome: 'Fogo-Fátuo', tipo: 'fogo', poder: 0, precisao: 85, pp: 15, efeito: { status: 'queimado', chance: 100 }, desc: 'Uma luz fantasma que queima.' },

  // Água
  jatoDagua:     { nome: "Jato d'Água", tipo: 'agua', poder: 40, precisao: 100, pp: 25, desc: 'Esguicha água com pressão.' },
  bolhas:        { nome: 'Bolhas', tipo: 'agua', poder: 40, precisao: 100, pp: 30, efeito: { alvo: 'oponente', stat: 'vel', estagios: -1, chance: 10 }, desc: 'Pode baixar a Velocidade.' },
  correnteza:    { nome: 'Correnteza', tipo: 'agua', poder: 65, precisao: 100, pp: 15, desc: 'Arrasta o oponente com a corrente.' },
  pororoca:      { nome: 'Pororoca', tipo: 'agua', poder: 95, precisao: 85, pp: 5, desc: 'Uma onda gigante de rio.' },

  // Planta
  chicoteDeCipo: { nome: 'Chicote de Cipó', tipo: 'planta', poder: 45, precisao: 100, pp: 25, desc: 'Chicoteia com cipós.' },
  raizSugadora:  { nome: 'Raiz Sugadora', tipo: 'planta', poder: 50, precisao: 100, pp: 15, efeito: { drena: 0.5 }, desc: 'Suga energia e recupera PV.' },
  folhaNavalha:  { nome: 'Folha Navalha', tipo: 'planta', poder: 65, precisao: 95, pp: 20, critico: true, desc: 'Folhas cortantes. Crítico fácil.' },
  polenDoSono:   { nome: 'Pólen do Sono', tipo: 'planta', poder: 0, precisao: 75, pp: 15, efeito: { status: 'dormindo', chance: 100 }, desc: 'Faz o oponente dormir.' },
  chaDeErvas:    { nome: 'Chá de Ervas', tipo: 'planta', poder: 0, precisao: null, pp: 10, efeito: { cura: 0.5 }, desc: 'Recupera metade dos PV.' },
  furiaDaMata:   { nome: 'Fúria da Mata', tipo: 'planta', poder: 95, precisao: 90, pp: 5, desc: 'A mata inteira ataca.' },

  // Elétrico
  choque:        { nome: 'Choque', tipo: 'eletrico', poder: 40, precisao: 100, pp: 30, efeito: { status: 'paralisado', chance: 10 }, desc: 'Pode paralisar.' },
  faisca:        { nome: 'Faísca', tipo: 'eletrico', poder: 65, precisao: 100, pp: 20, efeito: { status: 'paralisado', chance: 30 }, desc: 'Pode paralisar.' },
  ondaEletrica:  { nome: 'Onda Elétrica', tipo: 'eletrico', poder: 0, precisao: 90, pp: 20, efeito: { status: 'paralisado', chance: 100 }, desc: 'Paralisa o oponente.' },
  relampago:     { nome: 'Relâmpago', tipo: 'eletrico', poder: 95, precisao: 80, pp: 5, efeito: { status: 'paralisado', chance: 30 }, desc: 'Um raio do céu.' },

  // Terra
  poeira:        { nome: 'Poeira', tipo: 'terra', poder: 0, precisao: 100, pp: 30, efeito: { alvo: 'oponente', stat: 'vel', estagios: -1 }, desc: 'Levanta poeira e baixa a Velocidade.' },
  cascoDuro:     { nome: 'Casco Duro', tipo: 'terra', poder: 0, precisao: null, pp: 20, efeito: { alvo: 'eu', stat: 'def', estagios: 2 }, desc: 'Sobe muito a Defesa.' },
  tremor:        { nome: 'Tremor', tipo: 'terra', poder: 60, precisao: 100, pp: 20, desc: 'Faz o chão tremer.' },
  terremoto:     { nome: 'Terremoto', tipo: 'terra', poder: 100, precisao: 90, pp: 5, desc: 'Um tremor violento.' },

  // Vento
  rajada:        { nome: 'Rajada', tipo: 'vento', poder: 40, precisao: 100, pp: 35, desc: 'Um sopro forte.' },
  asaCortante:   { nome: 'Asa Cortante', tipo: 'vento', poder: 60, precisao: 100, pp: 25, desc: 'Corta com as asas.' },
  correrNoVento: { nome: 'Correr no Vento', tipo: 'vento', poder: 0, precisao: null, pp: 20, efeito: { alvo: 'eu', stat: 'vel', estagios: 2 }, desc: 'Sobe muito a Velocidade.' },
  redemoinho:    { nome: 'Redemoinho', tipo: 'vento', poder: 75, precisao: 95, pp: 15, desc: 'Gira o oponente num redemoinho.' },
  vendaval:      { nome: 'Vendaval', tipo: 'vento', poder: 95, precisao: 85, pp: 5, desc: 'Ventania avassaladora.' },

  // Inseto
  ferroada:      { nome: 'Ferroada', tipo: 'inseto', poder: 35, precisao: 100, pp: 35, efeito: { status: 'envenenado', chance: 30 }, desc: 'Pode envenenar.' },
  sedaPegajosa:  { nome: 'Seda Pegajosa', tipo: 'inseto', poder: 0, precisao: 95, pp: 40, efeito: { alvo: 'oponente', stat: 'vel', estagios: -2 }, desc: 'Baixa muito a Velocidade.' },
  picada:        { nome: 'Picada', tipo: 'inseto', poder: 60, precisao: 100, pp: 20, desc: 'Pica sem dó.' },
  enxame:        { nome: 'Enxame', tipo: 'inseto', poder: 85, precisao: 95, pp: 10, desc: 'Chama um enxame inteiro.' },

  // Espírito
  lambidaFria:   { nome: 'Lambida Fria', tipo: 'espirito', poder: 30, precisao: 100, pp: 30, efeito: { status: 'paralisado', chance: 30 }, desc: 'Uma lambida gelada. Pode paralisar.' },
  susto:         { nome: 'Susto', tipo: 'espirito', poder: 0, precisao: 100, pp: 30, efeito: { alvo: 'oponente', stat: 'def', estagios: -1 }, desc: 'Baixa a Defesa do oponente.' },
  sombraNoturna: { nome: 'Sombra Noturna', tipo: 'espirito', poder: 65, precisao: 100, pp: 15, desc: 'Ataca vindo das sombras.' },
  pesadelo:      { nome: 'Pesadelo', tipo: 'espirito', poder: 90, precisao: 95, pp: 10, desc: 'Traz o pior dos pesadelos.' },

  // Névoa
  garoaFria:     { nome: 'Garoa Fria', tipo: 'nevoa', poder: 45, precisao: 100, pp: 25, desc: 'Uma garoa que gela até os ossos.' },
  veuDeNevoa:    { nome: 'Véu de Névoa', tipo: 'nevoa', poder: 0, precisao: null, pp: 20, efeito: { alvo: 'eu', stat: 'def', estagios: 2 }, desc: 'Se esconde na névoa. Sobe muito a Defesa.' },
  sereno:        { nome: 'Sereno', tipo: 'nevoa', poder: 65, precisao: 100, pp: 15, efeito: { alvo: 'oponente', stat: 'atq', estagios: -1, chance: 20 }, desc: 'Pode baixar o Ataque.' },
  nevoeiro:      { nome: 'Nevoeiro Denso', tipo: 'nevoa', poder: 90, precisao: 90, pp: 10, desc: 'Sufoca o oponente na névoa.' },

  // Lenda
  assobio:       { nome: 'Assobio', tipo: 'lenda', poder: 50, precisao: 100, pp: 20, efeito: { alvo: 'oponente', stat: 'vel', estagios: -1, chance: 30 }, desc: 'Um assobio misterioso.' },
  cantoDaIara:   { nome: 'Canto da Iara', tipo: 'lenda', poder: 0, precisao: 70, pp: 10, efeito: { status: 'dormindo', chance: 100 }, desc: 'Um canto que faz dormir.' },
  encanto:       { nome: 'Encanto', tipo: 'lenda', poder: 70, precisao: 100, pp: 15, desc: 'Magia antiga das lendas.' },
  fogoEncantado: { nome: 'Fogo Encantado', tipo: 'lenda', poder: 100, precisao: 85, pp: 5, efeito: { status: 'queimado', chance: 20 }, desc: 'Fogo das lendas. Pode queimar.' },
};
