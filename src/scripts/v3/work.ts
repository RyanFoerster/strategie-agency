/**
 * Selected work: cards appear through the wave reveal, hover swaps to the
 * second visual with a wave coming from the side the cursor entered, and a
 * thin "tether" connects the cursor to the project's name (we connect).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WaveCanvas, type TransitionMode } from '../lib/waveDots';
import type { Ctx } from '../ctx';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createTether() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('tether');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('pathLength', '1');
  const anchor = document.createElementNS(SVG_NS, 'circle');
  anchor.setAttribute('r', '3.5');
  svg.append(path, anchor);
  document.body.append(svg);
  return { svg, path, anchor };
}

export function initWork(ctx: Ctx) {
  const cards = [...document.querySelectorAll<HTMLAnchorElement>('[data-card]')];
  const label = document.querySelector<HTMLElement>('.tether-label')!;
  const waves: WaveCanvas[] = [];
  let mode: TransitionMode = 'wave';

  /* ---------- tether: cursor ↔ project name ---------- */
  const tether = createTether();
  const mouse = { x: 0, y: 0 };
  const end = { x: 0, y: 0 };
  let target: HTMLElement | null = null;
  const draw = { p: 0 };

  if (ctx.hover) {
    window.addEventListener(
      'pointermove',
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      },
      { passive: true },
    );
    gsap.ticker.add(() => {
      if (!target && draw.p <= 0) return;
      end.x += (mouse.x - end.x) * 0.22;
      end.y += (mouse.y - end.y) * 0.22;
      const name = target?.querySelector<HTMLElement>('.card__name');
      if (!name) return;
      const r = name.getBoundingClientRect();
      const ax = r.left - 10;
      const ay = r.top + r.height / 2;
      const dist = Math.hypot(end.x - ax, end.y - ay);
      const sag = Math.min(90, dist * 0.22);
      // a slack rope from the name to the cursor
      tether.path.setAttribute(
        'd',
        `M${ax},${ay} C${ax - 40},${ay + sag} ${end.x - (end.x - ax) * 0.3},${end.y + sag} ${end.x},${end.y}`,
      );
      tether.path.style.strokeDashoffset = String(1 - draw.p);
      tether.anchor.setAttribute('cx', String(ax));
      tether.anchor.setAttribute('cy', String(ay));
      gsap.set(label, { x: end.x + 14, y: end.y - 14 });
    });
  }

  const showTether = (card: HTMLElement) => {
    if (!target) {
      end.x = mouse.x;
      end.y = mouse.y;
    }
    target = card;
    const color = card.dataset.color ?? '#00c74c';
    tether.svg.style.setProperty('--c', color);
    label.style.setProperty('--c', color);
    label.style.setProperty('--ci', card.dataset.ink ?? '#ffffff');
    gsap.to(draw, { p: 1, duration: 0.6, ease: 'expo.out', overwrite: true });
    gsap.to(tether.svg, { opacity: 1, duration: 0.2, overwrite: true });
    gsap.to(label, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)', overwrite: 'auto' });
  };
  const hideTether = () => {
    target = null;
    gsap.to(draw, { p: 0, duration: 0.35, ease: 'power2.in', overwrite: true });
    gsap.to(tether.svg, { opacity: 0, duration: 0.35, overwrite: true });
    gsap.to(label, { opacity: 0, scale: 0.5, duration: 0.25, ease: 'power3.in', overwrite: 'auto' });
  };
  gsap.set(label, { scale: 0.5, transformOrigin: '0% 100%' });

  /* ---------- cards ---------- */
  cards.forEach((card) => {
    const canvas = card.querySelector<HTMLCanvasElement>('.card__canvas')!;
    const imgA = card.querySelector<HTMLImageElement>('[data-a]')!;
    const imgB = card.querySelector<HTMLImageElement>('[data-b]') ?? imgA;
    const sameImage = imgB === imgA;
    const wave = new WaveCanvas(canvas, { mode, bg: '#e7e7e3' });
    waves.push(wave);
    wave.set(null);
    const ease = () => (mode === 'wave' ? 'power2.inOut' : 'power1.inOut');

    ScrollTrigger.create({
      trigger: card,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        if (wave.target) return; // already hovered in
        wave.to(imgA, { duration: ctx.reduced ? 0.01 : 1.4, axis: 'y', dir: 1, fromScale: 1.1, toScale: 1, ease: ease() });
      },
    });

    if (!ctx.hover) return;
    card.addEventListener('pointerenter', (e) => {
      const r = card.getBoundingClientRect();
      const dir = e.clientX < r.left + r.width / 2 ? 1 : -1;
      const s = sameImage ? 1.12 : 1;
      wave.to(imgB, { duration: 0.95, axis: 'x', dir, fromScale: s + 0.06, toScale: s, ease: ease() });
      showTether(card);
    });
    card.addEventListener('pointerleave', (e) => {
      const r = card.getBoundingClientRect();
      const dir = e.clientX > r.left + r.width / 2 ? 1 : -1;
      wave.to(imgA, { duration: 0.85, axis: 'x', dir, fromScale: 1.05, toScale: 1, ease: ease() });
      hideTether();
    });
  });

  /* ---------- filters ---------- */
  const filters = document.querySelector<HTMLElement>('.work .filters');
  if (filters) {
    const ind = filters.querySelector<HTMLElement>('.filters__ind')!;
    const buttons = [...filters.querySelectorAll<HTMLButtonElement>('[data-filter]')];
    const place = (btn: HTMLElement) => {
      ind.style.width = `${btn.offsetWidth}px`;
      ind.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    const active = () => buttons.find((b) => b.classList.contains('is-active')) ?? buttons[0];
    place(active());
    document.fonts?.ready.then(() => place(active()));
    window.addEventListener('resize', () => place(active()));

    buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        buttons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        place(btn);
        const f = btn.dataset.filter;
        cards.forEach((c) => c.classList.toggle('is-dim', f !== 'all' && c.dataset.cat !== f));
      }),
    );
  }

  return {
    setMode: (m: TransitionMode) => {
      mode = m;
      waves.forEach((w) => w.setMode(m));
    },
  };
}
