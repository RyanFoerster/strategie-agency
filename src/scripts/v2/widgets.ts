/** Dashboard widgets: studio clock & status, long date, StratAI pulse, robot, copy email. */
import gsap from 'gsap';
import { onClock } from '../modules/clock';
import type { Ctx } from '../ctx';

const longDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Brussels',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function initWidgets(ctx: Ctx) {
  const card = document.querySelector<HTMLElement>('.d-clockcard');
  const hands = card && {
    h: card.querySelector<SVGLineElement>('.clock__h')!,
    m: card.querySelector<SVGLineElement>('.clock__m')!,
    s: card.querySelector<SVGLineElement>('.clock__s')!,
  };
  const statuses = document.querySelectorAll<HTMLElement>('[data-studio-status]');
  const dots = document.querySelectorAll<HTMLElement>('[data-studio-dot]');
  const dates = document.querySelectorAll<HTMLElement>('[data-date-long]');
  let turns = 0;
  let prevS = -1;
  let lastMinute = -1;

  onClock((t) => {
    if (hands) {
      if (prevS !== -1 && t.s < prevS) turns++;
      prevS = t.s;
      hands.s.style.transform = `rotate(${(turns * 60 + t.s) * 6}deg)`;
      hands.m.style.transform = `rotate(${(t.m + t.s / 60) * 6}deg)`;
      hands.h.style.transform = `rotate(${((t.h % 12) + t.m / 60) * 30}deg)`;
    }
    if (t.m !== lastMinute) {
      lastMinute = t.m;
      const open = !['sat', 'sun'].includes(t.weekday) && t.h >= 9 && t.h < 18;
      statuses.forEach((el) => {
        el.classList.toggle('is-open', open);
        el.textContent = open ? 'studio open' : 'studio closed';
      });
      dots.forEach((el) => {
        el.classList.toggle('is-open', open);
        el.title = open ? 'studio open' : 'studio closed';
      });
      const d = longDate.format(new Date()).toLowerCase();
      dates.forEach((el) => (el.textContent = d));
    }
  });

  /* StratAI: a live-ish counter while visible, robot leans to the cursor */
  const count = document.querySelector<HTMLElement>('[data-ai-count]');
  if (count) {
    let insights = 1248;
    let timer = 0;
    new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (!e.isIntersecting || ctx.reduced) return;
      timer = window.setInterval(() => {
        insights += 1 + Math.floor(Math.random() * 6);
        count.textContent = insights.toLocaleString('en');
        gsap.fromTo(count, { yPercent: 14, opacity: 0.5 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
      }, 1400);
    }).observe(count);
  }
  const bot = document.querySelector<HTMLElement>('.d-ai__bot');
  if (bot && ctx.hover && !ctx.reduced) {
    const rTo = gsap.quickTo(bot, 'rotation', { duration: 0.9, ease: 'power3' });
    const xTo = gsap.quickTo(bot, 'x', { duration: 0.9, ease: 'power3' });
    window.addEventListener(
      'pointermove',
      (e) => {
        const r = bot.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        rTo(dx * 16);
        xTo(dx * 22);
      },
      { passive: true },
    );
  }

  /* copy email */
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
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
