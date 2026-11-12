# strategie — creative homepage prototype

Concept prototype for [strategie agency](https://www.strategie.agency/en): same
typeface, same green → teal gradient, same "wave", pushed into a more creative,
motion-led homepage.

Stack: **Astro** · **GSAP** (ScrollTrigger, SplitText) · **Lenis** smooth scroll · Canvas 2D.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static build in dist/
npm run deploy     # build + deploy to Cloudflare (wrangler.jsonc)
```

Add `?nointro` to the URL to skip the intro. The demo bar at the top switches
between the three versions and between the two project transitions, **wave** and
**minimal** (remembered per browser):

| URL | Version |
| --- | --- |
| `/` | **v1 showreel**: the first concept, close to the references |
| `/v2` | **v2 dashboard**: sticky "root system" project index + big media panel |
| `/v3` | **v3 connect**: v1's structure with the "we connect, you grow" signature |
| `/v4` | **v4 stratai**: the StratAI robot is the hero, big, and reacts to what you ask |
| `/audit` | **audit**: what the UI/UX audit points at on the current site (captures with numbered pins) next to our answer in the prototypes; content in `src/data/audit.ts`, captures in `public/audit/` (taken 12.11.2026) |

## v4: StratAI

Their robot is a single flat PNG (500 × 526), so the acting comes from two layers:

- **the body** (the PNG) floats, leans toward the cursor, hops, wiggles, dances, droops when it falls asleep
- **the visor**, redrawn live on a canvas: Strategie's wave lines run across the screen, and the face changes with the mood

| Mood | When | Face / body |
| --- | --- | --- |
| idle | waiting | eyes follow the cursor, blinks, fidgets every few seconds |
| listen | the prompt is focused / you type | eyes look down at the prompt, wider; a small nod on each keystroke |
| think | after you ask | a loading ring replaces the eyes, the lines swirl, the body wobbles |
| talking | while the answer types | equaliser mouth, lines pulse |
| proud / happy / love / excited / dance / confused | depends on the question | squint, ^ ^ eyes, heart eyes, wide eyes, dance, tilted head with ? |
| sleep | 40 s without activity | sleepy eyes, droops, z z z; wakes up when you come back |

It understands a few intents from keywords in English, French and Dutch (`src/scripts/v4/brain.ts`):
work / branding / campaigns (project cards fly out of the robot), clients, what strategie does,
who StratAI is, where the studio is, jobs, coffee (copies the email), showreel (opens the film),
hello, thanks, a joke. Anything else: it looks confused and sends you to the team.
Click the robot to poke it.

For a real product: get the robot's source file from the client (it looks like a 3D render) to
animate it properly (Rive state machine or Three.js), and plug a real AI model behind the brain
through a small server function.

## v1: showreel

| Section | Idea | Inspired by |
| --- | --- | --- |
| Intro | brand film in a small rounded window + counter, then it opens to full screen | Estudio Bang, Griflan |
| Showreel hero | pinned full-screen frame, scroll = next case, thumbnails = direct access, chips over the image | Mubien, Griflan, Porto Rocha |
| Transitions | wave (soft sine edge + thin green → teal line) or minimal (cross-fade) | Strategie's wave |
| Bottom nav pill | label and thumbnail follow the current case / section, unfolds into the menu | Mubien |
| Studio dashboard (`::` button) | widget panel: live analog clock of Hermée, brand film, latest work, StratAI pulse, jobs, copy email | Koto, Porto Rocha |
| Approach | words turn from grey to ink as you read, brand words in the gradient; interactive line-ribbon wave | Koto, Strategie's wave |
| Selected work | wave reveal on scroll, hover swaps visuals from the side you enter, cursor label in the brand colour | Mubien |
| Expertises | two video panels, hover grows one and lists its services | Strategie's current split |
| StratAI | robot leans toward the cursor, a fake analysis types itself out | — |
| Connect | dark footer card, client ticker, big "let's connect & grow", live clock | Koto, Griflan |

## v2 and v3: the "we connect, you grow" signature

Built to step away from the references, from Strategie's own line: things are
linked by lines, and they grow.

| Element | Idea | Where |
| --- | --- | --- |
| The thread | the cases sit as nodes on one living wave line at the bottom of the hero; it fills up to where you are | v2, v3 |
| Play ring | round play button with the reel's duration turning around it; the film opens out of it as a circle | v2, v3 |
| Ask StratAI | command palette (`⌘K` / `ctrl+K`, `/` on v3): filters suggestions, types scripted answers, jumps to work / reel / contact, copies the coffee email | v2, v3 |
| Growth rail | thin rail on the right edge that fills as you scroll ("you grow"), one node per section | v3 |
| Round menu | Strategie's round burger; the menu grows out of it as a circle | v3 |
| Hover tether | a line in the brand colour links the cursor to the project name | v3 |
| Root system | the real portfolio (51 projects, order / slugs / categories from their work page) as a numbered index on one trunk, which fills in green down to the case playing; search + all / branding / communication filters; hover shows any project in the hero | v2 |
| Widgets | analog studio clock, StratAI card (robot, live counter, ask button), "let's connect & grow" with copy email | v2 |

Motion rules (in `src/styles/global.css`): durations counted in frames at 60 fps
(`--f7` … `--f45`), custom curves (`--ease-out`, `--ease-in-out`, `--ease-back`),
rounded radii 6 / 10 / 14 / 22 px.

## Notes

- Images and videos are hot-linked from strategie.agency (nothing copied). That
  is why the transitions use Canvas 2D: their server sends no CORS headers,
  which WebGL needs.
- Placeholder copy for the pitch: some case one-liners, the service lists, the
  StratAI answers and demo figures.
- Font files: see `public/fonts/README.md`.
- The first "rounded dots" transition is still in the engine (`mode: 'dots'`).

## Structure

```
src/
  pages/index.astro         v1
  pages/v2.astro            v2
  pages/v3.astro            v3
  pages/audit.astro         audit: current site vs prototypes
  data/site.ts              cases, full portfolio, media, studio info
  components/*.astro        v1 sections + shared pieces (thread, play ring, ask, demo bar)
  components/v2/*.astro     v2 sidebar, hero, widgets
  components/v3/*.astro     v3 header, hero, growth rail
  components/v4/*.astro     v4 header, StratAI stage
  scripts/v4/*.ts           v4 boot, robot (body + live visor), brain (intents), stage (conversation)
  scripts/main.ts           v1 boot
  scripts/modules/*.ts      v1 behaviours + shared ones (clock, text, loader, sections, reel modal, ask, demo)
  scripts/v2/*.ts           v2 boot, hero, sidebar, widgets, intro
  scripts/v3/*.ts           v3 boot, hero, nav (rail + round menu), work (tether)
  scripts/lib/              waveDots (media canvas + transitions), thread, waveLines, utils
  styles/global.css         tokens + shared + v3 styles
  styles/v1.css             v1-only pieces (chips, thumbnails, pill, dashboard, cursor label)
  styles/v2.css             v2 layout
```
