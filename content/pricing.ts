/**
 * PLAN STRUCTURE — copied from the app's lib/billing/plans.ts on 2026-10-01
 * (S-W §7.9). The house plan is the owner's own organization and is never
 * sold, so it is not here. PRICES ARE AN OWNER INPUT (S-W §13): every
 * `price` is null until the owner sets it, and the page shows "Talk to us".
 * Subscription billing is not built (S-F-A FND-07), so there is no buy
 * button; a studio can already be opened free at app.genreline.com/signup.
 *
 * Limits are the plan's declared terms. Storage is enforced today; seat and
 * client-company limits are declared and not yet enforced (FND-08) — they
 * are stated here as what the plan includes, never as a cap that refuses.
 */
export type Plan = {
  id: 'agency' | 'studio' | 'enterprise'
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
  /** The plan a studio starts on at sign-up (lib/provisionTenant.ts writes 'agency'). */
  startsHere?: boolean
}

export const PLANS: readonly Plan[] = [
  {
    id: 'agency', name: 'Agency', forWhom: 'A small team with a handful of clients',
    price: null, seats: 5, clientCompanies: 25, storageGb: 500, meetingMinutesPerMonth: 3000,
    whiteLabel: false, hidesAttribution: false, sso: false, startsHere: true,
  },
  {
    id: 'studio', name: 'Studio', forWhom: 'A studio with a bench and many clients',
    price: null, seats: 20, clientCompanies: null, storageGb: 2000, meetingMinutesPerMonth: 10000,
    whiteLabel: true, hidesAttribution: true, sso: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', forWhom: 'Identity integration, procurement, no ceilings',
    price: null, seats: null, clientCompanies: null, storageGb: null, meetingMinutesPerMonth: null,
    whiteLabel: true, hidesAttribution: true, sso: true,
  },
]

export const USAGE_CREDITS = {
  heading: 'Usage credits',
  body: 'AI, SMS and metered work are paid from a credit balance the studio tops up. Every call is priced before it runs, a per-call ceiling asks before anything expensive, and a per-person budget is visible to the person it governs. The balance stops at zero; it never goes negative.',
}
