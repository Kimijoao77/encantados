import { criatura } from '../ui/desenho.js';
import { LISTA_CRIATURAS } from '../dados/criaturas.js';
import { TIPOS } from '../dados/tipos.js';
import { Entrada } from '../motor/entrada.js';

// Galeria de arte: abra o jogo com ?galeria no fim do endereço para ver todos os Encantados e tiles.
export default class Galeria extends Phaser.Scene {
  constructor() { super('Galeria'); }

  create() {
    this.pagina = 0;
    this.desenhar();
  }

  desenhar() {
    this.children.removeAll(true);
    this.add.rectangle(360, 240, 720, 480, 0x2a3440);
    const porPagina = 15;
    const lista = LISTA_CRIATURAS.slice(this.pagina * porPagina, (this.pagina + 1) * porPagina);
    lista.forEach((c, i) => {
      const x = 72 + (i % 5) * 144, y = 78 + Math.floor(i / 5) * 140;
      this.add.rectangle(x, y + 6, 132, 128, 0x3a4652).setStrokeStyle(2, 0x56646e);
      criatura(this, x, y - 6, c.id, 1.5);
      this.add.text(x, y + 46, `${c.num}. ${c.nome}`, { fontFamily: 'Pixelify Sans', fontSize: '17px', color: '#ffffff' }).setOrigin(0.5);
      this.add.text(x, y + 62, c.tipos.map((t) => TIPOS[t].nome).join('/'), { fontFamily: 'Pixelify Sans', fontSize: '13px', color: '#c8d0d8' }).setOrigin(0.5);
    });
    const total = Math.ceil(LISTA_CRIATURAS.length / porPagina);
    if (this.pagina === total) this.desenharTiles();
    this.add.text(360, 466, `Página ${this.pagina + 1}/${total + 1}  ◀ ▶ para trocar`, { fontFamily: 'Pixelify Sans', fontSize: '16px', color: '#e8e0c8' }).setOrigin(0.5);
  }

  desenharTiles() {
    const chaves = this.textures.getTextureKeys().filter((k) => k.startsWith('tile_') || k.startsWith('pers_') || k.startsWith('icone_'));
    chaves.forEach((k, i) => {
      const x = 40 + (i % 12) * 58, y = 50 + Math.floor(i / 12) * 70;
      const img = this.add.image(x, y, k, k.startsWith('pers_') ? 0 : undefined).setScale(3);
      if (k.startsWith('pers_')) img.setFrame(0);
      this.add.text(x, y + 30, k.replace(/^(tile_|pers_|icone_)/, ''), { fontFamily: 'Pixelify Sans', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5);
    });
  }

  update() {
    const total = Math.ceil(LISTA_CRIATURAS.length / 15) + 1;
    if (Entrada.apertou('dir')) { this.pagina = (this.pagina + 1) % total; this.desenhar(); }
    if (Entrada.apertou('esq')) { this.pagina = (this.pagina + total - 1) % total; this.desenhar(); }
  }
}
