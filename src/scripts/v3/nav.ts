/**
 * v1 navigation:
 * - header tone (white over the dark frames, ink over paper)
 * - Strategie's round burger, which opens the menu sheet as a growing circle
 * - the "you grow" rail on the right edge: fills with the scroll, one node per section
 * - smooth in-page anchors through Lenis
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ctx } from '../ctx';
import type { Reel } from './showreel';

export function initNav(ctx: Ctx, reel: Reel) {
  const html = document.documentElement;

  /* ---------- header tone ---------- */
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

  /* ---------- menu sheet ---------- */
  const sheet = document.querySelector<HTMLElement>('[data-menu]')!;
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!;
  const links = sheet.querySelectorAll<HTMLElement>('.msheet__links a > span');
  let open = false;

  const origin = () => {
    const s = sheet.getBoundingClientRect();
    const b = toggle.getBoundingClientRect();
    const cx = b.left + b.width / 2 - s.left;
    const cy = b.top + b.height / 2 - s.top;
    const far = Math.hypot(Math.max(cx, s.width - cx), Math.max(cy, s.height - cy));
    return { cx, cy, far, r: b.width / 2 };
  };

  function setOpen(v: boolean) {
    if (v === open) return;
    open = v;
    toggle.setAttribute('aria-expanded', String(v));
    sheet.setAttribute('aria-hidden', String(!v));
    html.classList.toggle('menu-open', v);
    gsap.killTweensOf([sheet, links]);
    if (v) {
      sheet.classList.add('is-open');
      const { cx, cy, far, r } = origin();
      gsap.fromTo(
        sheet,
        { clipPath: `circle(${r}px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${far}px at ${cx}px ${cy}px)`, duration: ctx.reduced ? 0.01 : 0.85, ease: 'expo.inOut' },
      );
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04, delay: 0.25 });
    } else {
      const { cx, cy, r } = origin();
      gsap.to(sheet, {
        clipPath: `circle(${r}px at ${cx}px ${cy}px)`,
        duration: ctx.reduced ? 0.01 : 0.6,
        ease: 'expo.inOut',
        onComplete: () => sheet.classList.remove('is-open'),
      });
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as Node;
    if (open && !sheet.contains(t) && !toggle.contains(t)) setOpen(false);
  });

  /* ---------- growth rail ---------- */
  const rail = document.querySelector<HTMLElement>('.rail');
  if (rail) {
    const nodes = [...rail.querySelectorAll<HTMLAnchorElement>('[data-rail-node]')];
    const pct = rail.querySelector<HTMLElement>('[data-rail-pct]')!;
    const targets = nodes.map((a) => document.querySelector<HTMLElement>(a.getAttribute('href') ?? '') ?? null);
    const firstLabel = nodes[0]?.querySelector<HTMLElement>('.rail__label');
    let tops: number[] = [];
    let current = -1;

    const measure = () => {
      tops = targets.map((el, i) => (i === 0 || !el ? 0 : el.getBoundingClientRect().top + window.scrollY));
    };
    const update = () => {
      if (!tops.length) measure();
      const y = window.scrollY + window.innerHeight * 0.45;
      const last = tops.length - 1;
      let k = 0;
      while (k < last && y >= tops[k + 1]) k++;
      const span = k < last ? tops[k + 1] - tops[k] : Math.max(1, document.documentElement.scrollHeight - window.innerHeight * 0.55 - tops[k]);
      const frac = Math.min(1, Math.max(0, (y - tops[k]) / span));
      const p = k >= last ? 1 : (k + frac) / last;
      rail.style.setProperty('--p', p.toFixed(4));
      pct.textContent = String(Math.round(p * 100));
      if (k !== current) {
        current = k;
        nodes.forEach((n, i) => {
          n.classList.toggle('is-active', i === k);
          n.classList.toggle('is-past', i < k);
        });
      }
    };
    ScrollTrigger.addEventListener('refresh', () => {
      measure();
      update();
    });
    ctx.lenis.on('scroll', update);
    measure();
    update();

    // the first node also tells which case the reel is showing
    reel.onChange((_i, s) => {
      if (firstLabel) firstLabel.textContent = s.name === 'showreel' ? 'showreel' : `showreel · ${s.name}`;
    });
  }

  /* ---------- smooth in-page anchors ---------- */
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href') ?? '';
    e.preventDefault();
    setOpen(false);
    if (id === '#top' || id === '#') {
      ctx.lenis.scrollTo(0, { duration: 1.4 });
      return;
    }
    const target = document.querySelector<HTMLElement>(id);
    if (target) ctx.lenis.scrollTo(target, { duration: 1.4 });
  });
}
