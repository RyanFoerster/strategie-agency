/**
 * The /audit page: what the UI/UX audit (report n°001, 12.11.2026) points at on
 * the current site, and how the prototypes answer it.
 * Captures live in /public/audit (1440 × 900, taken on 12.11.2026).
 * Pin positions are percentages of the capture.
 */
export type Pin = { x: number; y: number; t: string };
export type Shot = { img: string; url: string; alt: string; pins: Pin[] };
export type Finding = {
  n: string;
  zone: string;
  title: string;
  why: string;
  now: Shot;
  /** tall capture of the whole page, shown as a mini-map next to `now` */
  wall?: { img: string; label: string };
  fix: { text: string; shot: Shot; live: { href: string; label: string }; note?: string };
};

const NOW = 'strategie.agency';
const PROTO = 'prototype';

export const keep = ['la typographie', 'le dégradé vert-bleu', 'la vague', '« we connect, you grow »', 'StratAI', 'vos visuels'];

export const stats = [
  { v: '4+', unit: 'écrans', t: 'à faire défiler avant de voir un premier projet sur l’accueil' },
  { v: '51', unit: 'projets', t: 'affichés au même niveau sur la page Work, sans sélection' },
  { v: '26,3', unit: 'Mo', t: 'pour charger la page Work, dont 25,6 Mo d’images' },
];

/** finding 01 has its own layout: screen by screen */
export const firstScreens = {
  now: [
    { img: '/audit/now-home-screen-1.webp', label: 'la vague' },
    { img: '/audit/now-home-screen-2.webp', label: 'les expertises' },
    { img: '/audit/now-home-screen-3.webp', label: 'StratAI' },
    { img: '/audit/now-home-screen-4.webp', label: 'premier projet, tout en bas', hit: true },
    { img: '/audit/now-home-screen-5.webp', label: 'le carrousel' },
  ],
  fix: [
    { img: '/audit/proto-v1-open.webp', label: 'le slogan, et déjà les cas en vignettes' },
    { img: '/audit/proto-v1-case.webp', label: 'un projet, en plein écran', hit: true },
  ],
};

