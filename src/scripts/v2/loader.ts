/**
 * v2 intro: same idea as v1 (the brand film in a small window + counter), but the
 * window opens into the dashboard's main panel while the sidebar slides in.
 */
import gsap from 'gsap';
import { whenReady } from '../lib/waveDots';
import type { Ctx } from '../ctx';
import type { DashReel } from './reel';

const timeout = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export async function initLoaderV2(ctx: Ctx, reel: DashReel) {
  const html = document.documentElement;
  const loader = document.querySelector<HTMLElement>('.loader');
  const skip = ctx.reduced || !loader || new URLSearchParams(location.search).has('nointro');

  if (skip) {
    loader?.remove();
    html.classList.remove('is-loading');
    reel.intro(true);
    return;
  }

  ctx.lenis.stop();
  ctx.lenis.scrollTo(0, { immediate: true, force: true });

  // a small window centred in the viewport, expressed as an inset of the panel
  const panel = reel.frame;
  const r = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bw = Math.min(300, vw * 0.56);
  const bh = bw * 0.64;
  const wl = (vw - bw) / 2;
  const wt = (vh - bh) / 2;
  const inset = (t: number, rt: number, b: number, l: number, radius: number) =>
    `inset(${Math.max(0, t)}px ${Math.max(0, rt)}px ${Math.max(0, b)}px ${Math.max(0, l)}px round ${radius}px)`;
  const small = inset(wt - r.top, r.right - (wl + bw), r.bottom - (wt + bh), wl - r.left, 10);
  gsap.set(panel, { clipPath: small });

  const count = loader.querySelector<HTMLElement>('[data-count]')!;
  const lines = loader.querySelectorAll<HTMLElement>('.lm > *');
  const c = { v: 0 };

  const enter = gsap
    .timeline()
    .from(lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0)
    .to(
      c,
      {
        v: 100,
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          count.textContent = String(Math.round(c.v)).padStart(3, '0');
        },
      },
      0.1,
    );

  await Promise.all([
    enter.then(() => undefined),
    whenReady(reel.firstSource, 5000),
    Promise.race([document.fonts?.ready.then(() => undefined) ?? Promise.resolve(), timeout(2500)]),
  ]);

  await gsap
    .timeline()
    .to(lines, { yPercent: -110, duration: 0.55, ease: 'power3.in', stagger: 0.03 }, 0)
    .fromTo(
      panel,
      { clipPath: small },
      { clipPath: inset(0, 0, 0, 0, 14), duration: 1.25, ease: 'expo.inOut', immediateRender: false },
      0.15,
    )
    .add(() => {
      html.classList.remove('is-loading');
      reel.intro();
    }, 0.85)
    .then(() => undefined);

  loader.remove();
  gsap.set(panel, { clearProps: 'clipPath' });
  ctx.lenis.start();
}
