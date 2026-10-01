/** S-W §7.15 — what shipped, dated, from HANDOFF §6's records, in a customer’s words. */
export type ChangeEntry = { date: string; title: string; area: 'crew' | 'client' | 'suite' | 'review' | 'contracts' | 'platform' | 'security'; items: string[] }

export const CHANGELOG: readonly ChangeEntry[] = [
  { date: '2026-09-29', title: 'Tasks, drafts, templates and booking', area: 'crew', items: [
    'A task engine: assignees from both rosters, comments, labels, subtasks, relations, watchers and search, on one board shared by the Crew space, the studio’s project page and the client portal.',
    'Approval requests open from a file, a document or a task — stages, approvers by person, company or role, and a custom review window.',
    'A new version of a file uploads onto its predecessor; the vault shows the version number.',
    'Message drafts follow you between devices; every edit keeps its history.',
    'Audio and video calls start from any room header; a client sees Join the moment one is live.',
    'Invites show sent, opened and expiry; resend or withdraw in place. Member profiles carry title, department, skills, rate, union and equipment.',
    'Contract templates with merge fields that report anything they could not fill.',
    'Availability rules and booking: the meeting is the booking, on both calendars.',
    'Every route has a loading state; one component layer across the product.',
  ]},
  { date: '2026-09-29', title: 'Identity, production and the editor bridge', area: 'security', items: [
    'Two-factor sign-in, passkeys and recovery codes; a studio can require two-factor and set session limits.',
    'Single sign-on (SAML and OIDC) with a DNS-proved domain, enforcement and just-in-time provisioning; SCIM 2.0 provisioning.',
    'One person, several studios: switch between organizations.',
    'Production: scenes and their elements read from the screenplay into a breakdown.',
    'The editor panel bridge: a token that acts as the person who minted it, for notes and resolves from inside the editor.',
    'Live updates across the product, with nothing private carried on the wire.',
  ]},
  { date: '2026-09-29', title: 'Review, in frames', area: 'review', items: [
    'Notes anchored to a timecode, written from both sides; guest notes kept as evidence with how far the guest had watched.',
    'Marker export to Resolve, Final Cut and Premiere, plus CSV; the frame rate is declared, never guessed.',
    'Resolving a note is a ledger event the timeline and the certificate show.',
    'Version compare with the second player slaved to the first.',
  ]},
  { date: '2026-09-29', title: 'Open a studio in under a minute', area: 'platform', items: [
    'Self-serve sign-up with a verification that gates outbound actions, not the door.',
    'Rate limiting in the database that refuses rather than opens when anything fails; a per-call ceiling on AI spend.',
    'Storage quota enforced at upload; an unverified studio holds 1 GB.',
  ]},
  { date: '2026-09-14', title: 'The screening room, the brand kit, the client calendar', area: 'client', items: [
    'Screening links for people without accounts, with a passcode, an expiry and a view limit — and a record of how far each guest watched.',
    'A brand kit: one colour in, an accessible light-and-dark palette out, on the portal, the screening page, the signing page, the email and the sealed PDF.',
    'The client’s calendar, ordered by whose move it is, with the sentence that says what happens if nobody responds.',
  ]},
  { date: '2026-09-12', title: 'Seats, project roles and scoping', area: 'security', items: [
    'Staff and contractor seats; a contractor sees nothing until assigned.',
    'Project roles with a capability baseline; assignments with an expiry.',
    'Individual grants and denials, with a denial always beating a grant.',
  ]},
  { date: '2026-09-03', title: 'Rooms, groups, broadcasts and direct messages', area: 'client', items: [
    'Membership is a seat: channels, groups, broadcast rooms and direct messages on both sides.',
    'An outside collaborator can be seated in one room — and only that room.',
    'Attachments in every room, uploaded straight to storage; pausable above 8 MB.',
  ]},
  { date: '2026-09-02', title: 'Approval becomes a record', area: 'review', items: [
    'Stages, review windows and a reminder ladder; silence advances the stage and is recorded as an automatic advance, never as a sign-off.',
    'A printable certificate for every approval.',
    'Review comments that outlive the review.',
  ]},
]
