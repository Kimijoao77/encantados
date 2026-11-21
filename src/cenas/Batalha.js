// Cena de batalha por turnos.
import { estado, usarItem, adicionarCriatura, marcarVisto, timeVivo } from '../motor/estado.js';
import { CRIATURAS } from '../dados/criaturas.js';
import { GOLPES } from '../dados/golpes.js';
import { ITENS } from '../dados/itens.js';
import { TIPOS } from '../dados/tipos.js';
import { nomeDe, pvMax, xpParaNivel, ganharXp, xpDerrota } from '../motor/criatura.js';
import {
  novoLutador, usarGolpe, fimDeTurno, jogadorPrimeiro, escolherGolpeInimigo, tentarCaptura, tentarFugir, NOMES_STATUS,
} from '../motor/batalha.js';
import { aplicarItem } from '../motor/usoItens.js';
import { caixa, estilo, barraPV, seloTipo } from '../ui/desenho.js';
import { esperar } from './Interface.js';

const W = 720;
const POS = {
  inimigo: { x: 520, y: 206, escala: 3 },
  jogador: { x: 190, y: 360, escala: 3.6 },
};
const AUTO = 1300; // mensagens de batalha avançam sozinhas depois disso (ou com A)

export default class Batalha extends Phaser.Scene {
  constructor() { super('Batalha'); }
  init(dados) { this.dados = dados; }

  create() {
    this.ui = this.scene.get('Interface');
    const d = this.dados;
    this.selvagem = d.tipo === 'selvagem';
    this.inimigos = d.inimigos;
    this.idxIni = 0;
    this.participantes = new Set();
    this.evolucoes = new Map();
    this.fugas = 0;
    this.resultado = null;
    this.hud = {};
    this.desenharCenario();
    window.__batalha = this;
    this.rodar().catch((e) => { console.error(e); this.terminar('fuga'); });
  }

