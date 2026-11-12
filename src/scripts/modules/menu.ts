/**
 * Round-burger menu sheet that grows out of the button as a circle,
 * plus smooth in-page anchors through Lenis. (Same behaviour as in v3's nav.)
 */
import gsap from 'gsap';
import type { Ctx } from '../ctx';

export function initMenu(ctx: Ctx) {
  const html = document.documentElement;
  const sheet = document.querySelector<HTMLElement>('[data-menu]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  let open = false;

  function setOpen(v: boolean) {
    if (!sheet || !toggle || v === open) return;
    open = v;
    const links = sheet.querySelectorAll<HTMLElement>('.msheet__links a > span');
    toggle.setAttribute('aria-expanded', String(v));
    sheet.setAttribute('aria-hidden', String(!v));
    html.classList.toggle('menu-open', v);
    gsap.killTweensOf([sheet, links]);
    if (v) sheet.classList.add('is-open');
    const s = sheet.getBoundingClientRect();
    const b = toggle.getBoundingClientRect();
    const cx = b.left + b.width / 2 - s.left;
    const cy = b.top + b.height / 2 - s.top;
    const far = Math.hypot(Math.max(cx, s.width - cx), Math.max(cy, s.height - cy));
    const small = `circle(${b.width / 2}px at ${cx}px ${cy}px)`;
    if (v) {
      gsap.fromTo(
        sheet,
        { clipPath: small },
        { clipPath: `circle(${far}px at ${cx}px ${cy}px)`, duration: ctx.reduced ? 0.01 : 0.85, ease: 'expo.inOut' },
      );
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04, delay: 0.25 });
    } else {
      gsap.to(sheet, {
        clipPath: small,
        duration: ctx.reduced ? 0.01 : 0.6,
        ease: 'expo.inOut',
        onComplete: () => {
          if (!open) sheet.classList.remove('is-open');
        },
      });
    }
  }

  toggle?.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as Node;
    if (open && sheet && toggle && !sheet.contains(t) && !toggle.contains(t)) setOpen(false);
  });

  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!a) return;
    const id = a.getAttribute('href') ?? '';
    e.preventDefault();
    setOpen(false);
    if (id === '#top' || id === '#') {
      ctx.lenis.scrollTo(0, { duration: 1.4 });
      return;
    }
    const target = document.querySelector<HTMLElement>(id);
    if (target) ctx.lenis.scrollTo(target, { duration: 1.4, offset: -8 });
  });

  return { close: () => setOpen(false) };
}
