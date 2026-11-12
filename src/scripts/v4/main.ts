import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import type { Ctx } from '../ctx';
import { whenReady } from '../lib/waveDots';
import { initClock } from '../modules/clock';
import { initRoll, initReveal } from '../modules/text';
import { initApproach, initExpertises, initMagnetic } from '../modules/sections';
import { initReelModal } from '../modules/reelModal';
import { initTransitionSwitch } from '../modules/demo';
import { initMenu } from '../modules/menu';
import { initWork } from '../v3/work';
import { Robot } from './robot';
import { initStage } from './stage';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const ctx: Ctx = { lenis, reduced, hover };
const timeout = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/* header goes white over the dark footer */
function initTone() {
  ScrollTrigger.create({
    trigger: '.connect',
    start: 'top 40px',
    end: 'bottom 40px',
    onToggle: (self) => document.documentElement.classList.toggle('on-dark', self.isActive),
  });
}

async function boot() {
  initClock();
  initRoll();
  initMagnetic(ctx);
  initMenu(ctx);
  initTone();

  const robot = new Robot(document.querySelector<HTMLElement>('[data-bot]')!, ctx);
  const stage = initStage(ctx, robot);
  initApproach(ctx);
  const work = initWork(ctx);
  initExpertises(ctx);
  initReelModal(ctx);
  initTransitionSwitch((m) => work.setMode(m));
  initReveal(reduced);

  const img = document.querySelector<HTMLImageElement>('.bot__img');
  await Promise.race([
    Promise.all([whenReady(img, 4000), document.fonts?.ready.then(() => undefined) ?? Promise.resolve()]),
    timeout(4500),
  ]);
  document.documentElement.classList.remove('is-loading');
  await robot.boot();
  stage.greet();
  ScrollTrigger.refresh();
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('is-loading');
});
