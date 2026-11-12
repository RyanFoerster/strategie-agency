// Content for the prototype. Media is loaded straight from strategie.agency
// (their own public assets), so nothing is copied into this repo.

export const CDN = 'https://www.strategie.agency';

export const media = {
  wave: `${CDN}/build/assets/000010_STG_WAVE_02_16X9-CltKyx2j.mp4`,
  branding: `${CDN}/assets/videos/branding.mp4`,
  communication: `${CDN}/assets/videos/communication.mp4`,
  stratai: `${CDN}/assets/images/layout/stratai.png`,
};

export type Case = {
  slug: string;
  name: string;
  line: string;
  cat: 'branding' | 'communication';
  tags: string[];
  cover: string;
  /** second visual revealed on hover (falls back to a zoom of the cover) */
  alt?: string;
  /** approximate brand colour, used for the hover tether */
  color: string;
  ink?: string;
  /** slug of the case on strategie.agency */
  site: string;
  href: string;
};

const work = (slug?: string) => (slug ? `${CDN}/en/work/${slug}` : `${CDN}/en/work`);
const img = (path: string) => `${CDN}/assets/cases/${path}`;

const c = (data: Omit<Case, 'href'>): Case => ({ ...data, href: work(data.site) });

export const cases: Case[] = [
  c({
    slug: 'balade',
    name: 'balade',
    line: 'new packaging design',
    cat: 'branding',
    tags: ['branding', 'packaging'],
    cover: img('balade-new-packaging-design/card_header.jpg'),
    alt: img('balade/balade-thumbnail.png'),
    color: '#2e7d32',
    site: 'balade-new-packaging-design',
  }),
  c({
    slug: 'mcdonalds',
    name: 'mcdonald’s',
    line: 'big openings',
    cat: 'communication',
    tags: ['communication', 'activation'],
    cover: img('mcdonalds-big-openings/card_header.webp'),
    color: '#ffbc0d',
    ink: '#111111',
    site: 'mcdonalds-big-openings',
  }),
  c({
    slug: 'ferrero-rocher',
    name: 'ferrero rocher',
    line: 'add your golden touch',
    cat: 'communication',
    tags: ['communication', 'campaign'],
    cover: img('ferrero-rocher-add-your-golden-touch/hand-2.jpg'),
    alt: img('ferrero/Ferrero-praline.jpg'),
    color: '#b8893b',
    site: 'ferrero-rocher-add-your-golden-touch',
  }),
  c({
    slug: 'nutella',
    name: 'nutella',
    line: 'good morning',
    cat: 'communication',
    tags: ['communication', 'photography'],
    cover: img('nutella-good-morning/photoshoot-van.jpg'),
    alt: img('nutella/nutella-thumbnail.png'),
    color: '#d6281c',
    site: 'nutella-good-morning',
  }),
  c({
    slug: 'promagnor',
    name: 'promagnor',
    line: 'premium range',
    cat: 'branding',
    tags: ['branding', 'packaging'],
    cover: img('promagnor-premium-range/header2.webp'),
    alt: img('promagnor/promagnor-thumbnail.png'),
    color: '#1d3b6e',
    site: 'promagnor-premium-range',
  }),
  c({
    slug: 'herta',
    name: 'herta',
    line: 'sans chichi',
    cat: 'communication',
    tags: ['communication', 'campaign'],
    cover: img('herta/Herta-visuel-home.jpg'),
    alt: img('herta/chichi/Herta-Sans-ChiChi-logo.jpg'),
    color: '#c8102e',
    site: 'herta-sans-chichi-zonder-chichi',
  }),
  c({
    slug: 'mc',
    name: 'mc medi+',
    line: 'healthcare communication',
    cat: 'communication',
    tags: ['communication', 'campaign'],
    cover: img('mc-medi/B0007938-Modifiers.jpg'),
    alt: img('mc/mc-thumbnail.png'),
    color: '#0057b8',
    site: 'mc-medi',
  }),
  c({
    slug: 'vandemoortele',
    name: 'vandemoortele',
    line: 'recipe shooting',
    cat: 'communication',
    tags: ['communication', 'photography'],
    cover: img('vandemoortele-recipe-shooting/card_header-b.jpg'),
    color: '#0e2a52',
    site: 'vandemoortele-recipe-shooting',
  }),
  c({
    slug: 'thomas-piron',
    name: 'thomas & piron',
    line: 'brand identity',
    cat: 'branding',
    tags: ['branding', 'identity'],
    cover: img('thomas-et-piron/tp-header.jpg'),
    color: '#e35205',
    site: 'thomas-et-piron',
  }),
];

