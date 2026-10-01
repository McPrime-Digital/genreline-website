# genreline-web

The marketing website at **genreline.com**. Governing spec: `S-W` in the app repository
(`docs/specs/S-W-website.md`). `S-B` is authoritative for every visual decision;
`S-F-A` rev 2 is the only source of feature labels. This repository never imports from
the app (S-W W-1).

Next.js 16, every page generated at build time (W-2), one server route
(`/api/inquiry`, W-7). No cookies, no session, no third-party script on a page view
(Turnstile loads on the first interaction with a form).

## Run it

```bash
npm install
npm run dev          # http://localhost:3001
npm run build && npm run start
```

## Where things live

| Path | What it is |
|---|---|
| `content/features.ts` | Every S-F-A ID with its site label — the ONLY source of Available / Coming |
| `content/claims.ts` | S-W §3: what may be claimed, and the forbidden phrases the check enforces |
| `content/roadmap.ts` | Generated from `features.ts` by `npm run gen:roadmap` — never edit |
| `content/pages.ts` | The site map (S-W §4): titles, descriptions, label-check sections |
| `content/media.ts` | Every picture slot: product captures, and owner uploads |
| `content/pricing.ts` | Plan terms from the app's `lib/billing/plans.ts`; prices `null` until set |
| `styles/tokens.css` | Copied from the app's tokens (W-4) — re-copy, never edit to taste |
| `next.config.mjs` | Headers, the CSP, and THE forwarding rule (W-11) |
| `docs/PLAN.md` | The design plan, the repository and skills audits, the replan |
| `docs/ITEM-0-AUDIT.md` | The audit the build started from |

## The checks (S-W §10 step 8)

Build first, then run each against `npm run start` on :3001.

```bash
npm run check:labels       # over the built HTML: labels, forbidden claims, external links
npm run check:forward      # W-11: every app path 308s with its query string; owned paths don't
npm run check:links        # every internal link and #anchor resolves; every app link answers 200
npm run check:a11y         # axe, every page, both themes, menu open, phone drawer open
npm run check:lighthouse   # mobile; build with VERCEL_ENV=production so robots allows indexing
npm run check:licences     # the production dependency tree, transitively
```

## Product captures (W-8)

Real screens from the live app, signed in as the **harness tenant's** personas — never a
real studio. The credentials stay in the app repository:

```bash
npm run capture            # writes .capture/slots.json and prints the next two commands
# in the app repo:
npx tsx scripts/ops/capture-website.ts --slots ../genreline-web/.capture/slots.json --out ../genreline-web/.capture/raw
# back here:
npm run capture:optimize   # PNG → WebP in public/captures, with dimensions.json
```

The harness's rows are test fixtures, so the capture script relabels page text to a
fictional studio (Northlight Pictures and its clients) before each shot; `--raw` turns
that off. It refuses to save any screen that still shows a fixture string, an error, a
Suite working title, or a phrase the site may not publish.

## Owner uploads

Every `upload` slot in `content/media.ts` renders a labelled placeholder until its file
exists at `public/media/<id>.<format>`. The placeholder says what to upload and at what
size.

## Environment (Vercel → Settings → Environment Variables)

| Name | Needed for |
|---|---|
| `RESEND_API_KEY` | the inquiry route |
| `INQUIRY_FROM_EMAIL` | the From address, on the verified genreline.com Resend domain |
| `INQUIRY_TO_SALES`, `INQUIRY_TO_EARLY_ACCESS`, `INQUIRY_TO_SECURITY` | each form's inbox — a form without one renders disabled |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | bot protection on the forms (required in production) |

The forms read these at BUILD time, so set them before the deploy that should enable the
forms. Turnstile's allowed hostnames must include `genreline.com` (S-W §12 step 3).
