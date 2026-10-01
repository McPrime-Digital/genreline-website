/** Navigation — S-W §5.1 (header) and §5.2 (footer). */
import { APP } from '@/lib/site'

/** `featureId` ties a menu item to its S-F-A row; the SERVER resolves the badge
 *  (content/features.ts stays out of the client bundle). */
export type NavLink = { label: string; href: string; description?: string; featureId?: string }
export type NavLinkWithBadge = NavLink & { badge?: 'Available' | 'Coming' | null }
export type NavColumn = { heading: string; links: NavLink[] }

export const PRODUCT_MENU: NavColumn[] = [
  {
    heading: 'Spaces',
    links: [
      { label: 'Crew', href: '/product/crew', description: 'The team and the production' },
      { label: 'Client and portal', href: '/product/client', description: 'Client work, in your studio’s brand' },
      { label: 'The Suite', href: '/product/suite', description: 'Writing, boards, the library — and generation, being built' },
    ],
  },
  {
    heading: 'Capabilities',
    links: [
      { label: 'Review and approval', href: '/product/review', description: 'Approval as a record, not a status' },
      { label: 'Contracts and signing', href: '/product/contracts', description: 'Sealed signatures; releases that write rights' },
      { label: 'Production', href: '/product/production', description: 'Breakdown, stripboard, shoot days, call sheets' },
      { label: 'Meetings and scheduling', href: '/product/meetings', description: 'Meetings, synced review, calendar, booking' },
      { label: 'Money', href: '/product/money', description: 'Invoices, credits, budgets, cost control' },
      { label: 'Files and screening', href: '/product/files', description: 'The vault, large uploads, versions, the screening room' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Security', href: '/security', description: 'Every control that exists, stated precisely' },
      { label: 'AI and provenance', href: '/ai', description: 'Budgets, ceilings, provenance, rights' },
    ],
  },
]

export const SOLUTIONS_MENU: NavLink[] = [
  { label: 'Production companies', href: '/solutions/production-companies', description: 'Their day, in their words' },
  { label: 'Creative agencies', href: '/solutions/agencies', description: 'Client-heavy work and brand' },
  { label: 'In-house teams', href: '/solutions/in-house', description: 'The internal-only configuration' },
  { label: 'Enterprise', href: '/enterprise', description: 'Identity, controls, capacity, procurement' },
]

export const NETWORK_MENU: NavLink[] = [
  { label: 'Theater', href: '/network#theater', featureId: 'TOP-02', description: 'Filmmakers show films and what went into them' },
  { label: 'Community', href: '/network#community', featureId: 'TOP-03', description: 'Live feeds, for the professional industry' },
  { label: 'Streaming', href: '/network#streaming', featureId: 'TOP-05', description: 'Free or by subscription' },
  { label: 'Marketplace', href: '/network#marketplace', featureId: 'TOP-01', description: 'Likenesses, avatars and voices, with contracts' },
]
export const NETWORK_EARLY_ACCESS: NavLink = { label: 'Join early access', href: '/network#early-access' }

export const FOOTER: NavColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Crew', href: '/product/crew' },
      { label: 'Client and portal', href: '/product/client' },
      { label: 'The Suite', href: '/product/suite' },
      { label: 'Review', href: '/product/review' },
      { label: 'Contracts', href: '/product/contracts' },
      { label: 'Production', href: '/product/production' },
      { label: 'Meetings', href: '/product/meetings' },
      { label: 'Money', href: '/product/money' },
      { label: 'Files', href: '/product/files' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'Production companies', href: '/solutions/production-companies' },
      { label: 'Agencies', href: '/solutions/agencies' },
      { label: 'In-house', href: '/solutions/in-house' },
      { label: 'Enterprise', href: '/enterprise' },
      { label: 'Network', href: '/network' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Security', href: '/security' },
      { label: 'Responsible disclosure', href: '/security/disclosure' },
      { label: 'AI and provenance', href: '/ai' },
      { label: 'Sign in', href: APP.login },
      { label: 'Open your studio', href: APP.signup },
    ],
  },
  { heading: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
  { heading: 'Legal', links: [{ label: 'Terms', href: APP.terms }, { label: 'Privacy', href: APP.privacy }] },
]
