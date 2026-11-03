# HANDOFF — Batch W-3D-1: the home hero as a live 3D scene

2026-11-03. The home page's hero is now the Genreline logo's gold line in
space: the camera follows it through its three tiles (Crew, Client, Suite)
past each space's screen as the visitor scrolls. Only the hero changed: every
other section of the home page and every other page is as it was.

## What was built

| File | What it does |
|---|---|
| `content/home.ts` | Every visible word of the hero. The components carry no text. |
| `components/hero/HomeHero.tsx` | The 300vh section, its sticky 100svh stage, the poster, the five shots' HTML, the slate line and the track. Server component. |
| `components/hero/HeroDirector.tsx` | The one client island: GSAP ScrollTrigger (scrub) maps scroll to progress; it damps it, fades the shots' words, runs the timecode and the track, decides the device tier, and loads the canvas. |
| `components/hero/scene/HeroCanvas.tsx` | The R3F v9 `<Canvas>`, loaded with `next/dynamic`, `ssr: false`. `aria-hidden`. drei's `PerformanceMonitor` lowers the scene when frames run slow. |
| `components/hero/scene/HeroScene.tsx` | The scene: the line (a core and two glow tubes), the three tiles as camera-facing sprites, the three screens, dust, the travelling playhead, the camera rig. |
| `components/hero/scene/numbers.ts` | Every number the scene uses, each with where it came from. |
| `components/hero/scene/textures.ts` | Colours read from the site's CSS variables, the logo's tiles drawn at 512 px, and `getScreenTexture(slot)`, the one place a screen's picture comes from. |
| `components/hero/state.ts` | The shared per-frame state (scroll target, damped progress, Motion). |
| `components/site/MotionToggle.tsx`, `lib/motion.ts` | The header's Motion button and its stored state. |
| `styles/hero.css` | The hero's layout and the Motion-off rules. |
| `lib/three-slim.mjs` | three, cut to what R3F and the hero use (see *Bundle*). |
| `scripts/make-hero-poster.ts` | Renders the posters from the live scene. |
| `public/hero/` | The posters: dark/light × wide/tall, AVIF and WebP. |
| `public/detect-gpu/` | detect-gpu 5.0.70's benchmark data, served from this site. |

Removed: `components/cinema/HeroStage.tsx`, `HeroReel.tsx` and `Timecode.tsx`
(the old hero; nothing else used them).

### Loading order

1. **First paint is HTML**: the slate line, the title card, the lede, the two
   calls to action, over a poster of the scene's first frame. The poster is
   the Largest Contentful Paint (checked in Lighthouse: `picture.hero-poster > img`).
2. **After load, when the browser is idle**: GSAP and ScrollTrigger load and
   map the scroll. The words cut between shots from here on, even on the poster.
3. **When the visitor first moves, scrolls, touches or presses a key, or after
   5 s of reading**: the device check runs, and on a capable device the 3D
   canvas loads and fades in over the poster. The poster *is* the first frame,
   so nothing visibly jumps.

### Device tiers

| Device | Gets |
|---|---|
| Save-Data on | Poster |
| CPU probe slower than 6 ms (≈ 2.3 ms on an M2; ≈ 8.6 ms under a 4× throttle) | Poster |
| detect-gpu tier 0 or 1 | Poster (tier 1 waits for the pre-rendered film) |
| detect-gpu tier 2 or 3 | The live scene |
| Anything that fails (no WebGL, lost context, an error) | Poster |

For checking a device by hand: `/?hero=live` forces the scene and
`/?hero=poster` forces the poster.

### Motion

The header shows a **Motion** button on the home page (`aria-pressed`). It is
stored in localStorage as `genreline-motion` (`on`/`off`). A visitor who has
never pressed it follows the system: off under reduced motion, and it changes
live when the system setting changes.

- **Motion on**: the camera flies between shots (damped at the prototype's
  4.5/s), the pointer tilts the camera, dust drifts, the playhead travels, the
  screens float and catch light, and the words cross-fade.
- **Motion off** (and reduced motion, until the visitor chooses): the camera
  cuts between the five shots (progress snapped to quarters), the words cut,
  and nothing moves on its own. The scene draws only when something changes.
  While the home page is open, the page's other ambient motion stops too:
  the film-stock title, the REC dot, the floats and the marquee.

## The words: the site's own

The owner (2026-11-03): *"use exactly the words or writings on the website and
not change them … those are deliberate written words for the site."* Every
string in `content/home.ts` is the live site's own wording, carried over
verbatim: the slate line, the title card, the lede, both buttons and the five
spaces from the old hero, and the closing line, which is the site's tagline
(`lib/site.ts` `TAGLINE`). The hero opens on *Every space of production. One
operating system.* under the slate line *The operating system for AI & hybrid
film production*, and closes on *Run the production. Keep the record.*

