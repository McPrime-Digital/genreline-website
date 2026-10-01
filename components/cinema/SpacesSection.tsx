/** The three spaces showcase, assembled on the server with real screens. */
import { Media, hasMedia } from '@/components/site/Media'
import { SpacesShowcase, type SpacePanel } from '@/components/cinema/SpacesShowcase'
import { siteLabel } from '@/content/features'

const shot = (id: string, sizes = '(min-width: 1024px) 680px, 100vw') => (hasMedia(id) ? <Media id={id} frame={false} sizes={sizes} /> : null)
const shots = (list: [string, string][]) => list.filter(([id]) => hasMedia(id)).map(([id, label]) => ({ key: id, label, node: shot(id)! }))
const feat = (featureId: string, text: string) => ({ featureId, text, badge: (siteLabel(featureId) ?? 'Available') as 'Available' | 'Coming' })

const SPACES: SpacePanel[] = [
  {
    id: 'crew', name: 'Crew', tagline: 'Where the studio works.', href: '/product/crew',
    body: 'Who is on the job, what they are doing and what they may see — and the breakdown that comes straight out of the script.',
    features: [
      feat('CRW-02', 'A directory that is a production database — skills, rates, union, kit, availability'),
      feat('CRW-04', 'Tasks with assignees from both rosters, subtasks, relations and watchers'),
      feat('MSG-02', 'Internal rooms, threads and a call button in every room'),
      feat('CRW-07', 'Scenes and elements broken down from the script'),
      feat('MON-06', 'A budget per person for AI spend'),
      feat('IDN-04', 'Roles, project roles, seats, grants and denials with expiry'),
    ],
    people: ['Producers', 'Coordinators', 'Editors', 'Freelancers, scoped to their jobs', 'Finance'],
    shots: shots([['crew-tasks', 'Tasks'], ['crew-production', 'Breakdown'], ['crew-chat', 'Crew rooms'], ['crew-directory', 'Directory'], ['crew-calendar', 'Calendar']]),
  },
  {
    id: 'client', name: 'Client', tagline: 'Where clients meet the work — in your brand.', href: '/product/client',
    body: 'Every client company gets its own room, vault and portal. They review frame by frame, sign, book and pay — and never see a vendor’s name but yours.',
    features: [
      feat('MSG-01', 'One room per client company, with project tags and threads'),
      feat('APR-14', 'Frame-accurate review, notes on the timecode, drawings on the frame'),
      feat('APR-02', 'Approval records with a printable certificate'),
      feat('DOC-10', 'Contracts and releases that write the rights they prove'),
      feat('CLI-08', 'Screening links for people with no account'),
      feat('CLI-05', 'Your colour and logo on the portal, email and sealed PDFs'),
    ],
    people: ['Client owners', 'Reviewers and approvers', 'Client legal and finance', 'Guests on a screening link', 'Signers'],
    shots: shots([['client-messages', 'The client room'], ['portal-review', 'Review in the portal'], ['client-review-record', 'The approval record'], ['portal-contracts', 'Contracts'], ['home-portal-brand-a', 'The portal, in your brand']]),
  },
  {
    id: 'suite', name: 'The Suite', tagline: 'Where the work is made.', href: '/product/suite',
    body: 'A screenplay editor the production reads from, storyboards, and a library of every asset the studio holds. Image and video generation is being built here, inside the production.',
    features: [
      feat('SWR-01', 'A screenplay editor — industry format, locked scenes, tracked changes'),
      feat('SWR-06', 'Live co-editing with visible cursors'),
      feat('SWR-09', 'Storyboards — shots, types, prompts, ordering'),
      feat('FIL-07', 'A studio-wide library with facets and per-production footprint'),
      feat('STG-01', 'Image and video generation, with a budget and a record'),
      feat('SWR-04', 'Final Draft (FDX) import and export'),
    ],
    people: ['Writers, co-editing live', 'Directors', 'Storyboard artists', 'Producers'],
    shots: shots([['suite-library', 'The library']]),
  },
]


export function SpacesSection() {
  return <SpacesShowcase spaces={SPACES.filter((s) => s.shots.length > 0)} />
}
