// Gera PEDIDOS_DE_ARTE.md a partir dos dados das criaturas.
// Rode: node ferramentas/gerar_pedidos.mjs
import { writeFileSync, existsSync } from 'node:fs';
import { LISTA_CRIATURAS } from '../src/dados/criaturas.js';
import { TIPOS } from '../src/dados/tipos.js';

const ESTILO = [
  'Pixel art de UMA criatura para um jogo de RPG de capturar monstrinhos, no estilo dos jogos de Game Boy Advance.',
  'O design é ORIGINAL (não copie nenhum Pokémon ou personagem existente).',
  'Corpo inteiro, vista 3/4 de frente, virada para a ESQUERDA, centralizada.',
  'Fundo branco liso (#FFFFFF), sem cenário, sem chão, sem sombra, sem texto, sem moldura.',
  'Contorno escuro de 1 pixel, paleta limitada (no máximo 16 cores), cores vivas, sombreamento simples.',
  'Aparência fofa e carismática, proporções de sprite 64x64 pixels (imagem pode ser maior, mas os "pixels" devem ser grandes e nítidos).',
].join(' ');

const COSTAS = 'Agora a MESMA criatura, mesmo estilo e mesmas cores, mas vista de COSTAS (3/4 de trás), virada para a DIREITA, como o sprite do Encantado do jogador numa batalha. Fundo branco liso.';

const GRUPOS = [
  ['Iniciais (prioridade máxima)', (c) => c.num <= 9],
  ['Rota 1 — aparecem primeiro no jogo', (c) => ['capivi', 'gralhita', 'taturana', 'tatui', 'pirili', 'bezerrito', 'jatai', 'quatiri'].includes(c.id)],
  ['Evoluções e outros Encantados', (c) => c.num > 9 && !['capivi', 'gralhita', 'taturana', 'tatui', 'pirili', 'bezerrito', 'jatai', 'quatiri'].includes(c.id) && !c.tipos.includes('lenda') && !c.tipos.includes('espirito')],
  ['Lendas e assombrações (raros)', (c) => c.num > 9 && (c.tipos.includes('lenda') || c.tipos.includes('espirito')) && c.id !== 'quatiri'],
];

let md = `# 🎨 Pedidos de arte — Encantados

Este arquivo é gerado automaticamente (\`node ferramentas/gerar_pedidos.mjs\`). Cada bloco tem um **prompt pronto** para colar no **ChatGPT** ou no **Gemini**.

## Como fazer

1. Abra **uma conversa nova** no ChatGPT ou no Gemini e cole primeiro o **estilo base** (logo abaixo). Peça para ele seguir esse estilo em todas as imagens.
2. Depois cole o prompt de cada criatura, **um de cada vez**, sempre na mesma conversa. Assim o estilo fica igual entre elas.
3. Quando gostar de uma imagem, baixe e salve com o **nome do arquivo** indicado (ex.: \`guarito.png\`).
4. Coloque o arquivo na pasta \`arte_bruta/criaturas/\` do repositório (no site do GitHub: entre na pasta → **Add file → Upload files**).
5. Pronto! O GitHub roda o script que limpa o fundo, reduz para 64x64 e deixa no padrão do jogo. Em poucos minutos a arte nova aparece no jogo.

> Dica: se uma imagem ficar boa, anexe ela junto com o próximo pedido e escreva "mesmo estilo desta". Isso ajuda a manter todas parecidas.
>
> Para conferir todas as criaturas de uma vez, abra o jogo com \`?galeria\` no fim do endereço.

## Estilo base (cole primeiro)

\`\`\`
${ESTILO}
\`\`\`

## Vista de costas (opcional)

Depois de aprovar a frente de uma criatura, dá para pedir a versão de costas (usada quando ela é sua na batalha). Se não tiver, o jogo espelha a imagem da frente.

\`\`\`
${COSTAS}
\`\`\`
Salve como \`<nome>_costas.png\` (ex.: \`guarito_costas.png\`).

`;

const feitos = (id) => existsSync(new URL(`../assets/criaturas/${id}.png`, import.meta.url));

for (const [titulo, filtro] of GRUPOS) {
  md += `\n---\n\n## ${titulo}\n`;
  for (const c of LISTA_CRIATURAS.filter(filtro)) {
    const tipos = c.tipos.map((t) => TIPOS[t].nome).join(' / ');
    const status = feitos(c.id) ? '✅ já tem arte' : '⬜ falta';
    md += `
### ${String(c.num).padStart(3, '0')} · ${c.nome} — ${tipos}  ${status}
Arquivo: \`arte_bruta/criaturas/${c.id}.png\`

\`\`\`
Criatura "${c.nome}" (não escreva o nome na imagem). Tipo: ${tipos}.
Aparência: ${c.aparencia}.
Personalidade: ${c.desc}
Siga o estilo base: pixel art estilo GBA, vista 3/4 virada para a esquerda, fundo branco liso.
\`\`\`
`;
  }
}

writeFileSync(new URL('../PEDIDOS_DE_ARTE.md', import.meta.url), md);
console.log('PEDIDOS_DE_ARTE.md gerado com', LISTA_CRIATURAS.length, 'criaturas.');
