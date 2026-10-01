/**
 * WHO IT IS FOR — concrete, so a visitor can recognise themselves (owner,
 * 2026-10-01: "what sort of production companies… what creative agencies…
 * in-house isn't clear… what enterprise and what do they see"). Every
 * capability named here is Available in S-F-A, or stated as not yet built.
 */
export type Segment = {
  id: 'production-companies' | 'agencies' | 'in-house' | 'enterprise'
  name: string
  headline: string
  short: string
  who: string
  examples: string[]
  spaces: { name: string; on: boolean; note: string }[]
  invite: { role: string; sees: string; featureId: string }[]
  wins: { title: string; body: string; featureId: string }[]
  media: string[]
  honest?: string
}

export const SEGMENTS: readonly Segment[] = [
  {
    id: 'production-companies',
    headline: 'Run every job, from the first page to the final invoice.',
    name: 'Production companies',
    short: 'Commercial, film and TV, documentary and music-video houses',
    who: 'A production house with a core team and a freelance bench that changes with every job — making commercials, branded films, documentaries, series or music videos for clients who need to see the cut and sign it off.',
    examples: ['Commercial production houses', 'Film and TV production companies', 'Documentary companies', 'Music-video and branded-content houses', 'Post-production and finishing houses'],
    spaces: [
      { name: 'Crew', on: true, note: 'Your staff, your freelancers, your schedule' },
      { name: 'Client', on: true, note: 'Every client company, in your brand' },
      { name: 'The Suite', on: true, note: 'Script, boards and the library' },
    ],
    invite: [
      { role: 'Your staff', sees: 'Every production, at the role you give them', featureId: 'IDN-01' },
      { role: 'Freelancers', sees: 'Only the productions they are assigned to, until the assignment expires', featureId: 'IDN-03' },
      { role: 'Each client’s team', sees: 'Their own company’s portal — rooms, cuts, approvals, contracts, invoices', featureId: 'IDN-09' },
      { role: 'Outside collaborators', sees: 'One room — the VFX artist or colourist on one job, and nothing else', featureId: 'MSG-20' },
      { role: 'Guests', sees: 'One cut through a screening link, with no account', featureId: 'CLI-08' },
      { role: 'Talent', sees: 'One release to sign, through a single-use link', featureId: 'DOC-09' },
    ],
    wins: [
      { title: 'Script to generated shot in one chain', body: 'Scenes and elements read from the screenplay, boards built from them, and every generation filed to the production it belongs to.', featureId: 'CRW-07' },
      { title: 'Sign-offs that hold up', body: 'Every cut approved on the record — who, when, what they watched and what they said — with a printable certificate.', featureId: 'APR-02' },
      { title: 'Releases that write the rights', body: 'A performer signs an AI-likeness release on a phone; the asset’s rights — including whether the likeness may be generated — are written by the signature.', featureId: 'DOC-10' },
    ],
    media: ['crew-production', 'client-review-record', 'crew-calendar'],
  },
  {
    id: 'agencies',
    headline: 'Every brand, every round, in your agency’s name.',
    name: 'Creative agencies',
    short: 'Advertising, branded-content and social agencies, and their content studios',
    who: 'An agency producing for many brands at once — campaigns, social cutdowns, branded content — where every brand has its own stakeholders, rounds of feedback and legal sign-off, and the agency’s name has to be on everything the brand sees.',
    examples: ['Advertising agencies and their production arms', 'Branded-content and social-first studios', 'Design and motion studios', 'Content studios inside holding groups'],
    spaces: [
      { name: 'Client', on: true, note: 'One company per brand, each with its own team and rooms' },
      { name: 'Crew', on: true, note: 'Your producers, editors and freelancers' },
      { name: 'The Suite', on: true, note: 'Scripts, boards and every asset' },
    ],
    invite: [
      { role: 'Brand teams', sees: 'Their brand’s portal, with roles their owner sets — reviewer, approver, finance', featureId: 'CLI-04' },
      { role: 'Brand legal', sees: 'Contracts and the clearance panel that says what must be disclosed', featureId: 'CLI-11' },
      { role: 'Freelance editors', sees: 'The productions they are assigned to', featureId: 'IDN-03' },
      { role: 'Guests', sees: 'A screener, watermarked with their own name', featureId: 'CLI-09' },
    ],
    wins: [
      { title: 'Your agency, not ours', body: 'The portal, screening pages, signing pages, email and sealed PDFs carry your name and colour.', featureId: 'CLI-05' },
      { title: 'Rounds that end', body: 'Each round is an approval with a review window and a reminder ladder, and the record shows exactly how it closed.', featureId: 'APR-01' },
      { title: 'Notes straight into the edit', body: 'Frame-accurate notes out to Resolve, Final Cut and Premiere as markers.', featureId: 'APR-16' },
    ],
    media: ['home-portal-brand-a', 'portal-review', 'client-guest-links'],
  },
  {
    id: 'in-house',
    headline: 'The studio inside your company, run like a studio.',
    name: 'In-house teams',
    short: 'The video and creative team inside a company',
    who: 'The studio inside a business — a brand’s in-house content team, a corporate communications video unit, a broadcaster’s promo department, a university or museum media team. Your client is your own company, and your stakeholders sit in other departments.',
    examples: ['Brand in-house studios', 'Corporate communications video teams', 'Broadcaster and publisher promo departments', 'Museum, university and public-sector media teams'],
    spaces: [
      { name: 'Crew', on: true, note: 'Your team, tasks, schedule and internal rooms' },
      { name: 'The Suite', on: true, note: 'Scripts, boards and the library' },
      { name: 'Client', on: true, note: 'Optional — set up departments as the companies you serve' },
    ],
    invite: [
      { role: 'Your team', sees: 'The productions and tools their role covers', featureId: 'IDN-01' },
      { role: 'Departments you serve', sees: 'A portal per department — marketing, HR, the exec office — to review and approve', featureId: 'CLI-02' },
      { role: 'Agencies and freelancers', sees: 'Only the productions they are brought in for', featureId: 'IDN-03' },
    ],
    wins: [
      { title: 'Sign-off from the people who matter', body: 'Internal approvals with stages and a certificate, so “legal approved it” is a record, not a memory.', featureId: 'CRW-05' },
      { title: 'Identity your IT team already runs', body: 'Single sign-on with SAML or OIDC, SCIM provisioning, and required two-factor.', featureId: 'IDN-14' },
      { title: 'One library for the whole company', body: 'Every asset, with facets and each production’s footprint.', featureId: 'FIL-07' },
    ],
    media: ['crew-tasks', 'suite-library', 'crew-sso'],
    honest: 'Every studio sees all three spaces today. A configuration in which an internal team never sees the Client space is on the roadmap.',
  },
  {
    id: 'enterprise',
    headline: 'Built for the security review.',
    name: 'Enterprise',
    short: 'Studios, networks, streamers and global brands with a security review',
    who: 'An organisation whose identity, security and procurement teams decide before unreleased footage moves — a studio or network’s vendor programme, a streamer’s production partners, a global brand’s marketing operations.',
    examples: ['Studios and networks working with outside vendors', 'Streamers and their production partners', 'Global brands’ marketing and content operations', 'Groups running several studios under one roof'],
    spaces: [
      { name: 'Crew', on: true, note: 'Every studio in the group, each isolated' },
      { name: 'Client', on: true, note: 'Your partners and business units' },
      { name: 'The Suite', on: true, note: 'One library per studio' },
    ],
    invite: [
      { role: 'Everyone, through your identity provider', sees: 'What SCIM provisions; deactivation signs them out everywhere at once', featureId: 'IDN-18' },
      { role: 'People across several studios', sees: 'Each studio separately, switching between them', featureId: 'IDN-19' },
      { role: 'Your security team', sees: 'The permission ledger — every grant, denial and assignment', featureId: 'IDN-06' },
    ],
    wins: [
      { title: 'Identity, enforced', body: 'SAML or OIDC on a domain proved by DNS, enforcement, just-in-time provisioning and SCIM 2.0.', featureId: 'IDN-14' },
      { title: 'Your own rules', body: 'Required two-factor, a maximum session age and an idle timeout, set by you.', featureId: 'IDN-17' },
      { title: 'Isolation you can verify', body: 'Studio isolation enforced in the database and proven by 76 automated security checks.', featureId: 'FND-01' },
    ],
    media: ['crew-sso', 'crew-security', 'crew-integrations'],
    honest: 'No certification is held yet — no SOC 2, no ISO 27001, no TPN assessment. The security page lists every gap beside its plan.',
  },
]

/** The people on a production, and exactly what each one can reach. */
export const COLLABORATORS = [
  { role: 'Staff', where: 'Crew', sees: 'Every production, at their company role', featureId: 'IDN-01' },
  { role: 'Contractors', where: 'Crew', sees: 'Nothing until assigned — then only those productions, until it expires', featureId: 'IDN-03' },
  { role: 'Client teams', where: 'Portal', sees: 'Their company’s rooms, cuts, approvals, contracts and invoices', featureId: 'IDN-09' },
  { role: 'Outside collaborators', where: 'One room', sees: 'A single room and its meetings — nothing else in the studio', featureId: 'MSG-20' },
  { role: 'Guests', where: 'A screening link', sees: 'One cut, watermarked with their name, with no account', featureId: 'CLI-08' },
  { role: 'Signers', where: 'A signing link', sees: 'One document to sign, once', featureId: 'DOC-09' },
] as const