export const byslug = (slug: string) => {
  const found = cases.find((x) => x.slug === slug);
  if (!found) throw new Error(`unknown case: ${slug}`);
  return found;
};

export const clients = [
  'ferrero',
  'nutella',
  'mcdonald’s',
  'audi',
  'porsche',
  'zeiss',
  'leffe',
  'herta',
  'haleon',
  'nescafé',
  'lotus',
  'tollens',
  'fost plus',
  'vandemoortele',
  'thomas & piron',
  'sudinfo',
  'promagnor',
];

export const studio = {
  street: 'rue grand aaz 31',
  city: 'B4680 hermée, belgium',
  email: 'coffee@strategie.agency',
  phone: '+32 489 30 33 50',
  phoneHref: 'tel:+32489303350',
};

/* ---------- full portfolio (order, slugs, categories and images from strategie.agency/en/work) ---------- */

export type Work = {
  slug: string;
  name: string;
  sub: string;
  cat: 'branding' | 'communication' | 'both';
  img: string;
  href: string;
};

const w = (slug: string, name: string, sub: string, cat: Work['cat'], path: string): Work => ({
  slug,
  name,
  sub,
  cat,
  img: img(path),
  href: work(slug),
});

export const portfolio: Work[] = [
  w('promagnor-premium-range', 'promagnor', 'premium range', 'branding', 'promagnor-premium-range/header2.webp'),
  w('mcdonalds-big-openings', 'mcdonald’s', 'big openings', 'communication', 'mcdonalds-big-openings/card_header.webp'),
  w('vandemoortele-recipe-shooting', 'vandemoortele', 'recipe shooting', 'communication', 'vandemoortele-recipe-shooting/card_header-b.jpg'),
  w('balade-new-packaging-design', 'balade', 'new packaging design', 'branding', 'balade-new-packaging-design/card_header.jpg'),
  w('mc-medi', 'mc medi+', 'healthcare', 'communication', 'mc-medi/B0007938-Modifiers.jpg'),
  w('chavroux', 'chavroux', 'campaign', 'communication', 'chavroux/BANNER-TOP.jpg'),
  w('nutella-good-morning', 'nutella', 'good morning', 'communication', 'nutella-good-morning/photoshoot-van.jpg'),
  w('vandemoortele-bakers', 'vandemoortele', 'bakers', 'both', 'vandemoortele-bakers/VDM_Bakers_KV1-HD.png'),
  w('mc-vous-avez', 'mc', 'vous avez', 'communication', 'mc-vous-avez/B0001785-avec-accentuation-bruit-1_crop.png'),
  w('ferrero-rocher-add-your-golden-touch', 'ferrero rocher', 'golden touch', 'communication', 'ferrero-rocher-add-your-golden-touch/hand-2.jpg'),
  w('haleon-big-o', 'haleon', 'big o', 'communication', 'haleon/big-o/big-o-poster.png'),
  w('herta-sans-chichi-zonder-chichi', 'herta', 'sans chichi', 'communication', 'herta/chichi/Herta-Sans-ChiChi-logo.jpg'),
  w('vandemoortele-125', 'vandemoortele', '125 years', 'communication', 'vandemoortele/2024_04_04_VANDEMOORTELE_%2006_mealtimewide_12552-4-warmer.jpg'),
  w('mcdento', 'mc dento+', 'campaign', 'communication', 'mcdento/Dento_visus_CASES_1.jpg'),
  w('tp-notoriete', 'thomas & piron', 'awareness', 'communication', 'thomas-et-piron/tp-notoriete-case.png'),
  w('valdispert', 'valdispert', 'communication', 'communication', 'valdispert/valdispert-banner.jpg'),
  w('herta', 'herta', 'communication', 'communication', 'herta/Herta-visuel-home.jpg'),
  w('nutella', 'nutella', 'communication', 'communication', 'nutella/nutella-thumbnail.png'),
  w('ferrero', 'ferrero rocher', 'communication', 'communication', 'ferrero/Ferrero-praline.jpg'),
  w('ursa-2', 'ursa', 'communication', 'communication', 'ursa/comm/ursa-thumbnail.png'),
  w('mc', 'mc', 'communication', 'communication', 'mc/mc-thumbnail.png'),
  w('flora', 'flora', 'communication', 'communication', 'flora/flora-thumbnail.png'),
  w('fostplus', 'fost plus', 'communication', 'communication', 'fostplus/fostplus-thumbnail.png'),
  w('carlsbourg', 'carlsbourg', 'communication', 'communication', 'carlsbourg/carlsbourg-thumbnail.png'),
  w('audi', 'audi', 'communication', 'communication', 'audi/audi-thumbnail.png'),
  w('zeiss', 'zeiss', 'communication', 'communication', 'zeiss/zeiss-thumbnail.png'),
  w('porsche', 'porsche', 'communication', 'communication', 'porsche/porsche-header.jpg'),
  w('iba', 'iba', 'communication', 'communication', 'iba/iba-thumbnail.png'),
  w('sudinfo', 'sudinfo', 'communication', 'communication', 'sudinfo/sudinfo-header.jpg'),
  w('nescafe', 'nescafé', 'communication', 'communication', 'nescafe/nescafe-thumbnail.jpg'),
  w('nesivine', 'nesivine', 'communication', 'communication', 'nesivine/Nesivine-visuel-home.jpg'),
  w('victoria', 'victoria', 'branding', 'branding', 'victoria/Victoria_visuel-4.jpg'),
  w('balade', 'balade', 'branding', 'branding', 'balade/balade-thumbnail.png'),
  w('absology', 'absology', 'branding', 'branding', 'absology/absology-thumbnail@2x.png'),
  w('tollens', 'tollens', 'branding', 'branding', 'tollens/tollens-thumbnail.png'),
  w('jost', 'jost', 'branding', 'branding', 'jost/Jost---KTKTN_7398-retouche.jpg'),
  w('lotus', 'lotus', 'branding', 'branding', 'lotus/lotus-header@2x.jpg'),
  w('di', 'di', 'branding', 'branding', 'di/Di-home.jpg'),
  w('tripick', 'tripick', 'branding', 'branding', 'tripick/tripick-thumbnail.png'),
  w('toupret', 'toupret', 'branding', 'branding', 'toupret/toupret-thumbnail.png'),
  w('inelle', 'inelle', 'branding', 'branding', 'inelle/inelle-header@2x.jpg'),
  w('modilac', 'modilac', 'branding', 'branding', 'modilac/Modillac-home.png'),
  w('leffe', 'leffe', 'branding', 'branding', 'leffe/leffe-thumbnail.png'),
  w('dinosaurus', 'dinosaurus', 'branding', 'branding', 'dinosaurus/dinosaurus-header.jpg'),
  w('rdv', 'rdv', 'branding', 'branding', 'rdv/rdv-header.jpg'),
  w('promagnor', 'promagnor', 'branding', 'branding', 'promagnor/promagnor-thumbnail.png'),
  w('nalys', 'nalys', 'branding', 'branding', 'nalys/nalys-header.jpg'),
  w('thomas-et-piron', 'thomas & piron', 'branding', 'branding', 'thomas-et-piron/tp-header.jpg'),
  w('modifast', 'modifast', 'branding', 'branding', 'modifast/modifast-header.jpg'),
  w('kidibul', 'kidibul', 'branding', 'branding', 'kidibul/kidibul-header.jpg'),
  w('ucran', 'u-cran', 'branding', 'branding', 'ucran/ucran-thumbnail.png'),
];

export const totalProjects = portfolio.length;

/* ---------- v2 (dashboard) ---------- */

/** projects that play in the v2 showreel, in the same order as the index so the "roots" grow downward */
export const featuredV2 = ['promagnor', 'mcdonalds', 'vandemoortele', 'balade', 'mc', 'nutella', 'ferrero-rocher', 'herta'];
