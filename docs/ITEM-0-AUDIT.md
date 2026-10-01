# Item 0 — the audit, 2026-10-01

Read against the app repository at `throughline` 0262f66 and the live app. No premise
in S-W was false enough to stop on; every finding below was designed around and is
reported, not hidden.

## 1. S-F-A rev 2's Site column against the code

Commits since 3af3f85 touch three files only — `.github/workflows/queue-tick.yml`,
`playwright.prod.config.ts`, `scripts/ops/check-deploy-readiness.ts`. No feature code
changed, so **no ID's status has changed**. One live fact bears on labels:

- **FND-15, the job queue (Built, Internal), has never run in production** (app commit
  a079e7f: the two GitHub secrets the tick needs were never set). Its label is Internal,
  so nothing on the site names it — but **MTG-08** (recording, Available) lands its file
  through that queue, and **FIL-05** (renditions) depends on it. The site says "record a
  session" and never says where the recording lands.

## 2. S-B against S-W's design statements — where they disagree, S-B won

| S-W says | S-B / the app says | Built as |
|---|---|---|
| §8: "content fades and rises once on entering view" | Principle 4: "Nothing decorative moves on its own"; the landing page: "no entrance animation" | No scroll reveal. Motion answers an action only |
| §5.1: a primary "Open your studio" in the header, beside a hero with its own | "One gold per view — the primary action" | The header's button is gold only when no other primary CTA is on screen |
| §8: section labels and type from the app's scale | Scale 11–30 (36 in config) | Two display steps added (40, 56), which the landing page already used |
| §8: WCAG 2.2 AA | "section labels … in the faint colour" | `--text-faint` measures 4.3:1 (light) and 3.8:1 (dark); the site uses it for icons only |
| §8: themes "follow the visitor's system setting … the same treatment as the app" | The app pins light and disables system | System plus a footer toggle — the literal instruction |

## 3. The plans in `lib/billing/plans.ts`

| Plan | Crew seats | Client companies | Storage | Meeting minutes/month | White-label | Hides attribution | SSO |
|---|---|---|---|---|---|---|---|
| agency (new studios start here) | 5 | 25 | 500 GB | 3,000 | no | no | no |
| studio | 20 | no limit | 2 TB | 10,000 | yes | yes | no |
| enterprise | no limit | no limit | no limit | no limit | yes | yes | yes |
| house | the owner's organization; never sold | | | | | | |

**No price exists anywhere.** Two declared terms have no consumer in code: `whiteLabel`
and `sso` (an Agency studio can use the brand kit and SSO today). Seat and client-company
limits are not enforced (`withinLimit()` has zero callers — FND-08); storage is.
`/pricing` shows the terms as terms, with "Talk to us" in place of a price.

## 4. Tokens and fonts

Confirmed as W-4 describes: `app/globals.css` `:root` and `.dark` (navy `#020A2B`, panel
`#0C1E55`, gold `#C8A24A`, off-white `#E8EBF5`, glow `262 78% 72%`), the motion tokens,
the glass material; `tailwind.config.ts`'s named type scale; `app/layout.tsx`'s
`--font-body` (Geist) and `--font-display` (Schibsted Grotesk). Copied to
`styles/tokens.css` with the source and date in its header.

## 5. The harness tenant for captures

The capture script (app repo, `scripts/ops/capture-website.ts`) signs in **without a
password and without the captcha gate**: the service role mints a magic-link token
(no email is sent) and a plain client redeems it. It **refuses to run** unless the
session's organization claim is the harness org. The personas used — the harness owner
and company 1's owner — hold no membership anywhere else, and the 76 assertions are what
keep their reads inside the tenant. No capture can contain a real studio's data.

Two things a reader of the captures should know:

- **The harness's rows are test fixtures** ("P1 · before cutoff · 7d", "ZZ-HARNESS
  Company One"). The script relabels page TEXT to a fictional studio before each shot.
  The UI is the product's own; nothing is written for it. `--raw` captures as-is.
- **One write, restored**: the two portal-brand captures set a brand on the harness
  studio through the app's own route, and the original is restored in a `finally`.

## 6. Vercel Web Analytics

Vercel's documentation: "Web Analytics only stores anonymized data and does not use
cookies"; visitors are "identified by a hash created from the incoming request", reset
daily. Enabled — rendered only on Vercel, where `/_vercel/insights` exists.

## 7. The app's apex forwarding today, and every path W-11 must carry

There is **no forwarding map in the app's code**: `genreline.com` answers `308 →
https://www.genreline.com/` from Vercel's domain settings, and `www` serves the app.
(S-W §11's "temporary apex forwarding map" is therefore Vercel configuration, not code.)
The runbook's minimum set (`docs/runbooks/batch-28-app-move.md` §5 step 14) and the rest
of the app's surface, each checked by `scripts/check-forward.ts`:

`/auth/callback?…`, `/set-password`, `/reset-password`, `/login`, `/login/verify`,
`/signup?…`, `/s/<token>`, `/sign/<token>`, `/meet/<id>`, `/studio/*`, `/dashboard`,
`/projects/*`, `/approvals/*`, `/invoices`, `/messages`, `/files`, `/team`, `/legal/*`,
`/admin/*` (legacy), `/no-studio`, `/onboarding`, `/api/scim/*`, `/api/integrations/*`,
`/api/webhooks/*`, `/docs/integrations/nle-panel.md`, and `/.well-known/*` other than
this site's `security.txt`.

Two notes carried from the runbook: the two live screening links have no expiry, so the
forward is load-bearing for them until they are re-minted; and SCIM and the editor bridge
are machine contracts to be re-registered, not trusted to follow a redirect.