export const findings: Finding[] = [
  {
    n: '02',
    zone: 'accueil',
    title: 'Le carrousel montre un projet à la fois, sans flèche, sans compteur, sans légende.',
    why: 'Rien n’indique que neuf projets sont proposés, et le visiteur ignore s’il regarde un packaging, une campagne ou une identité. Les suivants sont rarement vus.',
    now: {
      img: '/audit/now-home-cases.webp',
      url: `${NOW}/en`,
      alt: 'Le carrousel « case studies » de l’accueil actuel : une image McDonald’s, sans nom ni navigation.',
      pins: [
        { x: 22, y: 15, t: 'Le titre « case studies » est recouvert par les images.' },
        { x: 14, y: 55, t: 'Un seul projet visible, sans nom de client ni type de projet.' },
        { x: 92, y: 55, t: 'Le suivant dépasse à peine : ni flèche, ni compteur.' },
      ],
    },
    fix: {
      text: 'Chaque cas s’affiche en plein écran avec son client, son titre et son type. Un compteur situe le visiteur, et les vignettes donnent un accès direct à tous les cas.',
      shot: {
        img: '/audit/proto-v1-case.webp',
        url: `${PROTO} v1 · showreel`,
        alt: 'Le prototype v1 : le cas Balade en plein écran, avec compteur, légende et vignettes.',
        pins: [
          { x: 8, y: 63.5, t: 'Un compteur : 02 / 07.' },
          { x: 43, y: 81, t: 'Client, titre du projet et type, toujours visibles.' },
          { x: 83, y: 78, t: 'Les vignettes : tous les cas d’un regard, en accès direct.' },
          { x: 73, y: 49.5, t: '« see the story » mène à l’étude de cas.' },
        ],
      },
      live: { href: '/?nointro', label: 'voir en live : v1 showreel' },
      note: 'La v3 propose la même idée avec un fil : chaque cas est un nœud sur la vague.',
    },
  },
  {
    n: '03',
    zone: 'work',
    title: '51 projets de même taille, sans sélection, et aucun nom sans survol.',
    why: 'Trop de choix équivalents découragent : vos cas les plus forts sont noyés. Impossible de parcourir la page du regard pour y trouver une marque.',
    now: {
      img: '/audit/now-work-grid.webp',
      url: `${NOW}/en/work`,
      alt: 'La page Work actuelle : une grille d’images sans marges ni légendes.',
      pins: [
        { x: 25, y: 38, t: 'Aucun nom de client tant qu’on ne survole pas l’image.' },
        { x: 75, y: 78, t: 'Toutes les fiches au même format : rien ne ressort.' },
      ],
    },
    wall: { img: '/audit/now-work-wall.webp', label: 'la page entière : 13 écrans' },
    fix: {
      text: 'Work devient un tableau de bord. Une sélection vedette joue en grand, et les 51 projets restent accessibles dans un index où chaque nom se lit sans survol, avec recherche et filtres.',
      shot: {
        img: '/audit/proto-v2.webp',
        url: `${PROTO} v2 · dashboard`,
        alt: 'Le prototype v2 : un index des 51 projets à gauche, le projet vedette en grand à droite.',
        pins: [
          { x: 25.5, y: 13, t: 'Recherche, et filtres avec le nombre de résultats.' },
          { x: 25.5, y: 55, t: 'L’index des 51 projets : client et titre toujours lisibles.' },
          { x: 61, y: 72, t: 'La sélection vedette, en grand, avec son titre.' },
          { x: 25.5, y: 94, t: 'Les rubriques et le contact restent visibles.' },
        ],
      },
      live: { href: '/v2?nointro', label: 'voir en live : v2 dashboard' },
    },
  },
  {
    n: '04',
    zone: 'work',
    title: 'Deux filtres en forme d’interrupteurs, et des cartes sans légende.',
    why: 'Un filtre qui garde presque tout ne filtre rien. Et sans légende, plusieurs fiches d’un même client passent pour une répétition.',
    now: {
      img: '/audit/now-work-top.webp',
      url: `${NOW}/en/work`,
      alt: 'Le haut de la page Work actuelle : la vague, trois interrupteurs et les premières images.',
      pins: [
        { x: 40, y: 29, t: 'La même vague qu’à l’accueil, et un titre à moitié recouvert.' },
        { x: 51, y: 44.5, t: 'Deux filtres seulement, présentés comme des interrupteurs.' },
        { x: 25, y: 77, t: 'Des cartes sans client, sans titre, sans type.' },
      ],
    },
    fix: {
      text: 'Chaque carte porte sa légende en permanence : client, titre du projet, type en pastilles. Le survol ajoute un second visuel et une étiquette, il ne cache plus l’information.',
      shot: {
        img: '/audit/proto-v1-work.webp',
        url: `${PROTO} v1 · selected work`,
        alt: 'Le prototype v1 : des cartes projet avec client, titre et pastilles de type.',
        pins: [
          { x: 16, y: 57, t: 'Client et titre du projet, toujours visibles.' },
          { x: 86, y: 82.5, t: 'Le type de projet, en pastilles.' },
          { x: 76, y: 55.5, t: 'Au survol : une étiquette et un second visuel, en complément.' },
        ],
      },
      live: { href: '/?nointro', label: 'voir en live : v1 showreel' },
      note: 'Les filtres par secteur demandent d’abord d’enrichir chaque projet (étape 02 du plan).',
    },
  },
  {
    n: '05',
    zone: 'navigation',
    title: 'Le menu est caché, et le logo passe sur les textes.',
    why: 'Une navigation cachée est moins utilisée : Work est à deux clics. Le logo flottant est le défaut le plus visible du site, présent sur presque toutes les pages.',
    now: {
      img: '/audit/now-home-logo.webp',
      url: `${NOW}/en`,
      alt: 'L’accueil actuel pendant le défilement : le logo chevauche un titre et une signature.',
      pins: [
        { x: 16, y: 9, t: 'Le logo, fixe et sans fond, chevauche le texte qui défile.' },
        { x: 90, y: 10, t: 'Les quatre rubriques sont derrière ce bouton.' },
      ],
    },
    fix: {
      text: 'Le logo et l’heure du studio reposent sur des pastilles avec fond : plus rien ne se chevauche. En bas, une pastille de navigation indique où l’on est et s’ouvre en menu.',
      shot: {
        img: '/audit/proto-v1-header.webp',
        url: `${PROTO} v1 · approach`,
        alt: 'Le prototype v1 pendant le défilement : logo sur pastille, pastille de navigation en bas.',
        pins: [
          { x: 11.5, y: 4.5, t: 'Le logo sur une pastille avec fond.' },
          { x: 60, y: 95, t: 'La pastille de navigation suit la section et s’ouvre en menu.' },
          { x: 97, y: 10, t: 'Le tableau de bord du studio, à un clic.' },
        ],
      },
      live: { href: '/?nointro', label: 'voir en live : v1 showreel' },
      note: 'En v2, les rubriques et le contact restent affichés en permanence dans la colonne.',
    },
  },
  {
    n: '06',
    zone: 'stratai',
    title: 'StratAI est décrit, pas démontré.',
    why: 'Un différenciant se démontre. Aujourd’hui la mascotte est toute petite et le texte liste des bénéfices génériques, sans exemple.',
    now: {
      img: '/audit/now-home-stratai.webp',
      url: `${NOW}/en`,
      alt: 'Le bloc StratAI de l’accueil actuel : un titre, une phrase et un petit robot.',
      pins: [
        { x: 96, y: 22, t: 'Une mascotte reconnaissable, mais en tout petit.' },
        { x: 2.8, y: 37.5, t: 'Des bénéfices génériques.' },
        { x: 50, y: 72, t: 'Aucun exemple, aucun cas, puis un grand vide.' },
      ],
    },
    fix: {
      text: 'StratAI devient le héros d’une version : en grand, il écoute, réfléchit et répond. On lui demande le travail de branding, il sort les projets.',
      shot: {
        img: '/audit/proto-v4.webp',
        url: `${PROTO} v4 · stratai`,
        alt: 'Le prototype v4 : le robot StratAI en grand, une bulle de réponse et trois cartes projet.',
        pins: [
          { x: 57, y: 27, t: 'Le robot en grand : son visage réagit à ce qu’on lui demande.' },
          { x: 83, y: 27.5, t: 'Il répond à la question posée.' },
          { x: 33, y: 50, t: 'Et il montre les projets correspondants.' },
          { x: 77, y: 94, t: 'On lui parle ici, ou via une question suggérée.' },
        ],
      },
      live: { href: '/v4', label: 'voir en live : v4 stratai' },
      note: 'Dans le prototype les réponses sont écrites à l’avance : il reste à décider ce que StratAI peut montrer concrètement.',
    },
  },
];

