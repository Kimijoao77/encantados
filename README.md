# 🐾 Encantados

Jogo de capturar e batalhar com criaturas inspiradas na **fauna e no folclore brasileiro**, no estilo dos RPGs de Game Boy Advance. Roda direto no navegador, no PC e no celular.

**▶ Jogar:** https://kimijoao77.github.io/encantados/

## O mundo

Na Vila Araucária, a Professora Jaci estuda os **Encantados**: bichos dos campos, das matas e dos rios que ganharam poderes, e criaturas das lendas que aparecem quando a névoa sobe. Você recebe seu primeiro Encantado, enfrenta o rival Caio e sai para explorar a Rota 1.

- **44 Encantados** baseados em animais brasileiros: lobo-guará, ariranha, jabuti, capivara, gralha-azul, tatu, tamanduá, onça...
- **Lendas** inspiradas no Saci, no Curupira, na Iara, na Mula sem Cabeça e no Boitatá
- **11 tipos**: Fera, Fogo, Água, Planta, Elétrico, Terra, Vento, Inseto, Espírito, Névoa e Lenda
- Captura com **patuás**, cura com **chás** e **garrafadas**

## Controles

| Ação | Teclado | Celular |
|---|---|---|
| Andar | Setas ou WASD | D-pad |
| Confirmar / falar | Z, Espaço ou J | A |
| Voltar / correr (segurando) | X, Esc ou K | B |
| Menu | Enter ou M | MENU |

O jogo salva sozinho ao trocar de mapa e depois das batalhas. Dá para salvar pelo menu também.

## O que já tem (v0.1)

- Introdução, escolha do inicial e batalha contra o rival
- Vila Araucária (casa, laboratório, Casa de Cura com loja) e Rota 1
- Encontros no mato alto, captura, treinadores que te veem e desafiam
- Batalha por turnos com tipos, golpes, status (queimado, paralisado, dormindo, envenenado), críticos e alteração de atributos
- Experiência, níveis, aprender golpes novos e evolução
- Time, bolsa, ficha, Caderno de Campo (enciclopédia) e loja
- Controles de toque para celular

## 🎨 Arte

Os Encantados são **modelados em 3D no Blender** e renderizados como sprites (frente, costas e miniatura).
Os modelos são feitos por código, em "massinha digital": cada criatura é uma lista de formas que se fundem (ver `ferramentas/blender/modelos.py`).

```bash
pip install bpy scikit-image pillow numpy
python3 ferramentas/blender/render.py guarito --previa   # prévia rápida em /tmp/previa
python3 ferramentas/blender/render.py guarito ariri      # gera os sprites finais em assets/criaturas/
python3 ferramentas/blender/render.py --todos
```

Quem ainda não tem modelo 3D aparece com a arte provisória em pixel art, gerada por código.
Também dá para usar imagens do ChatGPT/Gemini: veja [PEDIDOS_DE_ARTE.md](PEDIDOS_DE_ARTE.md) e envie para `arte_bruta/criaturas/`.

Para ver todas as criaturas de uma vez: abra o jogo com **`?galeria`** no fim do endereço.

## Estrutura

```
index.html, estilo.css     página do jogo e controles de toque
src/main.js                inicia o Phaser
src/cenas/                 Titulo, Mundo (mapa), Batalha, Interface (textos/menus), Galeria
src/motor/                 regras: criaturas, batalha, estado/save, entrada, itens
src/dados/                 criaturas, golpes, tipos, itens, mapas e eventos (história)
src/arte/procedural.js     arte provisória gerada por código
assets/                    arte final processada + manifest.json
arte_bruta/                imagens originais do GPT/Gemini (entrada do script)
ferramentas/               blender/ (modelos 3D e render), processar_arte.py, gerar_pedidos.mjs
testes/                    testes automáticos (npm test)
```

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
npm test   # testes das regras e dos mapas
```

Feito com [Phaser 3](https://phaser.io). Fonte [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (licença OFL).
