/**
 * PLAN STRUCTURE — mirrors the app's lib/billing/plans.ts (S-W §7.9), last
 * aligned 2026-10-03 when the plans were renamed (S-T ST-16, owner-approved):
 * Indie · Pro · Business · Enterprise. "Agency" and "Studio" collided with
 * words that mean something else everywhere in the product. The house plan is
 * the owner's own organization and is never sold, so it is not here. PRICES
 * ARE AN OWNER INPUT (S-W §13): every `price` is null until the owner sets it,
 * and the page shows "Talk to us". Subscription billing is not built (S-F-A
 * FND-07), so there is no buy button; a studio can already be opened free at
 * app.genreline.com/signup.
 *
 * Limits are the plan's declared terms (S-T §11.4's placeholders). Storage is
 * enforced today; seat and client-company limits are declared and not yet
 * enforced (FND-08) — they are stated here as what the plan includes, never as
 * a cap that refuses. `seats: null` on Pro and Business means per-seat
 * pricing with no ceiling, not "unlimited for one price".
 */
export type Plan = {
  id: 'indie' | 'pro' | 'business' | 'enterprise'
  name: string
  forWhom: string
  price: { amount: number; currency: 'USD'; per: 'seat' | 'studio'; period: 'month' } | null
  seats: number | null
  clientCompanies: number | null
  storageGb: number | null
  meetingMinutesPerMonth: number | null
  whiteLabel: boolean
  hidesAttribution: boolean
  sso: boolean
  /** The plan a studio starts on at sign-up (lib/provisionTenant.ts writes 'pro'); the setup questions may move it. */
  startsHere?: boolean
}

export const PLANS: readonly Plan[] = [
  {
    id: 'indie', name: 'Indie', forWhom: 'One to three people and a handful of counterparties',
    price: null, seats: 3, clientCompanies: 5, storageGb: 250, meetingMinutesPerMonth: 3000,
    whiteLabel: false, hidesAttribution: false, sso: false,
  },
  {
    id: 'pro', name: 'Pro', forWhom: 'A studio of three to twenty-five, priced per seat',
    price: null, seats: null, clientCompanies: 25, storageGb: 1000, meetingMinutesPerMonth: 10000,
    whiteLabel: false, hidesAttribution: false, sso: false, startsHere: true,
  },
  {
    id: 'business', name: 'Business', forWhom: 'Ten to two hundred, many counterparties, your name on everything',
    price: null, seats: null, clientCompanies: null, storageGb: 2000, meetingMinutesPerMonth: null,
    whiteLabel: true, hidesAttribution: true, sso: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', forWhom: 'Identity integration, procurement, security review, no ceilings',
    price: null, seats: null, clientCompanies: null, storageGb: null, meetingMinutesPerMonth: null,
    whiteLabel: true, hidesAttribution: true, sso: true,
  },
]

export const USAGE_CREDITS = {
  heading: 'Usage credits',
  body: 'AI, SMS and metered work are paid from a credit balance the studio tops up. Every call is priced before it runs, a per-call ceiling asks before anything expensive, and a per-person budget is visible to the person it governs. The balance stops at zero; it never goes negative.',
}
