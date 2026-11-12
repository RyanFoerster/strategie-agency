import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import type { Ctx } from '../ctx';
import { initClock } from '../modules/clock';
import { initRoll, initReveal } from '../modules/text';
import { initLoader } from '../modules/loader';
import { initAsk } from '../modules/ask';
import { initApproach, initExpertises, initStratAI, initMagnetic } from '../modules/sections';
import { initReelModal } from '../modules/reelModal';
import { initTransitionSwitch } from '../modules/demo';
import { initShowreel } from './showreel';
import { initNav } from './nav';
import { initWork } from './work';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const ctx: Ctx = { lenis, reduced, hover };

async function boot() {
  initClock();
  initRoll();
  initMagnetic(ctx);

  const reel = initShowreel(ctx);
  initNav(ctx, reel);
  initAsk(ctx);
  initApproach(ctx);
  const work = initWork(ctx);
  initExpertises(ctx);
  initStratAI(ctx);
  initReelModal(ctx);
  initTransitionSwitch((m) => {
    reel.setMode(m);
    work.setMode(m);
  });
  initReveal(reduced);

  await initLoader(ctx, reel);
  ScrollTrigger.refresh();
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('is-loading');
  document.querySelector('.loader')?.remove();
});