/** what the prototypes do not cover yet, from the audit's action plan */
export const todo = [
  { t: 'Le gabarit d’étude de cas', d: 'Défi, idée, exécution, résultats, projets liés : la fiche projet n’est pas encore maquettée.' },
  { t: 'Le poids des images', d: 'Le prototype charge vos visuels actuels. L’objectif reste moins de 3 Mo pour Work.' },
  { t: 'Les logos clients en haut de page', d: 'Dans les prototypes, ils défilent encore dans le pied de page.' },
  { t: 'Les filtres par secteur', d: 'Ils dépendent de l’enrichissement de chaque projet : titre, secteur, type, année.' },
  { t: 'Le français et le néerlandais', d: 'Une décision à prendre avant de dessiner les nouvelles pages.' },
  { t: 'L’accessibilité', d: 'Titres, formulaires et vidéos à mettre aux normes lors de la refonte.' },
];

export const goals = [
  { k: 'Premier projet visible sur l’accueil', now: 'Après quatre écrans', goal: 'Dès le deuxième écran', proto: 'Au premier défilement' },
  { k: 'Clics pour atteindre Work', now: '2', goal: '1', proto: '0 en v2 : l’index reste affiché' },
  { k: 'Nom du client lisible sans survol', now: 'Non', goal: 'Oui', proto: 'Oui' },
  { k: 'Poids de la page Work', now: '26,3 Mo', goal: 'Moins de 3 Mo', proto: 'À traiter' },
  { k: 'Études de cas avec résultats', now: '0 sur 3 examinées', goal: 'Tous les projets vedettes', proto: 'À traiter' },
];
