/**
 * THE CLAIMS REGISTER (S-W §3). §3.1 is what may be claimed; §3.2 is what
 * must not. The build-time check (scripts/check-labels.ts) runs every
 * forbidden pattern over the RENDERED HTML of every page. A pattern may be
 * allowed on a named page where it appears only as a negation — the security
 * page says "no SOC 2" and must be able to.
 */
export type Forbidden = { pattern: RegExp; reason: string; allowedOn?: readonly string[] }

export const FORBIDDEN: readonly Forbidden[] = [
  { pattern: /approved automatically/i, reason: 'S-W §2.2 — the website says "advances automatically"' },
  { pattern: /auto-?approv/i, reason: 'S-W §2.2 — silence is never written as approval' },
  { pattern: /SOC\s?2/i, reason: '§3.2 — no certification is held', allowedOn: ['/security', '/roadmap', '/enterprise'] },
  { pattern: /ISO\s?27001/i, reason: '§3.2 — no certification is held', allowedOn: ['/security', '/roadmap', '/enterprise'] },
  { pattern: /\bTPN\b|Trusted Partner Network|Blue Shield|Gold Shield/i, reason: '§3.2 — no assessment is held', allowedOn: ['/security', '/roadmap', '/enterprise'] },
  { pattern: /indemni/i, reason: '§3.2 — Genreline does not train models and offers no indemnity', allowedOn: ['/ai'] },
  { pattern: /commercially[\s-]safe/i, reason: '§3.2 — depends on the model; Genreline routes, it does not train', allowedOn: ['/ai'] },
  { pattern: /SMS passcode|text-message passcode|passcode by SMS/i, reason: '§3.2 / S-F-A §11 — declared only' },
  { pattern: /contract reminders|reminders and expiry|reminder(s)? and expir/i, reason: '§3.2 / S-F-A §11 — declared only', allowedOn: ['/roadmap'] },
  { pattern: /stored encrypted|encrypted in your settings|keys live in/i, reason: '§3.2 — false today (AGT-02)' },
  { pattern: /forensic/i, reason: '§3.2 — session watermarking only', allowedOn: ['/security', '/roadmap', '/product/files', '/product/client'] },
  { pattern: /meeting transcripts?|transcribed meetings?/i, reason: '§3.2 — recording only', allowedOn: ['/roadmap', '/product/meetings'] },
  { pattern: /data residency|EU region|European region|multi-region|second region/i, reason: '§3.2 — one US region', allowedOn: ['/security', '/roadmap', '/enterprise'] },
  { pattern: /audit export/i, reason: '§3.2 — no export route', allowedOn: ['/security', '/roadmap', '/enterprise'] },
  { pattern: /\b99(\.\d+)?\s?%|\buptime\b|\bSLA\b|always[\s-]on\b/i, reason: 'S0 §4 — no SLA and no copy implying one' },
  { pattern: /trusted by|customers include|\d[\d,]* (studios|users|teams|productions) (use|trust|rely)/i, reason: '§3.2 — no customer claims without written permission' },
  { pattern: /\bcreators?\b|\binfluencers?\b|\bviral\b|audience growth/i, reason: '§2.4 — never creator language' },
  { pattern: /(?<!Movie )\bmagic(al)?\b|\beffortless(ly)?\b|\brevolutionary\b|\b10x\b|asset factory|content engine/i, reason: '§2.4 — vocabulary to avoid' },
  { pattern: /coming soon/i, reason: '§2.4 — "being built" or "on the roadmap", never "coming soon"' },
  // W-10 (no Suite names) was overruled by the owner on 2026-10-01: the Suite is the
  // headline argument and its parts are named. Hidden Crew features stay unnamed.
  { pattern: /Provider mesh|Control Tower/, reason: 'FA-11 — hidden features are not published' },
  // Owner, 2026-10-01, overriding §3.1's allowance below: "there's nothing like shoot days in AI
  // filmmaking … no physical shoot days or call sheets … everything must conform to the AI
  // production cycle". The app keeps the features (CRW-06, CRW-08); the site does not show them.
  { pattern: /\bshoot[\s-]days?\b|\bcall[\s-]sheets?\b|\bstripboards?\b|\bstrips\b/i, reason: 'Owner 2026-10-01 — the site shows the AI and hybrid production cycle only' },
  { pattern: /McPrime/i, reason: 'S0-B — never a tenant’s name on the product’s site' },
  { pattern: /ZZ-HARNESS|rls-harness|Harness (Owner|Crew|Finance|Contractor)/i, reason: 'W-8 — harness names belong in captures, never in copy' },
]

/** S-W §3.1, verbatim, for reference on the security and product pages. */
export const MAY_CLAIM = [
  'Studio isolation enforced in the database and proven by 76 automated security checks',
  'roles, project roles, staff and contractor seats, individual grants and denials, and a permission ledger',
  'two-factor sign-in, passkeys, single sign-on (SAML/OIDC) and SCIM provisioning',
  'a studio’s own security rules (required two-factor, session limits)',
  'rate limiting, per-request content security policy, bot protection, breached-password checks',
  'per-studio branding of the portal, screening links, signing pages, email and sealed PDFs',
  'rooms, threads, mentions, read receipts, voice notes, drafts, edit history',
  'meetings, synchronised review playback, recording, background blur and noise suppression',
  'calendar and booking',
  'the screening room with session watermarking',
  'frame-accurate review, annotation, version compare, marker export to Resolve, Final Cut and Premiere, the editor panel bridge',
  'the approval engine and certificate',
  'contract templates, field placement, consent before signature, cryptographic seal, certificate of completion, single-use signing links, releases that write rights',
  'invoices, credits, per-member budgets, per-call AI ceiling (for text AI)',
  'resumable large uploads, version stacking, the asset library',
  'directory, task engine, call sheets, breakdown to stripboard to shoot days',
  'notifications, web push, SMS',
  'retention and erasure',
  'light and dark themes',
] as const
