/**
 * Thread: the reel's projects as nodes on one gently moving wave line.
 * The line fills up to where you are (scroll in v1, autoplay in v2).
 */
import gsap from 'gsap';

export class Thread {
  readonly root: HTMLElement;
  private svg: SVGSVGElement;
  private base: SVGPathElement;
  private fill: SVGPathElement;
  private nodes: HTMLElement[];
  private n: number;
  private w = 0;
  private h = 0;
  private t = Math.random() * 10;
  private progress = 0;
  private visible = true;

  constructor(root: HTMLElement, onPick: (i: number) => void, private speed = 1) {
    this.root = root;
    this.svg = root.querySelector('svg')!;
    this.base = root.querySelector('.thread__base')!;
    this.fill = root.querySelector('.thread__fill')!;
    this.nodes = [...root.querySelectorAll<HTMLElement>('[data-node]')];
    this.n = this.nodes.length;
    this.nodes.forEach((el, i) => el.addEventListener('click', () => onPick(i)));
    new ResizeObserver(() => this.measure()).observe(root);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(root);
    this.measure();
    gsap.ticker.add((_time, dt) => {
      if (!this.visible || !this.w) return;
      this.t += (Math.min(dt, 64) / 1000) * 0.55 * this.speed;
      this.draw();
    });
  }

  /** progress in node units: 0 = first node, n - 1 = last */
  setProgress(p: number) {
    this.progress = Math.max(0, Math.min(this.n - 1, p));
  }

  setActive(i: number) {
    this.nodes.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      el.classList.toggle('is-past', k < i);
    });
  }

  private measure() {
    this.w = this.root.offsetWidth;
    this.h = this.root.offsetHeight;
    if (this.w) this.svg.setAttribute('viewBox', `0 0 ${this.w} ${this.h}`);
  }

  private xAt(i: number) {
    const pad = 10;
    return pad + (i / Math.max(1, this.n - 1)) * (this.w - 2 * pad);
  }

  private yAt(x: number) {
    const { w, h, t } = this;
    return h / 2 + Math.sin((x / w) * Math.PI * 3 + t) * 5 + Math.sin((x / w) * Math.PI * 7.5 - t * 1.4) * 1.6;
  }

  private path(x0: number, x1: number) {
    let d = '';
    const step = 6;
    for (let x = x0; x < x1; x += step) d += `${d ? 'L' : 'M'}${x.toFixed(1)},${this.yAt(x).toFixed(2)}`;
    d += `${d ? 'L' : 'M'}${x1.toFixed(1)},${this.yAt(x1).toFixed(2)}`;
    return d;
  }

  private draw() {
    this.base.setAttribute('d', this.path(0, this.w));
    const i = Math.floor(this.progress);
    const f = this.progress - i;
    const xp = i >= this.n - 1 ? this.xAt(this.n - 1) : this.xAt(i) + f * (this.xAt(i + 1) - this.xAt(i));
    this.fill.setAttribute('d', this.path(0, Math.max(0.1, xp)));
    this.nodes.forEach((el, k) => {
      const x = this.xAt(k);
      el.style.transform = `translate(${x}px, ${this.yAt(x)}px)`;
    });
  }
}
