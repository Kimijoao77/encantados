// Cena do mapa: andar, falar com pessoas, portas, mato alto, treinadores.
import { Entrada } from '../motor/entrada.js';
import {
  estado, flag, marcarFlag, salvar, darItem, darCriatura, curarTime, marcarVisto, timeVivo,
} from '../motor/estado.js';
import { criarCriatura, nomeDe, evoluir as evoluirMon } from '../motor/criatura.js';
import { MAPAS, LEGENDA } from '../dados/mapas.js';
import { EVENTOS } from '../dados/eventos.js';
import { ITENS } from '../dados/itens.js';
import { esperar } from './Interface.js';

const T = 16;
const DIRS = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] };
const QUADRO = { baixo: 0, cima: 3, esq: 6, dir: 9 };
const OPOSTO = { cima: 'baixo', baixo: 'cima', esq: 'dir', dir: 'esq' };

class Personagem {
  constructor(scene, textura, tx, ty, dir) {
    this.scene = scene; this.textura = textura;
    this.tx = tx; this.ty = ty; this.dir = dir; this.passo = 0;
    this.sombra = scene.add.image(0, 0, 'sombra');
    this.sprite = scene.add.sprite(0, 0, textura, QUADRO[dir]);
    this.posicionar();
  }
  posicionar() {
    this.sprite.setPosition(this.tx * T + 8, this.ty * T + 6);
    this.sombra.setPosition(this.tx * T + 8, this.ty * T + 14);
    this.profundidade();
  }
  profundidade() {
    this.sprite.setDepth(10 + this.sprite.y / 1000);
    this.sombra.setDepth(9);
  }
  virar(dir) { this.dir = dir; this.sprite.setFrame(QUADRO[dir]); }
  andar(dir, duracao) {
    this.virar(dir);
    const [dx, dy] = DIRS[dir];
    this.tx += dx; this.ty += dy;
    this.passo++;
    const pe = QUADRO[dir] + (this.passo % 2 ? 1 : 2);
    this.sprite.setFrame(pe);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite, x: this.tx * T + 8, y: this.ty * T + 6, duration: duracao,
        onUpdate: () => { this.sombra.setPosition(this.sprite.x, this.sprite.y + 8); this.profundidade(); },
        onComplete: () => { this.sprite.setFrame(QUADRO[dir]); this.posicionar(); resolve(); },
      });
    });
  }
  destruir() { this.sprite.destroy(); this.sombra.destroy(); }
}

export default class Mundo extends Phaser.Scene {
  constructor() { super('Mundo'); }

  create() {
    this.ui = this.scene.get('Interface');
    this.scene.bringToTop('Interface');
    this.cameras.main.setZoom(3).setBackgroundColor('#101418');
    this.objetosMapa = [];
    this.npcs = [];
    this.travado = false;
    this.movendo = false;
    this.esperaVirar = 0;
    this.continuando = false;
    this.quadroAgua = 0;
    this.time.addEvent({ delay: 600, loop: true, callback: () => this.animarAgua() });
    this.carregarMapa(estado.mapa, estado.x, estado.y, estado.dir);
    this.ui.clarear(350);
    window.__mundo = this;
  }

  // ═══ Mapa ═══════════════════════════════════════════
  tileEm(x, y) {
    const ch = this.mapa.tiles[y]?.[x];
    return ch === undefined ? null : LEGENDA[ch];
  }

