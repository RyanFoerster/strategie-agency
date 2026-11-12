/**
 * v1 full-screen showreel hero (Mubien + Griflan + Porto Rocha):
 * pinned frame, scroll moves through the cases, each change is a wave (or
 * minimal) transition, thumbnails give direct access to every case.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WaveCanvas, type Source, type TransitionMode } from '../lib/waveDots';
import { clamp, clamp01, pad } from '../lib/utils';
import type { Ctx } from '../ctx';

export type Slide = {
  name: string;
  title: [string, string];
  accent: boolean;
  tags: string[];
  href: string;
  label: string;
  thumb: string | null;
};

export type Reel = {
  frame: HTMLElement;
  slides: Slide[];
  firstSource: Source;
  index: () => number;
  end: () => number;
  onChange: (fn: (i: number, s: Slide) => void) => void;
  intro: (instant?: boolean) => void;
  setMode: (m: TransitionMode) => void;
};

export function initShowreel(ctx: Ctx): Reel {
  const root = document.querySelector<HTMLElement>('.reel')!;
  const frame = root.querySelector<HTMLElement>('.reel__frame')!;
  const canvas = root.querySelector<HTMLCanvasElement>('.reel__canvas')!;
  const slides: Slide[] = JSON.parse(document.getElementById('reel-data')?.textContent || '[]');
  const sources = [...root.querySelectorAll<HTMLImageElement | HTMLVideoElement>('[data-reel-src]')].sort(
    (a, b) => Number(a.dataset.reelSrc) - Number(b.dataset.reelSrc),
  );
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>('[data-thumb]')];
  const thumbsWrap = root.querySelector<HTMLElement>('.reel__thumbs')!;
  const chips = [...root.querySelectorAll<HTMLElement>('.reel__chips > *')];
  const titleEl = root.querySelector<HTMLElement>('[data-reel-title]')!;
  const idxEl = root.querySelector<HTMLElement>('[data-reel-idx]')!;
  const tagsEl = root.querySelector<HTMLElement>('[data-reel-tags]')!;
  const linkEl = root.querySelector<HTMLAnchorElement>('[data-reel-link]')!;
  const countEl = root.querySelector<HTMLElement>('.reel__count')!;
  const listeners: ((i: number, s: Slide) => void)[] = [];
  const n = slides.length;
  let index = 0;
  let mode: TransitionMode = 'wave';

  const wave = new WaveCanvas(canvas, { mode, bg: '#0c0c0c' });
  wave.set(sources[0]);
  const v0 = sources[0];
  if (v0 instanceof HTMLVideoElement) v0.play().catch(() => {});

  /* ---------- text swaps ---------- */
  function renderTitle(s: Slide, dir: number) {
    const group = document.createElement('span');
    group.className = 'rt-group';
    s.title.forEach((text, k) => {
      const line = document.createElement('span');
      line.className = `rt-line${k ? ' rt-line--2' : ''}${k && s.accent ? ' rt-line--grad' : ''}`;
      const inner = document.createElement('span');
      inner.textContent = text;
      line.append(inner);
      group.append(line);
    });
    const leaving = [...titleEl.querySelectorAll<HTMLElement>('.rt-group:not([data-leaving])')];
    titleEl.append(group);
    leaving.forEach((g) => {
      g.dataset.leaving = '1';
      gsap.to(g.querySelectorAll('.rt-line > span'), {
        yPercent: -110 * dir,
        duration: 0.5,
        ease: 'power3.in',
        stagger: 0.04,
        onComplete: () => g.remove(),
      });
    });
    gsap.fromTo(
      group.querySelectorAll('.rt-line > span'),
      { yPercent: 110 * dir },
      { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.16 },
    );
  }

  function renderCount(i: number, dir: number) {
    const next = document.createElement('span');
    next.textContent = pad(i + 1);
    const old = [...idxEl.querySelectorAll<HTMLElement>('span:not([data-leaving])')];
    idxEl.append(next);
    old.forEach((o) => {
      o.dataset.leaving = '1';
      gsap.to(o, { yPercent: -100 * dir, duration: 0.4, ease: 'power3.in', onComplete: () => o.remove() });
    });
    gsap.fromTo(next, { yPercent: 100 * dir }, { yPercent: 0, duration: 0.7, ease: 'expo.out', delay: 0.1 });
  }

  function renderTags() {
    gsap.killTweensOf(tagsEl.children);
    gsap.to(tagsEl.children, {
      opacity: 0,
      y: -6,
      duration: 0.22,
      stagger: 0.03,
      onComplete: () => {
        const s = slides[index];
        tagsEl.replaceChildren(
          ...s.tags.map((t) => Object.assign(document.createElement('span'), { className: 'tag', textContent: t })),
        );
        gsap.from(tagsEl.children, { opacity: 0, y: 8, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
      },
    });
  }

  /* ---------- navigation ---------- */
  function go(i: number) {
    if (i === index) return;
    const dir = i > index ? 1 : -1;
    index = i;
    const isWave = mode === 'wave';
    wave
      .to(sources[i], {
        duration: ctx.reduced ? 0.01 : isWave ? 1.3 : 0.9,
        axis: 'y',
        dir: dir as 1 | -1,
        fromScale: isWave ? 1.08 : 1.035,
        toScale: 1,
        ease: isWave ? 'power2.inOut' : 'power1.inOut',
      })
      .then(() => {
        // keep the brand film (thumb 0) running, pause other videos once hidden
        sources.forEach((s, k) => {
          if (s instanceof HTMLVideoElement && k !== 0 && k !== index) s.pause();
        });
      });

    const s = slides[i];
    renderTitle(s, dir);
    renderCount(i, dir);
    renderTags();
    linkEl.href = s.href;
    if (s.href.startsWith('#')) {
      linkEl.removeAttribute('target');
      linkEl.removeAttribute('rel');
    } else {
      linkEl.target = '_blank';
      linkEl.rel = 'noopener';
    }
    thumbs.forEach((t, k) => t.classList.toggle('is-active', k === i));
    listeners.forEach((fn) => fn(i, s));
  }

  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${(n - 1) * window.innerHeight * 0.9}`,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = self.progress * (n - 1);
      const i = clamp(Math.round(p), 0, n - 1);
      if (i !== index) go(i);
      thumbs.forEach((t, k) => t.style.setProperty('--p', String(clamp01(p - k + 0.5))));
    },
  });

  thumbs.forEach((t, k) =>
    t.addEventListener('click', () => {
      const y = st.start + (k / (n - 1)) * (st.end - st.start);
      ctx.lenis.scrollTo(Math.min(y + 2, st.end - 2), { duration: 1.2 });
    }),
  );

  // Koto-style exit: the frame shrinks into a card as the next section arrives
  gsap.fromTo(
    frame,
    { scale: 1, borderRadius: 14 },
    {
      scale: 0.9,
      borderRadius: 28,
      ease: 'none',
      scrollTrigger: { trigger: '.approach', start: 'top bottom', end: 'top 15%', scrub: true },
    },
  );

  function intro(instant = false) {
    if (instant) return;
    const lines = titleEl.querySelectorAll('.rt-line > span');
    gsap
      .timeline()
      .from(lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
      .from(chips, { opacity: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.07 }, 0.1)
      .from(thumbsWrap, { opacity: 0, y: 24, duration: 0.9, ease: 'expo.out' }, 0.15)
      .from([countEl, tagsEl], { opacity: 0, y: 10, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.25);
  }

  return {
    frame,
    slides,
    firstSource: sources[0],
    index: () => index,
    end: () => st.end,
    onChange: (fn) => listeners.push(fn),
    intro,
    setMode: (m) => {
      mode = m;
      wave.setMode(m);
    },
  };
}
