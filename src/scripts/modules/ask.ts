/**
 * Ask StratAI: a small command palette. Filters suggestions as you type,
 * arrow keys + enter, a few scripted answers typed out by "stratai", and
 * shortcuts to the work filters, the reel, the contact and the coffee.
 */
import gsap from 'gsap';
import type { Ctx } from '../ctx';

const ANSWERS: Record<string, string> = {
  what: 'strategie is an independent branding & communication agency in hermée, belgium. we dig deep into your brand, its people and its ecosystem, then build the identity, the packaging and the campaigns that make it grow.',
  stratai:
    'i’m stratai, the team’s ai sidekick. i speed up the research (reviews, competitors, social conversation) so the humans spend their time on ideas. fueled by humans, powered by me.',
  clients:
    'they grew up with us: ferrero, nutella, mcdonald’s, audi, porsche, zeiss, leffe, herta, haleon, vandemoortele… 51 stories on the work page.',
  coffee: 'copied coffee@strategie.agency to your clipboard. the kettle is on in hermée.',
  fallback:
    'good question. this demo only knows a few answers, the team will happily take it over a coffee: coffee@strategie.agency',
};

export type Ask = { open: (query?: string, answerNow?: boolean) => void; close: () => void };

export function initAsk(ctx: Ctx, opts: { slash?: boolean } = {}): Ask | null {
  const root = document.querySelector<HTMLElement>('[data-ask]');
  if (!root) return null;
  const panel = root.querySelector<HTMLElement>('.ask__panel')!;
  const backdrop = root.querySelector<HTMLElement>('.ask__backdrop')!;
  const input = root.querySelector<HTMLInputElement>('[data-ask-input]')!;
  const answer = root.querySelector<HTMLElement>('[data-ask-answer]')!;
  const answerText = root.querySelector<HTMLElement>('[data-ask-text]')!;
  const items = [...root.querySelectorAll<HTMLElement>('[data-action]')];
  let open = false;
  let active = 0;
  let typer = 0;
  let lastFocus: HTMLElement | null = null;

  const visible = () => items.filter((it) => !it.hidden);

  function highlight(i: number) {
    const list = visible();
    if (!list.length) return;
    active = (i + list.length) % list.length;
    items.forEach((it) => {
      const on = it === list[active];
      it.classList.toggle('is-active', on);
      it.setAttribute('aria-selected', String(on));
    });
  }

  function filter() {
    const q = input.value.trim().toLowerCase();
    items.forEach((it) => (it.hidden = !!q && !(it.textContent ?? '').toLowerCase().includes(q)));
    highlight(0);
  }

  function say(text: string) {
    window.clearInterval(typer);
    answer.hidden = false;
    answerText.textContent = '';
    if (ctx.reduced) {
      answerText.textContent = text;
      return;
    }
    let i = 0;
    typer = window.setInterval(() => {
      i += 2;
      answerText.textContent = text.slice(0, i);
      if (i >= text.length) window.clearInterval(typer);
    }, 16);
  }

  function show(query = '', answerNow = false) {
    if (!open) {
      open = true;
      lastFocus = document.activeElement as HTMLElement | null;
      root!.classList.add('is-open');
      root!.setAttribute('aria-hidden', 'false');
      ctx.lenis.stop();
      gsap.killTweensOf([panel, backdrop, items]);
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(
        panel,
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: ctx.reduced ? 0.01 : 0.7, ease: 'expo.out' },
      );
      gsap.fromTo(items, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.03, delay: 0.08 });
    }
    input.value = query;
    answer.hidden = true;
    filter();
    input.focus({ preventScroll: true });
    if (answerNow && query) say(ANSWERS.fallback);
  }

  const isShown = () => open || root!.classList.contains('is-open');

  function hide() {
    if (!isShown()) return;
    open = false;
    window.clearInterval(typer);
    // stop the opening animation if it is still running, or it would win over this one
    gsap.killTweensOf([panel, backdrop, items]);
    gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(panel, {
      opacity: 0,
      y: 12,
      scale: 0.98,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (open) return;
        root!.classList.remove('is-open');
        root!.setAttribute('aria-hidden', 'true');
      },
    });
    ctx.lenis.start();
    lastFocus?.focus({ preventScroll: true });
  }

  function scrollTo(sel: string) {
    const target = document.querySelector<HTMLElement>(sel);
    if (target) ctx.lenis.scrollTo(target, { duration: 1.4, offset: -8 });
  }

  async function run(action: string) {
    const [kind, arg] = action.split(':');
    if (kind === 'answer') return say(ANSWERS[arg] ?? ANSWERS.fallback);
    if (kind === 'coffee') {
      try {
        await navigator.clipboard.writeText('coffee@strategie.agency');
      } catch {
        /* clipboard unavailable: the answer still shows the address */
      }
      return say(ANSWERS.coffee);
    }
    hide();
    if (kind === 'goto') return scrollTo(arg);
    if (kind === 'reel') {
      document.querySelector<HTMLElement>('[data-reel-play]')?.click();
      return;
    }
    if (kind === 'filter') {
      if (document.querySelector('#work')) scrollTo('#work');
      document.querySelector<HTMLElement>(`[data-filter="${arg}"]`)?.click();
    }
  }

  items.forEach((it) => {
    it.addEventListener('pointermove', () => highlight(visible().indexOf(it)));
    it.addEventListener('click', () => run(it.dataset.action ?? ''));
  });
  input.addEventListener('input', () => {
    answer.hidden = true;
    filter();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlight(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight(active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const list = visible();
      if (list.length) run(list[active].dataset.action ?? '');
      else if (input.value.trim()) say(ANSWERS.fallback);
    }
  });
  root.querySelectorAll('[data-ask-close]').forEach((el) => el.addEventListener('click', hide));
  document.querySelectorAll('[data-ask-open]').forEach((el) => el.addEventListener('click', () => show()));
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]');
    if (e.key === 'Escape' && isShown()) hide();
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isShown()) hide();
      else show();
    } else if (opts.slash !== false && e.key === '/' && !typing && !isShown()) {
      e.preventDefault();
      show();
    }
  });

  return { open: show, close: hide };
}
