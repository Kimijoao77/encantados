// Camada de interface que fica sempre por cima: caixa de texto, menus e telas (time, bolsa, caderno, loja).
// Tudo é baseado em Promises: `await ui.falar('Oi!')`, `const i = await ui.escolher(['Sim', 'Não'])`.
import { Entrada } from '../motor/entrada.js';
import { estado, usarItem, darItem, salvar } from '../motor/estado.js';
import { CRIATURAS, LISTA_CRIATURAS } from '../dados/criaturas.js';
import { GOLPES } from '../dados/golpes.js';
import { ITENS } from '../dados/itens.js';
import { TIPOS } from '../dados/tipos.js';
import { calcularStats, nomeDe, pvMax, xpParaNivel } from '../motor/criatura.js';
import { NOMES_STATUS } from '../motor/batalha.js';
import { motivoNaoUsar, aplicarItem } from '../motor/usoItens.js';
import { caixa, estilo, barraPV, seloTipo, criatura } from '../ui/desenho.js';

const W = 720, H = 480;
const CAIXA = { x: 8, y: 356, w: 704, h: 118 };

function substituir(t) {
  return String(t)
    .replaceAll('{nome}', estado.nome || '')
    .replaceAll('{rival}', estado.rival || 'Caio');
}

// ─────────────────────────────────────────────────────────
class Widget {
  constructor(ui) { this.ui = ui; this.primeiro = true; this.objetos = []; }
  add(o) { this.objetos.push(o); return o; }
  passo(dt) {
    if (this.primeiro) { this.primeiro = false; return; } // ignora o frame em que foi criado
    this.atualizar(dt);
  }
  atualizar() {}
  destruir() { this.objetos.forEach((o) => o.destroy()); this.objetos = []; }
}

// ── Leitor de texto (usa a caixa fixa da Interface) ─────────
class Leitor extends Widget {
  constructor(ui, paginas, opts, resolver) {
    super(ui);
    this.paginas = paginas; this.opts = opts; this.resolver = resolver;
    this.pag = 0; this.chars = 0; this.espera = 0;
    ui.mostrarCaixaTexto();
    this.mostrar();
  }
  mostrar() {
    this.chars = this.opts.instantaneo ? this.paginas[this.pag].length : 0;
    this.espera = 0;
    this.ui.textoCaixa.setText(this.paginas[this.pag].slice(0, this.chars));
    this.ui.setaCaixa.setVisible(false);
  }
  get completo() { return this.chars >= this.paginas[this.pag].length; }
  atualizar(dt) {
    const pagina = this.paginas[this.pag];
    const a = Entrada.apertou('a') || Entrada.apertou('b');
    if (a) { Entrada.consumir('a'); Entrada.consumir('b'); }
    if (!this.completo) {
      if (a) this.chars = pagina.length;
      else this.chars = Math.min(pagina.length, this.chars + dt * 0.055 * (Entrada.segurando('a') || Entrada.segurando('b') ? 3 : 1));
      this.ui.textoCaixa.setText(pagina.slice(0, Math.floor(this.chars)));
      return;
    }
    const ultima = this.pag === this.paginas.length - 1;
    if (ultima && this.opts.semEspera) return this.fim();
    this.ui.setaCaixa.setVisible(true);
    this.espera += dt;
    if (a || (this.opts.auto && this.espera > this.opts.auto)) {
      if (ultima) this.fim();
      else { this.pag++; this.mostrar(); }
    }
  }
  fim() {
    this.ui.setaCaixa.setVisible(false);
    this.ui.desempilhar(this);
    if (!this.opts.manter) this.ui.esconderCaixaDepois();
    this.resolver();
  }
}

