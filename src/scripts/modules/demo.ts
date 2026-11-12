/** Prototype bar: compare the wave and the minimal transition (remembered per browser). */
import type { TransitionMode } from '../lib/waveDots';

const KEY = 'strategie-transition';

export function initTransitionSwitch(setMode: (m: TransitionMode) => void) {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-tmode]')];
  const apply = (m: TransitionMode) => {
    setMode(m);
    buttons.forEach((b) => {
      const on = b.dataset.tmode === m;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  };
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* storage unavailable */
  }
  apply(saved === 'fade' ? 'fade' : 'wave');
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const m: TransitionMode = b.dataset.tmode === 'fade' ? 'fade' : 'wave';
      apply(m);
      try {
        localStorage.setItem(KEY, m);
      } catch {
        /* storage unavailable */
      }
    }),
  );
}
