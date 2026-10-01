# genreline-web — the build plan (written before the build, revised after research)

**2026-10-01.** Governing spec: `S-W` (the app repository, `docs/specs/S-W-website.md`).
`S-B` is authoritative for every visual decision; `S-F-A` rev 2 is the only source
of feature labels. Written in the frontend-design skill's order: plan → review
against the brief → build → critique.

## 1. The brief, in one line

A production operating system for film and media studios. The site's one job: make
a producer, a post supervisor, an agency head or a studio's security lead believe —
accurately — that Genreline runs the production *and keeps the record*. It must read
as infrastructure a security team would approve, never as a creator tool.

## 2. Design plan

**Colour — fixed by W-4, and that is the point.** The app's tokens, copied: navy canvas
`#020A2B`, lifted panel `#0C1E55`, gold `#C8A24A`, off-white `#E8EBF5`, and the violet
edge-light `hsl(262 78% 72%)` as the ONLY glow. Light theme on shark greys
(`#F7F9FB` / `#E2E8ED` / ink `#171C23`, a deeper gold for legibility). One gold per view:
the primary action. The site and the product must never look like two companies.

**Type.** Schibsted Grotesk for display, Geist for everything else (both OFL-1.1,
self-hosted at build through `next/font`). The app's nine named steps are copied
verbatim; the website adds exactly two display steps above them (40/44 and 56/60,
negative tracking) because a hero headline at 36px is a heading, not a hero — the
landing page this site inherits already set 40/56. Body copy 14px at 60–70ch, lead
paragraphs 16px. No all-caps tracked labels, no eyebrows, no accent-one-word headlines.

**Layout — "the record".** Left-aligned throughout, like the product. Prose sits on
an 880px measure; product captures bleed to 1200px inside squircle frames (radius 26,
the main-panel radius; 22 for a card; 18 for a list; 12 for a control — the app's
hierarchy, carrying meaning). One gold hairline at the head of a page, the title-card
rule the landing page already uses. Sections are separated by space, not by boxes;
cards appear only where things are genuinely comparable (plans, the three spaces).

```
┌──────────────────────────────────────────────────────────────────┐
│ ◆ Genreline   Product ▾  Solutions ▾  Network ▾  Pricing   Sign in [Open your studio] │ ← glass, sticky
├──────────────────────────────────────────────────────────────────┤
│ ──                                                               │
│ Run the production.                                              │
│ Keep the record.                                                 │
│ sub-line (52ch) · [Open your studio]  See how approval works     │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ real capture · Crew | Client | Suite tabs · theme-aware (26) │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ The stack you're replacing ── jobs → one surface (hover/focus)   │
│ ┌ THE RECORD — interactive ───────────────────────────────────┐  │
│ │ [the client responds] [nobody responds]                      │  │
│ │ Thu 5:00 PM  Rough cut v3 · awaiting your approval           │  │
│ │ "If nobody responds by Thursday 5:00 PM, this advances…"     │  │
│ │ sent → reminded → deadline → advanced automatically → shown  │  │
│ │ the certificate sentence                                     │  │
│ └──────────────────────────────────────────────────────────────┘  │
```

**Principles.**
1. One memorable thing per page (`S-B`). Home: the interactive record. A product page:
   its real capture.
2. Density is respect — but for a reader, not an operator.
3. Nothing decorative moves on its own (`S-B` 4). Motion answers an action — a menu,
   a drawer, a tab, a toggle, a press — with the four house curves and three durations.
4. Every claim traces to an ID; the badge is rendered from `content/features.ts`.
5. Real captures. Where a capture cannot yet exist, a named placeholder slot that says
   what the owner should upload.

## 3. Review against the brief — what was generic, and what changed

- Navy + one bright accent is calibration trait 2. Here it is the brief's own palette
  (W-4), so it stands; what we refuse is the *rest* of that kit — no gradient washes,
  no identical rounded cards with the same grey shadow, no `→` on links.
- `S-W` §8 asked for "content fades and rises once on entering view". `S-B` principle
  4 and the landing page's own rule ("no entrance animation") forbid it, and the
  frontend-design skill names fade-and-slide-up per section as the generic tell. `S-B`
  wins: **no scroll-reveal.** Motion is reserved for things a person did.
- `S-W` §5.1 puts a primary (gold) button in the header AND the hero puts one in view —
  two golds per view against `S-B`'s one. Resolution: the header's CTA is a quiet
  secondary button while the hero's primary is on screen, and turns gold the moment it
  scrolls away (an IntersectionObserver, ~20 lines).
- `S-W` §8 says themes follow the system setting "the same treatment as the app"; the
  app pins `defaultTheme="light"` with `enableSystem={false}`. We follow the visitor's
  system and offer the toggle — the literal instruction, and the right one for a site
  a person has not configured.
