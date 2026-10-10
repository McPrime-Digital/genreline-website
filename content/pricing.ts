/**
 * GENERATED — do not edit. `npx tsx scripts/ops/gen-website-pricing.ts` in the
 * app repository writes this file from the catalog (lib/billing/catalog.ts), the
 * plan table (lib/billing/plans.ts) and the trial's rules (lib/entitlements.ts);
 * `--check` refuses a stale copy. S-PR §15 B-13 (2026-10-10).
 *
 * EVERY PRICE IS PROVISIONAL UNTIL LAUNCH (S-PR, owner-approved 2026-10-09):
 * the amounts are the catalog's placeholders — what Stripe is installed with —
 * and the page says so. The plan ids are the app's (S-T ST-16); the house plan
 * is the owner's own organization and is never sold.
 */
export type SsoMode = 'none' | 'linked' | 'managed'
export type Plan = {
  id: 'indie' | 'pro' | 'business' | 'enterprise'
  name: string
  forWhom: string
  /** The staff-seat range; `max` null = no ceiling. The next seat beyond `max` moves the studio to the next plan. */
  seatRange: { min: number; max: number | null }
  /** Per staff seat a month; `annual` is the yearly price per seat (two months free). Null = by contract. */
  price: { amount: number; annual: number | null; currency: 'USD'; per: 'seat'; period: 'month'; provisional: true } | null
  collaboratorMonth: number | null
  clientCompanies: number | null
  extraCompany: number | null
  peoplePerCompany: number
  extraPerson: number | null
  storageGbPerSeat: number | null
  meetingMinutesPerSeat: number | null
  largestCall: number | null
  playableMinutesPerSeat: number | null
  watchedMinutesPerSeat: number | null
  whiteLabel: 'included' | 'addon'
  sso: SsoMode
  jobPostsIncluded: number
  /** The plan a studio starts on at sign-up; the setup questions may move it. */
  startsHere?: boolean
  /** The older shape, kept for scripts/export-claims.ts and the app's capability register. */
  seats: number | null
  storageGb: number | null
  meetingMinutesPerMonth: number | null
  hidesAttribution: boolean
}

export const PLANS: readonly Plan[] = [
  {
    "id": "indie",
    "name": "Indie",
    "forWhom": "One or two people — an independent, a founder, a pair",
    "seatRange": {
      "min": 1,
      "max": 2
    },
    "price": {
      "amount": 59,
      "annual": 590,
      "currency": "USD",
      "per": "seat",
      "period": "month",
      "provisional": true
    },
    "collaboratorMonth": 19,
    "clientCompanies": 3,
    "extraCompany": 25,
    "peoplePerCompany": 10,
    "extraPerson": 3,
    "storageGbPerSeat": 100,
    "meetingMinutesPerSeat": 200,
    "largestCall": 10,
    "playableMinutesPerSeat": 200,
    "watchedMinutesPerSeat": 1000,
    "whiteLabel": "addon",
    "sso": "none",
    "jobPostsIncluded": 0,
    "seats": 2,
    "storageGb": 100,
    "meetingMinutesPerMonth": 200,
    "hidesAttribution": false
  },
  {
    "id": "pro",
    "name": "Pro",
    "forWhom": "A studio of three to nineteen",
    "seatRange": {
      "min": 3,
      "max": 19
    },
    "price": {
      "amount": 89,
      "annual": 890,
      "currency": "USD",
      "per": "seat",
      "period": "month",
      "provisional": true
    },
    "collaboratorMonth": 29,
    "clientCompanies": 10,
    "extraCompany": 25,
    "peoplePerCompany": 10,
    "extraPerson": 3,
    "storageGbPerSeat": 200,
    "meetingMinutesPerSeat": 300,
    "largestCall": 25,
    "playableMinutesPerSeat": 300,
    "watchedMinutesPerSeat": 2000,
    "whiteLabel": "addon",
    "sso": "none",
    "jobPostsIncluded": 0,
    "seats": 19,
    "storageGb": 200,
    "meetingMinutesPerMonth": 300,
    "hidesAttribution": false,
    "startsHere": true
  },
  {
    "id": "business",
    "name": "Business",
    "forWhom": "Twenty to ninety-nine — your name on everything, linked sign-in",
    "seatRange": {
      "min": 20,
      "max": 99
    },
    "price": {
      "amount": 129,
      "annual": 1290,
      "currency": "USD",
      "per": "seat",
      "period": "month",
      "provisional": true
    },
    "collaboratorMonth": 39,
    "clientCompanies": 30,
    "extraCompany": 20,
    "peoplePerCompany": 10,
    "extraPerson": 3,
    "storageGbPerSeat": 300,
    "meetingMinutesPerSeat": 400,
    "largestCall": 50,
    "playableMinutesPerSeat": 500,
    "watchedMinutesPerSeat": 3000,
    "whiteLabel": "included",
    "sso": "linked",
    "jobPostsIncluded": 2,
    "seats": 99,
    "storageGb": 300,
    "meetingMinutesPerMonth": 400,
    "hidesAttribution": true
  },
  {
    "id": "enterprise",
    "name": "Enterprise",
    "forWhom": "A hundred and up — managed accounts, SCIM, by contract",
    "seatRange": {
      "min": 100,
      "max": null
    },
    "price": null,
    "collaboratorMonth": null,
    "clientCompanies": null,
    "extraCompany": null,
    "peoplePerCompany": 10,
    "extraPerson": null,
    "storageGbPerSeat": null,
    "meetingMinutesPerSeat": null,
    "largestCall": 100,
    "playableMinutesPerSeat": null,
    "watchedMinutesPerSeat": null,
    "whiteLabel": "included",
    "sso": "managed",
    "jobPostsIncluded": 0,
    "seats": null,
    "storageGb": null,
    "meetingMinutesPerMonth": null,
    "hidesAttribution": true
  }
] as const

