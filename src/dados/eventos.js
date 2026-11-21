// Roteiros (scripts) dos eventos. Cada um recebe `c`, o contexto com ações prontas
// (falar, perguntar, darItem, batalha, mover personagens...). Ver Mundo.criarContexto().
import { CRIATURAS } from '../dados/criaturas.js';
import { TIPOS } from '../dados/tipos.js';

const CONTRA = { guarito: 'ariri', ariri: 'brotojabi', brotojabi: 'guarito' };

export const EVENTOS = {
  async mae(c) {
    if (!c.flag('temInicial')) {
      await c.falar([
        'Mãe: Bom dia, {nome}! Dormiu bem?',
        'A Professora Jaci passou aqui cedinho. Ela quer te ver no laboratório!',
        'É a casa grande de telhado azul, do outro lado da praça.',
      ]);
      return;
    }
    await c.falar('Mãe: Você parece cansado. Descanse um pouco!');
    await c.curarComEfeito();
    c.definirCura('casaJogador', 4, 5, 'cima');
    await c.falar('Mãe: Pronto! Seus Encantados estão cheios de energia. Boa sorte, {nome}!');
  },

  async voCaio(c) {
    if (!c.flag('temInicial')) {
      await c.falar(['Vó do Caio: O {rival} saiu correndo para o laboratório da Professora.', 'Esse menino não para quieto!']);
    } else {
      await c.falar(['Vó do Caio: O {rival} foi treinar na Rota 1.', 'Ele fala de você o tempo todo, sabia? Diz que vocês são rivais!']);
    }
  },

  async bloqueioNorte(c) {
    if (c.flag('temInicial')) return;
    await c.exclamar('jogador');
    await c.falar(['Uma voz: Ei, {nome}! Espere!', 'Professora Jaci: Não entre no mato alto sem um Encantado! É perigoso!', 'Venha até o meu laboratório, o de telhado azul.']);
    await c.moverJogador('baixo', 1);
  },

  async caioLab(c) {
    if (!c.flag('temInicial')) {
      await c.falar(['{rival}: Demorou, hein, {nome}!', 'A Professora disse que você escolhe primeiro. Então anda logo!']);
    }
  },

  async chegadaLab(c) {
    if (c.flag('introLab')) return;
    c.virarNpc('caio', 'baixo');
    await c.falar('{rival}: Até que enfim, {nome}!');
    await EVENTOS.professora(c);
  },

  async professora(c) {
    if (!c.flag('temInicial')) {
      if (!c.flag('introLab')) {
        await c.falar([
          'Professora Jaci: Ah, {nome}! Que bom que você veio!',
          'Eu estudo os Encantados: criaturas que vivem nos campos, nas matas, nos rios... e até dentro da névoa.',
          'Muitos parecem bichos comuns da nossa terra, mas têm poderes. Outros vieram direto das lendas antigas!',
          'Hoje é um dia especial: você e o {rival} vão receber o primeiro Encantado de vocês.',
          'Nesta mesa há três patuás. Cada um guarda um Encantado. Escolha o seu!',
        ]);
        c.marcar('introLab');
      } else {
        await c.falar('Professora Jaci: Escolha um dos três patuás da mesa, {nome}!');
      }
      return;
    }
    const n = c.qtdCapturados();
    await c.falar([
      'Professora Jaci: A Rota 1 fica ao norte da vila. Vá explorar!',
      n > 1 ? `Você já registrou ${n} Encantados no Caderno de Campo. Muito bem!` : 'Capture Encantados e registre todos no Caderno de Campo!',
    ]);
  },

  async inicial(c, especie) {
    if (c.flag('temInicial')) {
      await c.falar(c.flag('patua_' + especie) ? 'Não tem mais nada aqui.' : 'Esse é o último patuá. A Professora vai guardar para outro Encantador.');
      return;
    }
    if (!c.flag('introLab')) await EVENTOS.professora(c);
    const e = CRIATURAS[especie];
    const fechar = c.mostrarCriatura(especie);
    const r = await c.perguntar(`Você quer o ${e.nome}, o Encantado do tipo ${TIPOS[e.tipos[0]].nome}?`);
    fechar();
    if (r !== 0) return;
    c.darCriatura(especie, 5);
    c.marcar('temInicial');
    c.marcar('inicial', especie);
    c.marcar('patua_' + especie);
    await c.falar([`Você recebeu o ${e.nome}!`]);

    // O rival escolhe o que tem vantagem
    const doRival = CONTRA[especie];
    c.marcar('inicialRival', doRival);
    await c.falar(`{rival}: Então eu fico com este aqui!`);
    const xAlvo = { guarito: 5, ariri: 6, brotojabi: 7 }[doRival];
    const caio = c.npc('caio');
    const caminho = [];
    if (caio.ty !== 5) caminho.push(['baixo', 5 - caio.ty]);
    if (xAlvo !== caio.tx) caminho.push([xAlvo > caio.tx ? 'dir' : 'esq', Math.abs(xAlvo - caio.tx)]);
    caminho.push(['cima', 1]);
    for (const [dir, n] of caminho) await c.moverNpc('caio', dir, n);
    c.virarNpc('caio', 'cima');
    c.marcar('patua_' + doRival);
    c.atualizarDecoracao();
    await c.falar(`O {rival} recebeu o ${CRIATURAS[doRival].nome}!`);
    c.virarNpc('caio', c.direcaoPara('caio'));
    await c.falar(['{rival}: Ei, {nome}! Vamos ver quem escolheu melhor!', 'Uma batalha, agora!']);

    const resultado = await c.batalhaTreinador({
      nome: 'Rival {rival}', sprite: 'rival', time: [[doRival, 5]], recompensa: 300,
      derrota: 'Ah, não! Perdi logo na primeira!', podePerder: true,
    });
    c.curarTime();
    if (resultado === 'vitoria') await c.falar(['{rival}: Hunf... Foi sorte!', 'Vou treinar na Rota 1 e ficar muito mais forte. Tchau!']);
    else await c.falar(['{rival}: Ha! Eu sabia que tinha escolhido o melhor!', 'Vou treinar na Rota 1. Até mais, {nome}!']);
    // Caio sai do laboratório
    const caio2 = c.npc('caio');
    await c.moverNpc('caio', 'baixo', 1);
    if (caio2.tx !== 5) await c.moverNpc('caio', caio2.tx < 5 ? 'dir' : 'esq', Math.abs(5 - caio2.tx));
    await c.moverNpc('caio', 'baixo', 8 - caio2.ty);
    c.marcar('caioSaiuLab');
    c.esconderNpc('caio');

    c.virarNpc('professora', 'baixo');
    await c.falar([
      'Professora Jaci: Que batalha! Seus Encantados descansaram um pouco, já estão bem.',
      'Tome, {nome}: cinco patuás para capturar Encantados selvagens...',
    ]);
    c.darItem('patua', 5);
    c.marcar('temCaderno');
    await c.falar([
      'Você recebeu 5 Patuás!',
      '...e este Caderno de Campo. Ele registra todo Encantado que você encontrar.',
      'Você recebeu o Caderno de Campo!',
      'Professora Jaci: Para capturar, primeiro enfraqueça o Encantado selvagem. Depois jogue o patuá!',
      'A Rota 1 fica ao norte da vila. Boa sorte, {nome}!',
    ]);
    c.salvar();
  },

  async enfermeira(c) {
    const r = await c.perguntar('Enfermeira Benta: Bem-vindo à Casa de Cura! Quer que eu cuide dos seus Encantados?');
    if (r !== 0) { await c.falar('Enfermeira Benta: Volte sempre!'); return; }
    if (!c.temTime()) { await c.falar('Enfermeira Benta: Mas você ainda não tem nenhum Encantado!'); return; }
    await c.falar('Enfermeira Benta: Pode deixar comigo!', { semEspera: true });
    await c.curarComEfeito();
    c.definirCura('casaCura', 5, 5, 'cima');
    await c.falar('Enfermeira Benta: Pronto! Seus Encantados estão novinhos em folha. Volte sempre!');
  },

  async vendedor(c) {
    await c.falar('Vendedor: Olá! Temos patuás, chás e remédios do mato. O que vai querer?', { manter: true, semEspera: true });
    await c.loja();
  },
};
