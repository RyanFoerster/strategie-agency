/**
 * The v4 stage: you ask, StratAI listens (leans in while you type), thinks
 * (loader in the visor), then answers in the bubble while its mouth moves,
 * and shows project cards that fly out of it when you ask about the work.
 * It fidgets when you wait, falls asleep when you leave, wakes up when you come back.
 */
import gsap from 'gsap';
import type { Ctx } from '../ctx';
import type { Robot } from './robot';
import { POKES, understand, type Intent } from './brain';

type Card = { name: string; line: string; cover: string; href: string };
type Cards = Record<'branding' | 'communication' | 'all', Card[]>;

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function initStage(ctx: Ctx, robot: Robot) {
  const form = document.querySelector<HTMLFormElement>('[data-prompt]')!;
  const input = form.querySelector<HTMLInputElement>('[data-input]')!;
  const bubble = document.querySelector<HTMLElement>('[data-bubble]')!;
  const qEl = bubble.querySelector<HTMLElement>('[data-bubble-q]')!;
  const aEl = bubble.querySelector<HTMLElement>('[data-bubble-a]')!;
  const cardsEl = document.querySelector<HTMLElement>('[data-cards]')!;
  const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-ask]')];
  const cards: Cards = JSON.parse(document.getElementById('v4-cards')?.textContent || '{}');

  let busy = false;
  let typer = 0;
  let idleTimer = 0;
  let sleepTimer = 0;
  let lastCards = '';

  /* ---------- bubble ---------- */
  function typeAnswer(text: string, link?: Intent['link']) {
    return new Promise<void>((resolve) => {
      window.clearInterval(typer);
      bubble.classList.remove('is-thinking');
      aEl.textContent = '';
      const caret = document.createElement('i');
      caret.className = 'caret';
      robot.speak(true);
      if (ctx.reduced) {
        aEl.textContent = text;
        robot.speak(false);
        appendLink(link);
        resolve();
        return;
      }
      let i = 0;
      const node = document.createTextNode('');
      aEl.append(node, caret);
      typer = window.setInterval(() => {
        i += 2;
        node.textContent = text.slice(0, i);
        if (i >= text.length) {
          window.clearInterval(typer);
          caret.remove();
          robot.speak(false);
          appendLink(link);
          resolve();
        }
      }, 22);
    });
  }

  function appendLink(link?: Intent['link']) {
    if (!link) return;
    const a = document.createElement('a');
    a.className = 'bubble__link';
    a.href = link.href;
    a.textContent = link.label;
    aEl.append(a);
    gsap.from(a, { opacity: 0, y: 6, duration: 0.5, ease: 'expo.out' });
  }

  function thinking(question: string) {
    window.clearInterval(typer);
    qEl.hidden = false;
    qEl.textContent = question;
    bubble.classList.add('is-thinking');
    aEl.innerHTML = '<span class="dots3" aria-label="thinking"><i></i><i></i><i></i></span>';
    gsap.fromTo(bubble, { y: 8, opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out' });
  }

  /* ---------- cards fly out of the robot ---------- */
  function fromRobot(el: HTMLElement) {
    const c = robot.visorCenter();
    const r = el.getBoundingClientRect();
    return { x: c.x - (r.left + r.width / 2), y: c.y - (r.top + r.height / 2) };
  }

  function clearCards() {
    const old = [...cardsEl.children] as HTMLElement[];
    if (!old.length) return;
    old.forEach((el, i) => {
      const d = fromRobot(el);
      gsap.to(el, {
        x: d.x,
        y: d.y,
        scale: 0.2,
        opacity: 0,
        duration: 0.45,
        delay: i * 0.03,
        ease: 'power3.in',
        onComplete: () => el.remove(),
      });
    });
    lastCards = '';
  }

  function showCards(kind: keyof Cards) {
    if (lastCards === kind) {
      robot.lookAtElement(cardsEl);
      return;
    }
    clearCards();
    lastCards = kind;
    const tilt = [-3, 2.5, -1.5, 3];
    const els = (cards[kind] ?? []).map((cd, i) => {
      const a = document.createElement('a');
      a.className = 'scard';
      a.href = cd.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.setProperty('--r', `${tilt[i % tilt.length]}deg`);
      a.innerHTML = `<img src="${cd.cover}" alt="" loading="eager" decoding="async"><span class="scard__meta"><b class="scard__name"></b><span class="scard__line"></span></span>`;
      a.querySelector('.scard__name')!.textContent = cd.name;
      a.querySelector('.scard__line')!.textContent = cd.line;
      a.addEventListener('pointerenter', () => robot.lookAtElement(a, 1200));
      return a;
    });
    cardsEl.append(...els);
    els.forEach((el, i) => {
      const d = fromRobot(el);
      gsap.from(el, {
        x: d.x,
        y: d.y,
        scale: 0.2,
        opacity: 0,
        rotation: (Math.random() - 0.5) * 40,
        duration: ctx.reduced ? 0.01 : 1,
        ease: 'expo.out',
        delay: 0.35 + i * 0.09,
      });
    });
    window.setTimeout(() => robot.lookAtElement(cardsEl, 2600), 300);
  }

  /* ---------- the conversation ---------- */
  let asked = false;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    busy = true;
    asked = true;
    activity();
    input.value = '';
    input.blur();
    thinking(q);
    robot.setMood('think');
    await wait(ctx.reduced ? 100 : 900 + Math.random() * 500);

    const intent = understand(q);
    robot.setMood(intent.mood);
    if (intent.fx) robot.spawn(intent.fx, 4);
    if (intent.cards) showCards(intent.cards);
    else if (intent.key !== 'thanks' && intent.key !== 'coffee') clearCards();

    if (intent.action === 'coffee') {
      try {
        await navigator.clipboard.writeText('coffee@strategie.agency');
      } catch {
        /* clipboard unavailable: the answer still shows the address */
      }
    }
    if (intent.action === 'reel') {
      window.setTimeout(() => document.querySelector<HTMLElement>('[data-reel-play]')?.click(), 900);
    }

    await typeAnswer(intent.say, intent.link);
    busy = false;
    window.setTimeout(() => {
      if (!busy && robot.mood !== 'sleep' && document.activeElement !== input) robot.setMood('idle');
    }, intent.mood === 'sleep' ? 6000 : 1800);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ask(input.value);
  });
  input.addEventListener('focus', () => {
    activity();
    if (!busy) robot.setMood('listen');
  });
  input.addEventListener('blur', () => {
    if (!busy && robot.mood === 'listen') robot.setMood('idle');
  });
  input.addEventListener('input', () => {
    activity();
    robot.nod();
  });

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      if (chip.hasAttribute('data-reel-play')) {
        // the reel modal opens by itself, StratAI just reacts
        robot.setMood('excited');
        typeAnswer('lights off, popcorn on. rolling the showreel…');
        return;
      }
      ask(chip.dataset.ask ?? chip.textContent ?? '');
    }),
  );

  robot.onPoke = () => {
    if (busy) return;
    activity();
    robot.setMood('happy');
    robot.wiggle();
    qEl.hidden = true;
    typeAnswer(POKES[Math.floor(Math.random() * POKES.length)]).then(() =>
      window.setTimeout(() => robot.mood === 'happy' && robot.setMood('idle'), 1200),
    );
  };

  /* ---------- fidget, sleep, wake up ---------- */
  function activity() {
    window.clearTimeout(idleTimer);
    window.clearTimeout(sleepTimer);
    if (robot.mood === 'sleep' && !busy) {
      robot.setMood('excited');
      qEl.hidden = true;
      typeAnswer('oh! i was just defragmenting. what can i do for you?').then(() =>
        window.setTimeout(() => robot.mood === 'excited' && robot.setMood('idle'), 1000),
      );
    }
    const fidgetLoop = () => {
      idleTimer = window.setTimeout(() => {
        if (!busy && robot.mood === 'idle') robot.fidget();
        fidgetLoop();
      }, 6500 + Math.random() * 4000);
    };
    fidgetLoop();
    sleepTimer = window.setTimeout(() => {
      if (!busy && document.activeElement !== input) robot.setMood('sleep');
    }, 40000);
  }
  let lastMove = 0;
  window.addEventListener(
    'pointermove',
    () => {
      const now = performance.now();
      if (now - lastMove > 1500 || robot.mood === 'sleep') {
        lastMove = now;
        activity();
      }
    },
    { passive: true },
  );
  window.addEventListener('keydown', () => activity());

  return {
    greet: async () => {
      activity();
      if (asked) return; // someone was quicker than the intro
      robot.setMood('happy');
      await typeAnswer('hi, i’m stratai. ask me anything about strategie, or pick a question below.');
      window.setTimeout(() => robot.mood === 'happy' && robot.setMood('idle'), 800);
    },
  };
}