**PLACEHOLDER copy: none.** `grep -n PLACEHOLDER content/home.ts` lists only
the comment that explains the convention. Two fields from the batch have no
words on the live site, so they are `null` and render nothing: `note` (under
the buttons) and `scrollCue` (the cue is drawn, a light running along the
track). If the owner writes either, it goes in `content/home.ts`.

## The WebGPU outcome: WebGL 2 shipped

WebGPU was measured and it does not fit this batch's own budget (3D bundle
under 250 KB gzipped). Measured with esbuild, minified and gzipped (-9):

| Bundle | gzipped |
|---|---|
| `three/webgpu` alone | 306 KB |
| R3F + `three/webgpu` (R3F also pulls plain `three`: two copies) | 420 KB |
| R3F + `three` (WebGL), unmodified | 250 KB, before any scene code |
| **R3F + three, slimmed (shipped), with drei's PerformanceMonitor and the whole scene** | **206.8 KB** (170.8 KB brotli) |

So the renderer is three's `WebGLRenderer` (WebGL 2), created through R3F v9's
`gl` factory prop in `HeroCanvas.tsx`. Moving to WebGPU later is a change to
that one factory, but only once the budget allows ~110 KB more. The installed
`cloudai-threejs-react-three-fiber` skill also lists the drei pieces that break
under WebGPU (Text, ContactShadows, Environment with children). The scene uses
none of them.

## Bundle

R3F imports the whole three namespace and registers every export, so no
bundler can drop any of three. `next.config.mjs` points the browser build's
`three` at `lib/three-slim.mjs`, which re-exports only what R3F's own code
reads and what the hero uses. That saves ~42 KB gzipped. A three class used
by the hero but missing from that list fails the build, not the page.

| Chunk | gzipped | When |
|---|---|---|
| 3D (three slim + R3F + drei PerformanceMonitor + scene) | **206.8 KB** | Engaged, capable devices only |
| GSAP core + ScrollTrigger | 44.6 KB | After load, when idle |
| detect-gpu | 3.3 KB | Engaged |
| The hero's client island | 11.2 KB | With the page |

## Lighthouse (mobile, against `next build` + `next start`, this machine)

| | Performance | Accessibility | Best practices | SEO* | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| **New hero** (last 3 runs) | 89 · 89 · 89 (90 in an earlier run) | 100 | 100 | 69* | 3.5–3.6 s | 10 ms | 0 |
| **Old hero** (HEAD before this batch, same machine, 3 runs) | 89 · 90 · 90 | 100 | 100 | 69* | 3.5–3.6 s | 10 ms | 0 |

\* SEO is 69 because these builds are previews and carry `noindex` by design.
The repo's `check:lighthouse` expects a build made with `LIGHTHOUSE_AS_PRODUCTION=1`.

**The bar of 90 is not reliably met**, and the old hero misses it the same way.
The new hero matches the old one on every metric. What holds the score at
89–90 is the page's simulated LCP (~3.5 s), and that comes from the page, not
the hero. Before the LCP paints, the page requests the same amount either way:
a 91 KB gzipped document (761 KB raw), 90 KB of fonts and ~180 KB of framework
script. Two hero-side fixes were measured and rejected because they did not
move LCP: a `<head>` preload of the poster (kept, harmless) and writing the
phone poster into the page as data (removed; the page grew 27 KB because the
server payload repeats it).

Two things found along the way, both fixed:

- Chrome never counts a full-viewport image as the LCP (it treats it as a
  background), so the poster starts under the header.
- This Mac's real GPU passes the device check inside Lighthouse, so the scene
  loaded in the test and cost 2.35 s of TBT. That led to the CPU probe and the
  "load on first engagement" rule. PageSpeed Insights runs without a GPU and
  would measure the poster path anyway.

To lift Home to a stable 90+, the next batch would need page-level work: the
home document's size (the capability list and its server payload), and the
display font that is discovered late, after the CSS.

## Where this batch departs from its spec, and why

1. **The words** are the site's own, not the prototype's (the owner, above).
2. **The line is the logo's line.** The owner: *"the line must match the actual
   genreline logo."* Its centreline was traced from
   `public/brand/genreline-mark-gold.png` and mapped at the prototype's scale.
   The prototype's node spacing turned out to be the logo's (Client 3.0 units
   above Crew; the logo gives 3.04), so the nodes barely move: Client x −1.0 →
   −1.365, and Suite drops to Crew's height, y 0.2 → −0.9. What changes is the
   curve (the logo's deep valley before the Suite) and that the line runs from
   Crew to the Suite, as the logo does. The tiles are the logo's (squircles,
   rings 0.166 thick, Client solid), drawn as vectors so they stay sharp up close.
