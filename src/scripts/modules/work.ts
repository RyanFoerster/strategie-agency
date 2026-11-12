/**
 * v1 selected work: cards appear through the wave reveal, hover swaps to the
 * second visual with a wave coming from the side the cursor entered, and a
 * label in the brand's colour follows the cursor (Mubien).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WaveCanvas, type TransitionMode } from '../lib/waveDots';
import type { Ctx } from '../ctx';

export function initWork(ctx: Ctx) {
  const cards = [...document.querySelectorAll<HTMLAnchorElement>('[data-card]')];
  const label = document.querySelector<HTMLElement>('.cursor-label')!;
  const lName = label.querySelector<HTMLElement>('.cursor-label__name')!;
  const lLine = label.querySelector<HTMLElement>('.cursor-label__line')!;
  const waves: WaveCanvas[] = [];
  let mode: TransitionMode = 'wave';

  /* ---------- cursor label ---------- */
  gsap.set(label, { scale: 0.4, transformOrigin: '0% 0%' });
  const xTo = gsap.quickTo(label, 'x', { duration: 0.5, ease: 'power3' });
  const yTo = gsap.quickTo(label, 'y', { duration: 0.5, ease: 'power3' });
  if (ctx.hover) {
    window.addEventListener(
      'pointermove',
      (e) => {
        xTo(e.clientX + 18);
        yTo(e.clientY + 18);
      },
      { passive: true },
    );
  }
  const showLabel = (card: HTMLElement) => {
    lName.textContent = card.dataset.name ?? '';
    lLine.textContent = card.dataset.line ?? '';
    label.style.setProperty('--c', card.dataset.color ?? '#0c0c0c');
    label.style.setProperty('--ci', card.dataset.ink ?? '#ffffff');
    gsap.to(label, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.7)', overwrite: 'auto' });
  };
  const hideLabel = () => gsap.to(label, { opacity: 0, scale: 0.4, duration: 0.3, ease: 'power3.in', overwrite: 'auto' });

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
      showLabel(card);
    });
    card.addEventListener('pointerleave', (e) => {
      const r = card.getBoundingClientRect();
      const dir = e.clientX > r.left + r.width / 2 ? 1 : -1;
      wave.to(imgA, { duration: 0.85, axis: 'x', dir, fromScale: 1.05, toScale: 1, ease: ease() });
      hideLabel();
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
