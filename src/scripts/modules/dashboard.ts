/**
 * v1 studio dashboard (Koto's widget panel, Porto Rocha's OS feel):
 * live clock of the studio, brand film, latest work, StratAI pulse, jobs, hello.
 */
import gsap from 'gsap';
import { onClock } from './clock';
import type { Ctx } from '../ctx';

export function initDashboard(ctx: Ctx) {
  const dash = document.querySelector<HTMLElement>('[data-dash]');
  if (!dash) return;
  const panel = dash.querySelector<HTMLElement>('.dash__panel')!;
  const backdrop = dash.querySelector<HTMLElement>('.dash__backdrop')!;
  const widgets = dash.querySelectorAll<HTMLElement>('.w');
  const video = dash.querySelector<HTMLVideoElement>('.w--reel video')!;
  const progress = dash.querySelector<HTMLElement>('.w__progress i')!;
  const closeBtn = dash.querySelector<HTMLButtonElement>('.dash__close')!;
  const openBtn = document.querySelector<HTMLElement>('[data-dash-open]');
  const status = dash.querySelector<HTMLElement>('[data-studio-status]')!;
  const aiCount = dash.querySelector<HTMLElement>('[data-ai-count]')!;
  const spark = dash.querySelector<SVGPathElement>('.spark path')!;
  const hands = {
    h: dash.querySelector<SVGLineElement>('.clock__h')!,
    m: dash.querySelector<SVGLineElement>('.clock__m')!,
    s: dash.querySelector<SVGLineElement>('.clock__s')!,
  };

  let open = false;
  let insights = 1248;
  let aiTimer = 0;
  let turns = 0;
  let prevS = -1;

  /* ---------- clock ---------- */
  onClock((t) => {
    if (prevS !== -1 && t.s < prevS) turns++;
    prevS = t.s;
    hands.s.style.transform = `rotate(${(turns * 60 + t.s) * 6}deg)`;
    hands.m.style.transform = `rotate(${(t.m + t.s / 60) * 6}deg)`;
    hands.h.style.transform = `rotate(${((t.h % 12) + t.m / 60) * 30}deg)`;
    const weekday = !['sat', 'sun'].includes(t.weekday);
    const isOpen = weekday && t.h >= 9 && t.h < 18;
    status.classList.toggle('is-open', isOpen);
    status.textContent = isOpen ? 'studio open' : 'studio closed';
  });

  video.addEventListener('timeupdate', () => {
    if (video.duration) progress.style.transform = `scaleX(${video.currentTime / video.duration})`;
  });

  /* ---------- open / close ---------- */
  function show() {
    if (open) return;
    open = true;
    dash!.classList.add('is-open');
    dash!.setAttribute('aria-hidden', 'false');
    ctx.lenis.stop();
    gsap.killTweensOf([panel, backdrop, widgets, spark]);
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo(panel, { xPercent: 106 }, { xPercent: 0, duration: ctx.reduced ? 0.01 : 0.9, ease: 'expo.out' });
    gsap.fromTo(
      widgets,
      { y: 40, opacity: 0, scale: 0.94 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.12 },
    );
    gsap.fromTo(spark, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'expo.out', delay: 0.4 });
    video.play().catch(() => {});
    aiTimer = window.setInterval(() => {
      insights += 1 + Math.floor(Math.random() * 6);
      aiCount.textContent = insights.toLocaleString('en');
      gsap.fromTo(aiCount, { yPercent: 12, opacity: 0.6 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    }, 1400);
    closeBtn.focus({ preventScroll: true });
  }

  function hide() {
    if (!open) return;
    open = false;
    window.clearInterval(aiTimer);
    gsap.killTweensOf([panel, backdrop, widgets]);
    gsap.to(backdrop, { opacity: 0, duration: 0.45, ease: 'power2.in' });
    gsap.to(panel, {
      xPercent: 106,
      duration: 0.6,
      ease: 'expo.in',
      onComplete: () => {
        if (open) return;
        dash!.classList.remove('is-open');
        dash!.setAttribute('aria-hidden', 'true');
        video.pause();
      },
    });
    ctx.lenis.start();
    openBtn?.focus({ preventScroll: true });
  }

  openBtn?.addEventListener('click', show);
  dash.querySelectorAll('[data-dash-close]').forEach((el) => el.addEventListener('click', hide));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  /* ---------- copy email ---------- */
  dash.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]')!;
    const original = label.textContent ?? '';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? '');
        label.textContent = 'copied, talk soon ✓';
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
        return;
      }
      window.setTimeout(() => (label.textContent = original), 1800);
    });
  });
}