3. **The camera path was re-framed.** The prototype's own path cut every node's
   screen out of frame (Crew's at the top, Client's and the Suite's off the
   right edge), and on a phone it lost the Crew tile at the title shot. The
   owner wants the screens *"at the back very well and in frame"*. Each node
   shot now stands back far enough to hold the node and its whole screen, in
   the part of the frame the words leave open, with a shift lens
   (`viewShift`). A tall frame has its own path. The prototype's numbers are
   kept in `numbers.ts` for comparison.
4. **The screens show each space's real product capture** in the visitor's
   theme (`crew-tasks`, `client-messages`, `suite-library`). The owner asked
   for *"high fidelity"* footage, and these are the highest-fidelity pictures
   the site has. The procedural placeholder frames are kept behind
   `getScreenTexture(slot)` and show while a capture loads or if it fails.
   **Footage drops straight in:** put `public/media/hero-screen-crew.mp4`
   (`-client`, `-suite`) in place and rebuild. That screen then plays it,
   muted and looping, and pauses with Motion off. Nothing in the scene changes.
5. **Reduced motion gets the live scene, cutting**, not the poster alone.
   §3 says poster only; §6 says reduced motion must show the cut version, and
   the camera cutting between five shots is that version. The scene draws on
   demand only, so nothing animates. To restore §3 literally, return `'poster'`
   from `chooseTier` when `prefers-reduced-motion` matches.
6. **The Motion button shows on the home page only**, where the hero is.
   Elsewhere it would control nothing, and a stored "off" would silently stop
   motion on pages without the button.
7. **The scene waits for the visitor's first move** (or 5 s), and a **CPU
   probe** joins detect-gpu (see Lighthouse above).
8. **Dust is soft round specks**, not the prototype's square points: up close a
   square point reads as a stray pixel. Size ×1.6 to keep the same presence.

## Checks run (all against the final build)

- `tsc --noEmit`: clean. `eslint`: clean.
- `next build`: clean.
- `check:labels`: 26 pages, 0 failures. `check:links`: 0 failures.
  `check:forward`: all pass. `check:licences`: 130 packages, 0 to review.
- `check:a11y` (axe, every page, both themes, menus open): 0 issues of any severity.
- Browser checks (Playwright; WebGL through SwiftShader):
  - no console errors or warnings, with and without the scene;
  - a no-GPU browser keeps the poster;
  - Motion on: the camera flies and settles on the shot, and the words follow;
  - hovering a screen gives a pointer and lifts it toward the viewer;
  - clicking a screen or a tile goes to its shot;
  - Motion off: cuts to the nearest shot, timecode exact, stored as `off`,
    `aria-pressed="false"`;
  - reduced motion starts with Motion off and cuts;
  - switching theme live re-colours the scene and swaps the captures;
  - the Motion button's keyboard focus ring is visible.
- Framing checked at 1440×900 in both themes, and at 390×844 for all five shots.

### The licence exception

`scripts/check-licences.ts` now names one reviewed exception: **gsap**, under
GSAP's "Standard 'no charge' license" (read 2026-11-03). It allows commercial
use at no charge. Its one restriction is building no-code visual animation
tools that compete with Webflow, which this site is not. Note that Webflow may
change or terminate the licence at its discretion. If that is a concern,
ScrollTrigger's one job here (scroll → progress) is ~20 lines without it.

## For the owner

- **The preview**: this work is on the branch `w-3d-1-hero`. Vercel builds a
  preview for every pushed branch, and the URL is on the branch's latest commit
  on GitHub (the Vercel check → Details) and in the Vercel dashboard. On a
  phone or laptop, `/?hero=live` forces the scene if the device check says
  otherwise.
- **When the scene changes, re-make the posters**: `npm run build && npm run
  start`, then `npx tsx scripts/make-hero-poster.ts`. Each AVIF must stay
  under 120 KB; today they are 11–19 KB.
- **The `hero-reel` upload slot** in `content/media.ts` belongs to the old
  hero and is no longer shown on Home. It was left alone because it is not
  part of the hero; remove it when convenient.
- **Skills**: ten audited skills were added for this batch (GreenSock's
  official GSAP skills, three.js and R3F skills, markdown only). Provenance is
  in `~/.claude/skills/INSTALLED.md` §6.
