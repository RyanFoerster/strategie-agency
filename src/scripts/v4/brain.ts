/**
 * StratAI's (scripted) brain: understands a few intents in English, French and
 * Dutch keywords, and tells the stage what to say, how to feel and what to show.
 */
import type { Fx, Mood } from './robot';

export type Intent = {
  key: string;
  mood: Mood;
  say: string;
  fx?: Fx;
  cards?: 'branding' | 'communication' | 'all';
  action?: 'coffee' | 'reel';
  link?: { href: string; label: string };
};

const RULES: { test: RegExp; intent: Intent }[] = [
  {
    test: /(showreel|\breel\b|watch|regarder|bekijk)/i,
    intent: { key: 'reel', mood: 'excited', action: 'reel', say: 'lights off, popcorn on. rolling the showreel…' },
  },
  {
    test: /(coffee|caf[eé]|koffie|meet|meeting|rdv|rendez|call|appel|contact|talk to|parler)/i,
    intent: {
      key: 'coffee',
      mood: 'love',
      action: 'coffee',
      say: 'copied coffee@strategie.agency to your clipboard. the kettle is on in hermée, see you soon.',
    },
  },
  {
    test: /(thank|merci|bedankt|dank je|love|j'adore|great|super|nice|cool|bravo)/i,
    intent: { key: 'thanks', mood: 'love', say: 'aww. i’ll pass it on to the humans, they built me.' },
  },
  {
    // before "work": "who did you work with?" is about clients
    test: /(who did|client|ferrero|nutella|audi|porsche|avec qui|worked with|work with|travaill[eé])/i,
    intent: {
      key: 'clients',
      mood: 'proud',
      fx: 'sparks',
      say: 'they grew up with us: ferrero, nutella, mcdonald’s, audi, porsche, zeiss, leffe, herta, haleon, vandemoortele… and plenty of belgian favourites.',
    },
  },
  {
    test: /(pack|brand|identit|logo|naming|marque|merk)/i,
    intent: {
      key: 'branding',
      mood: 'proud',
      cards: 'branding',
      say: 'here’s some branding & packaging, freshly grown. click a card to read the story.',
      link: { href: '#work', label: 'see the selection below ↓' },
    },
  },
  {
    test: /(campaign|campagne|comm|social|photo|film|video|vid[eé]o|pub|advert|activation)/i,
    intent: {
      key: 'communication',
      mood: 'proud',
      cards: 'communication',
      say: 'campaigns, shoots and activations. a few favourites:',
      link: { href: '#work', label: 'see the selection below ↓' },
    },
  },
  {
    test: /(work|project|projet|case|portfolio|show|montre|r[eé]alisation|travail|werk)/i,
    intent: {
      key: 'work',
      mood: 'proud',
      cards: 'all',
      say: '51 stories on the work page. here are a few i like:',
      link: { href: '#work', label: 'see the selection below ↓' },
    },
  },
  {
    test: /(stratai|who are you|qui es|robot|\bai\b|\bia\b|yourself|toi)/i,
    intent: {
      key: 'stratai',
      mood: 'proud',
      say: 'i’m stratai, the team’s ai sidekick. i speed up the research (reviews, competitors, social conversation) so the humans spend their time on ideas. fueled by humans, powered by me.',
    },
  },
  {
    test: /(where|o[uù] |address|adresse|herm[eé]e|belgi|li[eè]ge|office|bureau|waar)/i,
    intent: {
      key: 'where',
      mood: 'happy',
      say: 'rue grand aaz 31, b4680 hermée, belgium. just outside liège.',
      link: { href: '#connect', label: 'all the contact details ↓' },
    },
  },
  {
    test: /(job|hiring|join|career|stage|intern|emploi|recrut|vacature)/i,
    intent: {
      key: 'jobs',
      mood: 'excited',
      say: 'we’re hiring! open jobs, internships and spontaneous applications are all welcome. join the roots.',
    },
  },
  {
    test: /(joke|blague|grap|smile|sourire|dance|danse|fun|rigol)/i,
    intent: {
      key: 'joke',
      mood: 'dance',
      say: 'why did the brand go to therapy? too many identity issues. ba-dum-tss.',
    },
  },
  {
    test: /(sleep|dodo|tired|fatigu|moe)/i,
    intent: { key: 'sleep', mood: 'sleep', say: 'five more minutes…' },
  },
  {
    test: /\b(hi|hello|hey|yo|salut|bonjour|hallo|hoi|coucou)\b/i,
    intent: {
      key: 'hello',
      mood: 'happy',
      say: 'hi! i’m stratai. ask me about the work, the people, or how to get a coffee with them.',
    },
  },
  {
    test: /(what|quoi|do you do|faites|service|expertise|agency|agence|strategie|wat doen)/i,
    intent: {
      key: 'what',
      mood: 'proud',
      say: 'strategie is an independent branding & communication agency in hermée, belgium. we dig deep into your brand, its people and its ecosystem, then build the identity, the packaging and the campaigns that make it grow.',
      link: { href: '#about', label: 'our approach ↓' },
    },
  },
];

const FALLBACK: Intent = {
  key: 'unknown',
  mood: 'confused',
  say: 'hmm, that one is above my pay grade. the team will happily answer it over a coffee: coffee@strategie.agency',
};

export function understand(question: string): Intent {
  const q = question.trim();
  return RULES.find((r) => r.test.test(q))?.intent ?? FALLBACK;
}

export const POKES = [
  'hey, that tickles.',
  'beep boop. that’s robot for hello.',
  '0% calories, 100% insights.',
  'careful, i bruise like a peach.',
  'poke me again and i’ll start a brainstorm.',
];