// ── Menu de escolha ─────────────────────────────────────────
class Menu extends Widget {
  constructor(ui, opcoes, opts, resolver) {
    super(ui);
    this.opcoes = opcoes.map((o) => (typeof o === 'string' ? { texto: o } : o));
    this.opts = opts; this.resolver = resolver;
    this.cols = opts.colunas || 1;
    this.i = Math.min(opts.inicial || 0, this.opcoes.length - 1);
    const tam = opts.tamanho || 24;
    const s = ui;
    const medidas = this.opcoes.map((o) => { const t = s.add.text(0, 0, o.texto, estilo(tam)); const w = t.width; t.destroy(); return w; });
    const largCol = opts.larguraColuna || Math.max(...medidas) + 44;
    const linhas = Math.ceil(this.opcoes.length / this.cols);
    const altLinha = tam + 14;
    const w = opts.largura || largCol * this.cols + 36;
    const h = opts.altura || linhas * altLinha + 30 + (opts.titulo ? altLinha : 0);
    const x = opts.x ?? W - w - 8;
    const y = opts.y ?? CAIXA.y - h - 4;
    this.add(caixa(s, x, y, w, h).setDepth(50));
    let y0 = y + 18;
    if (opts.titulo) { this.add(s.add.text(x + 22, y0, opts.titulo, estilo(tam - 2, '#5a6a7a')).setDepth(51)); y0 += altLinha; }
    this.textos = this.opcoes.map((o, k) => {
      const col = k % this.cols, lin = Math.floor(k / this.cols);
      const t = s.add.text(x + 40 + col * largCol, y0 + lin * altLinha, o.texto, estilo(tam, o.desativado ? '#a0a8b0' : (o.cor || '#303840'))).setDepth(51);
      return this.add(t);
    });
    this.cursor = this.add(s.add.text(0, 0, '▶', estilo(tam, '#303840')).setDepth(51));
    this.posicionar();
  }
  posicionar() {
    const t = this.textos[this.i];
    this.cursor.setPosition(t.x - 26, t.y);
    this.opts.aoMudar?.(this.i);
  }
  atualizar() {
    const n = this.opcoes.length;
    let novo = this.i;
    if (this.cols === 1) {
      if (Entrada.apertou('cima')) novo = (this.i - 1 + n) % n;
      if (Entrada.apertou('baixo')) novo = (this.i + 1) % n;
    } else {
      if (Entrada.apertou('esq') && this.i % this.cols > 0) novo = this.i - 1;
      if (Entrada.apertou('dir') && this.i % this.cols < this.cols - 1 && this.i + 1 < n) novo = this.i + 1;
      if (Entrada.apertou('cima') && this.i - this.cols >= 0) novo = this.i - this.cols;
      if (Entrada.apertou('baixo') && this.i + this.cols < n) novo = this.i + this.cols;
    }
    if (novo !== this.i) { this.i = novo; this.posicionar(); }
    if (Entrada.apertou('a')) {
      Entrada.consumir('a');
      if (this.opcoes[this.i].desativado) return;
      this.terminar(this.i);
    } else if (Entrada.apertou('b') && this.opts.cancelavel !== false) {
      Entrada.consumir('b');
      this.terminar(-1);
    }
  }
  terminar(v) { this.ui.desempilhar(this); this.destruir(); this.resolver(v); }
}

