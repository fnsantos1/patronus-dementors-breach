#!/usr/bin/env python3
"""Gera as imagens de textura do jogo em assets/texturas/.

As texturas sao nossas, desenhadas por codigo: nada baixado da internet.
Cada material tem duas imagens: a cor (albedo) e o mapa de normais, que da
relevo a superficie quando a luz bate nela.

Rodar com:  python3 tools/gerar-texturas.py
"""

import math, random
from PIL import Image, ImageDraw, ImageFilter

RAIZ = "assets/texturas"
random.seed(7)          # mesma textura toda vez que rodar
TAM = 512


def ruido(img, forca=10):
    """Granulado fino, para a superficie nao ficar chapada."""
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            n = random.randint(-forca, forca)
            r, g, b = px[x, y][:3]
            px[x, y] = (max(0, min(255, r + n)),
                        max(0, min(255, g + n)),
                        max(0, min(255, b + n)))
    return img


def normal_map(altura, forca=2.5):
    """Converte um mapa de altura (cinza) em mapa de normais.

    A normal de cada pixel sai da inclinacao local: comparamos a altura do
    vizinho da direita com a da esquerda (e de baixo com a de cima) e
    guardamos esse declive nos canais R e G.
    """
    alt = altura.convert("L").filter(ImageFilter.GaussianBlur(1))
    p = alt.load()
    w, h = alt.size
    saida = Image.new("RGB", (w, h))
    s = saida.load()

    for y in range(h):
        for x in range(w):
            dx = (p[(x + 1) % w, y] - p[(x - 1) % w, y]) / 255
            dy = (p[x, (y + 1) % h] - p[x, (y - 1) % h]) / 255
            nx, ny, nz = -dx * forca, -dy * forca, 1.0
            comp = math.sqrt(nx * nx + ny * ny + nz * nz)
            s[x, y] = (int((nx / comp * 0.5 + 0.5) * 255),
                       int((ny / comp * 0.5 + 0.5) * 255),
                       int((nz / comp * 0.5 + 0.5) * 255))
    return saida


# ---------------------------------------------------------------- pedra

