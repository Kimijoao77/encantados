// Os Encantados. Cada um é baseado num animal brasileiro, com um toque de lenda, assombração ou do campo.
// base: PV, Ataque, Defesa, Velocidade.  captura: 3 (difícil) a 255 (fácil).
// forma/cores/marcas: usados para gerar o desenho provisório até a arte final chegar.
// aparencia: descrição visual usada nos pedidos de arte para o GPT/Gemini.

export const CRIATURAS = {
  // ── Iniciais ──────────────────────────────────────────────
  guarito: {
    num: 1, nome: 'Guarito', tipos: ['fogo'], base: { pv: 39, atq: 52, def: 43, vel: 65 }, captura: 45, xp: 62,
    evolui: { nivel: 16, para: 'guarabrasa' },
    golpes: [[1, 'arranhao'], [1, 'rugido'], [7, 'brasa'], [9, 'ataqueRapido'], [13, 'mordida'], [17, 'linguaDeFogo'], [25, 'cabecada'], [33, 'labareda']],
    desc: 'Filhote de lobo-guará. A crina no pescoço solta faíscas quando ele fica animado.',
    forma: 'quadrupede', cores: ['#d9762b', '#2b2b2b', '#ffd25a'], marcas: ['crina', 'orelhasGrandes', 'pernasLongas'],
    aparencia: 'filhote de lobo-guará fofo, pelagem laranja-avermelhada, patas compridas e pretas, orelhas enormes, crina de pequenas chamas amarelas no pescoço',
  },
  guarabrasa: {
    num: 2, nome: 'Guarabrasa', tipos: ['fogo'], base: { pv: 58, atq: 64, def: 58, vel: 80 }, captura: 45, xp: 142,
    evolui: { nivel: 32, para: 'guaraflama' },
    golpes: [[1, 'arranhao'], [1, 'rugido'], [1, 'brasa'], [9, 'ataqueRapido'], [13, 'mordida'], [17, 'linguaDeFogo'], [27, 'cabecada'], [36, 'labareda']],
    desc: 'Corre pelos campos à noite. Por onde passa, deixa um rastro de brasas no capim.',
    forma: 'quadrupede', cores: ['#c9531f', '#1f1f1f', '#ffb13b'], marcas: ['crina', 'orelhasGrandes', 'pernasLongas'],
    aparencia: 'lobo-guará jovem e esguio, pelagem laranja intensa, patas longas pretas, crina de fogo descendo pelas costas, olhar determinado',
  },
  guaraflama: {
    num: 3, nome: 'Guaraflama', tipos: ['fogo', 'fera'], base: { pv: 78, atq: 88, def: 76, vel: 100 }, captura: 45, xp: 240,
    golpes: [[1, 'arranhao'], [1, 'brasa'], [1, 'mordida'], [17, 'linguaDeFogo'], [27, 'cabecada'], [40, 'labareda'], [46, 'estouro']],
    desc: 'Dizem que seu uivo acende fogueiras a quilômetros de distância.',
    forma: 'quadrupede', cores: ['#b8401a', '#141414', '#ff9a1f'], marcas: ['crina', 'orelhasGrandes', 'pernasLongas', 'cauda'],
    aparencia: 'lobo-guará adulto imponente, pelagem laranja-fogo, patas pretas muito longas, crina e ponta da cauda em chamas vivas, postura heroica',
  },

  ariri: {
    num: 4, nome: 'Ariri', tipos: ['agua'], base: { pv: 44, atq: 48, def: 65, vel: 43 }, captura: 45, xp: 63,
    evolui: { nivel: 16, para: 'ariragua' },
    golpes: [[1, 'investida'], [1, 'endurecer'], [7, 'jatoDagua'], [9, 'bolhas'], [13, 'mordida'], [17, 'correnteza'], [25, 'cabecada'], [33, 'pororoca']],
    desc: 'Filhote de ariranha. Brinca o dia inteiro nas margens dos rios e adora peixe.',
    forma: 'lontra', cores: ['#6b4a32', '#e8d9b0', '#4f8fe8'], marcas: ['manchaPeito'],
    aparencia: 'filhote de ariranha fofo, pelagem marrom-escura brilhante, mancha creme no peito, olhos grandes, segurando uma bolha de água',
  },
  ariragua: {
    num: 5, nome: 'Arirágua', tipos: ['agua'], base: { pv: 59, atq: 63, def: 80, vel: 58 }, captura: 45, xp: 142,
    evolui: { nivel: 32, para: 'arirauna' },
    golpes: [[1, 'investida'], [1, 'endurecer'], [1, 'jatoDagua'], [9, 'bolhas'], [13, 'mordida'], [17, 'correnteza'], [27, 'cabecada'], [36, 'pororoca']],
    desc: 'Nada contra a correnteza sem esforço. Vive em bandos que protegem o rio.',
    forma: 'lontra', cores: ['#553a26', '#e0cfa0', '#3d7fd8'], marcas: ['manchaPeito', 'cauda'],
    aparencia: 'ariranha jovem ágil, pelagem marrom molhada, mancha creme no peito, cauda achatada como remo, gotas de água ao redor',
  },
  arirauna: {
    num: 6, nome: 'Ariraúna', tipos: ['agua', 'fera'], base: { pv: 79, atq: 83, def: 100, vel: 78 }, captura: 45, xp: 239,
    golpes: [[1, 'investida'], [1, 'jatoDagua'], [1, 'mordida'], [17, 'correnteza'], [27, 'cabecada'], [40, 'pororoca'], [46, 'estouro']],
    desc: 'A guardiã dos rios. Quando bate a cauda na água, provoca uma pororoca.',
    forma: 'lontra', cores: ['#3f2a1b', '#d8c48c', '#2f6fc8'], marcas: ['manchaPeito', 'cauda', 'crina'],
    aparencia: 'ariranha gigante e musculosa, pelagem marrom-escura, mancha creme no peito, cauda enorme, onda de água girando ao redor do corpo',
  },

  brotojabi: {
    num: 7, nome: 'Brotojabi', tipos: ['planta'], base: { pv: 45, atq: 49, def: 65, vel: 45 }, captura: 45, xp: 64,
    evolui: { nivel: 16, para: 'jabumato' },
    golpes: [[1, 'investida'], [1, 'endurecer'], [7, 'chicoteDeCipo'], [10, 'raizSugadora'], [13, 'polenDoSono'], [17, 'folhaNavalha'], [25, 'chaDeErvas'], [33, 'furiaDaMata']],
    desc: 'Filhote de jabuti. Tem um broto que cresce no casco quando toma sol.',
    forma: 'jabuti', cores: ['#4a7a3a', '#c9a15a', '#7fd65a'], marcas: ['broto'],
    aparencia: 'filhote de jabuti fofo, casco marrom com hexágonos amarelados, um broto verde de duas folhas nascendo no topo do casco, cabeça escura com manchas laranja',
  },
  jabumato: {
    num: 8, nome: 'Jabumato', tipos: ['planta'], base: { pv: 60, atq: 62, def: 80, vel: 60 }, captura: 45, xp: 142,
    evolui: { nivel: 32, para: 'jabutirana' },
    golpes: [[1, 'investida'], [1, 'endurecer'], [1, 'chicoteDeCipo'], [9, 'raizSugadora'], [13, 'polenDoSono'], [17, 'folhaNavalha'], [27, 'chaDeErvas'], [36, 'furiaDaMata']],
    desc: 'O casco virou um pequeno jardim. Pássaros fazem ninho nele.',
    forma: 'jabuti', cores: ['#3b6a2e', '#b08a48', '#5fbf45'], marcas: ['broto', 'arbusto'],
    aparencia: 'jabuti jovem, casco coberto de musgo e pequenas plantas, cipós pendurados, manchas laranja nas patas',
  },
  jabutirana: {
    num: 9, nome: 'Jabutirana', tipos: ['planta', 'terra'], base: { pv: 85, atq: 82, def: 105, vel: 70 }, captura: 45, xp: 236,
    golpes: [[1, 'investida'], [1, 'chicoteDeCipo'], [1, 'raizSugadora'], [17, 'folhaNavalha'], [27, 'tremor'], [40, 'furiaDaMata'], [46, 'terremoto']],
    desc: 'Carrega uma pequena araucária no casco. Vive mais de cem anos.',
    forma: 'jabuti', cores: ['#2f5a24', '#8a6a35', '#3f8f35'], marcas: ['arvore'],
    aparencia: 'jabuti gigante e ancestral, casco de pedra e terra com uma araucária crescendo no topo, raízes descendo pelas laterais',
  },

  // ── Campos e matas ────────────────────────────────────────
  capivi: {
    num: 10, nome: 'Capivi', tipos: ['fera', 'agua'], base: { pv: 55, atq: 45, def: 50, vel: 35 }, captura: 190, xp: 55,
    evolui: { nivel: 22, para: 'capivarao' },
    golpes: [[1, 'investida'], [3, 'endurecer'], [6, 'jatoDagua'], [11, 'mordida'], [17, 'bolhas'], [24, 'correnteza'], [30, 'cabecada']],
    desc: 'Filhote de capivara. É tão calmo que outros Encantados sentam em cima dele.',
    forma: 'capivara', cores: ['#9a6b43', '#7a5233', '#f0c080'], marcas: [],
    aparencia: 'filhote de capivara redondinho e calmo, pelagem marrom, focinho quadrado, olhos sonolentos, um passarinho sentado na cabeça',
  },
  capivarao: {
    num: 11, nome: 'Capivarão', tipos: ['fera', 'agua'], base: { pv: 95, atq: 70, def: 80, vel: 45 }, captura: 75, xp: 150,
    golpes: [[1, 'investida'], [1, 'jatoDagua'], [11, 'mordida'], [17, 'bolhas'], [24, 'correnteza'], [32, 'cabecada'], [40, 'estouro']],
    desc: 'Pesado e tranquilo. Nada como um barco e não se irrita com quase nada.',
    forma: 'capivara', cores: ['#7f5634', '#5e3f25', '#e0a868'], marcas: [],
    aparencia: 'capivara adulta grande e robusta, pelagem marrom-avermelhada, expressão serena e confiante, água escorrendo pelo pelo',
  },

  gralhita: {
    num: 12, nome: 'Gralhita', tipos: ['vento'], base: { pv: 40, atq: 45, def: 35, vel: 56 }, captura: 255, xp: 50,
    evolui: { nivel: 18, para: 'gralhazul' },
    golpes: [[1, 'rajada'], [1, 'rugido'], [5, 'ataqueRapido'], [9, 'asaCortante'], [15, 'correrNoVento'], [21, 'redemoinho'], [29, 'vendaval']],
    desc: 'Filhote de gralha-azul. Esconde pinhões no chão e esquece onde guardou.',
    forma: 'ave', cores: ['#2f6fd0', '#1a1a1a', '#9fd0ff'], marcas: ['topete'],
    aparencia: 'filhote de gralha-azul fofo, penas azul-vivo, cabeça e peito pretos, segurando um pinhão no bico',
  },
  gralhazul: {
    num: 13, nome: 'Gralhazul', tipos: ['vento', 'planta'], base: { pv: 63, atq: 65, def: 55, vel: 90 }, captura: 120, xp: 140,
    golpes: [[1, 'rajada'], [1, 'ataqueRapido'], [9, 'asaCortante'], [15, 'correrNoVento'], [18, 'chicoteDeCipo'], [23, 'redemoinho'], [28, 'folhaNavalha'], [34, 'vendaval']],
    desc: 'Planta florestas inteiras de araucária enterrando pinhões. É o orgulho da região.',
    forma: 'ave', cores: ['#1f5cc0', '#111111', '#7fc0ff'], marcas: ['topete', 'cauda'],
    aparencia: 'gralha-azul elegante, penas azul-intenso, cabeça preta com topete, asas abertas soltando folhas e pinhões',
  },

  pirili: {
    num: 14, nome: 'Pirili', tipos: ['inseto', 'eletrico'], base: { pv: 35, atq: 35, def: 35, vel: 55 }, captura: 200, xp: 52,
    evolui: { nivel: 20, para: 'pirilampejo' },
    golpes: [[1, 'investida'], [1, 'choque'], [6, 'ferroada'], [10, 'ondaEletrica'], [15, 'picada'], [21, 'faisca'], [30, 'relampago']],
    desc: 'Vaga-lume que acende o rabinho para conversar com os amigos.',
    forma: 'inseto', cores: ['#3a3a2a', '#f7e04a', '#fff8a0'], marcas: ['brilho', 'antenas'],
    aparencia: 'vaga-lume fofo e redondinho, corpo marrom-escuro, asinhas transparentes, abdômen brilhando amarelo, antenas curvas',
  },
  pirilampejo: {
    num: 15, nome: 'Pirilampejo', tipos: ['inseto', 'eletrico'], base: { pv: 60, atq: 70, def: 55, vel: 95 }, captura: 90, xp: 145,
    golpes: [[1, 'choque'], [1, 'ferroada'], [10, 'ondaEletrica'], [15, 'picada'], [22, 'faisca'], [28, 'enxame'], [34, 'relampago']],
    desc: 'Nas noites de verão, solta raios pequenos que iluminam o campo inteiro.',
    forma: 'inseto', cores: ['#2a2a22', '#ffd21f', '#fffbd0'], marcas: ['brilho', 'antenas', 'raio'],
    aparencia: 'vaga-lume grande e ágil, corpo escuro, asas brilhantes, abdômen soltando faíscas elétricas amarelas, antenas em forma de raio',
  },

  tatui: {
    num: 16, nome: 'Tatuí', tipos: ['terra'], base: { pv: 50, atq: 55, def: 75, vel: 30 }, captura: 190, xp: 58,
    evolui: { nivel: 24, para: 'tatuquara' },
    golpes: [[1, 'arranhao'], [1, 'endurecer'], [5, 'poeira'], [10, 'tremor'], [16, 'cascoDuro'], [22, 'mordida'], [32, 'terremoto']],
    desc: 'Tatu pequenino. Quando se assusta, vira uma bolinha perfeita e rola embora.',
    forma: 'tatu', cores: ['#b89a6a', '#8a7048', '#f0d8a8'], marcas: ['faixas'],
    aparencia: 'tatu pequeno e fofo, carapaça bege com faixas, focinho comprido, orelhinhas, meio enrolado como uma bola',
  },
  tatuquara: {
    num: 17, nome: 'Tatuquara', tipos: ['terra'], base: { pv: 75, atq: 90, def: 110, vel: 40 }, captura: 75, xp: 150,
    golpes: [[1, 'arranhao'], [1, 'poeira'], [10, 'tremor'], [16, 'cascoDuro'], [22, 'mordida'], [30, 'cabecada'], [36, 'terremoto']],
    desc: 'Cava túneis tão longos que já saiu do outro lado de uma montanha.',
    forma: 'tatu', cores: ['#8f7650', '#6a5434', '#d8bf88'], marcas: ['faixas', 'garras'],
    aparencia: 'tatu grande e blindado, carapaça marrom com faixas de pedra, garras enormes para cavar, terra caindo das costas',
  },

  cururim: {
    num: 18, nome: 'Cururim', tipos: ['agua', 'nevoa'], base: { pv: 50, atq: 40, def: 45, vel: 40 }, captura: 190, xp: 56,
    evolui: { nivel: 25, para: 'cururao' },
    golpes: [[1, 'bolhas'], [1, 'investida'], [6, 'garoaFria'], [11, 'veuDeNevoa'], [17, 'correnteza'], [23, 'sereno'], [33, 'nevoeiro']],
    desc: 'Sapinho que canta nas noites de neblina. Quanto mais canta, mais a névoa sobe.',
    forma: 'sapo', cores: ['#6f7a3a', '#c8c08a', '#b8c8d8'], marcas: ['verrugas'],
    aparencia: 'sapo-cururu pequeno e gorducho, pele verde-oliva com verrugas, papo claro, uma nuvenzinha de névoa saindo da boca',
  },
  cururao: {
    num: 19, nome: 'Cururão', tipos: ['agua', 'nevoa'], base: { pv: 85, atq: 75, def: 70, vel: 55 }, captura: 75, xp: 150,
    golpes: [[1, 'bolhas'], [1, 'garoaFria'], [11, 'veuDeNevoa'], [17, 'correnteza'], [23, 'sereno'], [30, 'nevoeiro'], [38, 'pororoca']],
    desc: 'Quando coaxa, a cidade inteira some na névoa por uma noite.',
    forma: 'sapo', cores: ['#4f5a2a', '#b0a870', '#98a8b8'], marcas: ['verrugas'],
    aparencia: 'sapo-cururu enorme, pele escura com verrugas, olhos amarelos brilhando, névoa densa saindo das costas',
  },

  pioca: {
    num: 20, nome: 'Pioca', tipos: ['vento', 'nevoa'], base: { pv: 45, atq: 40, def: 40, vel: 50 }, captura: 190, xp: 55,
    evolui: { nivel: 20, para: 'corujao' },
    golpes: [[1, 'rajada'], [1, 'susto'], [6, 'garoaFria'], [11, 'asaCortante'], [16, 'veuDeNevoa'], [21, 'sereno'], [30, 'redemoinho']],
    desc: 'Corujinha-buraqueira que mora num buraco no chão. Vira a cabeça quase toda.',
    forma: 'coruja', cores: ['#9a7a52', '#f2e6c8', '#f5d020'], marcas: ['pernas'],
    aparencia: 'corujinha-buraqueira fofa, penas marrons com pintinhas brancas, olhos amarelos enormes, pernas compridas, cabeça inclinada curiosa',
  },
  corujao: {
    num: 21, nome: 'Corujão', tipos: ['vento', 'nevoa'], base: { pv: 75, atq: 65, def: 60, vel: 80 }, captura: 90, xp: 145,
    golpes: [[1, 'rajada'], [1, 'garoaFria'], [11, 'asaCortante'], [16, 'veuDeNevoa'], [22, 'sereno'], [28, 'redemoinho'], [36, 'nevoeiro']],
    desc: 'Voa sem fazer barulho dentro da névoa. Enxerga tudo, mesmo no escuro.',
    forma: 'coruja', cores: ['#6f5534', '#e2d2a8', '#ffd21f'], marcas: ['pernas', 'tufos'],
    aparencia: 'coruja grande e misteriosa, penas marrom-acinzentadas, olhos amarelos intensos, asas abertas envoltas em névoa',
  },

  taturana: {
    num: 22, nome: 'Taturana', tipos: ['inseto'], base: { pv: 40, atq: 30, def: 35, vel: 30 }, captura: 255, xp: 39,
    evolui: { nivel: 10, para: 'mariposombra' },
    golpes: [[1, 'investida'], [1, 'sedaPegajosa'], [5, 'ferroada']],
    desc: 'Lagarta peluda. Melhor não encostar: os pelinhos queimam a pele.',
    forma: 'lagarta', cores: ['#d8c070', '#8a6a2a', '#fff0a0'], marcas: ['pelos'],
    aparencia: 'lagarta taturana fofa, corpo gordinho em segmentos, coberta de pelos amarelos, olhinhos pretos',
  },
  mariposombra: {
    num: 23, nome: 'Mariposombra', tipos: ['inseto', 'nevoa'], base: { pv: 65, atq: 55, def: 55, vel: 75 }, captura: 90, xp: 140,
    golpes: [[1, 'ferroada'], [1, 'sedaPegajosa'], [10, 'garoaFria'], [14, 'picada'], [18, 'polenDoSono'], [24, 'sereno'], [30, 'enxame']],
    desc: 'Mariposa que aparece nas lamparinas. Dizem que traz recados do outro lado.',
    forma: 'mariposa', cores: ['#5a5a6a', '#c8c8d8', '#f0f0ff'], marcas: ['olhosNasAsas', 'antenas'],
    aparencia: 'mariposa grande, asas cinza-prateadas com desenhos de olhos, corpo peludo, antenas plumosas, névoa saindo das asas',
  },

  tamandim: {
    num: 24, nome: 'Tamandim', tipos: ['fera'], base: { pv: 55, atq: 55, def: 45, vel: 40 }, captura: 170, xp: 60,
    evolui: { nivel: 26, para: 'tamanduaco' },
    golpes: [[1, 'arranhao'], [1, 'rugido'], [6, 'ferroada'], [11, 'mordida'], [17, 'picada'], [23, 'cabecada'], [30, 'estouro']],
    desc: 'Filhote de tamanduá-bandeira. Anda nas costas da mãe até ficar grande.',
    forma: 'tamandua', cores: ['#6a5a4a', '#1a1a1a', '#f0e8d8'], marcas: ['faixaDiagonal', 'cauda'],
    aparencia: 'filhote de tamanduá-bandeira fofo, focinho comprido e fino, pelagem cinza-amarronzada, faixa preta e branca diagonal, cauda peluda',
  },
  tamanduaco: {
    num: 25, nome: 'Tamanduaço', tipos: ['fera', 'inseto'], base: { pv: 90, atq: 95, def: 70, vel: 55 }, captura: 60, xp: 155,
    golpes: [[1, 'arranhao'], [1, 'ferroada'], [11, 'mordida'], [17, 'picada'], [26, 'cabecada'], [32, 'enxame'], [38, 'estouro']],
    desc: 'Quando fica de pé e abre os braços, nem a onça se arrisca a chegar perto.',
    forma: 'tamandua', cores: ['#4f4236', '#111111', '#e8dcc8'], marcas: ['faixaDiagonal', 'cauda', 'garras'],
    aparencia: 'tamanduá-bandeira adulto em pé, braços abertos com garras enormes, faixa preta e branca no peito, cauda imensa como bandeira',
  },

  jacarito: {
    num: 26, nome: 'Jacarito', tipos: ['agua', 'terra'], base: { pv: 55, atq: 60, def: 60, vel: 35 }, captura: 120, xp: 65,
    evolui: { nivel: 30, para: 'jacarucu' },
    golpes: [[1, 'mordida'], [1, 'endurecer'], [7, 'jatoDagua'], [12, 'poeira'], [18, 'correnteza'], [24, 'tremor'], [34, 'pororoca']],
    desc: 'Filhote de jacaré-de-papo-amarelo. Fica parado horas, fingindo ser um tronco.',
    forma: 'jacare', cores: ['#4a6a3a', '#e8d070', '#2a3a20'], marcas: ['escamas'],
    aparencia: 'filhote de jacaré-de-papo-amarelo fofo, escamas verde-escuras, papo amarelo, sorrisinho com dentinhos, olhos grandes',
  },
  jacarucu: {
    num: 27, nome: 'Jacaruçu', tipos: ['agua', 'terra'], base: { pv: 85, atq: 95, def: 90, vel: 50 }, captura: 45, xp: 165,
    golpes: [[1, 'mordida'], [1, 'jatoDagua'], [12, 'poeira'], [18, 'correnteza'], [24, 'tremor'], [32, 'cabecada'], [38, 'terremoto'], [42, 'pororoca']],
    desc: 'O rei do pantanal. Uma mordida dele parte um tronco de árvore ao meio.',
    forma: 'jacare', cores: ['#34502a', '#e0c050', '#1a2814'], marcas: ['escamas', 'espinhos'],
    aparencia: 'jacaré enorme e blindado, escamas escuras com placas de pedra nas costas, papo amarelo, boca entreaberta mostrando dentes',
  },

  bezerrito: {
    num: 28, nome: 'Bezerrito', tipos: ['fera', 'terra'], base: { pv: 60, atq: 50, def: 50, vel: 35 }, captura: 190, xp: 58,
    evolui: { nivel: 28, para: 'boiadao' },
    golpes: [[1, 'investida'], [1, 'rugido'], [6, 'poeira'], [11, 'cabecada'], [18, 'tremor'], [25, 'endurecer'], [33, 'estouro']],
    desc: 'Bezerro curioso que foge do curral para explorar. Sempre volta na hora do leite.',
    forma: 'boi', cores: ['#f2ece0', '#3a2a1a', '#f0a0a0'], marcas: ['manchas', 'chifrinhos'],
    aparencia: 'bezerro malhado fofo, pelagem branca com manchas marrom-escuras, chifrinhos pequenos, sininho no pescoço',
  },
  boiadao: {
    num: 29, nome: 'Boiadão', tipos: ['fera', 'terra'], base: { pv: 100, atq: 90, def: 85, vel: 45 }, captura: 60, xp: 160,
    golpes: [[1, 'investida'], [1, 'poeira'], [11, 'cabecada'], [18, 'tremor'], [25, 'endurecer'], [28, 'estouro'], [40, 'terremoto']],
    desc: 'Lidera a boiada. Quando bate a pata no chão, os outros param na hora.',
    forma: 'boi', cores: ['#e8e0d0', '#2a1e12', '#e09090'], marcas: ['manchas', 'chifres'],
    aparencia: 'boi zebu enorme com corcova, pelagem clara com manchas escuras, chifres grandes curvados, sino de couro no pescoço, poeira nos cascos',
  },

  jatai: {
    num: 30, nome: 'Jataí', tipos: ['inseto', 'planta'], base: { pv: 35, atq: 40, def: 30, vel: 60 }, captura: 200, xp: 50,
    evolui: { nivel: 18, para: 'jataia' },
    golpes: [[1, 'ferroada'], [1, 'ataqueRapido'], [5, 'chicoteDeCipo'], [10, 'polenDoSono'], [15, 'picada'], [20, 'raizSugadora'], [28, 'enxame']],
    desc: 'Abelhinha sem ferrão que faz um mel docinho. Os pequenos adoram.',
    forma: 'inseto', cores: ['#e0a020', '#3a2a10', '#fff0c0'], marcas: ['listras', 'antenas'],
    aparencia: 'abelhinha jataí fofa, corpo dourado com listras escuras, asinhas transparentes, carregando uma gota de mel',
  },
  jataia: {
    num: 31, nome: 'Jataiá', tipos: ['inseto', 'planta'], base: { pv: 60, atq: 70, def: 50, vel: 95 }, captura: 90, xp: 140,
    golpes: [[1, 'ferroada'], [1, 'chicoteDeCipo'], [10, 'polenDoSono'], [15, 'picada'], [20, 'raizSugadora'], [26, 'enxame'], [32, 'furiaDaMata']],
    desc: 'A rainha da colmeia. Defende as flores do campo com um enxame inteiro.',
    forma: 'inseto', cores: ['#d08a10', '#2a1e08', '#ffe8a0'], marcas: ['listras', 'antenas', 'coroa'],
    aparencia: 'abelha rainha grande e elegante, corpo dourado listrado, asas brilhantes, uma coroa de flores na cabeça, pólen flutuando ao redor',
  },

  morceguito: {
    num: 32, nome: 'Morceguito', tipos: ['nevoa', 'vento'], base: { pv: 40, atq: 45, def: 35, vel: 60 }, captura: 255, xp: 49,
    evolui: { nivel: 22, para: 'morcegao' },
    golpes: [[1, 'mordida'], [1, 'susto'], [5, 'rajada'], [10, 'garoaFria'], [15, 'asaCortante'], [21, 'sereno'], [30, 'nevoeiro']],
    desc: 'Morceguinho que dorme de cabeça para baixo no telhado das casas velhas.',
    forma: 'morcego', cores: ['#4a3a5a', '#d0b0c0', '#9a7ab0'], marcas: ['orelhasGrandes'],
    aparencia: 'morceguinho fofo, pelagem roxo-acinzentada, orelhas enormes, asas membranosas abertas, presinhas aparecendo',
  },
  morcegao: {
    num: 33, nome: 'Morcegão', tipos: ['nevoa', 'vento'], base: { pv: 75, atq: 80, def: 65, vel: 100 }, captura: 90, xp: 150,
    golpes: [[1, 'mordida'], [1, 'garoaFria'], [15, 'asaCortante'], [22, 'sereno'], [28, 'redemoinho'], [34, 'nevoeiro']],
    desc: 'Some dentro da névoa e reaparece atrás de você sem fazer som nenhum.',
    forma: 'morcego', cores: ['#33264a', '#c09ab0', '#7a5a9a'], marcas: ['orelhasGrandes'],
    aparencia: 'morcego grande e misterioso, asas enormes roxo-escuras, olhos vermelhos brilhando, envolto em névoa',
  },

  lambari: {
    num: 34, nome: 'Lambari', tipos: ['agua'], base: { pv: 25, atq: 20, def: 25, vel: 70 }, captura: 255, xp: 40,
    evolui: { nivel: 20, para: 'dourado' },
    golpes: [[1, 'investida'], [1, 'bolhas'], [15, 'jatoDagua']],
    desc: 'Peixinho prateado que vive em cardume. Sozinho, não faz quase nada.',
    forma: 'peixe', cores: ['#c0c8d0', '#e05030', '#ffffff'], marcas: [],
    aparencia: 'peixinho lambari fofo, escamas prateadas, rabo vermelho, olhos grandes e assustados',
  },
  dourado: {
    num: 35, nome: 'Dourado', tipos: ['agua', 'fogo'], base: { pv: 70, atq: 95, def: 60, vel: 95 }, captura: 45, xp: 170,
    golpes: [[1, 'bolhas'], [1, 'investida'], [20, 'brasa'], [24, 'correnteza'], [30, 'linguaDeFogo'], [36, 'pororoca'], [42, 'labareda']],
    desc: 'O lambari que nadou contra a correnteza até virar o rei do rio, brilhando como ouro.',
    forma: 'peixe', cores: ['#f0a020', '#c04010', '#fff0a0'], marcas: ['barbatanas'],
    aparencia: 'peixe dourado grande e valente, escamas douradas brilhantes, barbatanas como chamas, saltando da água',
  },

  // ── Lendas e assombrações (raros) ─────────────────────────
  quatiri: {
    num: 36, nome: 'Quatiri', tipos: ['vento', 'lenda'], base: { pv: 50, atq: 60, def: 45, vel: 85 }, captura: 45, xp: 90,
    evolui: { nivel: 30, para: 'saquati' },
    golpes: [[1, 'ataqueRapido'], [1, 'assobio'], [8, 'rajada'], [14, 'encanto'], [20, 'redemoinho'], [28, 'correrNoVento'], [34, 'vendaval']],
    desc: 'Quati brincalhão que usa um gorrinho vermelho. Dá nós no rabo dos cavalos.',
    forma: 'quati', cores: ['#a8683a', '#3a2414', '#d82020'], marcas: ['gorro', 'caudaListrada'],
    aparencia: 'quati fofo e travesso, pelagem marrom-alaranjada, cauda comprida listrada, gorro vermelho pontudo na cabeça, um pequeno redemoinho de vento aos pés',
  },
  saquati: {
    num: 37, nome: 'Saquati', tipos: ['vento', 'lenda'], base: { pv: 70, atq: 90, def: 60, vel: 115 }, captura: 25, xp: 180,
    golpes: [[1, 'assobio'], [1, 'rajada'], [14, 'encanto'], [20, 'redemoinho'], [30, 'correrNoVento'], [38, 'vendaval']],
    desc: 'Vive dentro dos redemoinhos de poeira. Quem consegue pegar o gorro dele ganha um desejo.',
    forma: 'quati', cores: ['#8a5028', '#2a180c', '#e01818'], marcas: ['gorro', 'caudaListrada', 'redemoinho'],
    aparencia: 'quati ágil girando dentro de um redemoinho de poeira e folhas, gorro vermelho, cauda listrada enorme, sorriso travesso',
  },

  caititu: {
    num: 38, nome: 'Caititu', tipos: ['planta', 'lenda'], base: { pv: 60, atq: 65, def: 55, vel: 50 }, captura: 45, xp: 90,
    evolui: { nivel: 30, para: 'curupiru' },
    golpes: [[1, 'investida'], [1, 'chicoteDeCipo'], [8, 'mordida'], [14, 'encanto'], [20, 'folhaNavalha'], [28, 'raizSugadora'], [34, 'furiaDaMata']],
    desc: 'Porquinho-do-mato com as patas viradas para trás. Seus rastros enganam caçadores.',
    forma: 'porco', cores: ['#4a4038', '#e8e0d0', '#e85a20'], marcas: ['colar', 'pesVirados'],
    aparencia: 'filhote de cateto (porco-do-mato) fofo, pelagem escura com colar branco, cabelinho ruivo espetado, patinhas viradas para trás',
  },
  curupiru: {
    num: 39, nome: 'Curupiru', tipos: ['planta', 'lenda'], base: { pv: 85, atq: 100, def: 80, vel: 75 }, captura: 25, xp: 185,
    golpes: [[1, 'chicoteDeCipo'], [1, 'encanto'], [20, 'folhaNavalha'], [28, 'raizSugadora'], [30, 'rugido'], [36, 'furiaDaMata'], [44, 'fogoEncantado']],
    desc: 'O guardião da mata. Persegue quem derruba árvores e faz o invasor andar em círculos.',
    forma: 'porco', cores: ['#33291f', '#e0d8c8', '#ff4a10'], marcas: ['colar', 'pesVirados', 'crinaFogo'],
    aparencia: 'porco-do-mato guardião grande e forte, pelagem escura, crina ruiva como fogo, patas viradas para trás, folhas e cipós enrolados no corpo',
  },

  preguicombra: {
    num: 40, nome: 'Preguiçombra', tipos: ['espirito', 'nevoa'], base: { pv: 75, atq: 60, def: 75, vel: 20 }, captura: 60, xp: 140,
    golpes: [[1, 'lambidaFria'], [1, 'susto'], [10, 'garoaFria'], [16, 'veuDeNevoa'], [22, 'sombraNoturna'], [30, 'sereno'], [38, 'pesadelo']],
    desc: 'Um bicho-preguiça fantasma que flutua devagar entre as árvores nas noites de névoa.',
    forma: 'preguica', cores: ['#a8b0c8', '#5a6080', '#d0e0ff'], marcas: ['fantasma'],
    aparencia: 'bicho-preguiça fantasma, translúcido azul-acinzentado, sorriso sonolento, garras compridas, flutuando pendurado num galho invisível',
  },

  mulassombra: {
    num: 41, nome: 'Mulassombra', tipos: ['fogo', 'espirito'], base: { pv: 75, atq: 95, def: 70, vel: 90 }, captura: 25, xp: 190,
    golpes: [[1, 'brasa'], [1, 'susto'], [10, 'fogoFatuo'], [18, 'linguaDeFogo'], [24, 'sombraNoturna'], [32, 'labareda'], [40, 'pesadelo']],
    desc: 'Galopa pelas estradas de terra nas noites de sexta-feira, soltando fogo no lugar da cabeça.',
    forma: 'equino', cores: ['#2a2020', '#ff6a1a', '#ffd040'], marcas: ['fogoCabeca'],
    aparencia: 'mula escura e assombrada galopando, chamas laranja no lugar da cabeça, ferraduras brilhando, rastro de fumaça',
  },

  piraiara: {
    num: 42, nome: 'Piraiara', tipos: ['agua', 'lenda'], base: { pv: 85, atq: 80, def: 75, vel: 75 }, captura: 25, xp: 190,
    golpes: [[1, 'jatoDagua'], [1, 'cantoDaIara'], [12, 'bolhas'], [18, 'encanto'], [26, 'correnteza'], [34, 'pororoca']],
    desc: 'Um pirarucu encantado. Seu canto atrai quem está perto do rio para as águas fundas.',
    forma: 'peixe', cores: ['#3a5a5a', '#c83a2a', '#a0f0e0'], marcas: ['barbatanas', 'cabelo'],
    aparencia: 'pirarucu encantado elegante, escamas verde-escuras com bordas vermelhas, barbatanas longas como cabelos ondulando, brilho mágico turquesa',
  },

  jaguarete: {
    num: 43, nome: 'Jaguaretê', tipos: ['fera', 'lenda'], base: { pv: 85, atq: 110, def: 80, vel: 105 }, captura: 10, xp: 210,
    golpes: [[1, 'mordida'], [1, 'rugido'], [15, 'arranhao'], [22, 'encanto'], [30, 'cabecada'], [40, 'estouro']],
    desc: 'A onça-pintada encantada. Dizem que cada pintinha dela é uma estrela que caiu na mata.',
    forma: 'felino', cores: ['#e0a030', '#1a1a1a', '#fff0c0'], marcas: ['rosetas'],
    aparencia: 'onça-pintada majestosa, pelagem dourada com rosetas pretas que brilham como estrelas, olhos verdes intensos, postura de caça',
  },

  boitata: {
    num: 44, nome: 'Boitatá', tipos: ['fogo', 'lenda'], base: { pv: 100, atq: 110, def: 90, vel: 100 }, captura: 3, xp: 270,
    golpes: [[1, 'brasa'], [1, 'fogoFatuo'], [20, 'encanto'], [30, 'linguaDeFogo'], [40, 'labareda'], [50, 'fogoEncantado']],
    desc: 'A grande serpente de fogo que protege os campos das queimadas. Seus olhos enxergam tudo.',
    forma: 'serpente', cores: ['#ff6010', '#ffd030', '#3aa0ff'], marcas: ['olhosBrilhantes'],
    aparencia: 'serpente gigante feita de fogo vivo, corpo laranja e amarelo em espiral, olhos azuis enormes e brilhantes, faíscas ao redor',
  },
};

export const LISTA_CRIATURAS = Object.entries(CRIATURAS)
  .map(([id, c]) => ({ id, ...c }))
  .sort((a, b) => a.num - b.num);
