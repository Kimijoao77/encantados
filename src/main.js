import { Entrada } from './motor/entrada.js';
import Boot from './cenas/Boot.js';
import Titulo from './cenas/Titulo.js';
import Mundo from './cenas/Mundo.js';
import Batalha from './cenas/Batalha.js';
import Interface from './cenas/Interface.js';
import Galeria from './cenas/Galeria.js';

export const LARGURA = 720;
export const ALTURA = 480;

async function iniciar() {
  try {
    await Promise.all([
      document.fonts.load('400 24px "Pixelify Sans"'),
      document.fonts.load('700 24px "Pixelify Sans"'),
    ]);
  } catch { /* segue com fonte padrão */ }
  document.getElementById('carregando')?.remove();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'jogo',
    width: LARGURA,
    height: ALTURA,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#101418',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: false },
    scene: [Boot, Titulo, Mundo, Batalha, Interface, Galeria],
  });
  Entrada.iniciar(game);
  window.__jogo = game;
}

iniciar();
