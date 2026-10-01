/** Server wrapper: the Suite's stages, labelled from features.ts. */
import { SuiteUniverse, type SuiteStageData } from '@/components/cinema/SuiteUniverse'
import { SUITE_DETAIL, SUITE_STAGES } from '@/content/suite'
import { feature, siteLabel } from '@/content/features'
import { Icon, type IconName } from '@/components/Icon'

export const STAGE_ICON: Record<string, IconName> = { write: 'PenTool', visualise: 'LayoutGrid', stage: 'WandSparkles', hybrid: 'Combine', automate: 'Workflow', sound: 'AudioWaveform', post: 'Scissors', adapt: 'ImageUpscale', worlds: 'Box', keep: 'Library' }

export function SuiteSection() {
  const stages: SuiteStageData[] = SUITE_STAGES.map((st) => ({
    id: st.id,
    name: st.name,
    line: st.line,
    icon: <Icon name={STAGE_ICON[st.id] ?? 'Clapperboard'} className="size-4" />,
    modules: st.ids.filter((id) => siteLabel(id)).map((id) => {
      const [title] = feature(id).title.split(' — ')
      const d = SUITE_DETAIL[id]
      return { id, title, detail: d?.does, points: d?.points, badge: siteLabel(id)! }
    }),
  }))
  return <SuiteUniverse stages={stages} />
}