/** Bought by the unit beyond the plan (S-PR §6). */
export const ADDONS = [
  {
    "id": "extra_company",
    "name": "Client company beyond the plan",
    "amount": 25,
    "unit": "a month each",
    "note": "$20 on Business"
  },
  {
    "id": "extra_person",
    "name": "Person at a company beyond 10",
    "amount": 3,
    "unit": "a month each",
    "note": ""
  },
  {
    "id": "storage_block",
    "name": "Active storage block",
    "amount": 15,
    "unit": "a month per 250 GB",
    "note": "beyond what your seats include"
  },
  {
    "id": "white_label",
    "name": "White-label",
    "amount": 299,
    "unit": "a month",
    "note": "on Indie and Pro; included from Business"
  }
] as const

/** Metered beyond the plan's pooled allowances, at a price beside its cost (S-PR §7.1). */
export const METERS = [
  {
    "id": "meetings",
    "name": "Meetings",
    "amount": 5,
    "unit": "per 1,000 participant-minutes beyond the plan",
    "plain": "One person in a call for one minute. A 30-minute call with four people is 120."
  },
  {
    "id": "recording",
    "name": "Recording",
    "amount": 0.04,
    "unit": "per recorded minute",
    "plain": "Every recorded minute; nothing is included."
  },
  {
    "id": "archive",
    "name": "Archive storage",
    "amount": 15,
    "unit": "per TB-month",
    "plain": "Files nobody has opened for ninety days move cold and come back the moment they are opened. You can turn it off."
  },
  {
    "id": "playable",
    "name": "Playable video",
    "amount": 10,
    "unit": "per 1,000 minutes kept playable a month",
    "plain": "Minutes of video kept ready to play in the browser, beyond the plan. A copy nobody plays for sixty days is retired and remade on the next play."
  },
  {
    "id": "watched",
    "name": "Watched video",
    "amount": 2,
    "unit": "per 1,000 minutes watched",
    "plain": "Minutes your reviewers, clients and guests actually watch, beyond the plan."
  }
] as const

/** AI is prepaid (S-PR §8). */
export const AI = {
  "minimumTopUp": 25,
  "plans": [
    {
      "id": "ai25",
      "name": "AI $25",
      "amount": 25
    },
    {
      "id": "ai100",
      "name": "AI $100",
      "amount": 100
    },
    {
      "id": "ai400",
      "name": "AI $400",
      "amount": 400
    }
  ],
  "markup": 1.25
} as const

