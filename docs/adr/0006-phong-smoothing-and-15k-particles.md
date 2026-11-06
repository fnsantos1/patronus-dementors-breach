# 0006 - Suavização por Iluminação de Phong e Expansão para 15k Partículas

Expandimos a densidade do Patrono de 3.800 para 15.000 partículas para obter uma volumetria aveludada contínua de vapor mágico.
Adotamos o modelo de reflexão de Phong tanto no núcleo geométrico quanto na nuvem de partículas:
1. No núcleo geométrico: substituição do MeshStandardMaterial (flatShading: true) por MeshPhongMaterial com normais suaves (`flatShading: false`), brilho especular (`shininess: 60`, `specular: 0x90caff`) e opacidade translúcida sutil (~0.2).
2. Na nuvem de partículas: cálculo analítico do termo especular de Phong baseado na luz interna do próprio Patrono e no vetor de visão da câmera, gerando brilho perolado espectral nas regiões iluminadas sem interferência de luzes externas da câmara.