  carregarMapa(id, x, y, dir) {
    this.objetosMapa.forEach((o) => o.destroy());
    this.objetosMapa = [];
    this.npcs.forEach((n) => n.destruir?.());
    this.npcs = [];
    this.jogador?.destruir();
    this.aguas = [];

    const m = MAPAS[id];
    this.mapa = m; this.mapaId = id;
    estado.mapa = id; estado.x = x; estado.y = y; estado.dir = dir;
    const w = m.tiles[0].length, h = m.tiles.length;
    this.larg = w; this.alt = h;

    const rt = this.add.renderTexture(0, 0, w * T, h * T).setOrigin(0, 0).setDepth(0);
    this.objetosMapa.push(rt);
    for (let ty = 0; ty < h; ty++) {
      for (let tx = 0; tx < w; tx++) {
        const info = LEGENDA[m.tiles[ty][tx]];
        let chave = 'tile_' + info.tile;
        if (info.tile === 'grama' && (tx * 7 + ty * 13) % 5 === 0) chave = 'tile_grama2';
        if (info.agua) {
          const img = this.add.image(tx * T, ty * T, 'tile_agua').setOrigin(0).setDepth(1);
          this.aguas.push(img); this.objetosMapa.push(img);
          continue;
        }
        rt.drawFrame(chave, undefined, tx * T, ty * T);
      }
    }

    // decoração (ex.: patuás na mesa)
    this.decoracao = [];
    for (const d of m.decoracao || []) {
      const img = this.add.image(d.x * T + 8, d.y * T + 6, d.textura).setDepth(5);
      img.def = d;
      this.decoracao.push(img); this.objetosMapa.push(img);
    }
    this.atualizarDecoracao();

    // pessoas e itens
    for (const def of m.npcs || []) {
      if (def.some && flag(def.some)) continue;
      if (def.item) {
        if (flag(this.chaveItem(def))) continue;
        const img = this.add.image(def.x * T + 8, def.y * T + 8, 'icone_patua').setDepth(8);
        this.objetosMapa.push(img);
        this.npcs.push({ def, tx: def.x, ty: def.y, item: true, destruir: () => img.destroy(), img });
        continue;
      }
      const p = new Personagem(this, 'pers_' + def.sprite, def.x, def.y, def.dir || 'baixo');
      p.def = def; p.id = def.id; p.casa = [def.x, def.y];
      p.proximaAndada = this.time.now + 1500 + Math.random() * 3000;
      this.npcs.push(p);
    }

    this.jogador = new Personagem(this, 'pers_jogador', x, y, dir);
    this.matoTopo = this.add.image(0, 0, 'tile_mato_topo').setOrigin(0).setVisible(false);
    this.objetosMapa.push(this.matoTopo);
    this.atualizarMato();

    const cam = this.cameras.main;
    cam.stopFollow();
    if (w * T > cam.width / cam.zoom || h * T > cam.height / cam.zoom) {
      cam.setBounds(0, 0, w * T, h * T);
      cam.startFollow(this.jogador.sprite, true);
    } else {
      cam.removeBounds();
      cam.centerOn((w * T) / 2, (h * T) / 2);
    }
    if (!m.interior) this.ui.mostrarNomeMapa?.(m.nome);
  }

  atualizarDecoracao() {
    for (const img of this.decoracao || []) img.setVisible(!(img.def.some && flag(img.def.some)));
  }

  chaveItem(def) { return `item_${this.mapaId}_${def.id}`; }

  animarAgua() {
    this.quadroAgua ^= 1;
    for (const a of this.aguas || []) a.setTexture(this.quadroAgua ? 'tile_agua2' : 'tile_agua');
  }

  atualizarMato() {
    const t = this.tileEm(this.jogador.tx, this.jogador.ty);
    const noMato = !!t?.mato;
    this.matoTopo.setVisible(noMato);
    if (noMato) this.matoTopo.setPosition(this.jogador.tx * T, this.jogador.ty * T).setDepth(this.jogador.sprite.depth + 0.0001);
    this.jogador.sombra.setVisible(!noMato);
  }

  npcEm(x, y) { return this.npcs.find((n) => n.tx === x && n.ty === y); }

  livre(x, y, ignorar) {
    const t = this.tileEm(x, y);
    if (!t || t.solido) return false;
    const n = this.npcEm(x, y);
    if (n && n !== ignorar) return false;
    if (this.jogador && this.jogador !== ignorar && this.jogador.tx === x && this.jogador.ty === y) return false;
    return true;
  }

  // ═══ Loop ═══════════════════════════════════════════
  update(t, dt) {
    this.andarNpcs(t);
    if (this.travado || this.movendo || this.ui.ocupado) { this.continuando = false; return; }
    if (Entrada.apertou('menu')) { Entrada.consumir('menu'); this.abrirMenu(); return; }
    if (Entrada.apertou('a')) { Entrada.consumir('a'); this.interagir(); return; }
    const d = Entrada.direcaoSegurada();
    if (!d) { this.continuando = false; this.esperaVirar = 0; return; }
    if (d !== this.jogador.dir && !this.continuando) {
      this.jogador.virar(d);
      this.esperaVirar = 90;
      return;
    }
    if (this.esperaVirar > 0) { this.esperaVirar -= dt; return; }
    this.tentarAndar(d);
  }

