/**
 * THE SITE MAP (S-W §4). One row per page: its address, title, description,
 * and the SECTION the label check applies (crew / client / portal pages may
 * render only Available; coming may appear only in suite / network / roadmap).
 * Feeds the sitemap, the search palette, the link check and the label check.
 */
export type Section = 'home' | 'crew' | 'client' | 'portal' | 'suite' | 'capability' | 'solutions' | 'platform' | 'network' | 'roadmap' | 'company'

export type SitePage = { path: string; title: string; description: string; section: Section; search?: string }

export const PAGES: readonly SitePage[] = [
  { path: '/', title: 'AI & Hybrid Film Production Infrastructure', description: 'Genreline is the operating system for AI and hybrid film production — the Crew space, the Client space and portal, and the Suite where the work is written, boarded, generated, edited and finished.', section: 'home', search: 'home overview' },
  { path: '/product', title: 'Product', description: 'Three spaces — Crew, Client, the Suite — and the platform beneath them.', section: 'capability' },
  { path: '/product/crew', title: 'The Crew space', description: 'Running the team and the production: directory, tasks, internal rooms, script breakdown and permissions.', section: 'crew' },
  { path: '/product/client', title: 'The Client space and portal', description: 'Client work in your studio’s brand: companies, projects, the message hub, invoices, the vault, review and approval, contracts, meetings, the screening room.', section: 'client' },
  { path: '/product/suite', title: 'The Suite', description: 'Writing, boards and the library today; image and video generation, being built.', section: 'suite' },
  { path: '/product/review', title: 'Review and approval', description: 'Approval as a record, not a status: stages, review windows, automatic advance on silence, the certificate, frame-accurate review, annotation, markers.', section: 'capability' },
  { path: '/product/contracts', title: 'Contracts and signing', description: 'Templates, field placement, consent before signature, a cryptographic seal, single-use signing links, and releases that write the rights they prove.', section: 'capability' },
  { path: '/product/production', title: 'Production', description: 'The AI and hybrid production cycle — script, breakdown, boards, generation, continuity, assembly, review, rights and delivery.', section: 'capability' },
  { path: '/product/meetings', title: 'Meetings and scheduling', description: 'Meetings, synchronised review playback, recording, a calendar on both sides, and booking where the meeting is the booking.', section: 'capability' },
  { path: '/product/money', title: 'Money', description: 'Invoices, credits, per-member budgets and a ceiling on every AI call.', section: 'capability' },
  { path: '/product/files', title: 'Files and screening', description: 'The vault, resumable large uploads, version stacking, and a screening room that records what a guest actually watched.', section: 'capability' },
  { path: '/solutions/production-companies', title: 'For production companies', description: 'The whole production — crew, clients, cuts, approvals, contracts and money — with a record that holds after the wrap.', section: 'solutions' },
  { path: '/solutions/agencies', title: 'For creative agencies', description: 'Client-heavy work in your own brand: the portal, the screening links, the signing pages and the email all wear the agency’s name.', section: 'solutions' },
  { path: '/solutions/in-house', title: 'For in-house teams', description: 'The studio inside your company: the Crew space, the Suite, and a Stakeholders space — a portal per department, with no invoices.', section: 'solutions' },
  { path: '/solutions/independents', title: 'For independents', description: 'Your own studio for your own work, and a seat in every studio that brings you in — one account, switching between them.', section: 'solutions' },
  { path: '/enterprise', title: 'Enterprise', description: 'Single sign-on and SCIM, required two-factor and session limits, multi-organization membership, database-enforced isolation, the permission ledger, retention and erasure.', section: 'platform' },
  { path: '/security', title: 'Security', description: 'Every control that exists, stated precisely — and what has not been done yet.', section: 'platform' },
  { path: '/security/disclosure', title: 'Responsible disclosure', description: 'How to report a vulnerability in Genreline.', section: 'platform' },
  { path: '/ai', title: 'AI and provenance', description: 'How generation will work: one gate, many models, a budget per person, a ceiling per call, provenance and rights per asset — and what Genreline does not claim.', section: 'suite' },
  { path: '/network', title: 'The filmmaker network', description: 'Theater, Community, streaming and a marketplace — for filmmakers, studios and working actors. Being built; early access is open.', section: 'network' },
  { path: '/pricing', title: 'Pricing', description: 'Per staff seat, in four ranges; freelancers by the month; everything metered beside its cost. Provisional until launch.', section: 'company' },
  { path: '/roadmap', title: 'Roadmap', description: 'Everything being built, with its honest status. Nothing is hidden.', section: 'roadmap' },
  { path: '/changelog', title: 'Changelog', description: 'What shipped, dated.', section: 'company' },
  { path: '/about', title: 'About', description: 'Who is building Genreline and why.', section: 'company' },
  { path: '/contact', title: 'Contact', description: 'Sales, support, press.', section: 'company' },
]

export function page(path: string): SitePage {
  const p = PAGES.find((x) => x.path === path)
  if (!p) throw new Error(`Unknown page: ${path}`)
  return p
}
