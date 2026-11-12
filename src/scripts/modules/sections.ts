import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { WaveLines } from '../lib/waveLines';
import { mixHex } from '../lib/utils';
import type { Ctx } from '../ctx';

/** Statement: words go from grey to ink while you read (Koto), brand words in the gradient. */
export function initApproach(ctx: Ctx) {
  const text = document.querySelector<HTMLElement>('[data-words]');
  if (text) {
    const split = SplitText.create(text, { type: 'words' });
    const words = split.words as HTMLElement[];
    const brand = words.filter((w) => w.closest('[data-grad]'));
    brand.forEach((w, i) => {
      w.dataset.c = mixHex('#00c74c', '#0089b2', brand.length > 1 ? i / (brand.length - 1) : 0);
    });
    if (ctx.reduced) {
      words.forEach((w) => (w.style.color = w.dataset.c ?? ''));
    } else {
      gsap.fromTo(
        words,
        { color: '#c9c9c3' },
        {
          color: (_i: number, el: HTMLElement) => el.dataset.c ?? '#0c0c0c',
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: text, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      );
    }
  }

  document
    .querySelectorAll<HTMLCanvasElement>('[data-wave-lines]')
    .forEach((c) => new WaveLines(c, { dark: c.hasAttribute('data-dark'), speed: ctx.reduced ? 0.08 : 1 }));
}

/** Expertise panels: hover grows a panel and reveals its services; videos run while in view. */
export function initExpertises(ctx: Ctx) {
  const wrap = document.querySelector<HTMLElement>('.exp__panels');
  if (!wrap) return;
  const panels = [...wrap.querySelectorAll<HTMLElement>('[data-panel]')];
  const videos = panels.map((p) => p.querySelector('video')!);

  new IntersectionObserver(
    ([e]) => videos.forEach((v) => (e.isIntersecting && !ctx.reduced ? v.play().catch(() => {}) : v.pause())),
    { threshold: 0.2 },
  ).observe(wrap);

  if (ctx.hover) {
    panels.forEach((p) =>
      p.addEventListener('pointerenter', () => panels.forEach((x) => x.classList.toggle('is-active', x === p))),
    );
    wrap.addEventListener('pointerleave', () => panels.forEach((x) => x.classList.remove('is-active')));
  } else {
    panels.forEach((p) =>
      new IntersectionObserver(([e]) => p.classList.toggle('is-active', e.isIntersecting), { threshold: 0.6 }).observe(p),
    );
  }
}

/** StratAI card: the robot leans toward the cursor, the "analysis" types itself out. */
export function initStratAI(ctx: Ctx) {
  const card = document.querySelector<HTMLElement>('[data-ai]');
  if (!card) return;
  const bot = card.querySelector<HTMLElement>('.ai__bot')!;
  const typeEl = card.querySelector<HTMLElement>('[data-ai-type]')!;
  const bars = [...card.querySelectorAll<HTMLElement>('.bar')];
  const done = card.querySelector<HTMLElement>('.ai__done')!;

  if (ctx.hover && !ctx.reduced) {
    const rTo = gsap.quickTo(bot, 'rotation', { duration: 0.9, ease: 'power3' });
    const xTo = gsap.quickTo(bot, 'x', { duration: 0.9, ease: 'power3' });
    window.addEventListener(
      'pointermove',
      (e) => {
        const r = bot.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        rTo(dx * 16);
        xTo(dx * 24);
      },
      { passive: true },
    );
  }

  const chars = SplitText.create(typeEl, { type: 'chars' }).chars;
  gsap.set(chars, { opacity: 0 });
  const tl = gsap.timeline({ paused: true });
  tl.to(chars, { opacity: 1, duration: 0.01, stagger: 0.016, ease: 'none' });
  bars.forEach((bar, i) => {
    const v = Number(bar.style.getPropertyValue('--v')) || 0;
    const num = bar.querySelector<HTMLElement>('b')!;
    const o = { p: 0 };
    tl.to(
      o,
      {
        p: v,
        duration: 1.3,
        ease: 'expo.out',
        onUpdate: () => {
          bar.style.setProperty('--p', String(o.p));
          num.textContent = `${Math.round(o.p * 100)}%`;
        },
      },
      i === 0 ? '-=0.1' : '<0.14',
    );
  });
  tl.fromTo(done, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.6');

  ScrollTrigger.create({ trigger: card, start: 'top 75%', once: true, onEnter: () => tl.play() });
}

/** Magnetic buttons. */
export function initMagnetic(ctx: Ctx) {
  if (!ctx.hover || ctx.reduced) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