  andarNpcs(t) {
    if (this.travado || this.ui.ocupado) return;
    for (const n of this.npcs) {
      if (!n.def?.anda || n.andando || t < n.proximaAndada) continue;
      n.proximaAndada = t + 1800 + Math.random() * 3500;
      const dirs = Object.keys(DIRS);
      const d = dirs[Math.floor(Math.random() * 4)];
      const [dx, dy] = DIRS[d];
      const nx = n.tx + dx, ny = n.ty + dy;
      const longe = Math.abs(nx - n.casa[0]) > 2 || Math.abs(ny - n.casa[1]) > 2;
      if (Math.random() < 0.4 || longe || !this.livre(nx, ny, n) || this.tileEm(nx, ny)?.mato) { n.virar(d); continue; }
      n.andando = true;
      n.andar(d, 260).then(() => { n.andando = false; });
    }
  }

  async tentarAndar(d) {
    const p = this.jogador;
    const [dx, dy] = DIRS[d];
    const nx = p.tx + dx, ny = p.ty + dy;
    p.virar(d);
    if (nx < 0 || ny < 0 || nx >= this.larg || ny >= this.alt) {
      const lado = { cima: 'norte', baixo: 'sul', esq: 'oeste', dir: 'leste' }[d];
      const s = this.mapa.saidas?.[lado];
      if (s) return this.atravessarBorda(s, lado, nx, ny);
      return;
    }
    if (!this.livre(nx, ny)) { this.continuando = false; return; }
    this.movendo = true;
    const rapido = Entrada.segurando('b');
    this.matoTopo.setVisible(false);
    p.sombra.setVisible(true);
    await p.andar(d, rapido ? 95 : 165);
    this.movendo = false;
    this.continuando = true;
    estado.x = p.tx; estado.y = p.ty; estado.dir = p.dir;
    await this.aoPisar(p.tx, p.ty);
  }

  async aoPisar(x, y) {
    this.atualizarMato();
    const porta = this.mapa.portas?.[`${x},${y}`];
    if (porta) { this.continuando = false; return this.trocarMapa(porta.para, porta.x, porta.y, porta.dir); }

    const gat = (this.mapa.gatilhos || []).find((g) => g.x === x && g.y === y);
    if (gat) { this.continuando = false; await this.rodarScript(gat.script); }

    const treinador = this.treinadorQueVe();
    if (treinador) { this.continuando = false; return this.desafio(treinador, true); }

    const t = this.tileEm(x, y);
    const enc = this.mapa.encontros;
    if (t?.mato && enc && estado.time.length && Math.random() < enc.chance) {
      this.continuando = false;
      return this.encontroSelvagem();
    }
  }

  async atravessarBorda(s, lado, nx, ny) {
    const destino = MAPAS[s.para];
    let x = nx + (s.dx || 0), y = ny + (s.dy || 0);
    if (lado === 'norte') y = destino.tiles.length - 1;
    if (lado === 'sul') y = 0;
    if (lado === 'oeste') x = destino.tiles[0].length - 1;
    if (lado === 'leste') x = 0;
    await this.trocarMapa(s.para, x, y, this.jogador.dir, 150);
  }

  async trocarMapa(id, x, y, dir, ms = 200) {
    this.travado = true;
    await this.ui.escurecer(ms);
    this.carregarMapa(id, x, y, dir);
    salvar();
    await this.ui.clarear(ms);
    this.travado = false;
  }

  // ═══ Interação ══════════════════════════════════════
  async interagir() {
    const p = this.jogador;
    const [dx, dy] = DIRS[p.dir];
    let fx = p.tx + dx, fy = p.ty + dy;
    if (this.tileEm(fx, fy)?.balcao) { fx += dx; fy += dy; }
    const npc = this.npcEm(fx, fy);
    if (npc) return this.falarCom(npc);
    const chave = `${p.tx + dx},${p.ty + dy}`;
    const placa = this.mapa.placas?.[chave];
    if (placa) { this.travado = true; await this.ui.falar(placa); this.travado = false; return; }
    const inter = this.mapa.interacoes?.[chave];
    if (inter) { const [nome, arg] = inter.split(':'); return this.rodarScript(nome, arg); }
    if (this.tileEm(p.tx + dx, p.ty + dy)?.agua) { this.travado = true; await this.ui.falar('A água é bem clarinha. Dá para ver uns peixinhos nadando.'); this.travado = false; }
  }

