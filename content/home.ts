/**
 * THE HOME HERO'S WORDS — every visible word of the 3D hero (batch W-3D-1),
 * and every word the 3D itself draws (the labels under its screens). The
 * hero's components read from here and carry no text of their own.
 *
 * Every string is the live site's own wording, carried over verbatim — the
 * owner, 2026-11-03: "use exactly the words or writings on the website and
 * not change them … those are deliberate written words for the site". Where
 * each comes from:
 *  · the title card, the slate line and the two calls to action: the hero
 *    this one replaced;
 *  · the line under the title, and each space's line: that hero's lede, cut
 *    where it names each space (the owner: "the only subtext under the hero
 *    heading is genreline runs ai & hybrid film production end to end", and
 *    the rest "divided and shared to each of the space … where they belong");
 *  · the Stakeholders space: the In-house page and segment (content/pages.ts,
 *    content/segments.ts) — "a Stakeholders space — a portal per department";
 *  · the labels under the screens: the Spaces section (SpacesBento), the
 *    platform list, the features register (content/features.ts) and the
 *    Suite's stages (content/suite.ts), word for word;
 *  · the closing title: the site's tagline (lib/site.ts);
 *  · the spaces index at the foot of the home page: the hero this replaced,
 *    with its lede's last sentence as the index's line.
 * Nothing here is a placeholder. If one is ever added it carries
 * `// PLACEHOLDER` on its own line (HANDOFF.md keeps that list).
 */
import { APP, TAGLINE } from '@/lib/site'
import type { IconName } from '@/components/Icon'

export type HeroNodeId = 'crew' | 'client' | 'suite'
/** The Client station turns between two faces every three seconds (the owner, 2026-11-03). */
export type HeroFace = 'client' | 'stakeholders'

/** The tagline, split into the closing title card's two lines (each keeps its full stop). */
const [closingLine1, closingLine2] = TAGLINE.split(/\.\s+/).map((s) => (s.endsWith('.') ? s : `${s}.`))

/** A screen in the 3D: a real product capture (content/media.ts id) and the words under it. */
export type HeroPanel = { capture: string; icon: IconName; label: string }
/** One of the Suite's tools: its stage name (content/suite.ts) and what the 3D draws for it. */
export type HeroTool = {
  stage: string
  icon: IconName
  label: string
  /** What the card shows: a capture, or a drawn piece of the tool at work. */
  art: 'script' | 'boards' | 'frame' | 'workflow' | 'waveform' | 'timeline' | 'capture'
  capture?: string
}

