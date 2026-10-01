import Link from 'next/link'
import { FeatureLabel, FeatureList } from '@/components/FeatureLabel'
import { CapabilityBlock, CtaBand, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/suite')

// Described by what each part does, never by a working title (S-W W-10).
const NEXT = ['STG-01', 'SWR-11']
const WRITING = ['SWR-04', 'SWR-03', 'SWR-05', 'SWR-07', 'SWR-10', 'SWR-08', 'SWR-12']
const GENERATION = ['STG-07', 'STG-08', 'STG-09', 'STG-10', 'STG-11', 'STG-12', 'STG-13', 'STG-15']
const LATER = ['SND-01', 'SND-02', 'SND-03', 'PST-01', 'PST-02', 'PST-04', 'PST-03', 'S3D-01', 'S3D-02', 'S3D-03', 'AGT-03']

export default function Suite() {
  return (
    <>
      <PageHero
        title="Write it, board it, keep it."
        lead="The Suite is where the work is made: a screenplay editor the production reads from, storyboards, and a library of every asset the studio holds. Image and video generation is being built here, inside the production."
        media={['suite-library', 'crew-production']}
      />
      <Section id="available" className="pt-0">
        <CapabilityBlock
          title="A screenplay editor the production reads from"
          body={<p>Industry formatting and pagination, locked scenes, tracked changes, comments and snapshots, with live co-editing and visible cursors. The breakdown in the Crew space reads from it — nobody retypes a scene.</p>}
          features={['SWR-01', 'SWR-06', 'SWR-02']}
        />
        <CapabilityBlock
          reverse
          title="Storyboards"
          body={<p>Boards of shots, with shot types, prompts and ordering.</p>}
          features={['SWR-09']}
        />
        <CapabilityBlock
          title="The library"
          body={<p>Every asset across the studio, with facets and the footprint of each production.</p>}
          features={['FIL-07']}
          media="suite-library"
        />
        <CapabilityBlock
          reverse
          title="An assistant inside the work"
          body={<p>Ask for help inside the screenplay and the documents. Every call is priced before it runs, a ceiling asks before anything expensive, and the person’s budget applies.</p>}
          features={['AGT-01', 'MON-05']}
        />
      </Section>
      <Section id="being-built" title="Being built" lead="Shown honestly. Each is marked available when it meets the bar for its category — and not before.">
        <div className="space-y-12">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Next</h3>
            <FeatureList items={NEXT} className="mt-4 max-w-3xl" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Writing</h3>
            <FeatureList items={WRITING} className="mt-4 max-w-3xl" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Generation</h3>
            <FeatureList items={GENERATION} className="mt-4 max-w-3xl" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Sound, post-production and virtual sets</h3>
            <FeatureList items={LATER} className="mt-4 max-w-3xl" />
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-3 squircle border border-border bg-card/40 p-5">
          <FeatureLabel id="STG-01" />
          <p className="text-[15px] text-muted-foreground">Generation runs through one gate: a budget, a ceiling and provenance on every asset. <Link href="/ai" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">How it will work</Link></p>
        </div>
        <p className="mt-6 text-[15px] text-muted-foreground">Everything else being built, in every space, is on the <Link href="/roadmap" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">roadmap</Link>.</p>
      </Section>
      <CtaBand />
    </>
  )
}