  async falarCom(npc) {
    if (npc.item) return this.pegarItem(npc);
    const def = npc.def;
    npc.virar(OPOSTO[this.jogador.dir]);
    if (def.treinador) return this.desafio(npc, false);
    if (def.script) return this.rodarScript(def.script);
    if (def.falas) { this.travado = true; await this.ui.falar(def.falas); this.travado = false; }
  }

  async pegarItem(n) {
    this.travado = true;
    const { id, qtd } = n.def.item;
    darItem(id, qtd);
    marcarFlag(this.chaveItem(n.def));
    n.destruir();
    this.npcs.splice(this.npcs.indexOf(n), 1);
    await this.ui.falar(`${estado.nome} encontrou ${qtd > 1 ? qtd + ' ' : ''}${ITENS[id].nome}${qtd > 1 ? 's' : ''}!`);
    this.travado = false;
  }

  async abrirMenu() {
    this.travado = true;
    await this.ui.menuPrincipal();
    this.travado = false;
  }

  async rodarScript(nome, arg) {
    const fn = EVENTOS[nome];
    if (!fn) { console.warn('Script não existe:', nome); return; }
    this.travado = true;
    try { await fn(this.criarContexto(), arg); } catch (e) { console.error(e); }
    this.travado = false;
  }

  // ═══ Treinadores ════════════════════════════════════
  treinadorQueVe() {
    const p = this.jogador;
    for (const n of this.npcs) {
      const tr = n.def?.treinador;
      if (!tr || !n.def.visao || flag('treinador_' + n.id)) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let k = 1; k <= n.def.visao; k++) {
        const x = n.tx + dx * k, y = n.ty + dy * k;
        if (x === p.tx && y === p.ty) return n;
        const t = this.tileEm(x, y);
        if (!t || t.solido || this.npcEm(x, y)) break;
      }
    }
    return null;
  }

  async desafio(npc, viu) {
    const tr = npc.def.treinador;
    this.travado = true;
    if (flag('treinador_' + npc.id)) {
      await this.ui.falar(tr.depois || tr.derrota);
      this.travado = false;
      return;
    }
    if (!estado.time.length || !timeVivo()) {
      await this.ui.falar('Você não tem Encantados em condições de lutar!');
      this.travado = false;
      return;
    }
    if (viu) {
      await this.exclamar(npc);
      // anda até ficar do lado do jogador
      for (let i = 0; i < 10; i++) {
        const dist = Math.abs(npc.tx - this.jogador.tx) + Math.abs(npc.ty - this.jogador.ty);
        if (dist <= 1) break;
        await npc.andar(npc.dir, 180);
      }
      this.jogador.virar(OPOSTO[npc.dir]);
    }
    await this.ui.falar(tr.antes);
    const res = await this.batalhaTreinador(tr, npc);
    if (res === 'vitoria') marcarFlag('treinador_' + npc.id);
    this.travado = false;
  }

  /** Batalha contra treinador. def: { nome, sprite, time: [[especie, nivel]], recompensa, derrota, podePerder } */
  async batalhaTreinador(def) {
    const inimigos = def.time.map(([e, n]) => criarCriatura(e, n));
    return this.batalhar({ tipo: 'treinador', inimigos, treinador: def, podePerder: def.podePerder });
  }

  async encontroSelvagem() {
    const lista = this.mapa.encontros.lista;
    const total = lista.reduce((s, l) => s + l[3], 0);
    let r = Math.random() * total;
    let escolha = lista[0];
    for (const l of lista) { r -= l[3]; if (r <= 0) { escolha = l; break; } }
    const [esp, min, max] = escolha;
    const nivel = min + Math.floor(Math.random() * (max - min + 1));
    const mon = criarCriatura(esp, nivel);
    marcarVisto(esp);
    this.travado = true;
    await this.batalhar({ tipo: 'selvagem', inimigos: [mon] });
    this.travado = false;
  }

  batalhar(config) {
    return new Promise((resolve) => {
      this.travado = true;
      const cam = this.cameras.main;
      cam.flash(120, 255, 255, 255);
      this.time.delayedCall(140, () => cam.flash(120, 255, 255, 255));
      this.time.delayedCall(300, async () => {
        await this.ui.escurecer(220);
        this.scene.launch('Batalha', {
          ...config,
          aoTerminar: async (saida) => {
            this.scene.stop('Batalha');
            this.scene.resume();
            this.scene.bringToTop('Interface');
            const res = await this.depoisDaBatalha(saida, config);
            resolve(res);
          },
        });
        this.scene.bringToTop('Interface');
        this.scene.pause();
      });
    });
  }

  async depoisDaBatalha(saida, config) {
    if (saida.resultado === 'derrota' && !config.podePerder) {
      await this.ui.falar([`${estado.nome} não tem mais Encantados em condições de lutar!`, `${estado.nome} correu de volta para descansar...`]);
      const perdeu = Math.floor(estado.moedas / 2);
      estado.moedas -= perdeu;
      curarTime();
      const c = estado.ultimaCura;
      this.carregarMapa(c.mapa, c.x, c.y, c.dir);
      salvar();
      await this.ui.clarear(400);
      if (perdeu) await this.ui.falar(`Na correria, ${estado.nome} deixou cair ${perdeu} moedas...`);
      return saida.resultado;
    }
    await this.ui.clarear(300);
    for (const ev of saida.evolucoes || []) {
      const mon = estado.time.find((m) => m.uid === ev.uid);
      if (!mon) continue;
      await this.ui.evoluir(mon.especie, ev.para, nomeDe(mon));
      const novos = evoluirMon(mon, ev.para);
      for (const n of novos) await this.ui.aprenderGolpe(mon, n.golpe, n.t === 'aprenderCheio');
    }
    salvar();
    return saida.resultado;
  }

  // ═══ Ações usadas nos roteiros ══════════════════════
  async exclamar(alvo) {
    const p = alvo === 'jogador' ? this.jogador : alvo;
    const img = this.add.image(p.sprite.x, p.sprite.y - 14, 'exclamacao').setDepth(1000).setScale(0.8);
    this.tweens.add({ targets: img, y: img.y - 3, duration: 120, yoyo: true });
    await esperar(this, 650);
    img.destroy();
  }

  async moverJogador(dir, n) {
    for (let i = 0; i < n; i++) await this.jogador.andar(dir, 170);
    estado.x = this.jogador.tx; estado.y = this.jogador.ty; estado.dir = this.jogador.dir;
    this.atualizarMato();
  }

  criarContexto() {
    const ui = this.ui;
    const m = this;
    return {
      ui,
      falar: (t, o) => ui.falar(t, o),
      perguntar: (t, o) => ui.perguntar(t, o),
      flag,
      marcar: (k, v = true) => marcarFlag(k, v),
      mostrarCriatura: (e) => ui.mostrarCriatura(e),
      darCriatura: (e, n) => darCriatura(e, n),
      darItem,
      curarTime,
      async curarComEfeito() { await ui.escurecer(300); curarTime(); await esperar(m, 400); await ui.clarear(300); },
      definirCura(mapa, x, y, dir) { estado.ultimaCura = { mapa, x, y, dir }; },
      npc: (id) => m.npcs.find((n) => n.id === id),
      async moverNpc(id, dir, n) { const p = m.npcs.find((x) => x.id === id); for (let i = 0; i < n; i++) await p.andar(dir, 200); },
      virarNpc(id, dir) { m.npcs.find((n) => n.id === id)?.virar(dir); },
      esconderNpc(id) { const i = m.npcs.findIndex((n) => n.id === id); if (i >= 0) { m.npcs[i].destruir(); m.npcs.splice(i, 1); } },
      moverJogador: (d, n) => m.moverJogador(d, n),
      exclamar: (alvo) => m.exclamar(alvo === 'jogador' ? 'jogador' : m.npcs.find((n) => n.id === alvo) || 'jogador'),
      direcaoPara(id) {
        const n = m.npcs.find((x) => x.id === id);
        const dx = m.jogador.tx - n.tx, dy = m.jogador.ty - n.ty;
        return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy > 0 ? 'baixo' : 'cima');
      },
      batalhaTreinador: (def) => m.batalhaTreinador({ ...def, nome: def.nome.replace('{rival}', estado.rival) }),
      atualizarDecoracao: () => m.atualizarDecoracao(),
      temTime: () => estado.time.length > 0,
      qtdCapturados: () => Object.keys(estado.capturados).length,
      salvar,
      loja: () => ui.loja(),
    };
  }
}
