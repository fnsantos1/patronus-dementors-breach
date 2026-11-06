# 0007 - Modelo Anatômico 3D com MeshSurfaceSampler e Refinamento de Phong nas Partículas

## Contexto
Após a aplicação inicial da iluminação analítica de Phong na nuvem de 15.000 partículas e a redução do tamanho para 0.095, as partículas encolheram em relação ao núcleo procedural de caixas (`BoxGeometry`). A falta de sobreposição visual evidenciou a silhueta quadrada e os cortes retos das primitivas geométricas do cervo, que contrastavam com a natureza vaporosa e espectral esperada de um Patrono.

## Decisão
1. **Adoção de Modelo 3D Local (.glb) com GLTFLoader**:
   - Integramos localmente o `GLTFLoader.js` e utilitários em `vendor/three/addons/` e adicionamos um modelo 3D anatômico otimizado de cervo (`assets/models/patronus.glb`) com galhada ramificada e proporções naturais sob licença aberta (CC0).
   - Normalização automática via `Box3`: escala reajustada para altura total de 2.4 metros (até a ponta dos chifres), pés ancorados em $Y = 0$, centro alinhado em $X/Z$ e rotação ajustada para orientar a cabeça na convenção de frente da cena ($-Z$).

2. **Amostragem Ponderada de Superfície (`MeshSurfaceSampler`)**:
   - Substituímos a amostragem em paralelepípedos procedurais pelo `MeshSurfaceSampler` distribuído sobre as malhas do corpo e da galhada (`Stag_Horns`).
   - Aplicamos ponderação proporcional à área dos triângulos com amplificação de 3.5x para a galhada, garantindo que as pontas e ramificações fiquem densas e claramente delineadas na nuvem de partículas.

3. **Recalibração do Tamanho e do Modelo de Iluminação de Phong nas Partículas**:
   - Aumentamos o tamanho de cada partícula (`size`) de 0.095 para 0.20, restaurando a sobreposição suave (overlap) e o aspecto contínuo aveludado de névoa mágica.
   - Suavizamos a equação difusa analítica de Phong: introduzimos uma base ambiente de 0.65 (`diffuse = 0.65 + 0.35 * nDotL`), impedindo que as partículas nas bordas e nas costas do cervo percam intensidade e escureçam abruptamente.
   - Mantivemos o brilho especular de Blinn-Phong perolado com expoente 24 e intensidade 0.70 acoplado à luz interna do tórax.
   - Adicionamos dinâmica contínua de ascensão térmica e dispersão radial ao longo da normal da malha (`radialDrift` e `riseY`), fazendo com que o vapor flua suavemente ao redor do corpo.

4. **Núcleo Espectral Suavizado**:
   - Todos os materiais do modelo 3D importado são sobrescritos por `MeshPhongMaterial` com `opacity: 0.08`, `emissive: 0x5a9eff`, `specular: 0x90caff` e `depthWrite: false`. O núcleo serve como um reflexo de energia interno e sutil, sem criar arestas duras através da névoa.

## Consequências
- A aparência quadrada foi completamente erradicada: o Patrono agora possui silhueta anatômica curva e esbelta.
- A nuvem de 15.000 partículas voltou a ter volume e densidade contínua, ocultando transições bruscas.
- O sistema opera 100% offline e autocontido no repositório local.

