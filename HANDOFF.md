# HANDOFF — Batch W-3D-1: the home hero as a live 3D scene

2026-11-03, revised the same day after the owner's review. The home page's
hero is the Genreline logo's gold line through deep space. It opens on the
whole line (the logo) under the title. As the visitor scrolls, the camera dives
to the **Crew space**, rides the line up to the **Client space** (which turns to
the **Stakeholders space** every three seconds), drops through the valley and
climbs to **the Suite**, then pulls back to the whole line for the close: *Run
the production. Keep the record.* Each space arrives in its own light, ringed
by its own screens and tools.

## Revision, 2026-11-06: a one-screen hero, the tour, dark only, a century of cinema

An audit found the hero held the page for 9.5 screens before a buyer saw
anything else. The owner's response: *"i love the take a tour idea. really love
it."* The plan was approved, then built feature by feature, each one
researched, built and checked before the next
(`~/.claude/plans/happy-dancing-star.md`).

| What | How |
|---|---|
| **Dark only** (*"i need the website to only be in dark mode"*) | `<html class="dark">` comes from the server: no theme script, no flash, no switch. `next-themes`, `ThemeProvider` and `ThemeToggle` are deleted. Captures and the mark render their dark image. The 12 light posters are deleted. `check-a11y` asks for light and stores "light" to prove neither is honoured. |
| **One screen** | `.hero` is `100svh`. Scrolling goes straight to the page. The journey's scroll length applies only under `html[data-tour='on']`. |
| **The title** | Each line holds on one line (`white-space: nowrap`, sized for line 1's 17.06 em). One `--hero-edge` sets the words' left margin, and `frame.ts` gives the logo the same margin on the right. |
| **The subtext** | The owner's choice of drafts (new copy): *"Make the film, run the crew and take every client from first cut to approval, signature and payment — in one place."* |
| **Take the tour** | A real button *just under* the 3D logo (*"not exactly on it"*). It is placed from the camera's own framing (`frame.ts logoOnStage`), and the logo's frame leaves it room. The click is choreographed, transform and opacity only, on the house curves: press 120 ms, the gold ring opens like an iris (760 ms), the title steps aside, the camera dives (a scripted glide on `--ease-out`), the track draws in, its marks pop in 70 ms apart, and *Exit tour* appears. Exit or Escape rewinds. A wheel, touch or key takes over the glide; interrupting the rewind keeps the tour on. On a phone the control spins until the scene is ready. Reduced motion uses fades and cuts. |
| **The first paint** | The title poster is scaled and placed so its logo lands where the camera puts it at this screen's size (`public/hero/posters.json`, written by the poster script). It fades in once placed, so the logo never jumps when the 3D takes over. The subtext is now the Largest Contentful Paint. |
| **The track and the marks** | Only on the tour. Each space's mark is a button that glides there. The Spaces section is hidden while the tour is on, so the tour never runs into the same three spaces (*what follows the tour is still to be decided with the owner*). |
| **Each space's words** | Its name, the site's own fuller line (SpacesBento, the In-house segment), and four items, each a feature of the register: `Feature` and `FeatureLabel`, "Coming" where not live. The camera measures each space's caption separately. |
| **Words before light** | The gold line steps back where it passes behind a caption, the close, the track or the slate line (a soft screen-space mask in the line's shader). |
| **The universe** | Shooting stars: three screen-space slots, irregular, worked out on the GPU. Stars ease aside and brighten near the pointer. A Milky Way: a band with dust lanes and granular star dust, per vertex plus a per-pixel hash. A slow **era drift** of the deep sky through film stock, about two minutes round: today; silver nitrate; silent-era amber tint; three-strip Technicolor. Far off and faint: a planet ringed by a strip of 35 mm film, its moon a film reel, and a small cool planet. |
| **Crew — the studio era** | The floor the owner loves, made into a soundstage deck: board seams, warm pools under three tungsten beams angled in through haze (haze per vertex), dust in the light, spike tape, a dolly track, the tile's reflection. A 35 mm reel turns behind the tile. |
| **Client — the picture palace** | The concentric rings and the gyroscope are gone. The deco floor has a gold fan and aisle lights converging on a great 2.39:1 silver screen, with film grain and the shutter's breath. Its arched gilded proscenium has a sunburst crown, fans at its corners and velvet curtains, and its light spills into space like an eclipse's corona. A projector beam crosses over the audience, and a deco sunburst rings the tile. **Stakeholders — premiere night:** searchlights sweep the sky behind the screen, the light turns gold, and the aisle becomes a red carpet. |
| **Suite — the modern lens** | The fan of rays and the gyroscope are gone. A cine lens sits behind the tile: a nine-bladed iris that opens as you arrive, a focus ring with engraved distances pulling focus, and coated-glass reflections. An anamorphic flare crosses through the tile. The floor is an edit timeline running to the horizon, its playhead sweeping. |

**Checking by hand.** `?era=0–3` holds one era. `?shot=`, `?hero=`, `?quality=` and `?governor=off` work as before.

**Measured** (production build, this Mac):
- the 3D chunk is 222.0 KB gzipped (budget 250);
- 60 fps at every quality, idle and through the dive, Client and Suite (95th-percentile frame 16.8 ms; 2–4 late frames at the click itself, when the hero grows);
- on a software renderer at quality 0: 38–46 fps per station, above the governor's 25 fps floor;
- Lighthouse mobile, Home: 93, 93 and 88 (the old hero: 90, 90, 90), CLS 0, TBT 10 ms;
- the label check: 26 pages, 0 failures; the link check: 0 failures; axe: 0 issues.

**Not done here.** The Suite's six drawn tool cards (the script, boards, a dusk shot and so on) are unchanged. What comes after the hero and the tour is the owner's next decision.

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

## Every device: the owner's report and the fix (2026-11-04)

The owner: *"the 3D doesnt work on some devices … it works [on] macbook, ipad,
iphone but it doesnt work on windows … and other devices … render smoothly on
all devices either small screen medium or big and operating systems and
brands."*

**Why it failed.** The first version decided up front who got the 3D, and the
rules were too strict:
- A processor test (a fixed sum, under 6 ms) was tuned on this Mac. Windows
  laptops on battery saver miss it, and so does Edge in "enhanced security"
  mode, which switches off JavaScript's optimising compiler on sites you
  rarely visit.
- detect-gpu's tier had to be 2 or 3. Firefox hides the GPU's name (tier 1),
  Chromebooks and Linux rate 0–1, and budget Android phones (Mali-G52) rate 1.
- The scene started only on a move made after the page had settled; a move
  made earlier was lost.

Every one of those visitors got the stills, which look like a 3D hero that
doesn't work.

**What it does now.** Every device that draws WebGL 2 on graphics hardware
gets the live scene, in any browser on any system, at a starting quality fitted
to its GPU. A governor then watches the frame rate the device actually
delivers and moves the quality to match.
- The quality steps cover: particles 3,400 / 2,400 / 1,300; stars 4,200 /
  3,000 / 1,800; warp streaks on or off; edge smoothing on or off; screen
  pictures 1,400 / 1,024 / 720 px wide.
- Below 40 fps it steps down, then lowers the resolution (0.85×, 0.7×).
  Above 55 fps it may step up one level.
- Resolution is held to a pixel budget (3.8 / 2.6 / 1.5 megapixels), so a 4K
  Windows monitor or a 3× phone draws no more than its GPU can fill.
- A display or battery saver holding the rate at a steady 30 Hz (Chrome's
  Energy Saver, iOS Low Power Mode) is recognised and not mistaken for
  slowness.
- Only a device without WebGL 2, drawing in software, asking to save data,
  under 25 fps even at the lowest level, or whose graphics driver can't build
  one of the scene's shaders, plays the hero as stills. The switch is clean,
  and so is the 20-second limit on getting ready.
- The screen shader reads its textures and derivatives outside its branches,
  as Direct3D's shader compiler (Chrome and Edge on Windows) prefers.

**Fitted to every screen.** The camera no longer frames shots with fixed
proportions. The page measures where its words actually sit (the header and
slate line, the title, the captions, the close, the track), and each shot is
fitted into the room they leave. For the title and the close it tries the logo
beside the words and above them, and uses whichever shows it larger.
Near-square frames (tablets, small windows) put the title at the foot, with the
logo above.

**Tested** (Playwright, production build, against this Mac's GPU):

| Case | Result |
|---|---|
| Chrome | live, quality 2, 60 fps |
| Edge on Windows with Intel UHD 620 (GPU name and user agent spoofed) | live, quality 1, climbs to 2 at 60 fps |
| Edge with the JIT off (enhanced security) | live, 60 fps |
| WebKit (Safari's engine) | live, 59–60 fps |
| A software renderer (no GPU) | stills |
| A software renderer forced live | the governor steps down 1.0 → 0.85 → 0.72 → 0.6× and switches to stills at ~15 s |
| A screen shader made to fail to build | stills, cleanly |

detect-gpu was also run against 20 real GPU names: Intel UHD and Iris Xe, AMD
integrated and RX, NVIDIA GTX and RTX, Adreno, Mali, Samsung Xclipse, Linux
Mesa and ChromeOS. Every one now gets the live scene. The framing was checked
at eight sizes: 360×740, 844×390 (a phone on its side), 768×1024 and 1024×768
(iPad), 1280×1024, 1366×768 and 1536×864 (Windows laptops), and 1920×1080 and
2560×1080.

**Not tested here:** real Windows hardware (Direct3D itself) and Firefox. This
tool's sandbox wouldn't let Playwright's Firefox start. On any device, inspect
the hero to see its choice: `.hero-scene[data-tier]` (live or stills, and the
starting quality) and `[data-hero-stage][data-hero-level]` (the governor's
level and resolution).

## Smooth on Windows (the owner's second report, 2026-11-04)

The owner: *"windows is still not working … its not smooth moving at all."*
The 3D now ran on Windows, but it stuttered. These were the likely causes,
each about cost per frame on Windows graphics, and each one is fixed:

1. **Frosted glass over a live canvas.** The header (a 24 px backdrop blur)
   and the "Talk to sales" button (14 px) sat over the 3D, so the browser
   re-blurred the moving scene under them every frame, which Windows
   integrated graphics do slowly. While the live 3D is on screen
   (`html[data-hero-live]`), neither frosts: the header lies on the hero's own
   top shade.
2. **Multisampling (MSAA) on integrated graphics.** On the shared memory of
   Intel and AMD laptop chips, it cost more than the rest of the scene. On a
   weak-GPU stand-in it alone cut the frame rate to a third. Now only quality
   2 uses it, and integrated graphics (Intel, AMD's laptop chips, phone GPUs,
   though not Apple's) start at quality 1.
3. **One shader with every branch.** Chrome and Edge on Windows translate
   shaders for Direct3D, whose compiler often flattens if/else, so every
   screen pixel could compute all seven Suite drawings. Each kind of screen and
   structure is now its own small program, chosen when it's built, with
   nothing to flatten.
4. **Pictures in bursts.** The screen pictures are now decoded and resized
   off the main thread (`createImageBitmap`) and handed to the GPU one per
   frame (`uploadSoon`), from the moment the scene appears, not in bursts
   mid-journey. On a 6× slower CPU the stalls went from 4 (up to 60 ms) to 0,
   and the frame rate from 56 to 60.
5. **Repaints for the words' shade.** The shade behind the words was a
   gradient repainted every frame through CSS variables. It's now fixed
   gradients that only fade, which the compositor does without repainting.
   The hidden closing title's running film stock is paused.
6. **A governor fooled by a steady 30 fps.** A graphics chip that can't keep
   up on a 60 Hz screen settles at a steady 30 fps (every second refresh). That
   looks steady and was mistaken for a battery saver's cap. The display's own
   rate is now measured before the scene starts, and smoothness is judged
   against it, counting late frames as well as the average. Far off the pace,
   the governor steps down two levels at once. A quality change no longer
   builds a new shader mid-scroll, because the warp streaks stay loaded.

Check a device by hand: `.hero-scene[data-tier]` shows the choice, the
starting quality and the measured display rate; `[data-hero-level]` shows the
level the governor settled on; `/?governor=off` holds the starting level.


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
| `components/hero/scene/HeroCanvas.tsx` | The R3F `<Canvas>` (WebGL 2). It compiles every shader up front and checks each built, then runs the governor that fits quality and resolution to the frame rate the device delivers. |
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
3. **As soon as the visitor is there** (a mouse over the page, or a first move,
   scroll, touch or key): the device check runs, and the 3D loads and fades in
   over the poster of its own first frame. The screens' pictures load station
   by station as the visitor nears each one. Lighthouse has no mouse and makes
   no moves, so it measures the page without the 3D, as most first visits begin.

### Device tiers

| Device | Gets |
|---|---|
| WebGL 2 on graphics hardware (any browser, any system) | **The live scene.** It starts at quality 2 (detect-gpu tier 3), 1 (tier 2, or a GPU it can't name) or 0 (tier 0–1), then the governor fits it to the frame rate (see *Every device* above). |
| No WebGL 2, a software renderer, Save-Data, or too slow even at the lowest level, or a shader the driver can't build | **The stills**: a poster of every shot (title, Crew, Client, Stakeholders, Suite, close), cross-fading as the visitor scrolls, the Client/Stakeholders turn included. Only the posters actually needed are fetched. |

`/?hero=live` or `/?hero=poster` forces a tier, `/?quality=0|1|2` sets the
starting quality, and `/?shot=crew` (or `title`, `client`, `stakeholders`,
`suite`, `close`) holds one shot, for checking a device by hand.

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
| 3D: three slim + R3F + the whole scene, shaders and governor | **217.3 KB** (was 206.8) | Engaged devices with WebGL 2 |
| GSAP core + ScrollTrigger | ~45 KB | After load, when idle |
| detect-gpu | ~3 KB | Engaged |

## Performance

- **Frame rate**: scrolling the whole hero in 14 s, production build, Apple
  M4 Max: 840 frames, a steady 16.7 ms, none over 16.8 ms. The same holds at a
  390×844 phone frame. On slower GPUs the governor steps the quality and the
  resolution down until it is smooth (see *Every device*).
- **Lighthouse, mobile, Home** (`next build` + `next start`, this machine):

| | Performance | Accessibility | Best practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| This version (2026-11-04, after the smoothness work) | 90 · 90 · 90 | — | — | 3.6 s | 10 ms | 0 |
| 2026-11-04, every-device work (4 runs) | 94 · 90 · 90 · 90 | 100 | 100 | 3.1–3.6 s | 10 ms | 0 |
| The 2026-11-03 revision (5 runs) | 85 (cold first run) · 90 · 91 · 90 · 90 | 100 | 100 | 3.5–3.6 s (4.3 cold) | 10 ms | 0 |
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
5. **Every WebGL 2 device on graphics hardware gets the live scene**, fitted
   by the governor, rather than the spec's GPU-tier gate (which sent Windows,
   Firefox and budget Android visitors to stills). Stills, a poster of every
   shot, are the fallback.
6. **The scene waits for the visitor** (a mouse over the page, or a first
   move), to protect the page's load (see Lighthouse).
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
