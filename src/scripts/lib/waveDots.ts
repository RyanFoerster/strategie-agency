/**
 * WaveCanvas — the signature transition of the prototype.
 *
 * Takes the "pixel reveal" idea from the references and makes it Strategie:
 * the next image appears through rounded dots that grow into tiles, along a
 * wave-shaped front, with a band of green→teal pastilles riding the front.
 *
 * Canvas 2D on purpose: the media is hot-linked from strategie.agency without
 * CORS headers, which WebGL refuses but drawImage() accepts.
 */
import gsap from 'gsap';
import { clamp01 } from './utils';

export type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

/**
 * dots    rounded dots growing into tiles (v1)
 * wave    a soft sine-shaped edge sweeping across, riding a ribbon of gradient lines (v2)
 * fade    minimal cross-fade with a slow zoom settle (v2)
 */
export type TransitionMode = 'dots' | 'wave' | 'fade';

type Layer = { src: Source | null; scale: number };

export type WaveOptions = {
  mode?: TransitionMode;
  /** cell size in css px for a given canvas size */
  cell?: (w: number, h: number) => number;
  /** colour painted when there is no media (or while it loads) */
  bg?: string;
  /** gradient pastilles on the wave front */
  accent?: boolean;
  colors?: [string, string];
};

export type ToOptions = {
  duration?: number;
  /** direction the front travels along: x = horizontal, y = vertical */
  axis?: 'x' | 'y';
  /** x: 1 = left→right, y: 1 = bottom→top */
  dir?: 1 | -1;
  fromScale?: number;
  toScale?: number;
  ease?: string;
};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function mediaSize(src: Source): [number, number] {
  if (src instanceof HTMLVideoElement) return [src.videoWidth, src.videoHeight];
  if (src instanceof HTMLImageElement) return [src.naturalWidth, src.naturalHeight];
  return [src.width, src.height];
}

export function isReady(src: Source | null): boolean {
  if (!src) return true;
  if (src instanceof HTMLVideoElement) return src.readyState >= 2 && src.videoWidth > 0;
  if (src instanceof HTMLImageElement) return src.complete && src.naturalWidth > 0;
  return src.width > 0;
}

export function whenReady(src: Source | null, timeout = 3000): Promise<void> {
  if (!src || isReady(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.clearTimeout(timer);
      src.removeEventListener('load', done);
      src.removeEventListener('loadeddata', done);
      src.removeEventListener('error', done);
      resolve();
    };
    const timer = window.setTimeout(done, timeout);
    src.addEventListener('load', done);
    src.addEventListener('loadeddata', done);
    src.addEventListener('error', done);
  });
}

const registry = new Set<WaveCanvas>();
let tickerOn = false;
function startTicker() {
  if (tickerOn) return;
  tickerOn = true;
  gsap.ticker.add(() => registry.forEach((c) => c.tick()));
}

export class WaveCanvas {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private snap = document.createElement('canvas');
  private w = 0;
  private h = 0;
  private dpr = 1;
  private a: Layer = { src: null, scale: 1 };
  private b: Layer = { src: null, scale: 1 };
  private progress = 0;
  private transitioning = false;
  private axis: 'x' | 'y' = 'y';
  private dir: 1 | -1 = 1;
  private phase = 0;
  private tween?: gsap.core.Tween;
  private token = 0;
  private visible = true;
  private dirty = true;
  private grad: CanvasGradient | string;
  private opts: Required<WaveOptions>;

