/**
 * v2 hero: the big media panel of the dashboard.
 * Same overlay as v1 (chips, title, tags), but it plays on its own (autoplay
 * with a progress line) and the sidebar drives it: hovering a project shows it,
 * any project from the full portfolio can be previewed.
 * Transitions: "wave" (default) or "fade" (minimal).
 */
import gsap from 'gsap';
import { WaveCanvas, type Source, type TransitionMode } from '../lib/waveDots';
import { Thread } from '../lib/thread';
import { pad } from '../lib/utils';
import type { Ctx } from '../ctx';

export type Item = { name: string; title: [string, string]; accent?: boolean; tags: string[]; href: string };
export type Preview = { name: string; src: string; href: string };

export type DashReel = ReturnType<typeof initDashReel>;

const SLIDE_SECONDS = 6;

export function initDashReel(ctx: Ctx) {
  const root = document.querySelector<HTMLElement>('.d-reel')!;
  const canvas = root.querySelector<HTMLCanvasElement>('.d-reel__canvas')!;
  const slides: Item[] = JSON.parse(document.getElementById('reel-data')?.textContent || '[]');
  const sources = [...root.querySelectorAll<HTMLImageElement | HTMLVideoElement>('[data-reel-src]')].sort(
    (a, b) => Number(a.dataset.reelSrc) - Number(b.dataset.reelSrc),
  );
  const titleEl = root.querySelector<HTMLElement>('[data-reel-title]')!;
  const idxEl = root.querySelector<HTMLElement>('[data-reel-idx]')!;
  const tagsEl = root.querySelector<HTMLElement>('[data-reel-tags]')!;
  const linkEl = root.querySelector<HTMLAnchorElement>('[data-reel-link]')!;
  const countEl = root.querySelector<HTMLElement>('.reel__count')!;
  const ring = root.querySelector<HTMLElement>('.playring')!;
  const threadEl = root.querySelector<HTMLElement>('[data-thread]')!;
  const autoBtn = root.querySelector<HTMLButtonElement>('[data-autoplay]')!;
  const n = slides.length;

  const changeFns: ((i: number) => void)[] = [];
  const progressFns: ((p: number) => void)[] = [];
  const cache = new Map<string, HTMLImageElement>();

  let index = 0;
  let previewing = false;
  let held = false;
  let userPaused = false;
  let inView = true;
  let started = false;
  let mode: TransitionMode = 'wave';

  const wave = new WaveCanvas(canvas, { mode, bg: '#0c0c0c' });
  wave.set(sources[0]);
  const thread = new Thread(threadEl, (k) => go(k), ctx.reduced ? 0 : 1);
  const v0 = sources[0];
  if (v0 instanceof HTMLVideoElement) v0.play().catch(() => {});

  const image = (url: string) => {
    let im = cache.get(url);
    if (!im) {
      im = new Image();
      im.decoding = 'async';
      im.src = url;
      cache.set(url, im);
    }
    return im;
  };

  /* ---------- text swaps ---------- */
  function renderTitle(item: Item, dir: number) {
    const group = document.createElement('span');
    group.className = 'rt-group';
    item.title.forEach((text, k) => {
      const line = document.createElement('span');
      line.className = `rt-line${k ? ' rt-line--2' : ''}${k && item.accent ? ' rt-line--grad' : ''}`;
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
      { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.2 },
    );
  }

  function renderCount(label: string, dir: number) {
    const next = document.createElement('span');
    next.textContent = label;
    const old = [...idxEl.querySelectorAll<HTMLElement>('span:not([data-leaving])')];
    idxEl.append(next);
    old.forEach((o) => {
      o.dataset.leaving = '1';
      gsap.to(o, { yPercent: -100 * dir, duration: 0.4, ease: 'power3.in', onComplete: () => o.remove() });
    });
    gsap.fromTo(next, { yPercent: 100 * dir }, { yPercent: 0, duration: 0.7, ease: 'expo.out', delay: 0.1 });
  }

  let pendingTags: string[] = [];
  function renderTags(tags: string[]) {
    pendingTags = tags;
    gsap.killTweensOf(tagsEl.children);
    gsap.to(tagsEl.children, {
      opacity: 0,
      y: -6,
      duration: 0.22,
      stagger: 0.03,
      onComplete: () => {
        tagsEl.replaceChildren(
          ...pendingTags.map((t) => Object.assign(document.createElement('span'), { className: 'tag', textContent: t })),
        );
        gsap.from(tagsEl.children, { opacity: 0, y: 8, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
      },
    });
  }

  function setLink(href: string) {
    linkEl.href = href;
    if (href.startsWith('#')) {
      linkEl.removeAttribute('target');
      linkEl.removeAttribute('rel');
    } else {
      linkEl.target = '_blank';
      linkEl.rel = 'noopener';
    }
  }

  function show(item: Item, src: Source, dir: 1 | -1, count: string) {
    const isWave = mode === 'wave';
    wave.to(src, {
      duration: ctx.reduced ? 0.01 : isWave ? 1.3 : 0.9,
      axis: 'y',
      dir,
      fromScale: isWave ? 1.08 : 1.035,
      toScale: 1,
      ease: isWave ? 'power2.inOut' : 'power1.inOut',
    });
    renderTitle(item, dir);
    renderCount(count, dir);
    renderTags(item.tags);
    setLink(item.href);
  }

  /* ---------- autoplay ---------- */
  const prog = { v: 0 };
  let tween: gsap.core.Tween | null = null;
  const setP = (v: number) => {
    thread.setProgress(index + v);
    progressFns.forEach((fn) => fn(v));
  };
  const shouldPause = () => held || !inView || document.hidden;

  function restart() {
    tween?.kill();
    tween = null;
    prog.v = 0;
    setP(0);
    if (!started || ctx.reduced || userPaused) return;
    tween = gsap.to(prog, {
      v: 1,
      duration: SLIDE_SECONDS,
      ease: 'none',
      paused: shouldPause(),
      onUpdate: () => setP(prog.v),
      onComplete: () => go(index + 1, 1),
    });
  }
  function syncPause() {
    if (!tween) return;
    if (shouldPause()) tween.pause();
    else tween.resume();
  }

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    syncPause();
  }).observe(root);
  document.addEventListener('visibilitychange', syncPause);

  autoBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    autoBtn.setAttribute('aria-pressed', String(!userPaused));
    autoBtn.setAttribute('aria-label', userPaused ? 'resume the autoplay' : 'pause the autoplay');
    restart();
  });

  /* ---------- api ---------- */
  function go(i: number, dir?: 1 | -1) {
    const next = (i + n) % n;
    if (next === index && !previewing) {
      restart();
      return;
    }
    const d: 1 | -1 = dir ?? (next > index ? 1 : -1);
    index = next;
    previewing = false;
    show(slides[next], sources[next], d, pad(next + 1));
    thread.setActive(next);
    changeFns.forEach((fn) => fn(next));
    restart();
  }

  function preview(p: Preview) {
    previewing = true;
    show({ name: p.name, title: [p.name, 'see the story'], tags: ['case study'], href: p.href }, image(p.src), 1, '··');
    changeFns.forEach((fn) => fn(-1));
    restart();
  }

  function hold(v: boolean) {
    held = v;
    if (!v && previewing) {
      previewing = false;
      show(slides[index], sources[index], -1, pad(index + 1));
      changeFns.forEach((fn) => fn(index));
      restart();
      return;
    }
    syncPause();
  }

  function setMode(m: TransitionMode) {
    mode = m;
    wave.setMode(m);
  }

  function intro(instant = false) {
    started = true;
    if (!instant) {
      const lines = titleEl.querySelectorAll('.rt-line > span');
      gsap
        .timeline()
        .from(lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
        .from(ring, { opacity: 0, scale: 0.6, rotate: -60, duration: 1.1, ease: 'expo.out' }, 0.1)
        .from(threadEl, { opacity: 0, y: 16, duration: 0.9, ease: 'expo.out' }, 0.15)
        .from([countEl, tagsEl, linkEl, autoBtn], { opacity: 0, y: 10, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 0.25);
    }
    restart();
  }

  return {
    frame: root,
    firstSource: sources[0] as Source,
    slides,
    index: () => index,
    go,
    preview,
    hold,
    setMode,
    intro,
    onChange: (fn: (i: number) => void) => changeFns.push(fn),
    onProgress: (fn: (p: number) => void) => progressFns.push(fn),
  };
}