// ── Tela do time ────────────────────────────────────────────
class TelaTime extends Widget {
  constructor(ui, modo, titulo, resolver) {
    super(ui);
    this.modo = modo; this.resolver = resolver; this.titulo = titulo;
    this.i = 0; this.trocando = -1; this.ocupadoInterno = false;
    this.desenhar();
  }
  desenhar() {
    this.destruir();
    const s = this.ui;
    this.add(s.add.rectangle(W / 2, H / 2, W, H, 0x3a6a8a).setDepth(40));
    // faixas decorativas
    const g = this.add(s.add.graphics().setDepth(40));
    g.fillStyle(0x4a7a9a); for (let y = 0; y < H; y += 24) g.fillRect(0, y, W, 12);
    const time = estado.time;
    this.slots = [];
    for (let k = 0; k < 6; k++) {
      const col = k % 2, lin = Math.floor(k / 2);
      const x = 16 + col * 348, y = 14 + lin * 104;
      const mon = time[k];
      const sel = k === this.i, troca = k === this.trocando;
      const fundo = !mon ? 0x5a7a8a : mon.pv <= 0 ? 0xd8a0a0 : troca ? 0xf8e080 : sel ? 0xb8e0f8 : 0xf8f8f0;
      this.add(caixa(s, x, y, 340, 96, { fundo, filete: null, borda: sel ? 0xf05050 : 0x384858 }).setDepth(41));
      if (!mon) continue;
      this.add(criatura(s, x + 46, y + 48, mon.especie, 1.1).setDepth(42));
      this.add(s.add.text(x + 92, y + 12, nomeDe(mon), estilo(22)).setDepth(42));
      this.add(s.add.text(x + 250, y + 12, 'Nv' + mon.nivel, estilo(20)).setDepth(42));
      const b = barraPV(s, x + 92, y + 50, 200, 10); b.g.setDepth(42); this.add(b.g); b.definir(mon.pv / pvMax(mon));
      this.add(s.add.text(x + 92, y + 64, `PV ${mon.pv}/${pvMax(mon)}`, estilo(17)).setDepth(42));
      if (mon.status) {
        const st = NOMES_STATUS[mon.status];
        this.add(s.add.text(x + 250, y + 64, st.curto, estilo(16, '#ffffff', { backgroundColor: st.cor, padding: { x: 4, y: 1 } })).setDepth(42));
      }
      if (mon.pv <= 0) this.add(s.add.text(x + 236, y + 64, 'DESMAIADO', estilo(14, '#a02020')).setDepth(42));
    }
    const selVoltar = this.i === 6;
    this.add(caixa(s, 16, 330, 450, 64, { filete: null }).setDepth(41));
    const msg = this.trocando >= 0 ? 'Trocar com qual?' : (this.titulo || 'Escolha um Encantado.');
    this.add(s.add.text(36, 348, msg, estilo(22)).setDepth(42));
    this.add(caixa(s, 480, 330, 224, 64, { fundo: selVoltar ? 0xb8e0f8 : 0xf8f8f0, filete: null, borda: selVoltar ? 0xf05050 : 0x384858 }).setDepth(41));
    this.add(s.add.text(592, 362, 'VOLTAR', estilo(22)).setOrigin(0.5).setDepth(42));
  }
  atualizar() {
    if (this.ocupadoInterno) return;
    const n = estado.time.length;
    let i = this.i;
    if (Entrada.apertou('dir') && i < 6 && i % 2 === 0 && i + 1 < n) i++;
    if (Entrada.apertou('esq') && i < 6 && i % 2 === 1) i--;
    if (Entrada.apertou('baixo')) i = i === 6 ? 6 : (i + 2 < n ? i + 2 : 6);
    if (Entrada.apertou('cima')) i = i === 6 ? Math.max(0, n - 1) : (i - 2 >= 0 ? i - 2 : i);
    if (i !== this.i) { this.i = i; this.desenhar(); }
    if (Entrada.apertou('b')) {
      Entrada.consumir('b');
      if (this.trocando >= 0) { this.trocando = -1; this.desenhar(); return; }
      return this.fim(-1);
    }
    if (Entrada.apertou('a')) {
      Entrada.consumir('a');
      if (this.i === 6) return this.fim(-1);
      this.selecionar();
    }
  }
  async selecionar() {
    const i = this.i;
    if (this.trocando >= 0) {
      const t = estado.time;
      [t[this.trocando], t[i]] = [t[i], t[this.trocando]];
      this.trocando = -1; this.desenhar();
      return;
    }
    if (this.modo === 'alvo') return this.fim(i);
    this.ocupadoInterno = true;
    const opcoes = this.modo === 'batalha' ? ['Lutar', 'Ficha', 'Voltar'] : ['Ficha', 'Mudar ordem', 'Voltar'];
    const r = await this.ui.escolher(opcoes, { x: 480, y: 214, largura: 224 });
    this.ocupadoInterno = false;
    const escolha = opcoes[r];
    if (escolha === 'Lutar') return this.fim(i);
    if (escolha === 'Ficha') { await this.ui.abrirFicha(estado.time[i]); }
    if (escolha === 'Mudar ordem') { this.trocando = i; }
    this.desenhar();
  }
  fim(v) { this.ui.desempilhar(this); this.destruir(); this.resolver(v); }
}

// ── Ficha de um Encantado ───────────────────────────────────
class TelaFicha extends Widget {
  constructor(ui, mon, resolver) {
    super(ui);
    this.resolver = resolver;
    const s = ui;
    const e = CRIATURAS[mon.especie];
    const st = calcularStats(mon);
    this.add(s.add.rectangle(W / 2, H / 2, W, H, 0x2a3a4a).setDepth(60));
    this.add(caixa(s, 12, 12, 300, 300, { fundo: 0xe0f0f8 }).setDepth(61));
    this.add(criatura(s, 162, 150, mon.especie, 3.4).setDepth(62));
    this.add(s.add.text(30, 26, `Nº${String(e.num).padStart(3, '0')}`, estilo(18, '#5a6a7a')).setDepth(62));
    this.add(caixa(s, 12, 318, 300, 154).setDepth(61));
    this.add(s.add.text(30, 334, nomeDe(mon), estilo(28)).setDepth(62));
    this.add(s.add.text(220, 340, 'Nv' + mon.nivel, estilo(22)).setDepth(62));
    e.tipos.forEach((t, k) => this.add(seloTipo(s, 76 + k * 112, 392, t, 15).setDepth(62)));
    const prox = xpParaNivel(mon.nivel + 1) - mon.xp;
    this.add(s.add.text(30, 418, mon.nivel >= 100 ? 'Nível máximo!' : `Falta ${prox} XP p/ subir`, estilo(18)).setDepth(62));

    this.add(caixa(s, 322, 12, 386, 178).setDepth(61));
    const linhas = [['PV', `${mon.pv}/${st.pv}`], ['Ataque', st.atq], ['Defesa', st.def], ['Velocidade', st.vel]];
    linhas.forEach(([k, v], n) => {
      this.add(s.add.text(344, 30 + n * 36, k, estilo(22)).setDepth(62));
      this.add(s.add.text(684, 30 + n * 36, String(v), estilo(22)).setOrigin(1, 0).setDepth(62));
    });
    this.add(caixa(s, 322, 196, 386, 202).setDepth(61));
    mon.golpes.forEach((g, n) => {
      const d = GOLPES[g.id];
      this.add(seloTipo(s, 380, 226 + n * 44, d.tipo, 13).setDepth(62));
      this.add(s.add.text(430, 214 + n * 44, d.nome, estilo(21)).setDepth(62));
      this.add(s.add.text(684, 216 + n * 44, `PP ${g.pp}/${d.pp}`, estilo(17)).setOrigin(1, 0).setDepth(62));
    });
    this.add(caixa(s, 322, 404, 386, 68).setDepth(61));
    this.add(s.add.text(340, 416, e.desc, estilo(16, '#303840', { wordWrap: { width: 350 } })).setDepth(62));
  }
  atualizar() {
    if (Entrada.apertou('a') || Entrada.apertou('b')) {
      Entrada.consumir('a'); Entrada.consumir('b');
      this.ui.desempilhar(this); this.destruir(); this.resolver();
    }
  }
}

