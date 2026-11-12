/** "play reel": the full film opens out of the chip you clicked (clip-path morph). */
import gsap from 'gsap';
import type { Ctx } from '../ctx';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function initReelModal(ctx: Ctx) {
  const modal = document.querySelector<HTMLElement>('[data-rmodal]');
  if (!modal) return;
  const video = modal.querySelector<HTMLVideoElement>('video')!;
  const durationEls = document.querySelectorAll<Element>('[data-reel-duration]');
  const first = video.currentSrc || video.src;
  const next = video.dataset.next;
  let from: HTMLElement | null = null;
  let open = false;

  video.addEventListener('loadedmetadata', () => {
    if ((video.currentSrc || video.src) === first && Number.isFinite(video.duration)) {
      durationEls.forEach((el) => (el.textContent = fmt(video.duration)));
    }
  });
  video.addEventListener('ended', () => {
    if (next && video.src !== next) {
      video.src = next;
      video.play().catch(() => {});
    }
  });

  const insetOf = (el: HTMLElement | null) => {
    if (!el) return 'inset(50% 50% 50% 50% round 10px)';
    const r = el.getBoundingClientRect();
    // the round play button opens as a circle, chips as rounded rectangles
    const radius = el.classList.contains('playring') ? Math.min(r.width, r.height) / 2 : 10;
    return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round ${radius}px)`;
  };

  function show(btn: HTMLElement) {
    from = btn;
    open = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    ctx.lenis.stop();
    gsap.killTweensOf(modal);
    gsap.fromTo(
      modal,
      { clipPath: insetOf(btn) },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: ctx.reduced ? 0.01 : 1.1, ease: 'expo.inOut' },
    );
    if (video.src !== first) video.src = first;
    video.currentTime = 0;
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }

  function hide() {
    if (!open) return;
    open = false;
    gsap.killTweensOf(modal);
    gsap.to(modal, {
      clipPath: insetOf(from),
      duration: ctx.reduced ? 0.01 : 0.8,
      ease: 'expo.inOut',
      onComplete: () => {
        if (open) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        video.pause();
      },
    });
    ctx.lenis.start();
  }

  document.querySelectorAll<HTMLElement>('[data-reel-play]').forEach((b) => b.addEventListener('click', () => show(b)));
  modal.querySelector('[data-rmodal-close]')?.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
}
