/**
 * THE LABEL SOURCE (S-W W-5 / §9.2). One entry per S-F-A rev 2 ID. A page
 * renders `<FeatureLabel id="…" />` and gets Available, Coming or nothing
 * FROM THIS FILE — nobody types a label by hand. The build-time check
 * (scripts/check-labels.ts) reads the same file.
 *
 * Transcribed from docs/specs/S-F-A-feature-inventory-and-v1.md (revision 2,
 * 2026-09-30, read against the app at 3af3f85) on 2026-10-01, and re-checked
 * at Item 0 against the commits since (none touch feature code). When S-F-A
 * changes, this file is re-transcribed; it is never edited from memory.
 *
 * SUITE TITLES ARE DESCRIBED BY FUNCTION, NEVER BY WORKING TITLE (S-W W-10,
 * S-F-A FA-12): the owner's renaming pass has not landed, so a working title
 * on a public page would be a published name the rename breaks.
 */

export type Space =
  | 'platform' | 'identity' | 'messaging' | 'client' | 'review' | 'meetings'
  | 'documents' | 'money' | 'files' | 'crew' | 'notes' | 'notifications'
  | 'experience' | 'suite' | 'generation' | 'sound' | 'post' | 'sets' | 'network' | 'enterprise'

/** S-F-A §3.3 — what genreline.com may say. */
export type SiteLabel =
  | 'available'     // shown as a working feature
  | 'coming'        // shown as being built — Suite and network only (FA-11)
  | 'hidden'        // Crew/Client/portal feature not shown until built (FA-11)
  | 'security'      // stated on the security page
  | 'enterprise'    // stated on the enterprise page
  | 'internal'      // real, not a marketing claim
  | 'do-not-claim'  // must not appear anywhere public until implemented (FA-13)
  | 'none'          // removed, excluded or undecided

export type Timing = 'live' | 'launch' | 'next' | 'v1.5' | 'v2' | 'v3+' | 'none'
export type Status = 'built' | 'partial' | 'not-built' | 'declared' | 'removed' | 'excluded' | 'undecided'

export type Feature = {
  id: string
  /** Public wording. For the Suite: what it does, never what it is called. */
  title: string
  space: Space
  status: Status
  timing: Timing
  label: SiteLabel
  /** The part of a Partial row that is NOT built and belongs on the roadmap. */
  remainder?: string
  /** A caveat the page must carry beside the label (e.g. "recording only"). */
  caveat?: string
}

export const SPACE_NAMES: Record<Space, string> = {
  platform: 'Platform',
  identity: 'Identity and permissions',
  messaging: 'Messaging',
  client: 'Client space and portal',
  review: 'Review and approval',
  meetings: 'Meetings, calendar and scheduling',
  documents: 'Contracts and signing',
  money: 'Money',
  files: 'Files',
  crew: 'Crew space',
  notes: 'Notes and memory',
  notifications: 'Notifications and presence',
  experience: 'Product experience',
  suite: 'The Suite — writing and pre-production',
  generation: 'The Suite — generation',
  sound: 'The Suite — sound',
  post: 'The Suite — post-production',
  sets: 'The Suite — virtual sets and agents',
  network: 'The filmmaker network',
  enterprise: 'Enterprise readiness',
}

const F = (f: Feature) => f

