export type BrusselsTime = {
  h: number;
  m: number;
  s: number;
  hh: string;
  mm: string;
  ss: string;
  weekday: string;
  day: string;
  month: string;
  tz: string;
};

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Brussels',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZoneName: 'short',
});

export function brussels(date = new Date()): BrusselsTime {
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  return {
    h: Number(p.hour),
    m: Number(p.minute),
    s: Number(p.second),
    hh: p.hour,
    mm: p.minute,
    ss: p.second,
    weekday: (p.weekday ?? '').toLowerCase(),
    day: p.day ?? '',
    month: (p.month ?? '').toLowerCase(),
    tz: (p.timeZoneName ?? 'cet').toLowerCase(),
  };
}

const listeners: ((t: BrusselsTime) => void)[] = [];
export const onClock = (fn: (t: BrusselsTime) => void) => listeners.push(fn);

export function initClock() {
  const full = document.querySelectorAll<HTMLElement>('[data-clock]');
  const short = document.querySelectorAll<HTMLElement>('[data-clock-short]');
  const tz = document.querySelectorAll<HTMLElement>('[data-tz]');
  const date = document.querySelectorAll<HTMLElement>('[data-date]');

  const update = () => {
    const t = brussels();
    full.forEach((el) => (el.textContent = `${t.hh}:${t.mm}:${t.ss}`));
    short.forEach((el) => (el.textContent = `${t.hh}:${t.mm}`));
    tz.forEach((el) => (el.textContent = t.tz));
    date.forEach((el) => (el.textContent = `${t.weekday} ${t.day} ${t.month}`));
    listeners.forEach((fn) => fn(t));
  };
  update();
  window.setInterval(update, 1000);
}