- Numbered markers only where the content is a sequence: the approval timeline is one;
  the three spaces are not.

## 4. Repositories audited (2026-10-01) — licence, verdict, what was taken

Checked live through GitHub's API: licence, archived flag, last push. **Code is taken
only from MIT / Apache-2.0 / OFL sources; everything else contributed ideas only.**

| Repository | Licence | Pushed | Verdict | What was taken |
|---|---|---|---|---|
| radix-ui/primitives | MIT | 2026-08 | **adopted** (`radix-ui` unified package, the app's own choice) | NavigationMenu (mega-menu keyboard model), Dialog (drawer, palette), Tabs, Accordion, Collapsible, VisuallyHidden |
| shadcn-ui/ui | MIT | 2026-09 | ideas | the navigation-menu recipe's data-state motion; the app's `components/ui` descends from it and is the real source here |
| pacocoursey/next-themes | MIT | 2026-02 | **adopted** | class-attribute theming with system preference, no cookie |
| pacocoursey/cmdk | MIT | 2025-10 | not adopted | the app hand-built its palette and ships no animation on it; the site mirrors the app's, not a library's |
| emilkowalski/vaul | MIT | 2025-10 | ideas | pointer capture on drag, `VELOCITY_THRESHOLD = 0.05`, a 10px touch / 2px pointer swipe-start threshold — used by the drawer's swipe-to-close |
| marsidev/react-turnstile | MIT | 2026-10 | ideas | the imperative `execute()`/`reset()` shape; we load Turnstile's script only on first interaction with a form, so a page view carries no third-party script |
| vercel/analytics | MIT | 2026-09 | **adopted** | Web Analytics, confirmed cookieless in Vercel's own docs (W-9) |
| supabase/supabase (`apps/www`) | Apache-2.0 | 2026-10 | ideas | the shape of an enterprise marketing nav: product/solutions dropdowns + one mobile menu + one `useDropdownMenu` hook; the "state the gaps" security page |
| PostHog/posthog.com | NOASSERTION | 2026-10 | ideas only, no code | roadmap grouped by area with status filters; changelog as dated entries |
| davidjerleke/embla-carousel | MIT | 2026-09 | not adopted | momentum projection is Apple's `v/1000·d/(1−d)`; the hero switches by tabs, not a carousel |
| magicuidesign/magicui | MIT | 2026-09 | **rejected** | decorative, self-moving effects — `S-B` principle 4 |
| motiondivision/motion | MIT | 2026-10 | not adopted | springs are right for gestures; this site's gesture is one drawer swipe, done with pointer events + WAAPI on the house curves |
| garmeeh/next-seo | MIT | 2026-07 | ideas | JSON-LD shapes for Organization and SoftwareApplication, written by hand |
| Evercoder/culori | MIT (zero deps) | 2026-07 | not needed | the brand demo uses the WCAG 2.1 relative-luminance formula directly (five lines) |
| dequelabs/axe-core (+ @axe-core/playwright) | MPL-2.0 | 2026-09 | **dev only** | the accessibility gate; never shipped to a visitor |
| GoogleChrome/lighthouse | Apache-2.0 | — | **dev only** | the performance gate |
| harlan-zw/unlighthouse | MIT | 2026-09 | not adopted | site-wide Lighthouse; `S-W` asks for three named pages |
| lovell/sharp | Apache-2.0 | 2026-09 | **dev only** | capture conversion to WebP/AVIF at DPR 2 |
| vercel/geist-font · Schibsted Grotesk | OFL-1.1 · OFL-1.1 | — | **adopted** | the two faces |

Transitive licences of the production dependency tree are scanned after install
(`scripts/check-licences.ts`) — the app once found a commercial-use ban riding in on an
MIT package's dependency, and the only defence is reading the tree.

## 5. What makes it not static (the interaction inventory)

Build-time generation is how pages are *delivered* (W-2). Everything below runs in
the visitor's browser:

1. Sticky glass header; Radix mega-menu (origin-aware, keyboard-complete); full-screen
   mobile drawer with accordions, CTAs pinned, swipe-to-close.
2. The header CTA that turns gold when the hero's primary leaves the viewport.
3. Light/dark from the system with a footer toggle; **captures switch with the theme.**
4. Hero capture switcher — Crew / Client / Suite tabs over real captures.
5. **The record** — an interactive explainer: "the client responds" vs "nobody responds",
   a stepper through the timeline, the certificate sentence rendered per state.
6. The stack row — hover or focus a job and see the one surface it resolves into.
7. The brand demo — type a colour, watch the on-colour chosen by measured contrast in
   both themes, beside two real portal captures in two real brands.
8. Security controls as disclosures with the precise statement under each.
9. Pricing — "which plan fits": seats and client-company sliders highlight the plan
   whose limits admit them; no price, no buy button (S-F-A FND-07).
10. Roadmap and changelog with live filters and search.
11. ⌘K site search over every page and labelled feature, styled as the app's palette
    (and, like it, with no open animation — a keyboard action is never animated).
12. Forms with inline validation; Turnstile loaded on first interaction; one neutral
    result for every failure.
13. Every capture and media slot comes from `content/media.ts`; a slot without a file
    renders a labelled placeholder that names what to upload and at what size.

## 6. What is deliberately not built

Scroll-reveal animation; parallax; marquee rows; competitor logos; a status page; a
customers page; a blog; compare pages; any cookie; any chat widget.

## 7. Skills audited and applied (2026-10-01)

Cloned, licence-read and grepped for network, exec and secret patterns before use
(`~/.claude/skills/_audited/AUDIT.md`). Installed as copies, so an upstream change
cannot alter what was audited; the two Vercel skills that fetched their rules from
GitHub at runtime now read a pinned snapshot.

| Source | Licence | Skills applied here | Where they bite |
|---|---|---|---|
| vercel-labs/agent-skills | MIT | web-design-guidelines (pinned), react-best-practices, composition-patterns, writing-guidelines | the final review pass; input `autocomplete`/`inputmode`/no-paste-block; `…` and curly quotes; `theme-color`; no `forwardRef` (React 19) |
| ibelick/ui-skills | MIT | baseline-ui, fixing-accessibility, fixing-metadata, fixing-motion-performance | `h-dvh`, safe-area insets, `aria-label` on icon buttons, one accent per view, compositor-only animation, metadata agreement (title/canonical/og:url) |
| phazurlabs/sumi | Apache-2.0 | navigation-pattern-encyclopedia, form-design-encyclopedia, micro-copy-intelligence, conversion-optimization-patterns, performance-states-patterns | mega-menu keyboard map; one-column forms, labels above, validate on blur, errors that name the fix, 44px targets; clear-over-clever copy |
| plugin87/ux-ui-agent-skills | MIT | accessibility checklists, taste notes | zero emoji anywhere; WCAG 2.2 AA checklist; "never state a number you did not measure" |
| anthropics/skills · nextlevelbuilder/ui-ux-pro-max | Apache-2.0 · MIT | frontend-design (the process this plan follows), ui-ux-pro-max | plan → review → build → critique; landing-page UX guidelines |
| already installed | — | emil-design-eng, apple-design, animate | press feedback on pointer-down, origin-aware menus, materials, interruptible motion, reduced-motion as cross-fade |

Where a skill contradicts `S-B` (Title Case, `&`, "no custom easing", "no tracking
changes"), `S-B` wins — it is the app's design, and W-4 says the site wears it.

## 8. Replan after the research (before the pages were built)

What the skills and the code reads changed, before a page was written:

- **Forms** (sumi form-design): one column, labels above, validate on blur, errors
  that name the fix, 44px targets, `autocomplete` and `inputmode` on every field.
- **Copy** (sumi micro-copy, vercel writing): verbs on buttons, `…` and curly quotes,
  second person; sentence case and "and" over S-B's objections to Title Case and `&`.
- **Metadata** (ui-skills fixing-metadata): title, description, canonical and og:url
  from ONE source per page (`lib/meta.ts`); `theme-color` per scheme; JSON-LD only
  for what the page renders, no invented prices or ratings.
- **Motion** (ui-skills fixing-motion-performance, apple-design): compositor-only;
  no scroll listeners — IntersectionObserver for the header's state; the drawer's
  swipe uses pointer capture and WAAPI, not a library.
- **A hero is never a row of placeholders**: capture tabs appear only when their
  capture exists (`hasMedia`).
- **Found in the app while writing copy, and designed around**:
  · the portal calendar still says "approved automatically" (`lib/portalCalendar.ts`
    159–167) — so the site never quotes it as the product's sentence, and the capture
    script refuses any screen containing a forbidden phrase;
  · the certificate sentence S-W quotes IS the product's, word for word
    (`components/shared/ApprovalCertificate.tsx`) — quoted as such;
  · recording ingest rides the job queue, which has never run in production (app
    commit a079e7f) — the site says "record a session", not where it lands;
  · the app's CSP is report-only (live header) — the security page says so;
  · `whiteLabel` and `sso` in `lib/billing/plans.ts` have no consumers — the pricing
    page shows them as plan terms, and the report flags that nothing enforces them;
  · FND-03 (internal-only) is not enforced — the in-house page says so and links to
    the roadmap instead of describing a configuration that does not exist.