// ── Bolsa ───────────────────────────────────────────────────
class TelaBolsa extends Widget {
  constructor(ui, modo, resolver) {
    super(ui);
    this.modo = modo; this.resolver = resolver; this.i = 0; this.ocupadoInterno = false;
    this.desenhar();
  }
  itens() {
    const ids = Object.keys(estado.bolsa).filter((k) => estado.bolsa[k] > 0 && ITENS[k]);
    return [...ids, null];
  }
  desenhar() {
    this.destruir();
    const s = this.ui;
    const lista = this.itens();
    this.i = Math.min(this.i, lista.length - 1);
    this.add(s.add.rectangle(W / 2, H / 2, W, H, 0xd8a85a).setDepth(40));
    const g = this.add(s.add.graphics().setDepth(40));
    g.fillStyle(0xc8984a); for (let x = 0; x < W; x += 30) g.fillRect(x, 0, 14, H);
    this.add(caixa(s, 12, 12, 240, 120).setDepth(41));
    this.add(s.add.text(132, 48, 'BOLSA', estilo(32)).setOrigin(0.5).setDepth(42));
    this.add(s.add.text(132, 92, `Moedas: ${estado.moedas}`, estilo(19)).setOrigin(0.5).setDepth(42));
    this.add(caixa(s, 264, 12, 444, 340).setDepth(41));
    const inicio = Math.max(0, Math.min(this.i - 3, lista.length - 7));
    lista.slice(inicio, inicio + 7).forEach((id, n) => {
      const k = inicio + n;
      const y = 32 + n * 44;
      if (k === this.i) this.add(s.add.text(282, y, '▶', estilo(24)).setDepth(42));
      if (!id) { this.add(s.add.text(312, y, 'Fechar', estilo(24)).setDepth(42)); return; }
      this.add(s.add.image(320, y + 14, ITENS[id].tipo === 'captura' ? 'icone_patua' : 'icone_item').setScale(2).setDepth(42));
      this.add(s.add.text(344, y, ITENS[id].nome, estilo(24)).setDepth(42));
      this.add(s.add.text(684, y, '×' + estado.bolsa[id], estilo(24)).setOrigin(1, 0).setDepth(42));
    });
    this.add(caixa(s, 12, 140, 240, 212).setDepth(41));
    const sel = lista[this.i];
    if (sel) this.add(s.add.image(132, 240, sel && ITENS[sel].tipo === 'captura' ? 'icone_patua' : 'icone_item').setScale(6).setDepth(42));
    this.add(caixa(s, 12, 360, 696, 112).setDepth(41));
    this.add(s.add.text(36, 380, sel ? ITENS[sel].desc : 'Fechar a bolsa.', estilo(22, '#303840', { wordWrap: { width: 650 } })).setDepth(42));
  }
  atualizar() {
    if (this.ocupadoInterno) return;
    const n = this.itens().length;
    if (Entrada.apertou('cima')) { this.i = (this.i - 1 + n) % n; this.desenhar(); }
    if (Entrada.apertou('baixo')) { this.i = (this.i + 1) % n; this.desenhar(); }
    if (Entrada.apertou('b')) { Entrada.consumir('b'); return this.fim(null); }
    if (Entrada.apertou('a')) { Entrada.consumir('a'); this.selecionar(); }
  }
  async selecionar() {
    const id = this.itens()[this.i];
    if (!id) return this.fim(null);
    const it = ITENS[id];
    this.ocupadoInterno = true;
    const r = await this.ui.escolher(['Usar', 'Voltar'], { x: 488, y: 236, largura: 200 });
    if (r !== 0) { this.ocupadoInterno = false; return; }
    if (this.modo === 'batalha') {
      if (it.tipo === 'captura') { this.ocupadoInterno = false; return this.fim({ item: id }); }
      const alvo = await this.ui.abrirTime('alvo', `Usar ${it.nome} em quem?`);
      if (alvo < 0) { this.ocupadoInterno = false; this.desenhar(); return; }
      const motivo = motivoNaoUsar(id, estado.time[alvo]);
      if (motivo) { await this.ui.falar(motivo); this.ocupadoInterno = false; this.desenhar(); return; }
      this.ocupadoInterno = false;
      return this.fim({ item: id, alvo });
    }
    if (it.tipo === 'captura') { await this.ui.falar('Agora não dá! Use em batalha contra um Encantado selvagem.'); this.ocupadoInterno = false; return; }
    const alvo = await this.ui.abrirTime('alvo', `Usar ${it.nome} em quem?`);
    if (alvo >= 0) {
      const mon = estado.time[alvo];
      const motivo = motivoNaoUsar(id, mon);
      if (motivo) await this.ui.falar(motivo);
      else { usarItem(id); await this.ui.falar(aplicarItem(id, mon)); }
    }
    this.ocupadoInterno = false;
    this.desenhar();
  }
  fim(v) { this.ui.desempilhar(this); this.destruir(); this.resolver(v); }
}

