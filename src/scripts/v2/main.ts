import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import type { Ctx } from '../ctx';
import { initClock } from '../modules/clock';
import { initRoll, initReveal } from '../modules/text';
import { initApproach, initExpertises, initMagnetic } from '../modules/sections';
import { initReelModal } from '../modules/reelModal';
import { initAsk } from '../modules/ask';
import { initTransitionSwitch } from '../modules/demo';
import { initDashReel } from './reel';
import { initSidebar } from './sidebar';
import { initWidgets } from './widgets';
import { initLoaderV2 } from './loader';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const ctx: Ctx = { lenis, reduced, hover };

/* in-page anchors through Lenis */
function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href') ?? '';
    e.preventDefault();
    if (id === '#top' || id === '#') {
      lenis.scrollTo(0, { duration: 1.4 });
      return;
    }
    const target = document.querySelector<HTMLElement>(id);
    if (target) lenis.scrollTo(target, { duration: 1.4, offset: -8 });
  });
}

/* dashboard cards slide up as they arrive */
function initCards() {
  if (reduced) return;
  document.querySelectorAll<HTMLElement>('.d-main > :not(.d-reel)').forEach((el) => {
    gsap.from(el, {
      y: 56,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 94%', once: true },
    });
  });
}

async function boot() {
  initWidgets(ctx);
  initClock();
  initRoll();
  initMagnetic(ctx);
  initAnchors();

  const reel = initDashReel(ctx);
  initTransitionSwitch(reel.setMode);
  // in v2 "/" focuses the project search, ⌘K / ctrl+K opens StratAI
  const ask = initAsk(ctx, { slash: false });
  initSidebar(ctx, reel, ask);
  initApproach(ctx);
  initExpertises(ctx);
  initReelModal(ctx);
  initCards();
  initReveal(reduced);

  await initLoaderV2(ctx, reel);
  ScrollTrigger.refresh();
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('is-loading');
  document.querySelector('.loader')?.remove();
});
