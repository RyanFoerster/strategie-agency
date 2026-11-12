/**
 * v2 sidebar, the "root system":
 * - every project hangs on one trunk; the trunk fills (green) down to the
 *   project playing in the hero, so the roots grow as the reel plays
 * - hover a project to see it in the hero (featured ones play, the others preview)
 * - search + branding / communication filters; enter with no match asks StratAI
 */
import type { Ctx } from '../ctx';
import type { Ask } from '../modules/ask';
import type { DashReel, Preview } from './reel';

export function initSidebar(ctx: Ctx, reel: DashReel, ask: Ask | null) {
  const tree = document.querySelector<HTMLElement>('.d-tree');
  if (!tree) return;
  const rows = [...tree.querySelectorAll<HTMLElement>('.tr')];
  const featured = rows.filter((r) => r.dataset.slide !== undefined);
  const search = document.querySelector<HTMLInputElement>('[data-search]');
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const filterWrap = document.querySelector<HTMLElement>('.d-filters');
  let active: HTMLElement | null = rows[0] ?? null;
  let hovering = false;
  let filter = 'all';

  /* ---------- rows ---------- */
  const loadThumb = (row: HTMLElement) => {
    const img = row.querySelector<HTMLImageElement>('img[data-src]');
    if (img && !img.getAttribute('src')) img.src = img.dataset.src ?? '';
  };
  const setOpen = (row: HTMLElement | null) => {
    rows.forEach((r) => r.classList.toggle('is-open', r === row));
    if (row) loadThumb(row);
  };
  const paintTrunk = () => {
    const idx = active ? rows.indexOf(active) : -1;
    rows.forEach((r, k) => r.classList.toggle('is-trunk', k < idx));
  };
  const reveal = (row: HTMLElement) => {
    const top = row.offsetTop - tree.clientHeight / 2 + 40;
    tree.scrollTo({ top, behavior: ctx.reduced ? 'auto' : 'smooth' });
  };

  reel.onChange((i) => {
    if (i < 0) return; // a preview of a non-featured project
    active = featured.find((r) => Number(r.dataset.slide) === i) ?? null;
    rows.forEach((r) => r.classList.toggle('is-active', r === active));
    paintTrunk();
    if (!hovering && active) {
      setOpen(active);
      if (!active.classList.contains('is-hidden')) reveal(active);
    }
  });
  reel.onProgress((p) => active?.style.setProperty('--p', String(p)));

  /* ---------- hover to show it in the hero ---------- */
  const showRow = (row: HTMLElement) => {
    if (row.dataset.slide !== undefined) {
      reel.go(Number(row.dataset.slide));
      return;
    }
    const data = JSON.parse(row.dataset.preview ?? '{}') as { name: string; sub: string; src: string };
    const href = row.querySelector<HTMLAnchorElement>('a')?.href ?? '#';
    const preview: Preview = { name: data.name, src: data.src, href };
    reel.preview(preview);
  };

  if (ctx.hover) {
    let timer = 0;
    tree.addEventListener('pointerenter', () => {
      hovering = true;
      reel.hold(true);
    });
    tree.addEventListener('pointerleave', () => {
      hovering = false;
      window.clearTimeout(timer);
      reel.hold(false);
      setOpen(active);
    });
    rows.forEach((row) =>
      row.addEventListener('pointerenter', () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => showRow(row), 70);
      }),
    );
  }

  /* ---------- search + filters ---------- */
  function apply() {
    const q = (search?.value ?? '').trim().toLowerCase();
    let shown = 0;
    rows.forEach((r) => {
      const cat = r.dataset.cat ?? '';
      const catOk = filter === 'all' || cat === filter || cat === 'both';
      const qOk = !q || (r.dataset.name ?? '').includes(q);
      const show = catOk && qOk;
      r.classList.toggle('is-hidden', !show);
      if (show) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  if (filterWrap) {
    const ind = filterWrap.querySelector<HTMLElement>('.filters__ind')!;
    const buttons = [...filterWrap.querySelectorAll<HTMLButtonElement>('[data-filter]')];
    const place = (btn: HTMLElement) => {
      ind.style.width = `${btn.offsetWidth}px`;
      ind.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    const current = () => buttons.find((b) => b.classList.contains('is-active')) ?? buttons[0];
    place(current());
    document.fonts?.ready.then(() => place(current()));
    window.addEventListener('resize', () => place(current()));
    buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter ?? 'all';
        buttons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        place(btn);
        apply();
        tree.scrollTo({ top: 0, behavior: ctx.reduced ? 'auto' : 'smooth' });
      }),
    );
  }

  search?.addEventListener('input', apply);
  search?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = search.value.trim();
    const first = rows.find((r) => !r.classList.contains('is-hidden') && r.dataset.slide !== '0');
    if (q && !first) ask?.open(q, true);
    else if (first) showRow(first);
  });
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]');
    if (e.key === '/' && !typing && search) {
      e.preventDefault();
      search.focus();
    }
  });
}
