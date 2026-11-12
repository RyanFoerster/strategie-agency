import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

/** Letter roll on hover: split [data-roll] labels into chars (CSS does the motion). */
export function initRoll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-roll]').forEach((el) => {
    if (el.dataset.rolled) return;
    el.dataset.rolled = '1';
    const text = (el.textContent ?? '').trim();
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    [...text].forEach((c, i) => {
      const ch = document.createElement('span');
      ch.className = 'ch';
      ch.style.setProperty('--i', String(i));
      ch.textContent = c === ' ' ? ' ' : c;
      visual.append(ch);
    });
    el.classList.add('roll');
    el.replaceChildren(sr, visual);
  });
}

/** Masked line reveal for [data-reveal] headings. */
export function initReveal(reduced: boolean) {
  if (reduced) return;
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });
}