export const hero = {
  /** Where the scene's clock starts. The slate line's timecode runs from here as the visitor scrolls. */
  timecode: '00:00:00:00',
  /** The slate line's left end. */
  rec: 'Rec',
  /** The slate line, set small above the title. */
  kicker: 'The operating system for AI & hybrid film production',
  /** The title card. */
  headlineLine1: 'Every space of production.',
  headlineLine2: 'One operating system.',
  /** The one line under the title (the old lede's first clause). */
  subtext: 'Genreline runs AI and hybrid film production end to end.',
  primaryButton: { label: 'Open Studio OS account', href: APP.signup },
  secondaryButton: { label: 'Talk to sales', href: '/contact?topic=sales' },

  /** The three spaces on the line, in the logo's order, each with its shot's timecode and its part of the old lede. */
  nodes: [
    { id: 'crew', timecode: '00:00:04:00', label: 'Crew space', line: 'Where your team works.' },
    { id: 'client', timecode: '00:00:08:00', label: 'Client space', line: 'A portal in your brand where clients review, approve, sign and pay.' },
    { id: 'suite', timecode: '00:00:12:00', label: 'The Suite', line: 'Where the work is written, boarded, generated, edited and finished.' },
  ] as const satisfies readonly { id: HeroNodeId; timecode: string; label: string; line: string }[],

  /** The Client station's other face. */
  stakeholders: { label: 'Stakeholders space', line: 'A portal per department — marketing, legal, the exec office — to review and approve.' },

  /** The screens around each station. Crew and the Client's two faces show real product captures. */
  panels: {
    crew: [
      { capture: 'crew-tasks', icon: 'ListChecks', label: 'Tasks across your team and the client’s' },
      { capture: 'crew-directory', icon: 'Contact', label: 'A directory with skills, rates and availability' },
      { capture: 'crew-chat', icon: 'MessagesSquare', label: 'Internal rooms, threads and calls' },
      { capture: 'crew-calendar', icon: 'CalendarDays', label: 'Calendar on both sides' },
      { capture: 'crew-security', icon: 'KeyRound', label: 'Two-factor and passkeys' },
      { capture: 'crew-sso', icon: 'Fingerprint', label: 'SSO and SCIM' },
    ],
    client: [
      { capture: 'client-messages', icon: 'MessagesSquare', label: 'One room per client company' },
      { capture: 'client-review', icon: 'ScanEye', label: 'Approvals with a certificate' },
      { capture: 'client-contracts', icon: 'FileSignature', label: 'Contracts, sealed and certified' },
      { capture: 'client-invoices', icon: 'Receipt', label: 'Invoices and payment details' },
      { capture: 'home-portal-brand-a', icon: 'Palette', label: 'One colour in, a full brand out' },
      { capture: 'client-companies', icon: 'Building2', label: 'Every client company, in one room' },
    ],
    stakeholders: [
      { capture: 'portal-review', icon: 'ScanEye', label: 'Frame-accurate review and notes' },
      { capture: 'portal-approvals', icon: 'Stamp', label: 'Sign-off from the people who matter' },
      { capture: 'portal-certificate', icon: 'BadgeCheck', label: 'Printable certificate' },
      { capture: 'portal-contracts', icon: 'PenLine', label: 'Consent, then signature' },
      { capture: 'portal-meetings', icon: 'CalendarClock', label: 'Booking from your availability' },
      { capture: 'portal-team', icon: 'UsersRound', label: 'Departments you serve' },
    ],
  } as const satisfies Record<'crew' | 'client' | 'stakeholders', readonly HeroPanel[]>,

  /** The Suite's tools around its tile, each named for its stage (content/suite.ts). */
  tools: [
    { stage: 'write', icon: 'PenTool', label: 'Write', art: 'script' },
    { stage: 'visualise', icon: 'Brush', label: 'Visualise', art: 'boards' },
    { stage: 'stage', icon: 'Camera', label: 'The Stage', art: 'frame' },
    { stage: 'automate', icon: 'Workflow', label: 'Workflows', art: 'workflow' },
    { stage: 'sound', icon: 'AudioWaveform', label: 'Sound', art: 'waveform' },
    { stage: 'post', icon: 'Scissors', label: 'Edit and finish', art: 'timeline' },
    { stage: 'keep', icon: 'Library', label: 'Keep', art: 'capture', capture: 'suite-library' },
  ] as const satisfies readonly HeroTool[],

  /** The closing title card: the site's tagline, alone. */
  closing: { timecode: '00:00:16:00', line1: closingLine1, line2: closingLine2 },

  /** The spaces index at the foot of the home page (moved out of the hero by the owner, 2026-11-03: "it must go to the bottom"). */
  index: {
    label: 'The spaces and portals',
    line: 'Contracts, rights, money and security run underneath all of it, on one record.',
    spaces: [
      { href: '#space-crew', icon: 'UsersRound', name: 'Crew space', line: 'Your team, tasks, rooms and permissions' },
      { href: '#space-client', icon: 'Building2', name: 'Client space', line: 'Every client company, in one room' },
      { href: '#space-portal', icon: 'AppWindow', name: 'Client portal', line: 'Review, sign and pay — in your brand' },
      { href: '#space-suite', icon: 'Clapperboard', name: 'The Suite', line: 'Write, board, generate, edit, finish' },
      { href: '#space-platform', icon: 'ShieldCheck', name: 'Platform', line: 'Identity, security and the record' },
    ],
  },
} as const satisfies {
  index: { label: string; line: string; spaces: readonly { href: string; icon: IconName; name: string; line: string }[] }
  [k: string]: unknown
}

/** Every icon the 3D draws, so the server can hand their drawings to the scene. */
export const HERO_ICONS: IconName[] = Array.from(
  new Set<IconName>([
    ...Object.values(hero.panels).flatMap((list) => list.map((p) => p.icon)),
    ...hero.tools.map((t) => t.icon),
  ]),
)

/** Every capture the 3D shows. */
export const HERO_CAPTURES: string[] = Array.from(
  new Set([...Object.values(hero.panels).flatMap((list) => list.map((p) => p.capture)), ...hero.tools.flatMap((t) => ('capture' in t ? [t.capture] : []))]),
)
