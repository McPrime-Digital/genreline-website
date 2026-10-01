import { PageHero, Section } from '@/components/site/Frame'
import { RoadmapBoard } from '@/components/interactive/RoadmapBoard'
import { ROADMAP } from '@/content/roadmap'
import { SPACE_NAMES } from '@/content/features'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/roadmap')

export default function Roadmap() {
  return (
    <>
      <PageHero
        title="Everything being built."
        lead="Nothing is hidden. Every feature that is not available today is here with its honest status — Being built, or Planned. No dates until they are real."
        size="md"
      />
      <Section className="pt-0">
        <RoadmapBoard rows={ROADMAP} spaces={{ ...SPACE_NAMES }} />
      </Section>
    </>
  )
}
