/**
 * THE MEDIA MANIFEST. Every picture on the site is a named slot here.
 *
 * `capture` slots are real product screens, taken from the harness tenant by
 * scripts/capture.ts at device pixel ratio 2 in BOTH themes (S-W W-8, §8) —
 * light at public/captures/<id>.light.webp, dark at <id>.dark.webp.
 * `upload` slots are footage or photography only the owner can supply. A slot
 * whose file is missing renders a labelled placeholder that says exactly what
 * to upload and at what size — never a stock image, never an invented screen.
 */
export type CaptureSlot = {
  kind: 'capture'
  id: string
  /** The app route the capture is taken from, and who is signed in. */
  route: string
  persona: 'owner' | 'c1own'
  /** CSS pixel size of the viewport the capture was framed at. */
  width: number
  height: number
  alt: string
  /** For portal captures: the brand colour set on the harness tenant for the shot. */
  brand?: string
}
export type UploadSlot = {
  kind: 'upload'
  id: string
  /** What the owner should upload, in their words. */
  brief: string
  width: number
  height: number
  format: 'webp' | 'mp4'
  alt: string
}
export type MediaSlot = CaptureSlot | UploadSlot

const W = 1440, H = 900

const capture = (id: string, route: string, alt: string, persona: 'owner' | 'c1own' = 'owner', extra: Partial<CaptureSlot> = {}): CaptureSlot =>
  ({ kind: 'capture', id, route, persona, width: W, height: H, alt, ...extra })