// ── Caderno de Campo (enciclopédia) ─────────────────────────
class TelaCaderno extends Widget {
  constructor(ui, resolver) {
    super(ui);
    this.resolver = resolver; this.i = 0; this.ocupadoInterno = false;
    this.desenhar();
  }
  desenhar() {
    this.destruir();
    const s = this.ui;
    this.add(s.add.rectangle(W / 2, H / 2, W, H, 0x8a3a3a).setDepth(40));
    this.add(caixa(s, 12, 12, 696, 56, { fundo: 0xf0e8d0 }).setDepth(41));
    const vistos = Object.keys(estado.vistos).length, pegos = Object.keys(estado.capturados).length;
    this.add(s.add.text(32, 26, 'CADERNO DE CAMPO', estilo(24)).setDepth(42));
    this.add(s.add.text(688, 28, `Vistos ${vistos}   Capturados ${pegos}`, estilo(19)).setOrigin(1, 0).setDepth(42));
    const porPag = 12;
    const pag = Math.floor(this.i / porPag);
    LISTA_CRIATURAS.slice(pag * porPag, pag * porPag + porPag).forEach((c, n) => {
      const k = pag * porPag + n;
      const x = 12 + (n % 4) * 175, y = 74 + Math.floor(n / 4) * 126;
      const visto = estado.vistos[c.id], pego = estado.capturados[c.id];
      this.add(caixa(s, x, y, 168, 118, { fundo: k === this.i ? 0xf8e8a0 : 0xf0e8d0, filete: null, borda: k === this.i ? 0xf05050 : 0x384858 }).setDepth(41));
      const img = this.add(criatura(s, x + 84, y + 50, c.id, 1.1).setDepth(42));
      if (!visto) img.setTintFill(0x384858);
      this.add(s.add.text(x + 12, y + 8, String(c.num).padStart(3, '0'), estilo(15, '#5a6a7a')).setDepth(42));
      if (pego) this.add(s.add.image(x + 148, y + 18, 'icone_patua').setScale(1.4).setDepth(42));
      this.add(s.add.text(x + 84, y + 96, visto ? c.nome : '???', estilo(18)).setOrigin(0.5).setDepth(42));
    });
    const total = Math.ceil(LISTA_CRIATURAS.length / porPag);
    this.add(s.add.text(W / 2, 472, `Pág ${pag + 1}/${total} — A: ver   B: sair`, estilo(15, '#ffffff')).setOrigin(0.5, 1).setDepth(42));
  }
  atualizar() {
    if (this.ocupadoInterno) return;
    const n = LISTA_CRIATURAS.length;
    let i = this.i;
    if (Entrada.apertou('dir')) i = Math.min(n - 1, i + 1);
    if (Entrada.apertou('esq')) i = Math.max(0, i - 1);
    if (Entrada.apertou('baixo')) i = Math.min(n - 1, i + 4);
    if (Entrada.apertou('cima')) i = Math.max(0, i - 4);
    if (i !== this.i) { this.i = i; this.desenhar(); }
    if (Entrada.apertou('b')) { Entrada.consumir('b'); this.ui.desempilhar(this); this.destruir(); this.resolver(); return; }
    if (Entrada.apertou('a')) { Entrada.consumir('a'); this.detalhe(); }
  }
  async detalhe() {
    const c = LISTA_CRIATURAS[this.i];
    if (!estado.vistos[c.id]) return;
    this.ocupadoInterno = true;
    const tipos = c.tipos.map((t) => TIPOS[t].nome).join('/');
    await this.ui.falar(`${c.nome} — tipo ${tipos}.\n${estado.capturados[c.id] ? c.desc : 'Capture para saber mais!'}`);
    this.ocupadoInterno = false;
  }
}