export const JOB_POST = {"amount":99,"unit":"for 30 days","businessIncluded":2} as const

/** S-PR §5 — every unit, plainly, in the words the plan page uses. */
export const UNITS = [
  {
    "id": "seat",
    "name": "Staff seat",
    "plain": "One person who works for your studio and logs in. Owners count; people you have invited who have not joined, and people you have paused, do not. Every plan is priced per seat, and each plan takes a range of seats — the next seat beyond the range moves you to the next plan."
  },
  {
    "id": "collaborator",
    "name": "Collaborator-month",
    "plain": "A freelancer you bring in for a job. You pay for them only in a calendar month in which they are on at least one live job or task — a colourist on your project for two weeks in March and nothing in April is one collaborator-month, charged for March."
  },
  {
    "id": "company",
    "name": "Client company",
    "plain": "Each client, stakeholder or partner company you keep open counts as one. Your plan includes some; more cost a monthly fee each. Each company can have up to 10 of its own people log in to your portal; each extra person is a small monthly fee. When a client's work is done, close the company: you stop paying, its history stays, its people's logins stop. Guest links cost no seat."
  },
  {
    "id": "meetings",
    "name": "Meetings",
    "plain": "Participant-minutes: one person in a call for one minute. Every plan includes some per seat, pooled across the studio; beyond that they are metered. The largest call is the plan's; a room with one person in it ends after ten minutes."
  },
  {
    "id": "storage",
    "name": "Storage",
    "plain": "Active storage is included per seat and pooled; beyond it you buy 250 GB blocks. Files nobody has opened for ninety days move to the archive at a lower price and come back the moment they are opened. Everything you delete waits thirty days in the bin."
  },
  {
    "id": "video",
    "name": "Playable and watched video",
    "plain": "Video is two meters, because that is how it costs us: minutes kept playable in the browser (a copy nobody plays for sixty days is retired, and remade on the next play) and minutes actually watched — by your reviewers, your clients and your guest links."
  },
  {
    "id": "ai",
    "name": "AI",
    "plain": "Prepaid, shown in dollars and cents, never free. Each action's price is the provider's price times 1.25, rounded up to the cent, and shown before it runs; a failed or refused generation is not charged. The minimum top-up is $25; the AI plans refill monthly with no bonus."
  }
] as const

/** S-PR §9 — the trial and Explore, as the product does them. */
export const TRIAL_AND_EXPLORE = {
  "heading": "Start on Business, free, for 14 days",
  "body": "Every new studio gets 14 days on the Business plan from the day its address is verified, with no card. The only caps are on what leaves the studio — 2 client companies, 10 portal people, 5 invitations, 3 contracts, 10 guest links, 50 GB and 200 meeting minutes in total — never on what you make inside. AI is prepaid: add a balance to use it.",
  "card": "Add a card (optional) and the caps rise — 5 companies, 25 portal people, 10 invitations, 5 contracts, 25 guest links, 100 GB, 500 meeting minutes — and the plan you choose starts when the trial ends, for the seats you have. Nothing is charged during the trial; we remind you on day 10 and day 13 with the price and the date, and you can cancel in one click.",
  "explore": "When the trial ends without a plan, the studio moves to Explore: free, permanent, nothing deleted. Everything you made stays readable and editable; uploads within 1 GB; the portal users you invited keep read-only access. Invitations, approval requests, contracts, guest links, invoices, meetings and AI wait for a plan. Being a collaborator in other studios is never affected.",
  "domain": "One trial per company email domain, and one per person; a second studio opens on Explore."
} as const

/** Kept for scripts/export-claims.ts: the one-paragraph statement about prepaid usage. */
export const USAGE_CREDITS = {
  heading: 'AI, prepaid',
  body: "Prepaid, shown in dollars and cents, never free. Each action's price is the provider's price times 1.25, rounded up to the cent, and shown before it runs; a failed or refused generation is not charged. The minimum top-up is $25; the AI plans refill monthly with no bonus.",
} as const

export const PRICING_SOURCE = { repository: 'McPrime-Digital/McPrime_ClientsPortal', from: 'lib/billing/catalog.ts · lib/billing/plans.ts · lib/entitlements.ts', provisional: true } as const