  constructor(canvas: HTMLCanvasElement, options: WaveOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.opts = {
      mode: 'dots',
      cell: (w) => Math.max(18, Math.min(48, w / 24)),
      bg: '#0c0c0c',
      accent: true,
      colors: ['#00c74c', '#0089b2'],
      ...options,
    };
    this.grad = this.opts.colors[0];
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.dirty = true;
      },
      { rootMargin: '15% 0px' },
    ).observe(canvas);
    this.resize();
    registry.add(this);
    startTicker();
  }

  /** what the canvas shows, or is heading to */
  get target(): Source | null {
    return this.transitioning ? this.b.src : this.a.src;
  }

  resize() {
    // layout size, unaffected by transforms (the hero frame gets scaled)
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    if (!w || !h) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    const g = this.ctx.createLinearGradient(0, 0, w, h * 0.35);
    g.addColorStop(0, this.opts.colors[0]);
    g.addColorStop(1, this.opts.colors[1]);
    this.grad = g;
    this.dirty = true;
  }

  setMode(mode: TransitionMode) {
    this.opts.mode = mode;
  }

  /** show a source immediately */
  set(src: Source | null, scale = 1) {
    this.token++;
    this.tween?.kill();
    this.a = { src, scale };
    this.b = { src: null, scale: 1 };
    this.transitioning = false;
    this.progress = 0;
    this.dirty = true;
  }

  /** wave-dot transition to a new source */
  async to(src: Source | null, o: ToOptions = {}) {
    const token = ++this.token;
    if (src instanceof HTMLVideoElement) src.play().catch(() => {});
    await whenReady(src, 2500);
    if (token !== this.token) return;

    const { duration = 1.1, axis = 'y', dir = 1, fromScale = 1, toScale = 1, ease = 'power1.inOut' } = o;

    if (this.transitioning) {
      // interrupted: freeze what is on screen and start from there
      this.snap.width = this.canvas.width;
      this.snap.height = this.canvas.height;
      this.snap.getContext('2d')!.drawImage(this.canvas, 0, 0);
      this.a = { src: this.snap, scale: 1 };
      this.tween?.kill();
    }

    const layer: Layer = { src, scale: fromScale };
    this.b = layer;
    this.axis = axis;
    this.dir = dir;
    this.phase = Math.random() * Math.PI * 2;
    this.progress = 0;
    this.transitioning = true;
    this.dirty = true;

    if (fromScale !== toScale) {
      gsap.to(layer, {
        scale: toScale,
        duration: Math.max(duration * 1.8, 0.01),
        ease: 'expo.out',
        onUpdate: () => {
          this.dirty = true;
        },
      });
    }

    await new Promise<void>((resolve) => {
      this.tween = gsap.to(this, {
        progress: 1,
        duration,
        ease,
        onComplete: () => {
          this.a = layer;
          this.b = { src: null, scale: 1 };
          this.transitioning = false;
          this.dirty = true;
          resolve();
        },
        onInterrupt: () => resolve(),
      });
    });
  }

  tick() {
    if (!this.visible || !this.w) return;
    const playing = (l: Layer) => l.src instanceof HTMLVideoElement && !l.src.paused;
    const pending = !isReady(this.a.src) || (this.transitioning && !isReady(this.b.src));
    if (this.dirty || this.transitioning || playing(this.a) || playing(this.b) || pending) {
      this.draw();
      this.dirty = false;
    }
  }

  private paint(layer: Layer) {
    const { ctx, w, h } = this;
    const src = layer.src;
    if (!src || !isReady(src)) {
      ctx.fillStyle = this.opts.bg;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const [sw, sh] = mediaSize(src);
    const r = Math.max(w / sw, h / sh) * layer.scale;
    const dw = sw * r;
    const dh = sh * r;
    ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  private draw() {
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.paint(this.a);
    if (!this.transitioning) return;
    if (this.opts.mode === 'wave') return this.drawWave();
    if (this.opts.mode === 'fade') return this.drawFade();

    const cell = this.opts.cell(w, h);
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    const ox = (w - cols * cell) / 2;
    const oy = (h - rows * cell) / 2;
    const spread = 0.42;
    const P = this.progress * (1 + spread);
    const round = typeof ctx.roundRect === 'function';
    const accents: number[] = [];

    ctx.save();
    ctx.beginPath();
    for (let j = 0; j < rows; j++) {
      const cy = oy + j * cell + cell / 2;
      const ny = cy / h;
      for (let i = 0; i < cols; i++) {
        const cx = ox + i * cell + cell / 2;
        const nx = cx / w;
        const along = this.axis === 'y' ? (this.dir > 0 ? 1 - ny : ny) : this.dir > 0 ? nx : 1 - nx;
        const across = this.axis === 'y' ? nx : ny;
        // the wave: a sine-shaped front, like their brand ribbon
        const front = along * 0.78 + 0.11 + Math.sin(across * Math.PI * 2.2 + this.phase) * 0.09;
        const l = clamp01((P - front) / spread);
        if (l <= 0) continue;
        const e = easeOutCubic(l);
        const s = cell * 1.06 * e;
        // a dot that becomes a tile: radius goes from s/2 (circle) to 0 (square)
        const rad = (s / 2) * (1 - e * e);
        if (round) {
          ctx.roundRect(cx - s / 2, cy - s / 2, s, s, rad);
        } else {
          const rr = (s / 2) * (l >= 1 ? 1.42 : 1);
          ctx.moveTo(cx + rr, cy);
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        }
        if (l < 1 && this.opts.accent) accents.push(cx, cy, l);
      }
    }
    ctx.clip();
    this.paint(this.b);
    ctx.restore();

    if (accents.length) {
      ctx.beginPath();
      for (let k = 0; k < accents.length; k += 3) {
        const r = cell * 0.32 * Math.sin(accents[k + 2] * Math.PI);
        if (r < 0.4) continue;
        ctx.moveTo(accents[k] + r, accents[k + 1]);
        ctx.arc(accents[k], accents[k + 1], r, 0, Math.PI * 2);
      }
      ctx.fillStyle = this.grad;
      ctx.fill();
    }
  }

  /** minimal: cross-fade (the incoming layer's scale settles at the same time) */
  private drawFade() {
    const { ctx } = this;
    ctx.globalAlpha = clamp01(this.progress);
    this.paint(this.b);
    ctx.globalAlpha = 1;
  }

  /** the wave: a soft sine edge sweeps across, a ribbon of gradient lines rides just ahead of it */
  private drawWave() {
    const { ctx, w, h } = this;
    const P = this.progress;
    const vertical = this.axis === 'y';
    const L = vertical ? h : w; // travel length
    const S = vertical ? w : h; // span of the edge
    const maxAmp = Math.min(L * 0.075, 64);
    const amp = maxAmp * Math.sin(Math.PI * P);
    const margin = maxAmp * 1.2 + 40;
    const base = -margin + P * (L + 2 * margin);
    const ph = this.phase + P * Math.PI * 1.3;
    const steps = Math.max(32, Math.ceil(S / 10));
    // distance of the edge from the side it comes from, for n in [0, 1] across the span
    const front = (n: number, shift = 0) =>
      base +
      shift +
      amp * (0.8 * Math.sin(n * Math.PI * 2.3 + ph + shift * 0.015) + 0.2 * Math.sin(n * Math.PI * 5.1 - ph * 1.3));
    const toXY = (s: number, u: number): [number, number] =>
      vertical ? [s, this.dir > 0 ? h - u : u] : [this.dir > 0 ? u : w - u, s];

    const trace = (shift: number) => {
      for (let i = 0; i <= steps; i++) {
        const n = i / steps;
        const [x, y] = toXY(n * S, front(n, shift));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    };

    // revealed area: from the origin side up to the edge
    ctx.save();
    ctx.beginPath();
    trace(0);
    let [x, y] = toXY(S, -4);
    ctx.lineTo(x, y);
    [x, y] = toXY(0, -4);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.clip();
    this.paint(this.b);
    ctx.restore();

    // the ribbon (fades in and out with the move)
    const alpha = Math.sin(Math.PI * P);
    if (alpha < 0.02) return;
    ctx.strokeStyle = this.grad;
    for (let e = 0; e < 6; e++) {
      ctx.beginPath();
      trace(e * 8);
      ctx.lineWidth = e === 0 ? 2 : 1;
      ctx.globalAlpha = alpha * (e === 0 ? 1 : 0.55 - e * 0.08);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
