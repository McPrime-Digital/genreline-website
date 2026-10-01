/** Server wrapper: every capability the site may name, from features.ts. */
import { CapabilityIndex, type Cap } from '@/components/cinema/CapabilityIndex'
import { FEATURES, SPACE_NAMES } from '@/content/features'
import { Icon, type IconName } from '@/components/Icon'

const GROUP_ICON: Record<string, IconName> = { 'The Suite': 'Clapperboard', Crew: 'UsersRound', 'Client and portal': 'AppWindow', 'Review and approval': 'ScanEye', Messaging: 'MessagesSquare', 'Meetings and calendar': 'Video', Contracts: 'FileSignature', Files: 'FolderOpen', Money: 'Receipt', 'Identity and permissions': 'KeyRound', 'Platform and security': 'ShieldCheck', Enterprise: 'Landmark', 'The network': 'Globe' }

const GROUP: Record<string, string> = {
  suite: 'The Suite', generation: 'The Suite', sound: 'The Suite', post: 'The Suite', sets: 'The Suite',
  crew: 'Crew', messaging: 'Messaging', client: 'Client and portal', review: 'Review and approval',
  meetings: 'Meetings and calendar', documents: 'Contracts', money: 'Money', files: 'Files',
  identity: 'Identity and permissions', platform: 'Platform and security', enterprise: 'Enterprise',
  notifications: 'Platform and security', experience: 'Platform and security', network: 'The network', notes: 'Crew',
}

export function CapabilitySection({ initial }: { initial?: number }) {
  const caps: Cap[] = FEATURES.filter((f) => ['available', 'coming', 'security', 'enterprise'].includes(f.label)).map((f) => ({
    id: f.id,
    title: f.caveat ? `${f.title} (${f.caveat})` : f.title,
    group: GROUP[f.space] ?? SPACE_NAMES[f.space],
    badge: f.label === 'coming' ? 'Coming' : f.label === 'available' ? 'Available' : 'Live',
  }))
  // The Suite first: it is the argument.
  const order = ['The Suite', 'Crew', 'Client and portal', 'Review and approval', 'Messaging', 'Meetings and calendar', 'Contracts', 'Files', 'Money', 'Identity and permissions', 'Platform and security', 'Enterprise', 'The network']
  caps.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
  const groupIcons = Object.fromEntries(Object.entries(GROUP_ICON).map(([g, n]) => [g, <Icon key={g} name={n} className="size-4" />]))
  // Physical-shoot features are not part of the AI production story (owner, 2026-10-01).
  return <CapabilityIndex caps={caps.filter((c) => !['CRW-06', 'CRW-08'].includes(c.id))} initial={initial} groupIcons={groupIcons} />
}
