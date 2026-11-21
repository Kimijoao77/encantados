import { gerarTudo } from '../arte/procedural.js';

// Carrega a arte de verdade listada em assets/manifest.json (se existir)
// e gera a arte provisória para tudo que ainda não tem imagem.
export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
    this.load.on('filecomplete-json-manifest', (_k, _t, dados) => {
      const texturas = dados?.texturas || {};
      for (const [chave, info] of Object.entries(texturas)) {
        if (typeof info === 'string') this.load.image(chave, info);
        else if (info.quadro) this.load.spritesheet(chave, info.arquivo, { frameWidth: info.quadro[0], frameHeight: info.quadro[1] });
        else this.load.image(chave, info.arquivo);
      }
    });
    this.load.on('loaderror', (arq) => console.warn('Arte não encontrada, usando provisória:', arq.key));
  }

  create() {
    gerarTudo(this);
    const params = new URLSearchParams(location.search);
    this.scene.launch('Interface');
    if (params.has('galeria')) this.scene.start('Galeria');
    else this.scene.start('Titulo');
  }
}
