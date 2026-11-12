/**
 * StratAI, alive.
 *
 * Their robot is a single flat PNG, so the "acting" comes from two layers:
 * - the body (the PNG) floats, hops, leans, wiggles, droops… (GSAP on a rig)
 * - the visor is redrawn live on a canvas: Strategie's wave lines run across
 *   the screen and the face (eyes, mouth, loader, hearts) changes with the mood.
 */
import gsap from 'gsap';
import type { Ctx } from '../ctx';

export type Mood = 'idle' | 'listen' | 'think' | 'happy' | 'love' | 'confused' | 'sleep' | 'proud' | 'excited' | 'dance';
export type Fx = 'hearts' | 'notes' | 'sparks' | 'question' | 'zzz';

/** visor position inside the source image (500 × 526), mirrored in v4.css */
const IMG = { w: 500, h: 526 };
export const VISOR = { x: 137, y: 44, w: 216, h: 188 };
/** eye centres, relative to the visor box (they sit where the original glowing eyes are) */
const EYES = [
  { x: 0.25, y: 0.46 },
  { x: 0.7, y: 0.49 },
];

type Face = {
  power: number;
  open: number;
  squint: number;
  lookX: number;
  lookY: number;
  happy: number;
  heart: number;
  sleepy: number;
  wide: number;
  load: number;
  confused: number;
  talk: number;
  amp: number;
  speed: number;
  swirl: number;
  glow: number;
};

const NEUTRAL = { happy: 0, heart: 0, sleepy: 0, wide: 0, load: 0, confused: 0, squint: 1, swirl: 0 };
const MOODS: Record<Mood, Partial<Face>> = {
  idle: { ...NEUTRAL, amp: 1, speed: 1, glow: 1 },
  listen: { ...NEUTRAL, wide: 0.3, amp: 1.4, speed: 1.7, glow: 1.2 },
  think: { ...NEUTRAL, load: 1, amp: 1.2, speed: 3.4, swirl: 1, glow: 1.1 },
  happy: { ...NEUTRAL, happy: 1, amp: 1.5, speed: 1.8, glow: 1.3 },
  love: { ...NEUTRAL, heart: 1, amp: 1.6, speed: 1.4, glow: 1.4 },
  confused: { ...NEUTRAL, confused: 1, wide: 0.15, amp: 0.8, speed: 0.7, glow: 0.9 },
  sleep: { ...NEUTRAL, sleepy: 1, amp: 0.4, speed: 0.3, glow: 0.55 },
  proud: { ...NEUTRAL, squint: 0.62, amp: 1.3, speed: 1.3, glow: 1.25 },
  excited: { ...NEUTRAL, wide: 1, amp: 2, speed: 2.6, swirl: 0.3, glow: 1.5 },
  dance: { ...NEUTRAL, happy: 1, amp: 2, speed: 3, swirl: 0.6, glow: 1.4 },
};

/* particles: little SVG shapes (no font dependency), plain text for ? and z */
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
const GLYPH: Record<Fx, string> = {
  hearts: svg('M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z'),
  notes: svg('M9 18.5a3 3 0 1 1-2-2.83V5l12-2v12.5a3 3 0 1 1-2-2.83V7.2L9 8.6z'),
  sparks: svg('M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z'),
  question: '?',
  zzz: 'z',
};

export class Robot {
  readonly el: HTMLElement;
  mood: Mood = 'idle';
  onPoke: () => void = () => {};

  private float: HTMLElement;
  private rig: HTMLElement;
  private canvas: HTMLCanvasElement;
  private c: CanvasRenderingContext2D;
  private shadow: HTMLElement;
  private fx: HTMLElement;
  private f: Face = {
    power: 0,
    open: 0,
    squint: 1,
    lookX: 0,
    lookY: 0,
    happy: 0,
    heart: 0,
    sleepy: 0,
    wide: 0,
    load: 0,
    confused: 0,
    talk: 0,
    amp: 1,
    speed: 1,
    swirl: 0,
    glow: 1,
  };
  private look = { x: 0, y: 0 };
  private override: { x: number; y: number } | null = null;
  private overrideTimer = 0;
  private t = 0;
  private phase = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private visible = true;
  private zzzTimer = 0;

