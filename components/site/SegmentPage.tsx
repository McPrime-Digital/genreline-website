/** One template for the four "who it is for" pages — content/segments.ts. */
import Link from 'next/link'
import { CapabilityBlock, CtaBand, PageHero, Section } from '@/components/site/Frame'
import { Reveal } from '@/components/cinema/Reveal'
import { Spotlight } from '@/components/cinema/Spotlight'
import { Feature } from '@/components/FeatureLabel'
import { SEGMENTS, type Segment } from '@/content/segments'

export function SegmentPage({ id, children }: { id: Segment['id']; children?: React.ReactNode }) {
  const s = SEGMENTS.find((x) => x.id === id)!
  return (
    <>
      <PageHero motif={({ 'production-companies': 'clapper', agencies: 'brand', 'in-house': 'slate', enterprise: 'vault' } as const)[id]} kicker={`${s.name} — ${s.short.charAt(0).toLowerCase()}${s.short.slice(1)}`} title={s.headline} lead={s.who} media={s.media}>
        <div className="flex flex-wrap gap-2">
          {s.examples.map((e) => <span key={e} className="rounded-full border border-border bg-card/50 px-3 py-1.5 text-[13px] text-foreground backdrop-blur">{e}</span>)}
        </div>
      </PageHero>

      <Section id="setup" title="Your setup" lead="The spaces you run, and what each one is for in a company like yours.">
        <div className="grid gap-4 md:grid-cols-3">
          {s.spaces.map((sp, n) => (
            <Reveal key={sp.name} delay={n * 80}>
              <Spotlight className="h-full rounded-2xl border border-border bg-card/40 p-6">
                <p className="font-display text-2xl font-bold text-foreground">{sp.name}</p>
                <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{sp.note}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="people" title="Who you invite, and exactly what they see" lead="Access is decided by the database, person by person — nobody sees more than their part.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.invite.map((p, n) => (
            <Reveal as="li" key={p.role} delay={n * 60}>
              <Spotlight className="h-full rounded-2xl border border-border bg-card/40 p-6">
                <Feature id={p.featureId} as="div">
                  <p className="font-display text-lg font-semibold text-foreground">{p.role}</p>
                  <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{p.sees}</p>
                </Feature>
              </Spotlight>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section id="what-you-get" title="What changes for you" className="pt-0">
        {s.wins.map((w, n) => (
          <CapabilityBlock key={w.title} reverse={n % 2 === 1} title={w.title} body={<p>{w.body}</p>} features={[w.featureId]} media={s.media[n]} />
        ))}
        {s.honest && <p className="mt-8 rounded-2xl border border-dashed border-border px-5 py-4 text-[15px] leading-6 text-muted-foreground">{s.honest} <Link href="/roadmap" className="font-medium text-foreground underline underline-offset-4">The roadmap</Link></p>}
      </Section>
      {children}
      <CtaBand />
    </>
  )
}