// ── Evolução ────────────────────────────────────────────────
class TelaEvolucao extends Widget {
  constructor(ui, de, para, resolver) {
    super(ui);
    this.resolver = resolver;
    const s = ui;
    this.add(s.add.rectangle(W / 2, H / 2, W, H, 0x101820).setDepth(70));
    this.raios = this.add(s.add.graphics().setDepth(70));
    this.antes = this.add(criatura(s, W / 2, 190, de, 3.5).setDepth(71));
    this.depois = this.add(criatura(s, W / 2, 190, para, 3.5).setDepth(71).setAlpha(0));
    this.t = 0;
    this.relogio = s.time.addEvent({ delay: 33, loop: true, callback: () => this.desenharRaios(33) });
  }
  destruir() { this.relogio?.remove(); super.destruir(); }
  desenharRaios(dt) {
    this.t += dt;
    const g = this.raios; g.clear();
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * Math.PI * 2 + this.t / 900;
      g.fillStyle(0x3a5a7a, 0.5);
      g.fillTriangle(W / 2, 190, W / 2 + Math.cos(ang) * 500, 190 + Math.sin(ang) * 500, W / 2 + Math.cos(ang + 0.15) * 500, 190 + Math.sin(ang + 0.15) * 500);
    }
  }
  async rodar(textoAntes, textoDepois) {
    const s = this.ui;
    this.antes.setTintFill(0xffffff); this.antes.clearTint();
    await this.ui.falar(textoAntes);
    // pisca alternando, cada vez mais rápido
    let periodo = 420;
    for (let n = 0; n < 12; n++) {
      this.antes.setTintFill(0xffffff); this.depois.setTintFill(0xffffff);
      this.antes.setAlpha(1); this.depois.setAlpha(0);
      await esperar(s, periodo / 2);
      this.antes.setAlpha(0); this.depois.setAlpha(1);
      await esperar(s, periodo / 2);
      periodo = Math.max(80, periodo * 0.8);
    }
    this.antes.setAlpha(0); this.depois.setAlpha(1);
    s.cameras.main.flash(500, 255, 255, 255);
    this.depois.clearTint();
    await esperar(s, 400);
    await this.ui.falar(textoDepois);
    this.ui.desempilhar(this); this.destruir(); this.resolver();
  }
}

// ── Loja ────────────────────────────────────────────────────
const ESTOQUE = ['patua', 'cha', 'garrafada', 'chaForte', 'patuaForte', 'canjica'];

export function esperar(scene, ms) {
  return new Promise((r) => scene.time.delayedCall(ms, r));
}

// ═════════════════════════════════════════════════════════
export default class Interface extends Phaser.Scene {
  constructor() { super('Interface'); }

  create() {
    this.pilha = [];
    this.bloqueios = 0;
    window.__ui = this;
    this.caixaTexto = caixa(this, CAIXA.x, CAIXA.y, CAIXA.w, CAIXA.h).setDepth(30).setVisible(false);
    this.textoCaixa = this.add.text(CAIXA.x + 26, CAIXA.y + 16, '', estilo(25, '#303840', { lineSpacing: 6, wordWrap: { width: CAIXA.w - 64 } })).setDepth(31).setVisible(false);
    this.medidor = this.add.text(0, -200, '', estilo(25, '#303840', { lineSpacing: 6, wordWrap: { width: CAIXA.w - 64 } })).setVisible(false);
    this.setaCaixa = this.add.text(CAIXA.x + CAIXA.w - 34, CAIXA.y + CAIXA.h - 34, '▼', estilo(20, '#d04040')).setDepth(31).setVisible(false);
    this.tweens.add({ targets: this.setaCaixa, y: '+=5', yoyo: true, repeat: -1, duration: 300 });
    this.cortina = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(100).setAlpha(0);
    this.esconderNoProximo = false;
  }

  get ocupado() { return this.pilha.length > 0 || this.bloqueios > 0; }

  empilhar(w) { this.pilha.push(w); }
  desempilhar(w) { const i = this.pilha.indexOf(w); if (i >= 0) this.pilha.splice(i, 1); }

  update(_t, dt) {
    if (this.esconderNoProximo) {
      this.esconderNoProximo = false;
      if (!this.pilha.some((w) => w instanceof Leitor)) this.fecharTexto();
    }
    const topo = this.pilha[this.pilha.length - 1];
    if (topo) topo.passo(dt);
  }