export const MEDIA: readonly MediaSlot[] = [
  // ── Home
  capture('home-hero-room', '/studio/client/messages', 'The studio’s client message hub: a company room with a message that is also an approval request, the room list on the left and the thread on the right.'),
  capture('home-portal-brand-a', '/projects', 'The client portal’s projects in one studio’s brand: the studio’s name and accent colour on the sidebar, each production with its progress.', 'c1own', { brand: '#1F6F5B' }),
  capture('home-portal-brand-b', '/projects', 'The same portal screen in a second studio’s brand: a different accent colour, the same screen.', 'c1own', { brand: '#8B2A3C' }),
  // ── Crew
  capture('crew-directory', '/studio/crew/directory', 'The crew directory: people with department, role, seat class and availability.'),
  capture('crew-tasks', '/studio/crew/tasks', 'The task board: columns of tasks with assignees, labels and due dates.'),
  capture('crew-chat', '/studio/crew/chat', 'The crew chat hub: internal channels and direct messages, with a thread open.'),
  capture('crew-production', '/studio/crew/production', 'Production: scenes and elements broken down from the screenplay.'),
  capture('crew-calendar', '/studio/crew/calendar', 'The crew calendar: review deadlines and invoice dates projected onto one month.'),
  capture('crew-security', '/studio/crew/settings/security', 'The studio’s security settings: two-factor, passkeys and the studio’s own rules.'),
  capture('crew-sso', '/studio/crew/settings/sso', 'Single sign-on settings: a domain to prove, a provider to connect, enforcement and SCIM.'),
  capture('crew-integrations', '/studio/crew/settings/integrations', 'Integrations: editor panel tokens, minted once and shown once.'),
  // ── Client space (studio side)
  capture('client-overview', '/studio/client/overview', 'The client-space overview: companies, productions and what needs the studio today.'),
  capture('client-companies', '/studio/client/companies', 'Client companies, each with its projects, team and status.'),
  capture('client-projects', '/studio/client/projects', 'Productions across every client company.'),
  capture('client-review', '/studio/client/review', 'Review and approvals: every approval with its stage, its deadline and how the record would hold up.'),
  capture('client-review-record', '/studio/client/review/0f0f0f0f-000a-4000-8000-000000000004', 'One approval record: the chain of stages, who saw what, what they said, and the certificate.'),
  capture('client-files', '/studio/client/files', 'The vault: files by folder with versions, sizes and who uploaded them.'),
  capture('client-invoices', '/studio/client/invoices', 'Invoices: numbered, dated, with status and payment method.'),
  capture('client-contracts', '/studio/client/contracts', 'Contracts: templates, drafts, sent and signed, with the sealed PDF.'),
  capture('client-meetings', '/studio/client/meetings', 'Meetings addressed to a client company, scheduled and recorded.'),
  capture('client-brand-kit', '/studio/client/brand-kit', 'The brand kit: one colour chosen, both themes derived, the preview of what the client sees.'),
  capture('client-guest-links', '/studio/client/guest-links', 'Screening links: each with how far the guest watched, as a bar.'),
  capture('client-messages', '/studio/client/messages', 'The client message hub: company rooms with presence and previews.'),
  // ── Portal (client side)
  capture('portal-dashboard', '/dashboard', 'The client portal dashboard, in the studio’s brand.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-calendar', '/dashboard/calendar', 'The client’s calendar: what’s coming, ordered by whose move it is, with the sentence that says what happens if nobody responds.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-approvals', '/approvals', 'The client’s approvals: pending items with their review windows.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-review', '/approvals/0f0f0f0f-000a-4000-8000-000000000005/review', 'A review in the portal: the player, timecoded notes down the side, a note being written on a frame.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-certificate', '/approvals/0f0f0f0f-000a-4000-8000-000000000004/certificate', 'The printable certificate for a completed approval: every stage, every decision, every viewing, in order.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-files', '/files', 'The client’s vault: their files, by production.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-messages', '/messages', 'The client’s messages: the room with the studio, project-tagged.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-invoices', '/invoices', 'The client’s invoices with status and how to pay.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-contracts', '/dashboard/contracts', 'The client’s contracts: what is waiting for a signature and what is sealed.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-meetings', '/dashboard/meetings', 'The client’s meetings, with a slot picker to book one.', 'c1own', { brand: '#1F6F5B' }),
  capture('portal-team', '/team', 'The client’s own team: roles, scoping and invites.', 'c1own', { brand: '#1F6F5B' }),
  // ── Suite
  capture('suite-library', '/studio/suite/library', 'The asset library: every asset across the studio with facets and a per-production footprint.'),
  // ── Owner uploads
  { kind: 'upload', id: 'hero-reel', brief: 'The hero reel — 10 to 20 seconds of your strongest footage or a product walk-through, muted, looping, 1920×1080, H.264, under 6 MB. Also add hero-reel.poster.webp (the first frame).', width: 1920, height: 1080, format: 'mp4', alt: 'The Genreline reel.' },
  { kind: 'upload', id: 'solutions-production-companies', brief: 'A production still you own the rights to — a set, a crew at work. No faces without a release.', width: 1600, height: 1000, format: 'webp', alt: 'A film crew at work on set.' },
  { kind: 'upload', id: 'solutions-agencies', brief: 'An agency edit suite or review room you own the rights to.', width: 1600, height: 1000, format: 'webp', alt: 'A review room in a creative agency.' },
  { kind: 'upload', id: 'solutions-in-house', brief: 'An in-house studio floor you own the rights to.', width: 1600, height: 1000, format: 'webp', alt: 'An in-house production team at work.' },
  { kind: 'upload', id: 'network-theater', brief: 'A still from a film you hold the rights to show, or a theater interior.', width: 1600, height: 1000, format: 'webp', alt: 'A darkened theater with a film on screen.' },
  { kind: 'upload', id: 'network-community', brief: 'Filmmakers together — a festival floor, a Q&A — with releases.', width: 1600, height: 1000, format: 'webp', alt: 'Filmmakers talking after a screening.' },
  { kind: 'upload', id: 'about-founder', brief: 'A photograph of the founder, 3:4.', width: 900, height: 1200, format: 'webp', alt: 'The founder of Genreline.' },
]

export function slot(id: string): MediaSlot {
  const s = MEDIA.find((m) => m.id === id)
  if (!s) throw new Error(`Unknown media slot: ${id}`)
  return s
}
