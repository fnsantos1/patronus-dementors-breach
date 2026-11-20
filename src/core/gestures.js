// Reconhecimento de gestos 2D desenhados com o mouse (Circulo, Triangulo, Quadrado).
// Ativado ao segurar o botao direito do mouse.

export class GestureRecognizer {
  constructor(onRecognize, { onStart, onEnd } = {}) {
    this.onRecognize = onRecognize;
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.isDrawing = false;
    this.points = [];

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.inset = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('pointerdown', (e) => {
      if (e.button === 2) {
        this.isDrawing = true;
        this.points = [{ x: e.clientX, y: e.clientY }];
        this.renderStroke();
        if (this.onStart) this.onStart();
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      const last = this.points[this.points.length - 1];
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (dx * dx + dy * dy > 16) {
        this.points.push({ x: e.clientX, y: e.clientY });
        this.renderStroke();
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (e.button === 2 && this.isDrawing) {
        this.isDrawing = false;
        const result = this.recognize(this.points);
        this.clear();
        if (this.onEnd) this.onEnd();
        if (result && this.onRecognize) {
          this.onRecognize(result.shape, result.center);
        }
      }
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderStroke() {
    this.clear();
    if (this.points.length < 2) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#8fd3ff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#4aa8ff';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  recognize(pts) {
    if (pts.length < 10) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let totalLen = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (i > 0) {
        totalLen += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    if (Math.max(width, height) < 40 || totalLen < 80) return null;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const center = { x: cx, y: cy };

    // 0. Checa linha reta (Dash): distancia ponta-a-ponta proxima do comprimento total
    const start = pts[0];
    const end = pts[pts.length - 1];
    const directDist = Math.hypot(end.x - start.x, end.y - start.y);
    if (directDist / totalLen > 0.88) {
      return { shape: 'line', center };
    }

    // 1. Checa circularidade (variancia da distancia ao centroide)
    const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const avgR = radii.reduce((a, b) => a + b, 0) / radii.length;
    const variance = radii.reduce((a, r) => a + Math.abs(r - avgR), 0) / radii.length;
    const circularityError = variance / (avgR || 1);

    if (circularityError < 0.16) {
      return { shape: 'circle', center };
    }

    // 2. Conta cantos significativos (mudanca de direcao > 45 graus)
    const corners = this.countCorners(pts, Math.max(width, height) * 0.12);
    if (corners <= 3) return { shape: 'triangle', center };
    if (corners >= 4) return { shape: 'square', center };

    return null;
  }

  countCorners(pts, minSegment) {
    // Reamostra em segmentos maiores para ignorar tremor da mao
    const simplified = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const last = simplified[simplified.length - 1];
      if (Math.hypot(pts[i].x - last.x, pts[i].y - last.y) >= minSegment) {
        simplified.push(pts[i]);
      }
    }
    if (simplified.length < 3) return 0;

    let corners = 0;
    for (let i = 1; i < simplified.length - 1; i++) {
      const a = simplified[i - 1];
      const b = simplified[i];
      const c = simplified[i + 1];
      const v1x = b.x - a.x;
      const v1y = b.y - a.y;
      const v2x = c.x - b.x;
      const v2y = c.y - b.y;
      const dot = v1x * v2x + v1y * v2y;
      const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
      if (mag > 0) {
        const angle = Math.acos(Math.max(-1, Math.min(1, dot / mag)));
        if (angle > 0.65) corners++;
      }
    }
    return corners;
  }
}