  // ── Texto ──
  mostrarCaixaTexto() {
    this.caixaTexto.setVisible(true);
    this.textoCaixa.setVisible(true);
    this.esconderNoProximo = false;
  }
  esconderCaixaDepois() { this.esconderNoProximo = true; }
  fecharTexto() {
    this.caixaTexto.setVisible(false);
    this.textoCaixa.setVisible(false).setText('');
    this.setaCaixa.setVisible(false);
  }

  paginar(textos) {
    const paginas = [];
    for (const t of [].concat(textos)) {
      for (const paragrafo of substituir(t).split('\n\n')) {
        const linhas = this.medidor.getWrappedText(paragrafo);
        for (let i = 0; i < linhas.length; i += 3) paginas.push(linhas.slice(i, i + 3).join('\n'));
      }
    }
    return paginas.length ? paginas : [''];
  }

  /** Mostra texto. opts: { auto: ms, manter, semEspera, instantaneo } */
  falar(textos, opts = {}) {
    return new Promise((resolve) => {
      this.empilhar(new Leitor(this, this.paginar(textos), opts, resolve));
    });
  }

  escolher(opcoes, opts = {}) {
    return new Promise((resolve) => this.empilhar(new Menu(this, opcoes, opts, resolve)));
  }

  async perguntar(texto, opcoes = ['Sim', 'Não'], opts = {}) {
    await this.falar(texto, { manter: true, semEspera: true });
    const r = await this.escolher(opcoes, { cancelavel: true, ...opts });
    this.fecharTexto();
    return r;
  }

  abrirTime(modo = 'ver', titulo) { return new Promise((r) => this.empilhar(new TelaTime(this, modo, titulo, r))); }
  abrirFicha(mon) { return new Promise((r) => this.empilhar(new TelaFicha(this, mon, r))); }
  abrirBolsa(modo = 'ver') { return new Promise((r) => this.empilhar(new TelaBolsa(this, modo, r))); }
  abrirCaderno() { return new Promise((r) => this.empilhar(new TelaCaderno(this, r))); }

  evoluir(de, para, nome) {
    return new Promise((r) => {
      const t = new TelaEvolucao(this, de, para, r);
      this.empilhar(t);
      t.rodar(`O quê? ${nome} está evoluindo!`, `Parabéns! ${nome} virou ${CRIATURAS[para].nome}!`);
    });
  }

  /** Painel pequeno mostrando um Encantado (ex.: escolha do inicial). Retorna função para fechar. */
  mostrarCriatura(especie) {
    const c = CRIATURAS[especie];
    const objs = [];
    objs.push(caixa(this, 220, 40, 280, 300, { fundo: 0xe0f0f8 }).setDepth(45));
    objs.push(criatura(this, 360, 170, especie, 3.2).setDepth(46));
    objs.push(this.add.text(360, 278, c.nome, estilo(28)).setOrigin(0.5).setDepth(46));
    c.tipos.forEach((t, k) => objs.push(seloTipo(this, 360 + (k - (c.tipos.length - 1) / 2) * 110, 316, t, 15).setDepth(46)));
    return () => objs.forEach((o) => o.destroy());
  }

  async menuPrincipal() {
    this.bloqueios++;
    const info = [];
    info.push(caixa(this, 8, 8, 300, 92).setDepth(45));
    info.push(this.add.text(30, 24, estado.nome, estilo(24)).setDepth(46));
    info.push(this.add.text(30, 58, `Moedas: ${estado.moedas}`, estilo(20)).setDepth(46));
    let inicial = 0;
    for (;;) {
      const opcoes = [
        { texto: 'Time', desativado: !estado.time.length },
        { texto: 'Bolsa' },
        { texto: 'Caderno', desativado: !estado.flags.temCaderno },
        { texto: 'Salvar' },
        { texto: 'Fechar' },
      ];
      const r = await this.escolher(opcoes, { x: 500, y: 8, largura: 212, inicial });
      if (r < 0 || r === 4) break;
      inicial = r;
      info.forEach((o) => o.setVisible(false));
      if (r === 0) await this.abrirTime('ver');
      if (r === 1) await this.abrirBolsa('ver');
      if (r === 2) await this.abrirCaderno();
      if (r === 3) {
        const ok = await this.perguntar('Salvar o jogo?');
        if (ok === 0) await this.falar(salvar() ? `${estado.nome} salvou o jogo!` : 'Não foi possível salvar neste navegador.');
      }
      info.forEach((o) => o.setVisible(true));
    }
    info.forEach((o) => o.destroy());
    this.bloqueios--;
  }

