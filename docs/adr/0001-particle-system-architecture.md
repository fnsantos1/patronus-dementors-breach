# 0001 - Arquitetura de Partículas para Varinha e Patrono

Adotamos a implementação de um sistema procedural reutilizável de partículas (`THREE.Points` com textura gerada via Canvas procedural em `src/core/particles.js`). O Patrono deixará de ser uma malha opaca/translúcida poligonal para ser constituído inteiramente por uma nuvem de partículas (Point Cloud), preservando o estilo estético etéreo sem dependências externas de texturas pesadas e mantendo alta performance de renderização.

