# Patronus: The Dementor's Breach

Trabalho final da disciplina de **Computação Gráfica** — Instituto de Ciência e
Tecnologia, UNIFESP (Campus São José dos Campos).

Jogo 3D de sobrevivência em primeira pessoa (modo horda): o jogador é um mago
em uma câmara fechada que precisa repelir ondas de Dementadores conjurando o
feitiço do Patrono através de gestos com a varinha.

**Tecnologia:** Three.js r169 sobre WebGL. Sem build step — ES Modules nativos,
com a biblioteca versionada em `vendor/three/`.

## Integrantes

| Nome | RA |
|---|---|
| Andrey Prado de Oliveira | 168491 |
| Diogo José Santos | 168632 |
| Fabricio Nascimento dos Santos | 170552 |
| João Victor Assaoka Ribeiro | 168863 |
| Kauan Domingues de Souza | 170347 |

## Como executar

ES Modules não carregam por `file://`, então é preciso um servidor HTTP local:

```bash
python3 -m http.server 8000
```

Depois abra <http://localhost:8000>.

## Controles do visualizador

| Tecla | Ação |
|---|---|
| `1` / `2` / `3` | focar Conjurador / Dementador / Patrono |
| `0` | ver os três juntos |
| `Espaço` (segurar e soltar) | carregar e conjurar o Patrono |
| `G` | mostrar grade e eixos |
| `L` | alternar wireframe |
| mouse | orbitar (arrastar) e aproximar (roda) |

## Estrutura

```
.
├── index.html                  # importmap + HUD
├── src/
│   ├── main.js                 # cena, luzes, câmera orbital, loop de render
│   ├── core/textures.js        # texturas procedurais em <canvas>
│   └── characters/
│       ├── conjurer.js         # Conjurador: braço + varinha (10 malhas)
│       ├── dementor.js         # Dementador: manto + capuz + braços (20 malhas)
│       └── patronus.js         # Patrono: cervo espectral (25 malhas)
├── vendor/three/               # Three.js r169 versionado
└── docs/                       # proposta, capturas de tela e vídeo
```

Todos os modelos são **próprios**, construídos por código a partir de
primitivas do Three.js — não há modelos externos nem arquivos de textura no
projeto. O acabamento é de propósito tosco: poucos segmentos por primitiva e
`flatShading` ligado, deixando as facetas à mostra.

## Status das entregas

- [x] **Entrega 1** — Proposta do trabalho final (`docs/Entrega1-Proposta.pdf`)
- [ ] **Entrega 2** — Modelagem 3D e construção inicial da cena
  - [x] Personagens do item 3.1 da proposta (Conjurador, Dementador, Patrono)
  - [x] Cena mínima para visualização (chão, iluminação, câmera orbital)
  - [ ] Câmara completa: paredes, teto, obstáculos e tochas
  - [ ] Câmeras em 1ª pessoa, 3ª pessoa e zenital
  - [ ] Capturas de tela / vídeo em `docs/`
  - [ ] Relatório da entrega
