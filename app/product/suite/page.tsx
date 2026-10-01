import Link from 'next/link'
import { CtaBand, PageHero, Section } from '@/components/site/Frame'
import { SuiteSection } from '@/components/cinema/SuiteSection'
import { Reveal } from '@/components/cinema/Reveal'
import { Motif, type MotifName } from '@/components/cinema/Motif'

const STAGE_MOTIF: Record<string, MotifName> = { write: 'slate', visualise: 'constellation', stage: 'contactsheet', hybrid: 'sprockets', automate: 'stripboard', sound: 'waveform', post: 'timecode', adapt: 'brand', worlds: 'vault', keep: 'ledger' }
import { Spotlight } from '@/components/cinema/Spotlight'
import { Media, hasMedia } from '@/components/site/Media'
import { feature, siteLabel } from '@/content/features'
import { SUITE_DETAIL, SUITE_STAGES } from '@/content/suite'
import { TOOL_GROUPS } from '@/content/tools'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/suite')

export default function Suite() {
  const suiteTools = TOOL_GROUPS.find((g) => g.space === 'The Suite')!.tools
  return (
    <>
      <PageHero
        motif="contactsheet"
        kicker="The Suite"
        title="The whole making of a film, in one suite."
        lead="Write it, board it, generate it, shoot it, cut it, score it, finish it, remaster it and send it to every screen — inside the same production, with a budget on every generation and a record of every asset."
        media={['suite-library']}
      >
        <div className="flex flex-wrap gap-2">
          {SUITE_STAGES.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border border-glow/40 bg-glow/10 px-3.5 py-1.5 text-[13px] font-medium text-foreground backdrop-blur hover:bg-glow/20">{s.name}</a>)}
        </div>
      </PageHero>

      <Section id="console" kicker="Ten stages of making" title="Every stage, one place.">
        <SuiteSection />
      </Section>

      {SUITE_STAGES.map((st, n) => {
        const ids = st.ids.filter((id) => siteLabel(id))
        return (
          <section key={st.id} id={st.id} className="relative isolate overflow-hidden py-20 sm:py-24">
            <Motif name={STAGE_MOTIF[st.id] ?? 'slate'} />
            <div className="container-wide">
              <Reveal>
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-border pt-10">
                  <span className="font-display text-[15px] tabular-nums text-glow">{String(n + 1).padStart(2, '0')}</span>
                  <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">{st.name}</h2>
                </div>
                <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{st.line}</p>
              </Reveal>
              <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ids.map((id, k) => {
                  const d = SUITE_DETAIL[id]
                  const label = siteLabel(id)!
                  return (
                    <Reveal as="li" key={id} delay={k * 60}>
                      <Spotlight className="h-full rounded-2xl border border-border bg-card/40 p-6 backdrop-blur" >
                        <div data-feature-id={id}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-xl font-semibold leading-snug text-foreground">{feature(id).title.split(' — ')[0]}</p>
                            <span data-feature-label={label.toLowerCase()} data-feature-id={id} className={`mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${label === 'Coming' ? 'bg-status-blue/15 text-status-blue' : 'bg-status-green/15 text-status-green'}`}>{label}</span>
                          </div>
                          {d && <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{d.does}</p>}
                          {d && <ul className="mt-4 space-y-1.5">{d.points.map((p) => <li key={p} className="flex gap-2.5 text-[14px] leading-5 text-foreground/90"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-glow" />{p}</li>)}</ul>}
                        </div>
                      </Spotlight>
                    </Reveal>
                  )
                })}
              </ul>
              {st.id === 'keep' && hasMedia('suite-library') && <div className="mt-10 screen"><Media id="suite-library" frame={false} /></div>}
            </div>
          </section>
        )
      })}

      <Section id="replaces" kicker="What the Suite replaces" title="A tab and a subscription for every step — or one suite.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suiteTools.map((t) => (
            <li key={t.job} data-feature-id={t.featureId} className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-display text-lg font-semibold text-foreground">{t.job}</p>
              <p className="mt-1 text-[14px] text-muted-foreground line-through decoration-destructive/50">{t.today}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[15px] text-muted-foreground">Every generation runs through one gate — a budget, a ceiling and provenance on every asset. <Link href="/ai" className="font-medium text-foreground underline underline-offset-4">How it works</Link></p>
      </Section>
      <CtaBand line="Open a studio and start writing. The Suite grows with every stage." />
    </>
  )
}