  // ═══ Cenário ════════════════════════════════════════
  desenharCenario() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x7cc0ec, 0x7cc0ec, 0xd4eef8, 0xd4eef8, 1);
    g.fillRect(0, 0, W, 230);
    // nuvens
    g.fillStyle(0xffffff, 0.85);
    for (const [x, y, r] of [[90, 50, 26], [120, 44, 32], [150, 52, 22], [400, 30, 20], [425, 26, 26], [450, 34, 18], [640, 70, 22], [662, 64, 26]]) g.fillCircle(x, y, r);
    // morros e araucárias ao fundo
    g.fillStyle(0x9cd08c); g.fillEllipse(160, 236, 520, 120); g.fillEllipse(600, 240, 520, 110);
    g.fillStyle(0x6aa864);
    for (const x of [40, 110, 300, 640, 690]) {
      g.fillRect(x - 2, 150, 4, 70);
      g.fillEllipse(x, 150, 56, 16); g.fillEllipse(x, 172, 40, 12);
    }
    // chão
    g.fillGradientStyle(0xa8dc84, 0xa8dc84, 0x8cc86c, 0x8cc86c, 1);
    g.fillRect(0, 226, W, 260);
    // plataformas
    g.fillStyle(0x6aa850); g.fillEllipse(POS.inimigo.x, POS.inimigo.y, 300, 70);
    g.fillStyle(0x94cc72); g.fillEllipse(POS.inimigo.x, POS.inimigo.y - 4, 272, 54);
    g.fillStyle(0x6aa850); g.fillEllipse(POS.jogador.x, POS.jogador.y, 360, 84);
    g.fillStyle(0x94cc72); g.fillEllipse(POS.jogador.x, POS.jogador.y - 4, 330, 66);

    this.spriteIni = this.add.image(POS.inimigo.x, POS.inimigo.y, 'criatura_capivi').setOrigin(0.5, 1).setScale(POS.inimigo.escala).setVisible(false).setDepth(5);
    this.spriteJog = this.add.image(POS.jogador.x, POS.jogador.y + 6, 'criatura_capivi').setOrigin(0.5, 1).setScale(POS.jogador.escala).setVisible(false).setDepth(5);
  }

  texturaDe(mon, lado) {
    if (lado === 'jogador' && this.textures.exists(`criatura_${mon.especie}_costas`)) return { chave: `criatura_${mon.especie}_costas`, flip: false };
    return { chave: 'criatura_' + mon.especie, flip: lado === 'jogador' };
  }

  // ═══ HUD ════════════════════════════════════════════
  criarHud(lado, animar = true) {
    this.hud[lado]?.objs.forEach((o) => o.destroy());
    const l = lado === 'inimigo' ? this.ini : this.jog;
    const mon = l.mon;
    const ehJog = lado === 'jogador';
    const [x, y, w, h] = ehJog ? [384, 226, 324, 118] : [16, 20, 324, 90];
    const objs = [];
    objs.push(caixa(this, x, y, w, h, { filete: null }).setDepth(20));
    objs.push(this.add.text(x + 20, y + 12, nomeDe(mon), estilo(24)).setDepth(21));
    objs.push(this.add.text(x + w - 20, y + 14, 'Nv' + mon.nivel, estilo(21)).setOrigin(1, 0).setDepth(21));
    objs.push(this.add.text(x + 20, y + 50, 'PV', estilo(17, '#f8a020', { fontStyle: '700' })).setDepth(21));
    const barra = barraPV(this, x + 56, y + 54, w - 82, 10);
    barra.g.setDepth(21); objs.push(barra.g);
    barra.definir(mon.pv / pvMax(mon));
    const status = this.add.text(x + 20, y + (ehJog ? 76 : 66), '', estilo(15, '#ffffff', { padding: { x: 4, y: 1 } })).setDepth(21);
    objs.push(status);
    let numeros = null, xpG = null;
    if (ehJog) {
      numeros = this.add.text(x + w - 22, y + 70, '', estilo(20)).setOrigin(1, 0).setDepth(21);
      objs.push(numeros);
      xpG = this.add.graphics().setDepth(21);
      objs.push(xpG);
    }
    const hud = { objs, barra, status, numeros, xpG, x, y, w, pvMostrado: mon.pv, fracaoXp: this.fracaoXp(mon) };
    this.hud[lado] = hud;
    this.atualizarStatus(lado);
    this.atualizarNumeros(lado, mon.pv);
    if (ehJog) this.desenharXp(this.fracaoXp(mon));
    if (!animar) return;
    // entra deslizando
    const dx = ehJog ? 360 : -360;
    objs.forEach((o) => { o.x += dx; this.tweens.add({ targets: o, x: o.x - dx, duration: 260, ease: 'Quad.out' }); });
  }

  fracaoXp(mon) {
    if (mon.nivel >= 100) return 1;
    const a = xpParaNivel(mon.nivel), b = xpParaNivel(mon.nivel + 1);
    return Math.max(0, Math.min(1, (mon.xp - a) / (b - a)));
  }

  desenharXp(f) {
    const h = this.hud.jogador;
    if (!h?.xpG) return;
    const g = h.xpG; g.clear();
    const x = h.x + 56, y = h.y + 100, w = h.w - 82;
    g.fillStyle(0x384858); g.fillRect(x - 2, y - 2, w + 4, 8);
    g.fillStyle(0x506070); g.fillRect(x, y, w, 4);
    g.fillStyle(0x48a8f8); g.fillRect(x, y, Math.round(w * f), 4);
  }

  atualizarStatus(lado) {
    const h = this.hud[lado];
    const l = lado === 'inimigo' ? this.ini : this.jog;
    const st = l.mon.status ? NOMES_STATUS[l.mon.status] : null;
    h.status.setText(st ? st.curto : '');
    h.status.setBackgroundColor(st ? st.cor : 'rgba(0,0,0,0)');
  }
  atualizarNumeros(lado, pv) {
    const h = this.hud[lado];
    const l = lado === 'inimigo' ? this.ini : this.jog;
    if (h.numeros) h.numeros.setText(`${Math.round(pv)}/${pvMax(l.mon)}`);
  }

  animarPV(lado, pvFinal) {
    const h = this.hud[lado];
    const l = lado === 'inimigo' ? this.ini : this.jog;
    const max = pvMax(l.mon);
    const de = h.pvMostrado;
    h.pvMostrado = pvFinal;
    const dur = Math.min(900, 220 + Math.abs(de - pvFinal) * 18);
    return new Promise((resolve) => {
      this.tweens.addCounter({
        from: de, to: pvFinal, duration: dur,
        onUpdate: (tw) => { const v = tw.getValue(); h.barra.definir(v / max); this.atualizarNumeros(lado, v); },
        onComplete: resolve,
      });
    });
  }

  // ═══ Animações ══════════════════════════════════════
  async animarAtaque(lado, tipo, ehStatus) {
    const atk = lado === 'jogador' ? this.spriteJog : this.spriteIni;
    const alvo = lado === 'jogador' ? this.spriteIni : this.spriteJog;
    const cor = parseInt(TIPOS[tipo].cor.slice(1), 16);
    if (ehStatus) {
      for (let i = 0; i < 2; i++) { atk.setTintFill(cor); await esperar(this, 110); atk.clearTint(); await esperar(this, 90); }
      return;
    }
    const dx = lado === 'jogador' ? 34 : -34;
    await new Promise((r) => this.tweens.add({ targets: atk, x: atk.x + dx, duration: 90, yoyo: true, onComplete: r }));
    const cx = alvo.x, cy = alvo.y - alvo.displayHeight / 2;
    for (let i = 0; i < 14; i++) {
      const p = this.add.image(cx, cy, 'particula').setTint(cor).setScale(2 + Math.random() * 2).setDepth(8);
      const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 60;
      this.tweens.add({ targets: p, x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, alpha: 0, duration: 380, onComplete: () => p.destroy() });
    }
    this.cameras.main.shake(140, 0.006);
  }

  async piscar(sprite) {
    for (let i = 0; i < 3; i++) { sprite.setAlpha(0.15); await esperar(this, 70); sprite.setAlpha(1); await esperar(this, 70); }
  }

  async animarDesmaio(lado) {
    const s = lado === 'jogador' ? this.spriteJog : this.spriteIni;
    const y0 = s.y;
    await new Promise((r) => this.tweens.add({ targets: s, y: y0 + 120, alpha: 0, duration: 380, ease: 'Quad.in', onComplete: r }));
    s.setVisible(false).setAlpha(1).setY(y0);
  }

  async animarEstagio(lado, subiu) {
    const s = lado === 'jogador' ? this.spriteJog : this.spriteIni;
    const cor = subiu ? 0xf8a040 : 0x58a8f8;
    for (let i = 0; i < 10; i++) {
      const p = this.add.image(s.x - 60 + Math.random() * 120, s.y - (subiu ? 10 : 150), 'particula').setTint(cor).setScale(2).setDepth(8);
      this.tweens.add({ targets: p, y: p.y + (subiu ? -140 : 140), alpha: 0, duration: 520, delay: i * 30, onComplete: () => p.destroy() });
    }
    await esperar(this, 500);
  }

  async aparecer(lado, mon) {
    const s = lado === 'jogador' ? this.spriteJog : this.spriteIni;
    const p = POS[lado];
    const { chave, flip } = this.texturaDe(mon, lado);
    s.setTexture(chave).setFlipX(flip).setVisible(true).setScale(0).setTintFill(0xffffff);
    s.setPosition(p.x, lado === 'jogador' ? p.y + 6 : p.y);
    await new Promise((r) => this.tweens.add({ targets: s, scale: p.escala, duration: 260, ease: 'Back.out', onComplete: r }));
    s.clearTint();
  }

  async recolher(lado) {
    const s = lado === 'jogador' ? this.spriteJog : this.spriteIni;
    s.setTintFill(0xffffff);
    await new Promise((r) => this.tweens.add({ targets: s, scale: 0, duration: 220, onComplete: r }));
    s.setVisible(false).clearTint();
  }

  falar(t, auto = AUTO) { return this.ui.falar(t, { auto }); }

  // ═══ Fluxo principal ════════════════════════════════
  async rodar() {
    const d = this.dados;
    const primeiro = estado.time.findIndex((m) => m.pv > 0);
    // treinador / jogador entrando
    let tr = null;
    const pj = this.add.sprite(POS.jogador.x - 420, POS.jogador.y + 6, 'pers_jogador', 3).setOrigin(0.5, 1).setScale(7).setDepth(5);
    if (!this.selvagem) {
      tr = this.add.sprite(POS.inimigo.x + 420, POS.inimigo.y, 'pers_' + (d.treinador.sprite || 'rival'), 0).setOrigin(0.5, 1).setScale(6).setDepth(5);
      this.tweens.add({ targets: tr, x: POS.inimigo.x, duration: 700, ease: 'Quad.out' });
    } else {
      const mon = this.inimigos[0];
      const { chave } = this.texturaDe(mon, 'inimigo');
      this.spriteIni.setTexture(chave).setVisible(true).setX(POS.inimigo.x + 420).setTint(0x404050);
      this.tweens.add({ targets: this.spriteIni, x: POS.inimigo.x, duration: 700, ease: 'Quad.out', onComplete: () => this.spriteIni.clearTint() });
    }
    this.tweens.add({ targets: pj, x: POS.jogador.x, duration: 700, ease: 'Quad.out' });
    await this.ui.clarear(250);
    await esperar(this, 650);

    if (this.selvagem) {
      this.ini = novoLutador(this.inimigos[0], 'inimigo');
      this.ini.selvagem = true;
      marcarVisto(this.ini.mon.especie);
      this.criarHud('inimigo');
      await this.falar(`Um ${nomeDe(this.ini.mon)} selvagem apareceu!`);
    } else {
      const nomeTr = d.treinador.nome.replace('{rival}', estado.rival);
      await this.falar(`${nomeTr} quer batalhar!`);
      await new Promise((r) => this.tweens.add({ targets: tr, x: W + 200, duration: 400, onComplete: r }));
      tr.setVisible(false);
      this.trSprite = tr;
      await this.enviarInimigo(0);
    }
    // jogador manda o primeiro
    await new Promise((r) => this.tweens.add({ targets: pj, x: -200, duration: 380, onComplete: r }));
    pj.destroy();
    await this.enviarJogador(primeiro, false);

    for (;;) {
      const acao = await this.escolherAcao();
      if (!acao) continue;
      const acabou = await this.executarTurno(acao);
      if (acabou) break;
    }
    await this.terminar(this.resultado);
  }

  async enviarInimigo(i) {
    this.idxIni = i;
    const mon = this.inimigos[i];
    this.ini = novoLutador(mon, 'inimigo');
    marcarVisto(mon.especie);
    const nomeTr = this.dados.treinador.nome.replace('{rival}', estado.rival);
    await this.falar(`${nomeTr} mandou ${nomeDe(mon)}!`);
    await this.aparecer('inimigo', mon);
    this.criarHud('inimigo');
    this.participantes = new Set(this.jog ? [this.jog.mon.uid] : []);
  }

  async enviarJogador(i, voltando = true) {
    if (voltando && this.jog) {
      await this.falar(`Volte, ${nomeDe(this.jog.mon)}!`);
      await this.recolher('jogador');
    }
    const mon = estado.time[i];
    this.idxJog = i;
    this.jog = novoLutador(mon, 'jogador');
    await this.falar(`Vai, ${nomeDe(mon)}!`);
    await this.aparecer('jogador', mon);
    this.criarHud('jogador');
    this.participantes.add(mon.uid);
  }

  async escolherAcao() {
    const mon = this.jog.mon;
    await this.ui.falar(`O que ${nomeDe(mon)}\nvai fazer?`, { manter: true, semEspera: true, instantaneo: true });
    const r = await this.ui.escolher(['LUTAR', 'BOLSA', 'TIME', 'FUGIR'], {
      colunas: 2, x: 392, y: 356, largura: 320, altura: 118, larguraColuna: 140, cancelavel: false, inicial: this.ultimaAcao || 0,
    });
    this.ultimaAcao = r;
    if (r === 0) {
      const g = await this.escolherGolpe();
      return g ? { tipo: 'golpe', id: g } : null;
    }
    this.ui.fecharTexto();
    if (r === 1) {
      const res = await this.ui.abrirBolsa('batalha');
      if (!res) return null;
      if (ITENS[res.item].tipo === 'captura') {
        if (!this.selvagem) { await this.ui.falar('Não dá para capturar o Encantado de outro Encantador!'); return null; }
        return { tipo: 'captura', item: res.item };
      }
      return { tipo: 'item', item: res.item, alvo: res.alvo };
    }
    if (r === 2) {
      const i = await this.ui.abrirTime('batalha', 'Mandar quem para a luta?');
      if (i < 0) return null;
      if (i === this.idxJog) { await this.ui.falar(`${nomeDe(mon)} já está lutando!`); return null; }
      if (estado.time[i].pv <= 0) { await this.ui.falar(`${nomeDe(estado.time[i])} não tem energia para lutar!`); return null; }
      return { tipo: 'trocar', idx: i };
    }
    if (r === 3) {
      if (!this.selvagem) { await this.ui.falar('Não dá para fugir de uma batalha contra outro Encantador!'); return null; }
      return { tipo: 'fugir' };
    }
    return null;
  }

  async escolherGolpe() {
    this.ui.fecharTexto();
    const golpes = this.jog.mon.golpes;
    if (golpes.every((g) => g.pp <= 0)) {
      await this.ui.falar(`${nomeDe(this.jog.mon)} não tem mais PP! Vai na raça!`);
      return 'investida';
    }
    const info = [];
    const caixaInfo = caixa(this.ui, 520, 356, 192, 118).setDepth(50);
    const ppTxt = this.ui.add.text(616, 372, '', estilo(22)).setOrigin(0.5, 0).setDepth(51);
    let selo = null;
    info.push(caixaInfo, ppTxt);
    const mostrar = (i) => {
      const g = golpes[i]; const d = GOLPES[g.id];
      ppTxt.setText(`PP ${g.pp}/${d.pp}`);
      selo?.destroy();
      selo = seloTipo(this.ui, 616, 438, d.tipo, 16).setDepth(51);
    };
    const opcoes = golpes.map((g) => ({ texto: GOLPES[g.id].nome, desativado: g.pp <= 0 }));
    const r = await this.ui.escolher(opcoes, {
      colunas: 2, x: 8, y: 356, largura: 508, altura: 118, larguraColuna: 236, tamanho: 22,
      aoMudar: mostrar, inicial: this.ultimoGolpe || 0,
    });
    info.forEach((o) => o.destroy()); selo?.destroy();
    if (r < 0) return null;
    this.ultimoGolpe = r;
    return golpes[r].id;
  }

  async tocar(eventos) {
    for (const ev of eventos) {
      if (ev.t === 'msg') await this.falar(ev.texto);
      else if (ev.t === 'anim') await this.animarAtaque(ev.lado, ev.tipo, ev.status);
      else if (ev.t === 'pv') {
        const h = this.hud[ev.lado];
        const desceu = ev.pv < h.pvMostrado;
        if (desceu) await this.piscar(ev.lado === 'jogador' ? this.spriteJog : this.spriteIni);
        await this.animarPV(ev.lado, ev.pv);
      } else if (ev.t === 'status') this.atualizarStatus(ev.lado);
      else if (ev.t === 'estagio') await this.animarEstagio(ev.lado, ev.subiu);
      else if (ev.t === 'desmaio') await this.animarDesmaio(ev.lado);
    }
  }

  async executarTurno(acao) {
    this.ui.fecharTexto();
    const ev = [];
    const golpeIni = escolherGolpeInimigo(this.ini, this.jog, !this.selvagem);
    let inimigoAtaca = true;

    if (acao.tipo === 'fugir') {
      this.fugas++;
      if (tentarFugir(this.jog, this.ini, this.fugas)) {
        await this.falar('Você fugiu sem problemas!');
        this.resultado = 'fuga';
        return true;
      }
      await this.falar('Não deu para fugir!');
    } else if (acao.tipo === 'trocar') {
      await this.enviarJogador(acao.idx);
    } else if (acao.tipo === 'item') {
      usarItem(acao.item);
      const alvo = estado.time[acao.alvo];
      const antes = alvo.pv;
      const msg = aplicarItem(acao.item, alvo);
      await this.falar(`${estado.nome} usou ${ITENS[acao.item].nome}!`);
      if (alvo === this.jog.mon) {
        if (alvo.pv !== antes) await this.animarPV('jogador', alvo.pv);
        this.atualizarStatus('jogador');
      }
      await this.falar(msg);
    } else if (acao.tipo === 'captura') {
      usarItem(acao.item);
      const pegou = await this.capturar(acao.item);
      if (pegou) return true;
    } else if (acao.tipo === 'golpe') {
      inimigoAtaca = false;
      const ordem = jogadorPrimeiro(this.jog, this.ini, acao.id, golpeIni)
        ? [[this.jog, this.ini, acao.id], [this.ini, this.jog, golpeIni]]
        : [[this.ini, this.jog, golpeIni], [this.jog, this.ini, acao.id]];
      for (const [a, b, g] of ordem) {
        if (a.mon.pv <= 0 || b.mon.pv <= 0) continue;
        const evs = [];
        usarGolpe(a, b, g, evs);
        await this.tocar(evs);
      }
    }
    if (inimigoAtaca && this.ini.mon.pv > 0 && this.jog.mon.pv > 0) {
      const evs = [];
      usarGolpe(this.ini, this.jog, golpeIni, evs);
      await this.tocar(evs);
    }
    // fim do turno
    fimDeTurno(this.jog, ev);
    fimDeTurno(this.ini, ev);
    await this.tocar(ev);
    return this.resolverDesmaios();
  }

  async resolverDesmaios() {
    if (this.ini.mon.pv <= 0) {
      await this.darXp();
      const prox = this.inimigos.findIndex((m, i) => i > this.idxIni && m.pv > 0);
      if (prox < 0) {
        if (this.jog.mon.pv <= 0 && !timeVivo()) { /* empate: considera vitória */ }
        await this.vitoria();
        return true;
      }
      if (this.jog.mon.pv > 0) {
        const nomeTr = this.dados.treinador.nome.replace('{rival}', estado.rival);
        await this.falar(`${nomeTr} vai mandar ${nomeDe(this.inimigos[prox])}.`);
      }
      await this.enviarInimigo(prox);
    }
    if (this.jog.mon.pv <= 0) {
      if (!timeVivo()) {
        this.resultado = 'derrota';
        if (!this.selvagem && this.dados.podePerder) await this.falar(`${estado.nome} perdeu a batalha...`);
        return true;
      }
      let i;
      for (;;) {
        i = await this.ui.abrirTime('alvo', 'Escolha o próximo Encantado.');
        if (i >= 0 && estado.time[i].pv > 0) break;
        if (i >= 0) await this.ui.falar('Esse não tem energia para lutar!');
      }
      await this.enviarJogador(i, false);
    }
    return false;
  }

  async darXp() {
    const xp = xpDerrota(this.ini.mon, !this.selvagem);
    for (const uid of this.participantes) {
      const mon = estado.time.find((m) => m.uid === uid);
      if (!mon || mon.pv <= 0) continue;
      const nivelAntes = mon.nivel;
      const evs = ganharXp(mon, xp);
      await this.falar(`${nomeDe(mon)} ganhou ${xp} pontos de experiência!`);
      const ativo = mon === this.jog.mon;
      if (ativo) await this.animarXp(mon, nivelAntes);
      for (const e of evs) {
        if (e.t === 'nivel') {
          if (ativo) { this.criarHud('jogador', false); }
          await this.falar(`${nomeDe(mon)} subiu para o nível ${e.nivel}!`);
        } else if (e.t === 'aprende') await this.ui.aprenderGolpe(mon, e.golpe, false);
        else if (e.t === 'aprenderCheio') await this.ui.aprenderGolpe(mon, e.golpe, true);
        else if (e.t === 'evolui') this.evolucoes.set(mon.uid, e.para);
      }
    }
  }

  async animarXp(mon, nivelAntes) {
    const alvo = this.fracaoXp(mon);
    const passos = mon.nivel - nivelAntes;
    const h = this.hud.jogador;
    const tween = (de, ate) => new Promise((r) => this.tweens.addCounter({ from: de, to: ate, duration: 500, onUpdate: (t) => this.desenharXp(t.getValue()), onComplete: r }));
    let atual = h.fracaoXp ?? 0;
    for (let i = 0; i < passos; i++) { await tween(atual, 1); atual = 0; }
    await tween(atual, alvo);
    h.fracaoXp = alvo;
  }

  async vitoria() {
    if (this.selvagem) { this.resultado = 'vitoria'; return; }
    const d = this.dados.treinador;
    const nomeTr = d.nome.replace('{rival}', estado.rival);
    const tr = this.trSprite;
    tr.setVisible(true).setX(W + 200);
    await new Promise((r) => this.tweens.add({ targets: tr, x: POS.inimigo.x, duration: 500, ease: 'Quad.out', onComplete: r }));
    await this.ui.falar(`${nomeTr}: ${d.derrota}`);
    if (d.recompensa) {
      estado.moedas += d.recompensa;
      await this.ui.falar(`${estado.nome} ganhou ${d.recompensa} moedas!`);
    }
    this.resultado = 'vitoria';
  }

  async capturar(itemId) {
    const it = ITENS[itemId];
    await this.falar(`${estado.nome} jogou um ${it.nome}!`, 500);
    const pat = this.add.image(POS.jogador.x, POS.jogador.y - 120, 'icone_patua').setScale(3).setDepth(9);
    const alvoX = POS.inimigo.x, alvoY = POS.inimigo.y - 90;
    const x0 = pat.x, y0 = pat.y;
    await new Promise((r) => this.tweens.addCounter({
      from: 0, to: 1, duration: 520,
      onUpdate: (t) => {
        const k = t.getValue();
        pat.x = x0 + (alvoX - x0) * k;
        pat.y = y0 + (alvoY - y0) * k - Math.sin(k * Math.PI) * 140;
        pat.angle = k * 540;
      },
      onComplete: r,
    }));
    pat.angle = 0;
    this.spriteIni.setTintFill(0xffffff);
    await new Promise((r) => this.tweens.add({ targets: this.spriteIni, scale: 0, duration: 260, onComplete: r }));
    await new Promise((r) => this.tweens.add({ targets: pat, y: POS.inimigo.y - 24, duration: 300, ease: 'Bounce.out', onComplete: r }));
    const { capturou, balancos } = tentarCaptura(this.ini, it.bonus);
    for (let i = 0; i < balancos; i++) {
      await esperar(this, 380);
      await new Promise((r) => this.tweens.add({ targets: pat, angle: { from: -22, to: 22 }, duration: 140, yoyo: true, onComplete: r }));
      pat.angle = 0;
    }
    await esperar(this, 420);
    if (capturou) {
      for (let i = 0; i < 6; i++) {
        const b = this.add.image(pat.x, pat.y, 'brilho').setScale(2).setDepth(10);
        this.tweens.add({ targets: b, x: pat.x + (i - 2.5) * 24, y: pat.y - 50 - Math.random() * 30, alpha: 0, duration: 700, onComplete: () => b.destroy() });
      }
      const mon = this.ini.mon;
      await this.ui.falar(`Pegou! ${nomeDe(mon)} foi capturado!`);
      const novo = !estado.capturados[mon.especie];
      const onde = adicionarCriatura(mon);
      if (novo && estado.flags.temCaderno) await this.ui.falar(`Os dados de ${nomeDe(mon)} foram anotados no Caderno de Campo.`);
      if (onde === 'caixa') await this.ui.falar(`O time está cheio. ${nomeDe(mon)} foi enviado para a Caixa da Professora Jaci.`);
      this.resultado = 'captura';
      return true;
    }
    pat.destroy();
    this.spriteIni.setScale(POS.inimigo.escala);
    this.spriteIni.clearTint();
    this.cameras.main.flash(150, 255, 255, 255);
    const frases = ['Ah, não! Ele escapou!', 'Quase! Parecia que ia pegar!', 'Ahh! Faltou muito pouco!'];
    await this.falar(frases[Math.min(balancos, 2)]);
    return false;
  }

  async terminar(resultado) {
    this.ui.fecharTexto();
    await this.ui.escurecer(300);
    const evolucoes = [...this.evolucoes].map(([uid, para]) => ({ uid, para }));
    this.dados.aoTerminar({ resultado, evolucoes });
  }
}
