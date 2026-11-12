/**
 * v1 bottom nav pill (Mubien-like): its label and mark follow what you are
 * looking at (current case in the reel, then the section), and it unfolds
 * upward into the menu. Also: header tone and smooth in-page anchors.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ctx } from '../ctx';
import type { Reel } from './showreel';

export function initNav(ctx: Ctx, reel: Reel) {
  const pill = document.querySelector<HTMLElement>('.pill')!;
  const labelBox = pill.querySelector<HTMLElement>('.pill__label')!;
  const mark = pill.querySelector<HTMLElement>('.pill__mark')!;
  const markImg = mark.querySelector<HTMLImageElement>('img')!;
  const toggle = pill.querySelector<HTMLButtonElement>('.pill__toggle')!;
  const menu = pill.querySelector<HTMLElement>('.pill__menu')!;
  const links = menu.querySelectorAll<HTMLElement>('.pill__links a > span');

  let current = labelBox.textContent?.trim() ?? '';
  let inReel = true;
  let open = false;

  function setLabel(text: string, href?: string) {
    if (text === current) return;
    current = text;
    const next = document.createElement(href ? 'a' : 'span');
    next.textContent = text;
    if (href && next instanceof HTMLAnchorElement) {
      next.href = href;
      next.target = '_blank';
      next.rel = 'noopener';
    }
    const old = [...labelBox.children].filter((el) => !(el as HTMLElement).dataset.leaving) as HTMLElement[];
    labelBox.append(next);
    old.forEach((o) => {
      o.dataset.leaving = '1';
      gsap.to(o, { yPercent: -110, opacity: 0, duration: 0.35, ease: 'power3.in', onComplete: () => o.remove() });
    });
    gsap.fromTo(next, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.06 });
  }

  function setMark(src: string | null) {
    if (src) {
      if (markImg.getAttribute('src') !== src) markImg.src = src;
      mark.classList.add('has-img');
    } else {
      mark.classList.remove('has-img');
    }
  }

  function showSlide() {
    const s = reel.slides[reel.index()];
    setLabel(s.label, s.href.startsWith('#') ? undefined : s.href);
    setMark(s.thumb);
  }

  reel.onChange(() => inReel && showSlide());

  ScrollTrigger.create({
    start: 0,
    end: () => reel.end() + window.innerHeight * 0.35,
    onToggle: (self) => {
      inReel = self.isActive;
      if (inReel) showSlide();
    },
  });

  // header text goes white over the dark frames (reel, footer), ink over paper
  const html = document.documentElement;
  let overReel = true;
  let overFooter = false;
  const syncTone = () => html.classList.toggle('on-dark', overReel || overFooter);
  ScrollTrigger.create({
    start: 0,
    end: () => reel.end() + window.innerHeight * 0.55,
    onToggle: (self) => {
      overReel = self.isActive;
      syncTone();
    },
  });
  ScrollTrigger.create({
    trigger: '.connect',
    start: 'top 40px',
    end: 'bottom 40px',
    onToggle: (self) => {
      overFooter = self.isActive;
      syncTone();
    },
  });
  syncTone();

  document.querySelectorAll<HTMLElement>('[data-section]:not(.reel)').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 60%',
      end: 'bottom 60%',
      onToggle: (self) => {
        if (!self.isActive || inReel) return;
        setLabel(sec.dataset.section ?? '');
        setMark(null);
      },
    });
  });

  /* ---------- menu ---------- */
  function setOpen(v: boolean) {
    open = v;
    pill.classList.toggle('is-open', v);
    toggle.setAttribute('aria-expanded', String(v));
    gsap.killTweensOf([menu, links]);
    if (v) {
      gsap.to(menu, { height: 'auto', duration: 0.75, ease: 'expo.out' });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.035, delay: 0.05 });
    } else {
      gsap.to(menu, { height: 0, duration: 0.5, ease: 'expo.inOut' });
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
  document.addEventListener('pointerdown', (e) => {
    if (open && !pill.contains(e.target as Node)) setOpen(false);
  });

  // smooth in-page anchors through Lenis
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href') ?? '';
    e.preventDefault();
    if (open) setOpen(false);
    if (id === '#top' || id === '#') {
      ctx.lenis.scrollTo(0, { duration: 1.4 });
      return;
    }
    const target = document.querySelector<HTMLElement>(id);
    if (target) ctx.lenis.scrollTo(target, { duration: 1.4 });
  });
}