  constructor(
    el: HTMLElement,
    private ctx: Ctx,
  ) {
    this.el = el;
    this.float = el.querySelector('.bot__float')!;
    this.rig = el.querySelector('.bot__rig')!;
    this.canvas = el.querySelector('.bot__visor')!;
    this.c = this.canvas.getContext('2d')!;
    this.shadow = el.querySelector('.bot__shadow')!;
    this.fx = el.querySelector('.bot__fx')!;

    new ResizeObserver(() => this.resize()).observe(this.canvas);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(el);
    window.addEventListener(
      'pointermove',
      (e) => {
        const r = this.canvas.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        this.look.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.45)));
        this.look.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.45)));
      },
      { passive: true },
    );
    this.rig.addEventListener('click', () => this.onPoke());
    this.resize();
    gsap.ticker.add((_time, dt) => this.tick(dt));
    this.scheduleBlink();
  }

  /* ---------- public api ---------- */

  /** drop in, power the visor on, open the eyes */
  boot() {
    if (this.ctx.reduced) {
      this.f.power = 1;
      this.f.open = 1;
      return Promise.resolve();
    }
    // the drop is on the outer element: the body moves (on the rig) can't cut it short
    gsap.set(this.el, { y: -90, opacity: 0 });
    return gsap
      .timeline({ onComplete: () => gsap.set(this.el, { opacity: 1, y: 0 }) })
      .to(this.el, { opacity: 1, duration: 0.25 })
      .to(this.el, { y: 0, duration: 0.9, ease: 'bounce.out' }, 0)
      .to(this.f, { power: 0.7, duration: 0.08 }, 0.55)
      .to(this.f, { power: 0.15, duration: 0.08 })
      .to(this.f, { power: 0.9, duration: 0.1 })
      .to(this.f, { power: 0.4, duration: 0.06 })
      .to(this.f, { power: 1, duration: 0.2 })
      .to(this.f, { open: 1, duration: 0.3, ease: 'back.out(3)' }, '+=0.1')
      .then(() => undefined);
  }

  setMood(m: Mood) {
    const prev = this.mood;
    this.mood = m;
    gsap.to(this.f, { ...MOODS[m], duration: m === 'think' ? 0.3 : 0.55, ease: 'power2.out', overwrite: 'auto' });
    window.clearInterval(this.zzzTimer);
    if (prev === 'sleep' && m !== 'sleep') gsap.to(this.rig, { rotation: 0, y: 0, duration: 0.4, ease: 'back.out(2)' });

    switch (m) {
      case 'listen':
        this.lookAt(0.05, 0.75, 0);
        break;
      case 'think':
        this.lookAt(0.45, -0.7, 0);
        this.wobble();
        break;
      case 'happy':
        this.hop(26);
        this.spawn('sparks', 3);
        break;
      case 'love':
        this.hop(18);
        this.spawn('hearts', 7);
        break;
      case 'excited':
        this.hop(52);
        this.spawn('sparks', 6);
        break;
      case 'dance':
        this.dance();
        this.spawn('notes', 6);
        break;
      case 'confused':
        this.lookAt(-0.5, -0.5, 1800);
        this.tilt(-7);
        this.spawn('question', 2);
        break;
      case 'proud':
        this.puff();
        this.spawn('sparks', 4);
        break;
      case 'sleep':
        this.lookAt(0, 0.5, 0);
        gsap.to(this.rig, { rotation: 7, y: 10, duration: 1.4, ease: 'sine.inOut', overwrite: true });
        this.spawn('zzz', 1);
        this.zzzTimer = window.setInterval(() => this.spawn('zzz', 1), 1600);
        break;
      default:
        this.lookAt(null);
    }
  }

  /** mouth on / off while the answer is typed */
  speak(on: boolean) {
    gsap.to(this.f, { talk: on ? 1 : 0, duration: 0.25, overwrite: 'auto' });
  }

  /** a small nod on each keystroke */
  nod() {
    if (this.ctx.reduced) return;
    gsap.fromTo(this.rig, { y: 0 }, { y: 4, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.out', overwrite: true });
  }

  /** look somewhere for a while (x, y in -1…1), null = follow the cursor again */
  lookAt(x: number | null, y = 0, ms = 2200) {
    window.clearTimeout(this.overrideTimer);
    this.override = x === null ? null : { x, y };
    if (x !== null && ms > 0) this.overrideTimer = window.setTimeout(() => (this.override = null), ms);
  }

  /** point the eyes at an element on the page */
  lookAtElement(target: Element, ms = 2400) {
    const r = target.getBoundingClientRect();
    const v = this.canvas.getBoundingClientRect();
    const x = (r.left + r.width / 2 - (v.left + v.width / 2)) / (window.innerWidth * 0.45);
    const y = (r.top + r.height / 2 - (v.top + v.height / 2)) / (window.innerHeight * 0.45);
    this.lookAt(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)), ms);
  }

  /** centre of the visor, in viewport coordinates */
  visorCenter() {
    const v = this.canvas.getBoundingClientRect();
    return { x: v.left + v.width / 2, y: v.top + v.height / 2 };
  }

  wiggle() {
    if (this.ctx.reduced) return;
    gsap.killTweensOf(this.rig);
    gsap
      .timeline()
      .to(this.rig, { rotation: -7, duration: 0.07 })
      .to(this.rig, { rotation: 7, duration: 0.1, yoyo: true, repeat: 4, ease: 'sine.inOut' })
      .to(this.rig, { rotation: 0, duration: 0.35, ease: 'back.out(2)' });
  }

  /** random little things while waiting */
  fidget() {
    const pick = Math.floor(Math.random() * 4);
    if (pick === 0) {
      this.lookAt(-0.9, -0.1, 900);
      window.setTimeout(() => this.lookAt(0.9, -0.1, 900), 900);
    } else if (pick === 1) {
      this.hop(14);
    } else if (pick === 2) {
      this.blink(true);
    } else {
      this.spawn('notes', 2);
      this.tilt(4);
    }
  }

  spawn(kind: Fx, n = 4) {
    if (this.ctx.reduced) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = `fx fx--${kind}`;
      s.innerHTML = GLYPH[kind];
      this.fx.append(s);
      const x = (Math.random() - 0.5) * (kind === 'zzz' ? 60 : 200);
      const dur = 1.5 + Math.random() * 0.9;
      gsap
        .timeline({ delay: i * 0.09, onComplete: () => s.remove() })
        .fromTo(
          s,
          { x: (Math.random() - 0.5) * 30, y: 0, scale: 0.4, rotation: 0, opacity: 0 },
          {
            x: kind === 'zzz' ? 40 + x : x,
            y: -110 - Math.random() * 90,
            scale: 0.7 + Math.random() * 0.8,
            rotation: (Math.random() - 0.5) * 50,
            duration: dur,
            ease: 'power2.out',
          },
        )
        .to(s, { opacity: 1, duration: 0.2 }, 0)
        .to(s, { opacity: 0, duration: 0.5 }, dur - 0.5);
    }
  }

  /* ---------- body moves ---------- */

  private hop(height: number) {
    if (this.ctx.reduced) return;
    gsap.killTweensOf(this.rig);
    gsap
      .timeline()
      .to(this.rig, { scaleY: 0.93, scaleX: 1.05, rotation: 0, duration: 0.12, ease: 'power2.out' })
      .to(this.rig, { y: -height, scaleY: 1.06, scaleX: 0.96, duration: 0.28, ease: 'power2.out' })
      .to(this.rig, { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: 'power2.in' })
      .to(this.rig, { scaleY: 0.95, scaleX: 1.04, duration: 0.08 })
      .to(this.rig, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  }

  private dance() {
    if (this.ctx.reduced) return;
    gsap.killTweensOf(this.rig);
    const tl = gsap.timeline();
    for (let i = 0; i < 4; i++) {
      tl.to(this.rig, { y: -22, rotation: i % 2 ? 9 : -9, duration: 0.18, ease: 'power2.out' }).to(this.rig, {
        y: 0,
        duration: 0.18,
        ease: 'power2.in',
      });
    }
    tl.to(this.rig, { rotation: 0, duration: 0.4, ease: 'back.out(2)' });
  }

  private wobble() {
    if (this.ctx.reduced) return;
    gsap.killTweensOf(this.rig);
    gsap
      .timeline()
      .to(this.rig, { rotation: 3, duration: 0.22, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to(this.rig, { rotation: 0, duration: 0.2 });
  }

  private tilt(deg: number) {
    if (this.ctx.reduced) return;
    gsap.killTweensOf(this.rig);
    gsap
      .timeline()
      .to(this.rig, { rotation: deg, duration: 0.35, ease: 'back.out(2)' })
      .to(this.rig, { rotation: 0, duration: 0.6, ease: 'power2.inOut' }, '+=1.2');
  }

  private puff() {
    if (this.ctx.reduced) return;
    gsap.killTweensOf(this.rig);
    gsap
      .timeline()
      .to(this.rig, { scale: 1.06, rotation: -2, duration: 0.3, ease: 'back.out(2)' })
      .to(this.rig, { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, '+=0.5');
  }

  private blink(double = false) {
    if (this.mood === 'sleep') return;
    const tl = gsap.timeline();
    tl.to(this.f, { open: 0.05, duration: 0.07, ease: 'power2.in' }).to(this.f, { open: 1, duration: 0.1, ease: 'power2.out' });
    if (double) tl.to(this.f, { open: 0.05, duration: 0.07 }).to(this.f, { open: 1, duration: 0.1 });
  }

  private scheduleBlink() {
    window.setTimeout(() => {
      if (this.f.power > 0.5 && this.f.load < 0.5) this.blink(Math.random() < 0.2);
      this.scheduleBlink();
    }, 2200 + Math.random() * 3200);
  }

  /* ---------- frame ---------- */

  private resize() {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    if (!w || !h) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  private tick(dt: number) {
    if (!this.visible || !this.w) return;
    const s = Math.min(dt, 64) / 1000;
    this.t += s;
    this.phase += s * this.f.speed;
    const target = this.override ?? this.look;
    this.f.lookX += (target.x - this.f.lookX) * 0.1;
    this.f.lookY += (target.y - this.f.lookY) * 0.1;

    if (!this.ctx.reduced) {
      const k = 1 - this.f.sleepy * 0.65;
      const y = Math.sin(this.t * 1.15) * 9 * k;
      const r = Math.sin(this.t * 0.75) * 1.3 * k + this.f.lookX * 2.4;
      this.float.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg)`;
      this.shadow.style.transform = `scaleX(${(1 - y / 80).toFixed(3)})`;
      this.shadow.style.opacity = (0.85 - y / 50).toFixed(3);
    }
    this.draw();
  }

  private visorPath() {
    const { c, w, h } = this;
    c.beginPath();
    c.roundRect(0, 0, w, h, Math.min(w, h) * 0.3);
  }

  private draw() {
    const { c, w, h, f } = this;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.save();
    this.visorPath();
    c.clip();

    // the screen
    const bg = c.createRadialGradient(w * 0.42, h * 0.42, h * 0.05, w * 0.5, h * 0.5, w * 0.75);
    bg.addColorStop(0, '#0f6a5a');
    bg.addColorStop(1, '#05302a');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    const P = f.power;
    if (P > 0.01) {
      // Strategie's wave, running across the visor
      const lines = c.createLinearGradient(0, 0, w, h);
      lines.addColorStop(0, '#2cf28b');
      lines.addColorStop(1, '#17b3d6');
      c.strokeStyle = lines;
      c.lineWidth = Math.max(1, w / 210);
      c.globalAlpha = Math.min(1, 0.42 * P * f.glow);
      const N = 22;
      const step = w / 26;
      for (let i = 0; i < N; i++) {
        const y0 = h * (0.05 + (i / (N - 1)) * 0.9);
        const A = h * 0.034 * f.amp * (1 + f.talk * 0.7 * Math.sin(this.t * 18 + i));
        const off = i * (0.25 + f.swirl * 0.7);
        c.beginPath();
        for (let x = -step; x <= w + step; x += step) {
          const nx = x / w;
          const y =
            y0 +
            Math.sin(nx * Math.PI * 2.2 + this.phase * 1.4 + off) * A +
            Math.sin(nx * Math.PI * 5 - this.phase * 2 + i * 0.1) * A * 0.35;
          if (x === -step) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
      this.drawFace(P);
    }

    // glass reflection
    const hl = c.createLinearGradient(0, 0, w * 0.5, h * 0.45);
    hl.addColorStop(0, 'rgba(255,255,255,0.3)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl;
    c.beginPath();
    c.ellipse(w * 0.34, h * 0.1, w * 0.42, h * 0.13, -0.12, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  private drawFace(P: number) {
    const { c, w, h, f, t } = this;
    c.save();
    c.fillStyle = '#6dffad';
    c.strokeStyle = '#6dffad';
    c.lineCap = 'round';
    c.shadowColor = 'rgba(80, 255, 160, 0.9)';
    c.shadowBlur = w * 0.06 * f.glow;

    const eyeA = P * (1 - f.load);
    const ew = w * 0.1 * (1 + f.wide * 0.35);
    const eh = h * 0.2 * (1 + f.wide * 0.25);

    EYES.forEach((e, i) => {
      let cx = e.x * w + f.lookX * w * 0.07;
      let cy = e.y * h + f.lookY * h * 0.08;
      let k = 1;
      if (i === 0 && f.confused > 0) {
        k = 1 - 0.32 * f.confused;
        cy -= h * 0.05 * f.confused;
      }
      if (i === 1 && f.confused > 0) cx += w * 0.01 * f.confused;

      // open eyes (capsules, they blink and squint)
      const capA = eyeA * (1 - f.happy) * (1 - f.heart);
      if (capA > 0.01) {
        const eyeH = Math.max(ew * 0.22, eh * k * f.open * f.squint * (1 - f.sleepy * 0.86));
        const eyeW = ew * k;
        c.globalAlpha = capA;
        c.beginPath();
        c.roundRect(cx - eyeW / 2, cy - eyeH / 2, eyeW, eyeH, Math.min(eyeW, eyeH) / 2);
        c.fill();
      }
      // happy eyes ^ ^
      const hapA = eyeA * f.happy * (1 - f.heart);
      if (hapA > 0.01) {
        c.globalAlpha = hapA;
        c.lineWidth = ew * 0.42;
        c.beginPath();
        c.arc(cx, cy + eh * 0.24, ew * 0.62, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();
      }
      // heart eyes
      if (f.heart > 0.01) {
        c.globalAlpha = eyeA * f.heart;
        this.heart(cx, cy, ew * 0.95 * (1 + 0.08 * Math.sin(t * 8 + i)));
        c.fill();
      }
    });

    // mouth: little equaliser while it talks
    if (f.talk > 0.01) {
      c.globalAlpha = P * f.talk;
      const n = 5;
      const bw = w * 0.028;
      const gap = w * 0.02;
      const mx = w * 0.48 + f.lookX * w * 0.05;
      const my = h * 0.76 + f.lookY * h * 0.05;
      for (let i = 0; i < n; i++) {
        const level = 0.25 + 0.75 * Math.abs(Math.sin(t * 14 + i * 1.7) * Math.sin(t * 5.3 + i));
        const bh = h * 0.13 * level;
        c.beginPath();
        c.roundRect(mx + (i - (n - 1) / 2) * (bw + gap) - bw / 2, my - bh / 2, bw, bh, bw / 2);
        c.fill();
      }
    }

    // thinking: a loading ring replaces the eyes
    if (f.load > 0.01) {
      c.globalAlpha = P * f.load;
      c.lineWidth = w * 0.035;
      const a = t * 5;
      c.beginPath();
      c.arc(w * 0.5, h * 0.5, h * 0.17, a, a + Math.PI * 1.25);
      c.stroke();
    }
    c.restore();
  }

  private heart(x: number, y: number, s: number) {
    const { c } = this;
    c.beginPath();
    c.moveTo(x, y + s * 0.38);
    c.bezierCurveTo(x - s * 0.95, y - s * 0.22, x - s * 0.45, y - s * 0.95, x, y - s * 0.42);
    c.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.95, y - s * 0.22, x, y + s * 0.38);
    c.closePath();
  }
}

export const ROBOT_IMG = IMG;
