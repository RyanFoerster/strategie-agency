/**
 * WaveLines — a live take on Strategie's wave visual: a ribbon of fine lines
 * that twists, bunches and spreads, and bends away from the cursor.
 */
import gsap from 'gsap';

type Options = { lines?: number; dark?: boolean; speed?: number };

export class WaveLines {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private visible = false;
  private t = Math.random() * 50;
  private mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
  private grad: CanvasGradient | string = '#00c74c';
  private o: Required<Options>;

  constructor(
    private canvas: HTMLCanvasElement,
    options: Options = {},
  ) {
    this.o = { lines: 44, dark: false, speed: 1, ...options };
    this.ctx = canvas.getContext('2d')!;
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(canvas);
    window.addEventListener(
      'pointermove',
      (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouse.tx = e.clientX - r.left;
        this.mouse.ty = e.clientY - r.top;
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => {
      this.mouse.tx = -1e4;
      this.mouse.ty = -1e4;
    });
    this.resize();
    gsap.ticker.add((_time, dt) => this.frame(dt));
  }

  private resize() {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    if (!w || !h) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    const g = this.ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#00c74c');
    g.addColorStop(1, '#0089b2');
    this.grad = g;
  }

  private frame(dt: number) {
    if (!this.visible || !this.w) return;
    this.t += (Math.min(dt, 64) / 1000) * this.o.speed;
    const m = this.mouse;
    if (m.tx < -1e3) {
      m.x = m.tx;
      m.y = m.ty;
    } else {
      if (m.x < -1e3) {
        m.x = m.tx;
        m.y = m.ty;
      }
      m.x += (m.tx - m.x) * 0.08;
      m.y += (m.ty - m.y) * 0.08;
    }
    this.draw();
  }

  private draw() {
    const { ctx, w, h, t } = this;
    const n = this.o.lines;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = this.o.dark ? 1 : 1.1;
    ctx.strokeStyle = this.grad;

    const cy = h * 0.5;
    const amp = h * 0.22;
    const gap = (h * 0.5) / n;
    const step = Math.max(6, w / 150);
    const R = Math.min(170, w * 0.12);
    const { x: mx, y: my } = this.mouse;

    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      ctx.beginPath();
      for (let x = -step; x <= w + step; x += step) {
        const nx = x / w;
        // the ribbon twists: its width goes through zero and flips
        const twist = Math.sin(nx * Math.PI * 1.55 + t * 0.32 + 0.7);
        let y =
          cy +
          Math.sin(nx * Math.PI * 2.1 + t * 0.45) * amp * 0.85 +
          Math.sin(nx * 5.2 - t * 0.7 + i * 0.045) * amp * 0.1 +
          k * gap * (0.25 + 0.75 * twist);
        const dx = x - mx;
        const dy = y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R * 6) {
          const f = Math.exp(-d2 / (2 * R * R));
          y += (dy >= 0 ? 1 : -1) * f * 46;
        }
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const edge = Math.abs(k) / (n / 2);
      ctx.globalAlpha = (this.o.dark ? 0.75 : 0.9) * (1 - edge * 0.65);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
