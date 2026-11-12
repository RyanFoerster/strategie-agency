/**
 * Intro: the brand film plays in a small rounded window while a counter runs,
 * then the window opens up into the full-screen showreel.
 */
import gsap from 'gsap';
import { whenReady, type Source } from '../lib/waveDots';
import type { Ctx } from '../ctx';

/** what the intro needs from a showreel (v1 and v3 both provide it) */
type Reel = { frame: HTMLElement; firstSource: Source; intro: (instant?: boolean) => void };

const timeout = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export async function initLoader(ctx: Ctx, reel: Reel) {
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

  const { frame } = reel;
  const fw = frame.offsetWidth;
  const fh = frame.offsetHeight;
  const bw = Math.min(300, fw * 0.56);
  const bh = bw * 0.64;
  const ix = ((fw - bw) / 2 / fw) * 100;
  const iy = ((fh - bh) / 2 / fh) * 100;
  // keep all four sides explicit: the computed style collapses them, which breaks interpolation
  const small = `inset(${iy}% ${ix}% ${iy}% ${ix}% round 10px)`;
  gsap.set(frame, { clipPath: small });

  const count = loader.querySelector<HTMLElement>('[data-count]')!;
  const lines = loader.querySelectorAll<HTMLElement>('.lm > *');
  const c = { v: 0 };

  const enter = gsap
    .timeline()
    .from(lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0)
    .fromTo(frame, { scale: 0.86 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0)
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
      frame,
      { clipPath: small },
      { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.25, ease: 'expo.inOut', immediateRender: false },
      0.15,
    )
    .add(() => {
      html.classList.remove('is-loading');
      reel.intro();
    }, 0.85)
    .then(() => undefined);

  loader.remove();
  gsap.set(frame, { clearProps: 'clipPath' });
  ctx.lenis.start();
}
