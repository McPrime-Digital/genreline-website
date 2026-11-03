/**
 * THE HOME HERO'S WORDS — every visible word of the 3D hero (batch W-3D-1).
 * The hero's components read from here and carry no text of their own.
 *
 * Every string below is the live site's own wording, carried over verbatim:
 * the title card, the slate line, the lede, the two calls to action and the
 * five spaces from the hero this one replaces, and the closing line from the
 * site's tagline (lib/site.ts). The owner, 2026-11-03: "use exactly the words
 * or writings on the website and not change them … those are deliberate
 * written words for the site". So nothing here is a placeholder.
 *
 * A field the live hero never had (a note under the buttons, a scroll cue in
 * words) is `null` and renders nothing. If a placeholder is ever added, it
 * carries `// PLACEHOLDER` on its own line, so `grep -n PLACEHOLDER
 * content/home.ts` lists every one (HANDOFF.md keeps that list).
 */
import { APP, TAGLINE } from '@/lib/site'
import type { IconName } from '@/components/Icon'

export type HeroNodeId = 'crew' | 'client' | 'suite'

/** The tagline, split into the closing title card's two lines (each keeps its full stop). */
const [closingLine1, closingLine2] = TAGLINE.split(/\.\s+/).map((s) => (s.endsWith('.') ? s : `${s}.`))

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
  lede: 'Genreline runs AI and hybrid film production end to end — the Crew space where your team works, the Client space and a portal in your brand where clients review, approve, sign and pay, and the Suite where the work is written, boarded, generated, edited and finished. Contracts, rights, money and security run underneath all of it, on one record.',
  primaryButton: { label: 'Open Studio OS account', href: APP.signup },
  secondaryButton: { label: 'Talk to sales', href: '/contact?topic=sales' },
  /** The live hero has no note under its buttons. */
  note: null as string | null,
  /** The live hero has no scroll cue in words; the cue is drawn, not written. */
  scrollCue: null as string | null,

  /** The three nodes on the line, in the logo's order, each with the shot's timecode. */
  nodes: [
    { id: 'crew', timecode: '00:00:04:00', label: 'Crew space', line: 'Your team, tasks, rooms and permissions', href: '#space-crew' },
    { id: 'client', timecode: '00:00:08:00', label: 'Client space', line: 'Every client company, in one room', href: '#space-client' },
    { id: 'suite', timecode: '00:00:12:00', label: 'The Suite', line: 'Write, board, generate, edit, finish', href: '#space-suite' },
  ] as const satisfies readonly { id: HeroNodeId; timecode: string; label: string; line: string; href: string }[],

  /** The portal rides with the Client shot: the client's side of the same space. */
  portal: { label: 'Client portal', line: 'Review, sign and pay — in your brand' },

  /** The closing title card: the site's tagline. */
  closing: { timecode: '00:00:16:00', line1: closingLine1, line2: closingLine2 },

  /** Under the closing title: every space and portal, each a way into the page below. */
  spacesLabel: 'The spaces and portals',
  spaces: [
    { href: '#space-crew', icon: 'UsersRound', name: 'Crew space', line: 'Your team, tasks, rooms and permissions' },
    { href: '#space-client', icon: 'Building2', name: 'Client space', line: 'Every client company, in one room' },
    { href: '#space-portal', icon: 'AppWindow', name: 'Client portal', line: 'Review, sign and pay — in your brand' },
    { href: '#space-suite', icon: 'Clapperboard', name: 'The Suite', line: 'Write, board, generate, edit, finish' },
    { href: '#space-platform', icon: 'ShieldCheck', name: 'Platform', line: 'Identity, security and the record' },
  ] as const satisfies readonly { href: string; icon: IconName; name: string; line: string }[],

  /** The header's Motion switch (batch W-3D-1 §4). */
  motionLabel: 'Motion',
} as const