  async loja() {
    this.bloqueios++;
    const info = [];
    const atualizarInfo = () => {
      info.forEach((o) => o.destroy()); info.length = 0;
      info.push(caixa(this, 8, 8, 260, 64).setDepth(45));
      info.push(this.add.text(26, 24, `Moedas: ${estado.moedas}`, estilo(22)).setDepth(46));
    };
    atualizarInfo();
    let i = 0;
    for (;;) {
      const opcoes = ESTOQUE.map((id) => ({ texto: `${ITENS[id].nome.padEnd(12)} ${String(ITENS[id].preco).padStart(5)}` }));
      opcoes.push('Sair');
      const r = await this.escolher(opcoes, {
        x: 300, y: 8, largura: 412, inicial: i,
        aoMudar: (k) => { if (this.descLoja) this.descLoja.setText(ESTOQUE[k] ? ITENS[ESTOQUE[k]].desc : 'Até logo!'); },
      });
      if (r < 0 || r === ESTOQUE.length) break;
      i = r;
      const id = ESTOQUE[r];
      const preco = ITENS[id].preco;
      const qtds = [1, 5, 10].filter((q) => q * preco <= estado.moedas);
      if (!qtds.length) { await this.falar('Você não tem moedas suficientes.'); continue; }
      const q = await this.perguntar(`${ITENS[id].nome}? Quantos?`, qtds.map((n) => `${n}  (${n * preco})`));
      if (q < 0) continue;
      const n = qtds[q];
      estado.moedas -= n * preco;
      darItem(id, n);
      if (id === 'patua' && n >= 10) { darItem('patuaForte', 1); await this.falar(`Aqui está! E de brinde, um Patuá Bento!`); }
      else await this.falar('Aqui está! Obrigado!');
      atualizarInfo();
    }
    info.forEach((o) => o.destroy());
    this.bloqueios--;
  }

  /** Pergunta se quer aprender um golpe novo quando já sabe 4. Se `cheio` for falso, só anuncia. */
  async aprenderGolpe(mon, golpeId, cheio) {
    const nome = nomeDe(mon), g = GOLPES[golpeId].nome;
    if (!cheio) { await this.falar(`${nome} aprendeu ${g}!`); return; }
    await this.falar(`${nome} quer aprender ${g}, mas já sabe quatro golpes.`);
    for (;;) {
      const r = await this.perguntar(`Esquecer um golpe para aprender ${g}?`);
      if (r !== 0) { await this.falar(`${nome} não aprendeu ${g}.`); return; }
      const ops = mon.golpes.map((x) => GOLPES[x.id].nome);
      ops.push('Cancelar');
      const k = await this.escolher(ops, { titulo: 'Esquecer qual?' });
      if (k < 0 || k === 4) continue;
      const velho = GOLPES[mon.golpes[k].id].nome;
      mon.golpes[k] = { id: golpeId, pp: GOLPES[golpeId].pp };
      await this.falar([`1, 2 e... pronto!`, `${nome} esqueceu ${velho} e aprendeu ${g}!`]);
      return;
    }
  }

  mostrarNomeMapa(nome) {
    this.placaMapa?.destroy();
    const t = this.add.text(0, 0, nome, estilo(22));
    const w = t.width + 40;
    const g = caixa(this, 0, 0, w, 52, { filete: null });
    t.setPosition(20, 13);
    const c = this.add.container(10, -60, [g, t]).setDepth(35);
    this.placaMapa = c;
    this.tweens.add({ targets: c, y: 10, duration: 300, ease: 'Quad.out',
      onComplete: () => this.tweens.add({ targets: c, y: -60, delay: 1800, duration: 300, onComplete: () => c.destroy() }) });
  }

  // ── Cortina (transições) ──
  escurecer(ms = 250) {
    return new Promise((r) => this.tweens.add({ targets: this.cortina, alpha: 1, duration: ms, onComplete: r }));
  }
  clarear(ms = 250) {
    return new Promise((r) => this.tweens.add({ targets: this.cortina, alpha: 0, duration: ms, onComplete: r }));
  }

  /** Caixa HTML para digitar o nome. */
  pedirNome(padrao = '') {
    return new Promise((resolve) => {
      const ov = document.getElementById('nome-overlay');
      const form = document.getElementById('nome-form');
      const inp = document.getElementById('nome-input');
      inp.value = padrao;
      ov.hidden = false;
      setTimeout(() => inp.focus(), 50);
      const enviar = (e) => {
        e.preventDefault();
        const v = inp.value.trim().slice(0, 10);
        if (!v) return;
        form.removeEventListener('submit', enviar);
        ov.hidden = true;
        inp.blur();
        resolve(v);
      };
      form.addEventListener('submit', enviar);
    });
  }
}
