// Tela de título e introdução do jogo novo.
import { existeSave, carregar, novoJogo, salvar, apagarSave } from '../motor/estado.js';
import { estilo } from '../ui/desenho.js';
import { esperar } from './Interface.js';

const W = 720, H = 480;

export default class Titulo extends Phaser.Scene {
  constructor() { super('Titulo'); }

  create() {
    this.ui = this.scene.get('Interface');
    this.scene.bringToTop('Interface');
    this.desenharFundo();
    this.ui.clarear(400);
    this.time.delayedCall(450, () => this.menu());
  }

  desenharFundo() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x6a8ab0, 0x6a8ab0, 1);
    g.fillRect(0, 0, W, H);
    // lua
    g.fillStyle(0xf8f0d0); g.fillCircle(600, 80, 38);
    g.fillStyle(0x6a8ab0, 0.5); g.fillCircle(616, 70, 32);
    // estrelas
    g.fillStyle(0xffffff);
    for (let i = 0; i < 40; i++) g.fillRect((i * 137) % W, (i * 71) % 200, 2, 2);
    // morros e araucárias
    g.fillStyle(0x24405a); g.fillEllipse(180, 430, 700, 220); g.fillEllipse(600, 450, 640, 200);
    g.fillStyle(0x162a3a);
    for (const [x, s] of [[60, 1.2], [140, 0.9], [560, 1.1], [650, 1.4], [700, 0.8]]) {
      g.fillRect(x - 3 * s, 300 - 40 * s, 6 * s, 160 * s);
      g.fillEllipse(x, 300 - 40 * s, 110 * s, 30 * s);
      g.fillEllipse(x, 330 - 30 * s, 70 * s, 18 * s);
    }
    // névoa
    for (let i = 0; i < 4; i++) {
      const n = this.add.ellipse(i * 240, 420 + (i % 2) * 20, 420, 60, 0xd8e4f0, 0.18);
      this.tweens.add({ targets: n, x: n.x + 120, duration: 6000 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // os três iniciais
    ['guarito', 'ariri', 'brotojabi'].forEach((id, i) => {
      const img = this.add.image(220 + i * 140, 330, 'criatura_' + id).setScale(2).setOrigin(0.5, 1);
      this.tweens.add({ targets: img, y: 320, duration: 500 + i * 80, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 200 });
    });
    // logo
    const logo = this.add.text(W / 2, 96, 'ENCANTADOS', estilo(76, '#ffd84a', {
      fontStyle: '700', stroke: '#5a2a10', strokeThickness: 10,
      shadow: { offsetX: 4, offsetY: 6, color: '#101820', fill: true, stroke: true },
    })).setOrigin(0.5);
    this.tweens.add({ targets: logo, y: 102, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.text(W / 2, 162, 'Criaturas da fauna e das lendas do Brasil', estilo(22, '#ffffff')).setOrigin(0.5);
    this.add.text(W - 10, H - 8, 'v0.1', estilo(14, '#ffffff')).setOrigin(1, 1).setAlpha(0.6);
  }

  async menu() {
    const temSave = existeSave();
    const opcoes = temSave ? ['Continuar', 'Novo jogo'] : ['Novo jogo'];
    const r = await this.ui.escolher(opcoes, { x: W / 2 - 120, y: 360, largura: 240, cancelavel: false });
    const escolha = opcoes[r];
    if (escolha === 'Continuar') {
      carregar();
      await this.ui.escurecer(300);
      this.scene.start('Mundo');
      return;
    }
    if (temSave) {
      const c = await this.ui.perguntar('Começar de novo apaga o jogo salvo. Tem certeza?', ['Não', 'Sim, começar de novo']);
      if (c !== 1) return this.menu();
      apagarSave();
    }
    await this.introducao();
  }

  async introducao() {
    await this.ui.escurecer(300);
    this.children.removeAll(true);
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a4a6a, 0x2a4a6a, 0x101820, 0x101820, 1);
    g.fillRect(0, 0, W, H);
    const prof = this.add.sprite(W / 2, 250, 'pers_professora', 0).setScale(12).setOrigin(0.5, 1);
    await this.ui.clarear(400);
    await this.ui.falar([
      'Olá! Seja bem-vindo ao mundo dos Encantados!',
      'Meu nome é Jaci. Todo mundo me chama de Professora Jaci.',
      'Nesta terra vivem os Encantados: bichos dos campos, das matas e dos rios que ganharam poderes...',
      '...e criaturas das lendas antigas, que aparecem quando a névoa sobe.',
    ]);
    prof.setVisible(false);
    const amigos = ['capivi', 'gralhita', 'pirili'].map((id, i) => this.add.image(200 + i * 160, 250, 'criatura_' + id).setScale(2.6).setOrigin(0.5, 1).setAlpha(0));
    this.tweens.add({ targets: amigos, alpha: 1, duration: 500 });
    await this.ui.falar([
      'As pessoas que vivem junto com os Encantados, batalham com eles e cuidam deles são chamadas de Encantadores.',
      'E eu passo os meus dias estudando essas criaturas.',
    ]);
    amigos.forEach((a) => a.destroy());
    prof.setVisible(true);
    await this.ui.falar('Mas me conte sobre você.');
    const nome = await this.ui.pedirNome();
    novoJogo(nome);
    await this.ui.falar([
      `${nome}! Que nome bonito!`,
      'Seu vizinho, o Caio, também está muito animado. Ele vai começar a jornada junto com você.',
      `${nome}, a sua aventura com os Encantados vai começar agora!`,
    ]);
    this.tweens.add({ targets: prof, scale: 0.5, alpha: 0, duration: 700 });
    await esperar(this, 700);
    salvar();
    await this.ui.escurecer(400);
    this.scene.start('Mundo');
  }
}
