import { Feature, FeatureLabel } from '@/components/FeatureLabel'
import { Media } from '@/components/site/Media'
import { PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/network')

const PARTS = [
  { id: 'TOP-02', anchor: 'theater', name: 'Theater', media: 'network-theater', body: 'A place for filmmakers to show their films — and what went into them: the boards, the takes, the people.' },
  { id: 'TOP-03', anchor: 'community', name: 'Community', media: 'network-community', body: 'Live feeds for the working industry: filmmakers, studios and actors following each other’s work.' },
  { id: 'TOP-05', anchor: 'streaming', name: 'Streaming', body: 'Films shown free or by subscription, from the people who made them.' },
  { id: 'TOP-01', anchor: 'marketplace', name: 'Marketplace', body: 'Likenesses, avatars and voices licensed with contracts — the same releases that already write the rights they prove inside a studio.' },
]

export default function Network() {
  return (
    <>
      <PageHero
        title="The filmmaker network."
        lead="Theater, Community, streaming and a marketplace — for filmmakers, studios and working actors. It lives outside every studio, and it is being built. Early access is open."
        size="md"
      />
      <Section className="pt-0">
        <div className="space-y-16">
          {PARTS.map((p, i) => (
            <Feature key={p.id} id={p.id} as="div">
              <div id={p.anchor} className={`grid items-center gap-8 ${p.media ? 'lg:grid-cols-2' : ''}`}>
                <div className={p.media && i % 2 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-3xl font-bold text-foreground">{p.name}</h2>
                    <FeatureLabel id={p.id} />
                  </div>
                  <p className="mt-3 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
                {p.media && <Media id={p.media} sizes="(min-width: 1024px) 560px, 100vw" />}
              </div>
            </Feature>
          ))}
        </div>
      </Section>
      <Section id="early-access" title="Join early access" lead="Tell us who you are and what you make. We will write when there is something to see.">
        <div id="early-access-form" />
      </Section>
    </>
  )
}