export const FEATURES: readonly Feature[] = [
  // ── 4.1 Foundation and platform
  F({ id: 'FND-01', title: 'Studio isolation — the database is the tenancy boundary, proven by 76 automated checks', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-02', title: 'Access-token hook — organization claim, security claims, multi-organization selection', space: 'platform', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'FND-03', title: 'Internal-only configuration — an internal studio never sees a client-space surface', space: 'enterprise', status: 'partial', timing: 'launch', label: 'enterprise', remainder: 'Enforce the internal-only configuration' }),
  F({ id: 'FND-04', title: 'One US region, stated plainly', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-05', title: 'Tenant provisioning shared by script and sign-up', space: 'platform', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'FND-06', title: 'Self-serve studio sign-up, per-studio verification, first-run checklist', space: 'platform', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FND-07', title: 'Subscription billing — a studio pays Genreline', space: 'platform', status: 'partial', timing: 'launch', label: 'hidden', remainder: 'Subscription billing for studios' }),
  F({ id: 'FND-08', title: 'Plan limits enforced — seats, client companies, storage', space: 'platform', status: 'partial', timing: 'launch', label: 'hidden', remainder: 'Seat and client-company limits enforced (storage already is)' }),
  F({ id: 'FND-09', title: 'Tenant branding — the portal wears the studio’s name and logo', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FND-10', title: 'Sender identity per studio — a studio’s clients never receive mail branded Genreline', space: 'platform', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FND-11', title: 'A studio’s own sending domain', space: 'platform', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'FND-12', title: 'Person erasure with a stable pseudonym', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-13', title: 'Retention — soft delete, a grace-window purge, seven-year ledger retention', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-14', title: 'Activity ledger — every consequential action recorded', space: 'platform', status: 'partial', timing: 'launch', label: 'hidden', remainder: 'Ledger events for file deletion, contracts and screening links' }),
  F({ id: 'FND-15', title: 'Job queue with fair share across studios', space: 'platform', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'FND-16', title: 'Error sink', space: 'platform', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'FND-17', title: 'Usage metering for image, video and audio', space: 'platform', status: 'partial', timing: 'next', label: 'internal' }),
  F({ id: 'FND-18', title: 'Rate limiting in the database — fail-closed on sessionless routes', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-19', title: 'Per-request content security policy and security headers', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-20', title: 'Storage quota enforced at three points; unverified studios capped', space: 'platform', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FND-21', title: 'Tenant stamping by trigger — a cross-tenant write is refused', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-22', title: 'Bot protection — Turnstile, a disposable-address list, breached-password checks', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FND-23', title: 'Live activity feed across eighteen tables', space: 'platform', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.2 Identity, roles and permissions
  F({ id: 'IDN-01', title: 'Company roles — owner, admin, producer, coordinator, finance, crew', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-02', title: 'Project roles with capability baselines', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-03', title: 'Seat class — staff and contractor; a contractor sees nothing until assigned', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-04', title: 'Individual grants, denials and expiry; a denial beats a grant', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-05', title: 'Delegation limits enforced as database triggers', space: 'identity', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'IDN-06', title: 'Permission ledger', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-07', title: 'Project scope stated at invite', space: 'identity', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'IDN-08', title: 'Assigning people to productions with a role and an expiry', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-09', title: 'Client portal roles with scoping and a history cutoff', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-10', title: 'Client capability ceiling', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-11', title: 'Dashboards composed from the capability set', space: 'identity', status: 'not-built', timing: 'v1.5', label: 'internal' }),
  F({ id: 'IDN-12', title: 'Surfaces reshape on a permission change', space: 'identity', status: 'partial', timing: 'live', label: 'available' }),
  F({ id: 'IDN-13', title: 'Invite lifecycle on both sides — sent, opened, expires, resend, withdraw', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'IDN-14', title: 'Single sign-on — SAML and OIDC, domain proof, enforcement, just-in-time provisioning', space: 'enterprise', status: 'built', timing: 'live', label: 'enterprise' }),
  F({ id: 'IDN-15', title: 'Two-factor sign-in, recovery codes, step-up for sensitive actions', space: 'identity', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'IDN-16', title: 'Passkeys', space: 'identity', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'IDN-17', title: 'A studio’s own security rules — two-factor required, session limits', space: 'enterprise', status: 'built', timing: 'live', label: 'enterprise' }),
  F({ id: 'IDN-18', title: 'SCIM 2.0 provisioning', space: 'enterprise', status: 'built', timing: 'live', label: 'enterprise' }),
  F({ id: 'IDN-19', title: 'Membership in several organizations, with switching', space: 'identity', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.3 Messaging
  F({ id: 'MSG-01', title: 'Company rooms, project tags and a General thread — the client portal is the other side of the room', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-02', title: 'Crew rooms — internal chat', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-03', title: 'Threads', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-04', title: 'Per-person read state and receipts', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-05', title: 'Keyset pagination', space: 'messaging', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'MSG-06', title: 'Search inside a room', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-07', title: 'Search across every room a person can see', space: 'messaging', status: 'not-built', timing: 'launch', label: 'hidden' }),
  F({ id: 'MSG-08', title: 'Mentions of people', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-09', title: 'Mentions of projects, files, tasks and approvals, rendered as tokens', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-10', title: 'Reactions, edit, soft delete', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-11', title: 'Pins and saved messages', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-12', title: 'Attachments and voice notes', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-13', title: 'Presence, typing and recording indicators', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-14', title: 'Per-room notification level and focus mode', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-15', title: 'Drafts kept per person, per room, per thread', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-16', title: 'Forward and bulk select', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-17', title: 'Wallpapers, emoji and stickers', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-18', title: 'Project-tagged messages highlighted in the main hub', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-19', title: 'A message as an approval gate', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-20', title: 'An outside collaborator seated in a room, and in its meetings', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-21', title: 'Call buttons in every room header', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-22', title: 'Meeting-intent detection in conversation', space: 'messaging', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'MSG-23', title: 'Thread summaries and translation', space: 'messaging', status: 'partial', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'MSG-24', title: 'Canvases', space: 'messaging', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'MSG-25', title: 'Cross-room answers with citations', space: 'messaging', status: 'not-built', timing: 'v2', label: 'hidden' }),
  F({ id: 'MSG-26', title: 'Voice-note transcription with provenance', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MSG-27', title: 'Message edit history, append-only', space: 'messaging', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.4 Client space and portal
  F({ id: 'CLI-01', title: 'Overview, on both sides', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CLI-02', title: 'Companies', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CLI-03', title: 'Projects', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CLI-04', title: 'Client teams and invites', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CLI-05', title: 'White-label brand kit — one colour in, an accessible light-and-dark palette out, reaching the portal, screening, signing, email and the sealed PDF', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CLI-06', title: 'Per-client brand kits', space: 'client', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'CLI-07', title: 'A custom portal domain per studio', space: 'client', status: 'not-built', timing: 'v2', label: 'hidden' }),
  F({ id: 'CLI-08', title: 'The screening room — guest links for people without accounts', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CLI-09', title: 'Session watermarking on screening links', space: 'client', status: 'partial', timing: 'live', label: 'available', caveat: 'session watermarking only', remainder: 'Forensic watermarking' }),
  F({ id: 'CLI-10', title: 'Release on payment', space: 'client', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'CLI-11', title: 'Clearance panel — disclosure obligations for synthetic performers, read to the client who bears them', space: 'client', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.5 Review and approval
  F({ id: 'APR-01', title: 'Approval engine — stages, review windows, automatic advance on silence, the reminder ladder', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-02', title: 'Printable certificate', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-03', title: 'One record, three surfaces', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-04', title: 'Blocked on a permission change — reported, never lapsed', space: 'review', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'APR-05', title: 'Internal approvals', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-06', title: 'Outside stakeholders and shareholders as approvers', space: 'review', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'APR-07', title: 'Sequential and parallel stages that behave differently', space: 'review', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'APR-08', title: 'File version stacking', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-09', title: 'A document approval frozen at the moment it is sent', space: 'review', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'APR-10', title: 'A script shown inside its approval', space: 'review', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'APR-11', title: 'Comments anchored to a timecode', space: 'review', status: 'partial', timing: 'launch', label: 'available', caveat: 'timecode anchors', remainder: 'Comments anchored to a script block, a panel or a region' }),
  F({ id: 'APR-12', title: 'Side-by-side and overlay version compare', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-13', title: 'Drawing and annotation on a frame, kept after the call', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-14', title: 'Frame-accurate review with markers', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-15', title: 'Review session — synchronised playback together', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-16', title: 'Marker export and import — Resolve, Final Cut, Premiere, CSV', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-17', title: 'Editor panel bridge — a published integration contract', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-18', title: 'Guest review notes as evidence; resolve and tag as ledger events', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-19', title: 'Colour-space declaration and a display warning', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'APR-20', title: 'Watch evidence joined to the approval', space: 'review', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.6 Meetings, calendar and scheduling
  F({ id: 'MTG-01', title: 'Audio and video meetings', space: 'meetings', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MTG-02', title: 'Calendar on both sides — deadlines, invoice dates and shoot days by projection', space: 'meetings', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MTG-03', title: 'A real Today view', space: 'meetings', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'MTG-04', title: 'Booking — availability rules, overrides, time-zone safe; the meeting is the booking', space: 'meetings', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MTG-05', title: 'Schedule a meeting from inside the message hub', space: 'meetings', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'MTG-06', title: 'External calendar sync', space: 'meetings', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'MTG-07', title: 'Round-robin and collective booking', space: 'meetings', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'MTG-08', title: 'Meeting recording', space: 'meetings', status: 'partial', timing: 'live', label: 'available', caveat: 'recording only', remainder: 'Meeting transcripts' }),
  F({ id: 'MTG-09', title: 'A meeting summary posted to the room', space: 'meetings', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'MTG-10', title: 'Background blur and noise suppression', space: 'meetings', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.7 Documents and signing
  F({ id: 'DOC-01', title: 'Templates with merge fields that report what they could not fill', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'DOC-02', title: 'Field placement on the PDF — all five field kinds', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'DOC-03', title: 'A vault PDF as the contract source', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'DOC-04', title: 'Signing flow — consent before signature, a typed signature', space: 'documents', status: 'partial', timing: 'live', label: 'available', caveat: 'consent and typed signature' }),
  F({ id: 'DOC-05', title: 'Cryptographic seal (PAdES) that says “unsealed” rather than downgrading silently', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'DOC-06', title: 'Certificate of completion, sealed inside the PDF', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'DOC-07', title: 'Signing order, decline and void', space: 'documents', status: 'partial', timing: 'launch', label: 'available', caveat: 'order, decline and void', remainder: 'Contract reminders and expiry' }),
  F({ id: 'DOC-08', title: 'Start-work paperwork — deal memos, NDAs and releases per crew member', space: 'documents', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'DOC-09', title: 'Single-use signing links for signers without accounts', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'DOC-10', title: 'Releases — talent, AI likeness, location, music — that write the rights they prove', space: 'documents', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.8 Money
  F({ id: 'MON-01', title: 'Client invoices', space: 'money', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MON-02', title: 'Invoice payment through Stripe', space: 'money', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MON-03', title: 'Organization credits and top-ups', space: 'money', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MON-04', title: 'A hard stop at zero balance', space: 'money', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MON-05', title: 'A per-call ceiling on AI spend, with confirmation above it', space: 'money', status: 'built', timing: 'live', label: 'available', caveat: 'for text AI' }),
  F({ id: 'MON-06', title: 'Per-member and per-seat-class budgets, each visible to its holder', space: 'money', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'MON-07', title: 'Spend, burn, margin and limits in one view', space: 'money', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'MON-08', title: 'Escrow payments through a licensed partner', space: 'money', status: 'not-built', timing: 'v2', label: 'hidden' }),
  F({ id: 'MON-09', title: 'Timecards with overtime', space: 'money', status: 'not-built', timing: 'v2', label: 'hidden' }),
  // ── 4.9 Files
  F({ id: 'FIL-01', title: 'The vault, on both sides', space: 'files', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FIL-02', title: 'Direct-to-storage uploads', space: 'files', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'FIL-03', title: 'Resumable large uploads — pausable, resumable, verified on the server', space: 'files', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FIL-04', title: 'Keyset pagination on files', space: 'files', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'FIL-05', title: 'Transcode, probe and renditions', space: 'files', status: 'partial', timing: 'launch', label: 'internal' }),
  F({ id: 'FIL-06', title: 'Orphaned object cleanup', space: 'files', status: 'built', timing: 'live', label: 'security' }),
  F({ id: 'FIL-07', title: 'A studio-wide asset library with facets and a per-production footprint', space: 'suite', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'FIL-08', title: 'Large file transfer', space: 'files', status: 'undecided', timing: 'none', label: 'none' }),
  F({ id: 'FIL-09', title: 'Universal link downloader', space: 'files', status: 'undecided', timing: 'none', label: 'none' }),
  // ── 4.10 Crew space
  F({ id: 'CRW-01', title: 'Directory', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-02', title: 'Directory as a production database — department, skills, day rate, union, equipment, availability, location', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-04', title: 'Task engine — assignees on both rosters, comments, labels, subtasks, relations, watchers, search', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-05', title: 'Internal approvals', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-06', title: 'Call sheets — sealed, numbered, sent in the studio’s voice', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-07', title: 'Screenplay to scenes to breakdown to strips to shoot days', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-08', title: 'Shoot days on the calendar', space: 'crew', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'CRW-09', title: 'CRM, pipeline and lead generation', space: 'crew', status: 'removed', timing: 'none', label: 'none' }),
  F({ id: 'CRW-10', title: 'Location library', space: 'crew', status: 'not-built', timing: 'v2', label: 'hidden' }),
  F({ id: 'CRW-11', title: 'Payroll', space: 'crew', status: 'excluded', timing: 'none', label: 'none' }),
  F({ id: 'CRW-12', title: 'Insurance, tax filing, union reporting', space: 'crew', status: 'excluded', timing: 'none', label: 'none' }),
  // ── 4.11 Logs, notes and AI memory
  F({ id: 'LOG-01', title: 'Notes kept across the Crew space, the Client space and every portal', space: 'notes', status: 'partial', timing: 'launch', label: 'hidden' }),
  F({ id: 'LOG-02', title: 'Summaries of logs, chats and meetings', space: 'notes', status: 'not-built', timing: 'v1.5', label: 'hidden' }),
  F({ id: 'LOG-03', title: 'Ask about anything said in a chat or meeting, respecting permissions exactly', space: 'notes', status: 'not-built', timing: 'v2', label: 'hidden' }),
  // ── 4.12 Notifications and presence
  F({ id: 'NTF-01', title: 'In-app notifications, preferences and away escalation — five categories across three channels', space: 'notifications', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'NTF-02', title: 'Web push', space: 'notifications', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'NTF-03', title: 'SMS, metered', space: 'notifications', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'NTF-04', title: 'Presence and heartbeat, app-wide', space: 'notifications', status: 'built', timing: 'live', label: 'available' }),
  // ── 4.13 Product experience and public surface
  F({ id: 'UX-01', title: 'Component layer, loading states on every route, a fixed type scale', space: 'experience', status: 'built', timing: 'live', label: 'internal' }),
  F({ id: 'UX-02', title: 'Command palette', space: 'experience', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'UX-03', title: 'Light and dark themes', space: 'experience', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'PUB-01', title: 'Landing page, social card, robots, sitemap, manifest', space: 'experience', status: 'built', timing: 'live', label: 'none' }),
  F({ id: 'PUB-02', title: 'Terms and privacy, with the accepted version recorded', space: 'experience', status: 'built', timing: 'live', label: 'none' }),
  F({ id: 'PUB-03', title: 'First-run checklist and onboarding', space: 'experience', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'OPS-01', title: 'Operator probe suite, the 76-assertion security harness, end-to-end tests', space: 'platform', status: 'built', timing: 'live', label: 'security' }),
  // ── 4.14 The Suite — writing and pre-production (functions, never working titles)
  F({ id: 'SWR-01', title: 'Screenplay editor — industry format, pagination, locked scenes, tracked changes, comments, snapshots', space: 'suite', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'SWR-02', title: 'Document types — screenplay, treatment, bible, breakdown', space: 'suite', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'SWR-03', title: 'Revision mode — coloured pages, asterisks, omitted scenes', space: 'suite', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SWR-04', title: 'Final Draft (FDX) import and export', space: 'suite', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SWR-05', title: 'Import from Fountain, PDF and Word', space: 'suite', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SWR-06', title: 'Live co-editing with visible cursors', space: 'suite', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'SWR-07', title: 'Live co-editing for storyboards and workflows', space: 'suite', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SWR-08', title: 'An assistant that learns one writer’s own style, with consent', space: 'suite', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SWR-09', title: 'Storyboard — boards, shots, types, prompts, ordering', space: 'suite', status: 'partial', timing: 'live', label: 'available', caveat: 'the board; generation is being built', remainder: 'Storyboard frame generation' }),
  F({ id: 'SWR-10', title: 'Shot lists feeding the schedule', space: 'suite', status: 'partial', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SWR-11', title: 'Storyboard frame generation and animatics', space: 'suite', status: 'not-built', timing: 'next', label: 'coming' }),
  F({ id: 'SWR-12', title: 'Generation pipelines and automations', space: 'suite', status: 'partial', timing: 'v2', label: 'coming' }),
  F({ id: 'SWR-13', title: 'Prompt engineering guide', space: 'suite', status: 'undecided', timing: 'none', label: 'none' }),
  // ── 4.15 The Suite — generation
  F({ id: 'STG-01', title: 'Image and video generation — takes, versions, cost per result', space: 'generation', status: 'not-built', timing: 'next', label: 'coming' }),
  F({ id: 'STG-02', title: 'Capability routing across many models', space: 'generation', status: 'partial', timing: 'next', label: 'internal' }),
  F({ id: 'STG-03', title: 'One gate for every generation — budget, member budget, ceiling, route, queue, meter, provenance', space: 'generation', status: 'partial', timing: 'next', label: 'internal' }),
  F({ id: 'STG-04', title: 'Ingestion of generated output into the vault', space: 'generation', status: 'not-built', timing: 'next', label: 'internal' }),
  F({ id: 'STG-05', title: 'Provenance per generated image and video', space: 'generation', status: 'partial', timing: 'next', label: 'hidden', remainder: 'Provenance written for every generated image and video' }),
  F({ id: 'STG-06', title: 'Rights per asset — releases write rights; clients read disclosures', space: 'generation', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'STG-07', title: 'Character, location, wardrobe and style consistency across generations', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-08', title: 'Side-by-side model comparison', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-09', title: 'Reusable generation presets per studio', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-10', title: 'Upscale and restore existing footage', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-11', title: 'Translation with lip-sync', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-12', title: 'Aspect-ratio conversion at any length', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-13', title: 'Variant output — cutdowns, captions, localisations', space: 'generation', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'STG-14', title: 'Bring your own subscription or API key', space: 'generation', status: 'undecided', timing: 'none', label: 'none' }),
  F({ id: 'STG-15', title: '3D scenes from generated imagery', space: 'generation', status: 'not-built', timing: 'v2', label: 'coming' }),
  // ── 4.16 Sound
  F({ id: 'SND-01', title: 'Sound generation — music, effects, dialogue', space: 'sound', status: 'not-built', timing: 'v1.5', label: 'coming' }),
  F({ id: 'SND-02', title: 'Sound design — spotting, ADR, mix', space: 'sound', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'SND-03', title: 'A licensed effects library', space: 'sound', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'SND-04', title: 'A third-party audio integration', space: 'sound', status: 'undecided', timing: 'none', label: 'none' }),
  // ── 4.17 Post-production
  F({ id: 'PST-01', title: 'An assembly surface — not an editor replacement', space: 'post', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'PST-02', title: 'Timeline hand-off to professional editors, and back', space: 'post', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'PST-03', title: 'A full editor with two-way live sync', space: 'post', status: 'not-built', timing: 'v3+', label: 'coming' }),
  F({ id: 'PST-04', title: 'Finishing — colour, grade, delivery specifications, captions', space: 'post', status: 'not-built', timing: 'v2', label: 'coming' }),
  // ── 4.18 Virtual sets and agents
  F({ id: 'S3D-01', title: 'Full 3D virtual sets', space: 'sets', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'S3D-02', title: 'Roamable interactive sets for a whole film', space: 'sets', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'S3D-03', title: 'Hire a film architect to build the set', space: 'sets', status: 'not-built', timing: 'v3+', label: 'coming' }),
  F({ id: 'AGT-01', title: 'A production assistant that answers inside the work', space: 'suite', status: 'built', timing: 'live', label: 'available' }),
  F({ id: 'AGT-02', title: 'Per-organization AI keys', space: 'generation', status: 'not-built', timing: 'next', label: 'do-not-claim' }),
  F({ id: 'AGT-03', title: 'Executive director and producer agents', space: 'sets', status: 'not-built', timing: 'v3+', label: 'coming' }),
  // ── 4.19 The public filmmaker network
  F({ id: 'TOP-01', title: 'Marketplace — licensing likenesses, avatars and voices, with contracts', space: 'network', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'TOP-02', title: 'Theater — filmmakers show films and behind-the-scenes', space: 'network', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'TOP-03', title: 'Community, with live feeds', space: 'network', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'TOP-04', title: 'Following other filmmakers', space: 'network', status: 'not-built', timing: 'v2', label: 'coming' }),
  F({ id: 'TOP-05', title: 'Streaming — free or by subscription', space: 'network', status: 'not-built', timing: 'v3+', label: 'coming' }),
  // ── 4.20 Enterprise readiness
  F({ id: 'ENT-01', title: 'Internal-only configuration enforced', space: 'enterprise', status: 'partial', timing: 'launch', label: 'enterprise', remainder: 'Internal-only configuration, enforced and asserted' }),
  F({ id: 'ENT-02', title: 'Single sign-on and SCIM', space: 'enterprise', status: 'built', timing: 'live', label: 'enterprise' }),
  F({ id: 'ENT-03', title: 'Security documentation', space: 'enterprise', status: 'partial', timing: 'launch', label: 'security' }),
  F({ id: 'ENT-04', title: 'Content-security posture aligned to the film industry’s regime (TPN)', space: 'enterprise', status: 'not-built', timing: 'v2', label: 'do-not-claim' }),
  F({ id: 'ENT-05', title: 'A second region', space: 'enterprise', status: 'not-built', timing: 'v2', label: 'do-not-claim' }),
  F({ id: 'ENT-06', title: 'Organization-wide audit export', space: 'enterprise', status: 'partial', timing: 'v1.5', label: 'do-not-claim' }),
  F({ id: 'ENT-07', title: 'Capacity statement — staff, contractors, co-editors', space: 'enterprise', status: 'partial', timing: 'launch', label: 'enterprise', remainder: 'Seat and client-company capacity enforced' }),
] as const

const BY_ID = new Map(FEATURES.map((f) => [f.id, f]))

export function feature(id: string): Feature {
  const f = BY_ID.get(id)
  if (!f) throw new Error(`Unknown S-F-A id: ${id}`)
  return f
}

/** What the badge says. Crew/Client/portal pages may only render 'available'. */
export function siteLabel(id: string): 'Available' | 'Coming' | null {
  const f = feature(id)
  if (f.label === 'available') return 'Available'
  if (f.label === 'coming') return 'Coming'
  return null
}