def pedra():
    """Alvenaria: fileiras deslocadas, cada bloco com tom e desgaste proprios."""
    cor = Image.new("RGB", (TAM, TAM), (58, 58, 68))     # argamassa
    altura = Image.new("L", (TAM, TAM), 40)
    dc, da = ImageDraw.Draw(cor), ImageDraw.Draw(altura)

    linhas, colunas, junta = 8, 4, 6
    alt, larg = TAM // linhas, TAM // colunas

    for i in range(linhas):
        desloca = (larg // 2) if i % 2 else 0
        for j in range(-1, colunas + 1):
            x, y = j * larg + desloca, i * alt
            caixa = [x + junta, y + junta, x + larg - junta, y + alt - junta]
            tom = random.randint(-20, 20)
            base = (112 + tom, 110 + tom, 122 + tom)
            dc.rectangle(caixa, fill=base)
            da.rectangle(caixa, fill=200 + random.randint(-25, 25))

            # chanfro: a borda de baixo do bloco fica mais escura
            dc.line([caixa[0], caixa[3], caixa[2], caixa[3]],
                    fill=tuple(int(c * 0.72) for c in base), width=3)
            dc.line([caixa[0], caixa[1], caixa[2], caixa[1]],
                    fill=tuple(min(255, int(c * 1.12)) for c in base), width=2)

            # manchas de desgaste dentro do bloco
            for _ in range(3):
                mx = random.randint(caixa[0], max(caixa[0], caixa[2] - 26))
                my = random.randint(caixa[1], max(caixa[1], caixa[3] - 26))
                raio = random.randint(14, 26)
                fator = random.uniform(0.80, 0.94)   # um fator so, senao a mancha fica colorida
                escuro = tuple(int(c * fator) for c in base)
                dc.ellipse([mx, my, mx + raio, my + raio], fill=escuro)
                da.ellipse([mx, my, mx + raio, my + raio], fill=170)

    return ruido(cor, 7), altura


# -------------------------------------------------------------- madeira

def madeira():
    """Veios tortos, com nos espalhados pela tabua."""
    cor = Image.new("RGB", (TAM, TAM))
    altura = Image.new("L", (TAM, TAM))
    pc, pa = cor.load(), altura.load()

    nos = [(random.randint(0, TAM), random.randint(0, TAM),
            random.uniform(18, 34)) for _ in range(4)]

    for y in range(TAM):
        for x in range(TAM):
            # distancia ao no mais proximo entorta o veio em volta dele
            desvio = 0
            for nx, ny, forca in nos:
                d = math.hypot(x - nx, y - ny) + 1
                desvio += forca * 12 / d

            onda = math.sin((y + desvio) / TAM * math.pi * 2 * 14
                            + math.sin(x * 0.012) * 1.6)
            t = onda * 0.5 + 0.5
            g = random.randint(-5, 5)
            pc[x, y] = (int(92 + t * 74) + g, int(58 + t * 46) + g, int(30 + t * 24) + g)
            pa[x, y] = int(70 + t * 150)

    # o centro do no fica escuro
    dc, da = ImageDraw.Draw(cor), ImageDraw.Draw(altura)
    for nx, ny, forca in nos:
        r = forca * 0.33
        dc.ellipse([nx - r, ny - r, nx + r, ny + r], fill=(58, 36, 20))
        da.ellipse([nx - r, ny - r, nx + r, ny + r], fill=40)

    return cor, altura


# ---------------------------------------------------------------- manto

def manto():
    """Tecido do Dementador: trama cruzada, dobras verticais e barra rasgada."""
    cor = Image.new("RGBA", (TAM, TAM), (34, 35, 45, 255))
    altura = Image.new("L", (TAM, TAM), 128)
    pc, pa = cor.load(), altura.load()

    for y in range(TAM):
        for x in range(TAM):
            # trama: dois fios cruzados de 3 px
            fio = 14 if ((x // 3) % 2) ^ ((y // 3) % 2) else 0
            # dobras: sombra longa na vertical, acompanhando a queda do pano
            dobra = math.sin(x / TAM * math.pi * 2 * 6) * 12
            v = int(fio + dobra)
            r, g, b, a = pc[x, y]
            pc[x, y] = (max(0, r + v), max(0, g + v), max(0, b + v + 4), a)
            pa[x, y] = max(0, min(255, 128 + v * 4))

    # franja: tiras verticais de altura sorteada ficam transparentes
    tiras = 72
    larg = TAM // tiras
    for i in range(tiras):
        corte = int(TAM * random.uniform(0.10, 0.32))
        for y in range(TAM - corte, TAM):
            for x in range(i * larg, min(TAM, (i + 1) * larg)):
                r, g, b, _ = pc[x, y]
                pc[x, y] = (r, g, b, 0)

    return cor, altura


# ------------------------------------------------------------------- uv

def uv():
    """Xadrez de referencia, para conferir o mapeamento UV na cena."""
    img = Image.new("RGB", (TAM, TAM), (235, 235, 235))
    d = ImageDraw.Draw(img)
    lado = TAM // 8
    for i in range(8):
        for j in range(8):
            if (i + j) % 2:
                d.rectangle([j * lado, i * lado, (j + 1) * lado, (i + 1) * lado],
                            fill=(60, 120, 200))
    d.rectangle([0, 0, TAM - 1, TAM - 1], outline=(220, 60, 60), width=6)
    return img


for nome, (cor, altura) in [("pedra", pedra()), ("madeira", madeira()), ("manto", manto())]:
    cor.save(f"{RAIZ}/{nome}.png")
    normal_map(altura).save(f"{RAIZ}/{nome}-normal.png")
    print("gerado", nome, "+ normal")

uv().save(f"{RAIZ}/uv.png")
print("gerado uv")
