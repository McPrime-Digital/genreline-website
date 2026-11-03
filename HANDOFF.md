# HANDOFF — Batch W-3D-1: the home hero as a live 3D scene

2026-11-03, revised the same day after the owner's review. The home page's
hero is the Genreline logo's gold line through deep space. It opens on the
whole line (the logo) under the title. As the visitor scrolls, the camera dives
to the **Crew space**, rides the line up to the **Client space** (which turns to
the **Stakeholders space** every three seconds), drops through the valley and
climbs to **the Suite**, then pulls back to the whole line for the close: *Run
the production. Keep the record.* Each space arrives in its own light, ringed
by its own screens and tools.

## The owner's review, and what changed

The first version was rejected (*"what you have built for the hero is just
wrong"*). Each point the owner made, and what was done about it:

| The owner | Done |
|---|---|
| *"why is there a motion play and pause on the website — that must go"* | The Motion button is gone (`components/site/MotionToggle.tsx` deleted). `lib/motion.ts` now only follows the system's reduced-motion setting; nothing is stored. |
| *"the whole hero must be covered with the 3D"* | The canvas fills the stage edge to edge. The heavy left-hand shade is gone; a soft pool of shade gathers only behind the words, and only while they show. |
| *"the hero writing in the left side must be reduced in size"* | The title is 40 px at most (it was 62), and its block is narrower. |
| *"the only subtext under the hero heading is genreline runs ai & hybrid film production end to end"* | The title card carries one line: *Genreline runs AI and hybrid film production end to end.* That is the site's own wording, "and" not "&"; the owner confirmed. |
| *"the undertexts must also be divided and shared to each of the space … where they belong"* | The old lede is cut where it names each space. Crew: *Where your team works.* Client: *A portal in your brand where clients review, approve, sign and pay.* Suite: *Where the work is written, boarded, generated, edited and finished.* Its last sentence (*Contracts, rights, money and security run underneath all of it, on one record.*) heads the spaces index at the foot of the page. |
| *"the background of the crew space appears … enterprise premium background"* | Each space has its own sky (a slow nebula, computed on the GPU) and structure. **Crew**: tungsten amber over a studio-floor grid with a light sweeping across it. **Client**: steel and teal with portal rings opening outward, turning deep violet for Stakeholders. **Suite**: violet and rose with a slow fan of light. Behind everything, deep space with stars. |
| *"just one placeholder … features … in their own placeholders surrounding the icon"* | Six screens ring the Crew and Client tiles; seven tool cards ring the Suite. Each shows a real product capture (or a drawn tool at work) and carries a label in the site's own words with its icon. While a picture loads, its screen shows a shimmering app skeleton. |
| *"the distance between crew and client must be meaningful … the line is very unprofessionally crooked"* | The line is four clean cubic curves through the logo's four landmarks, measured from the mark (no more trace wobble), and set out 8× larger. Crew → Client is now 33 units, and Client → valley → Suite is 80. |
| *"the trip must follow the line in space moving through stars and high fidelity reactive particles"* | Between stations the camera rides the line, lifted above it and looking down it. A light runs just ahead, the stars streak with the camera's speed, and 3,400 particles stream along the line, faster as the visitor scrolls, parting and lighting up around the pointer. |
| *"client space which must change or be rotating to stakeholders space … every 3 seconds"* | Every 3 s while the Client station is on screen, the tile turns to the Stakeholders face (Client's figure with an approval seal), the six screens turn one after another to the Stakeholders portal screens, the sky shifts to violet, and the caption changes. A pointer resting on a screen holds the turn. |
| *"the final trip descends down and climbs a little the suite space … camera, brush, sounds, weavy lines, workflowlines, script write"* | The last ride falls into the valley and climbs into the Suite. Around its tile: **Write** (a screenplay typing in), **Visualise** (sketched storyboard frames with a gold brush stroke painting across), **The Stage** (a shot resolving as it generates), **Workflows** (nodes with work travelling along the lines), **Sound** (a layered waveform that swells under the pointer), **Edit and finish** (a timeline with a playhead), **Keep** (the asset library capture). Seven tool chips (camera, brush, waveform and the rest) circle the tile. |
| *"ends with the run the production keep the record. anything else under must move to the bottom of the page"* | The close is the tagline alone over the whole line. The five space cards now sit at the very end of the home page, above the footer (`components/site/SpacesIndex.tsx`); the owner chose that placement. |

## What was built

| File | What it does |
|---|---|
| `content/home.ts` | Every word of the hero, and every word the 3D draws: the screens' labels and the tools' names. Each string is the site's own (sources listed in the file's header). |
| `components/hero/HomeHero.tsx` | The section (its scroll length from the timeline), the sticky full-bleed stage, the posters, the five shots' HTML, the slate line and the track. Server component; it also hands the scene its captures and icon drawings. |
| `components/hero/HeroDirector.tsx` | The one client island. It maps scroll to progress with ScrollTrigger and damps it (or cuts it, under reduced motion). It fades each shot's words in and out, runs the timecode and the track, turns the Client face every 3 s, plays the posters as stills on devices without the 3D, decides the device tier, and loads the canvas. |
| `components/hero/state.ts` | The timeline as plain functions: which segment a scroll position falls in, each shot's word weight, each station's presence and sky. It also holds the shared live state. No three.js, so it ships with the page cheaply. |
| `components/hero/scene/numbers.ts` | Every number: the line's landmarks and curves, the stations, each screen's place (wide and tall frames), the camera, the timeline (`STORY`). |
| `components/hero/scene/rig.ts` | The camera for any moment. At a station it stands straight on and keeps creeping in; between stations it rides the line; at the title and the close it frames the whole logo. It also holds the per-frame values the scene shares. |
| `components/hero/scene/HeroScene.tsx` | The deep sky, the stars and their warp streaks, the line (core and halo, with flowing light), the particle stream, and the three stations. |
| `components/hero/scene/Station.tsx` | A station: its sky, its structure, its rings, its screens (gathering, floating, leaning to the pointer, lifting under it, turning for Stakeholders), the Suite's tool chips, and its tile. |
| `components/hero/scene/shaders.ts` | The GLSL: stars, streaks, particle flow, line, skies, structures, and the screen shader, which draws a screen with its rounded edge, rim, glass sheen, label, skeleton and the Suite's drawn tools in one draw call. |
| `components/hero/scene/textures.ts` | The theme from the site's CSS variables, the logo's tiles (and the Stakeholders face), labels in the site's display face with lucide icons, tool chips, and `getScreenTexture(id)`, the one place a screen's picture comes from. |
| `components/hero/scene/HeroCanvas.tsx` | The R3F `<Canvas>` (WebGL 2), compiling every shader up front so no screen stalls the frame it appears in. |
| `components/site/SpacesIndex.tsx` | The five spaces and portals, at the foot of the home page. |
| `lib/motion.ts` | The system's reduced-motion setting, live. |
| `styles/hero.css` | The stage, the scrims, the title card, the lower-third captions, the Client/Stakeholders cross-fade, the track, the spaces index. |
| `scripts/make-hero-poster.ts` | Renders a poster of every shot from the live scene. |
| `public/hero/` | 24 posters (6 shots × dark/light × wide/tall), AVIF and WebP, 9–61 KB each. |

### Loading order

1. **First paint is HTML**: the slate line, the title card, its line and the
   two calls to action, over the title's poster. Lighthouse confirms the poster
   is the Largest Contentful Paint (`picture.hero-poster > img`).
2. **After load, when idle**: GSAP ScrollTrigger maps the scroll.
3. **On the visitor's first move, scroll, touch or key (or after 5 s)**: the
   device check runs. A capable device loads the 3D, which fades in over the
   poster of its own first frame. The screens' pictures load station by
   station as the visitor nears each one.

### Device tiers

| Device | Gets |
|---|---|
| detect-gpu tier 2 or 3, CPU probe under 6 ms, no Save-Data | The live scene |
| Anything else (tier 0–1, slow CPU, Save-Data, no WebGL, an error) | **The stills**: a poster of every shot (title, Crew, Client, Stakeholders, Suite, close), cross-fading as the visitor scrolls, the Client/Stakeholders turn included. Only the posters actually needed are fetched. |

`/?hero=live` or `/?hero=poster` forces a tier. `/?shot=crew` (or `title`,
`client`, `stakeholders`, `suite`, `close`) holds one shot, for checking a
device by hand.

### Reduced motion

There is no switch on the site. When the system asks for reduced motion:
- the camera cuts between the five shots instead of flying, and the words cut too;
- the stars, particles, rings and tools stand still;
- the scene draws only when something changes;
- the Client face still alternates every 3 s, but as a plain cross-fade with no turn.

## The words: the site's own

PLACEHOLDER copy: **none**. Every string in `content/home.ts` is the live
site's own wording, and the file's header says where each comes from. The
screens' labels come from the Spaces section, the platform list, the features
register (shortened the way the site's own marquee shortens them), the
In-house segment, and the Suite's stage names. The drawn tool cards contain no
words.

## The WebGPU outcome: WebGL 2 shipped

WebGPU was measured against this batch's 250 KB budget and does not fit:
`three/webgpu` alone is 306 KB gzipped, and R3F with it 420 KB. The renderer is
three's `WebGLRenderer` (WebGL 2), created through R3F v9's `gl` factory in
`HeroCanvas.tsx`. Moving to WebGPU later means changing that one factory and
porting `shaders.ts` to TSL, once the budget allows.

## Bundle

`next.config.mjs` points the browser's `three` at `lib/three-slim.mjs`, which
re-exports only what R3F and the hero use.

| Chunk | gzipped (-9) | When |
|---|---|---|
| 3D: three slim + R3F + drei PerformanceMonitor + the whole scene and shaders | **216.0 KB** (was 206.8) | Engaged, capable devices only |
| GSAP core + ScrollTrigger | ~45 KB | After load, when idle |
| detect-gpu | ~3 KB | Engaged |

## Performance

- **Frame rate**: scrolling the whole hero in 14 s, production build, Apple
  M4 Max: 840 frames, a steady 16.7 ms, none over 16.8 ms. The same holds at a
  390×844 phone frame. On slower GPUs drei's PerformanceMonitor drops the
  resolution to 1×, halves the particles and stars, and drops the line's halo
  and the streaks, once and for good.
- **Lighthouse, mobile, Home** (`next build` + `next start`, this machine):

| | Performance | Accessibility | Best practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| This version (5 runs) | 85 (cold first run) · 90 · 91 · 90 · 90 | 100 | 100 | 3.5–3.6 s (4.3 cold) | 10 ms | 0 |
| The first version | 89 · 89 · 89 | 100 | 100 | 3.5–3.6 s | 10 ms | 0 |
| The old hero | 89 · 90 · 90 | 100 | 100 | 3.5–3.6 s | 10 ms | 0 |

SEO shows 69 locally only because these builds carry `noindex` by design. The
LCP is page-level (the 91 KB gzipped document and the fonts). To make 90+
certain rather than typical, the next step is page-level work, not hero work.

## Checks run (against the final production build)

- `tsc --noEmit` and `eslint .`: clean. `next build`: clean.
- `check:labels`: 26 pages, 0 failures. `check:links`: 0 failures.
  `check:forward`: all pass. `check:licences`: 130 packages, 0 to review.
- `check:a11y` (axe, every page, both themes): 0 issues of any severity.
- Browser checks (Playwright on the real GPU):
  - The console is clean, with and without the scene.
  - Every shot was framed in dark and light, at 1440×810 and 390×844, and mid-journey.
  - The header has no Motion button.
  - The spaces index is the last section before the footer, and the hero has none.
  - Client turns to Stakeholders and back every 3 s.
  - Reduced motion cuts to the nearest shot, with the timecode exact.
  - The stills show the right poster for every shot.

## Where this batch departs from its spec, and why

1. **The words** are the site's own, not the prototype's (the owner).
2. **The line** is the logo's silhouette drawn as clean curves, at 8× the
   prototype's scale, so each trip is a journey (the owner).
3. **No Motion button** (the owner), although the spec asked for one.
   Reduced motion is honoured from the system setting alone.
4. **Reduced motion gets the live scene, cutting**, not the poster: the cut
   version §6 asks for. Returning `'poster'` from `chooseTier` under
   `prefers-reduced-motion` would restore §3 literally.
5. **Tier 0–1 devices get stills of every shot**, not the poster alone, so
   they still see each space.
6. **The scene waits for the visitor's first move** (or 5 s), and a CPU
   probe joins detect-gpu, to protect the page's load (see Lighthouse).
7. **The screens show real product captures**, the highest-fidelity pictures
   the site has. **Footage drops straight in**: put
   `public/media/hero-<capture-id>.mp4` (for example
   `hero-crew-tasks.mp4`) in place and rebuild. That screen then plays it,
   muted and looping. Nothing in the scene changes.

### The licence exception

`scripts/check-licences.ts` names one reviewed exception: **gsap**, under
GSAP's "Standard 'no charge' license" (read 2026-11-03). It allows commercial
use at no charge; its one restriction is building no-code animation tools that
compete with Webflow. Webflow may change or end the licence; ScrollTrigger's
one job here (scroll → progress) is ~20 lines without it.

## For the owner

- **The preview**: the branch `w-3d-1-hero`. Vercel builds every push, and
  the preview sits behind your Vercel login, so sign in first.
  `/?hero=live` forces the 3D on a device the check would give the stills.
- **After any change to the scene, re-make the posters**: build and start
  the site, then run `BASE=http://localhost:3001 npx tsx scripts/make-hero-poster.ts`.
- **The `hero-reel` upload slot** in `content/media.ts` belongs to the old
  hero; remove it when convenient.
- **Skills used**: the ten audited skills from the first pass (GSAP's official
  four, the three.js and R3F skills), plus Apple's motion and design
  principles. Provenance is in `~/.claude/skills/INSTALLED.md` §6. A research
  pass collected the references this was built against: igloo inc, Shopify
  Editions, Cartier's alcoves, Lusion, Apple's scroll pages, and Codrops'
  write-ups on star warps, particles flowing along a curve, and camera rails.
