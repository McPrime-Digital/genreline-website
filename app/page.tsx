import Link from 'next/link'
import { Feature, FeatureLabel } from '@/components/FeatureLabel'
import { Media, hasMedia } from '@/components/site/Media'
import { BrandDemo } from '@/components/interactive/BrandDemo'
import { HomeJsonLd } from '@/components/site/JsonLd'
import { HeroStage } from '@/components/cinema/HeroStage'
import { SpacesSection } from '@/components/cinema/SpacesSection'
import { SuiteSection } from '@/components/cinema/SuiteSection'
import { ToolStack } from '@/components/cinema/ToolStack'
import { CapabilitySection } from '@/components/cinema/CapabilitySection'
import { Motif } from '@/components/cinema/Motif'
import { WhoItsFor } from '@/components/cinema/WhoItsFor'
import { CollaboratorMap } from '@/components/cinema/CollaboratorMap'
import { ProductionReel, type ReelFrame } from '@/components/cinema/ProductionReel'
import { RecordLedger } from '@/components/cinema/RecordLedger'
import { Reveal } from '@/components/cinema/Reveal'
import { Tilt } from '@/components/cinema/Tilt'
import { Spotlight } from '@/components/cinema/Spotlight'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/icons'
import { feature } from '@/content/features'
import { COLLABORATORS, SEGMENTS } from '@/content/segments'
import { APP } from '@/lib/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/')

const shot = (id: string, sizes = '(min-width: 1024px) 680px, 100vw') => (hasMedia(id) ? <Media id={id} frame={false} sizes={sizes} /> : null)

const REEL: ReelFrame[] = [
  { tc: '00:00:01:00', title: 'Script', body: 'Written and co-edited in the screenplay editor.', featureId: 'SWR-01' },
  { tc: '00:00:12:00', title: 'Breakdown', body: 'Scenes and elements read from the script.', media: 'crew-production', featureId: 'CRW-07' },
  { tc: '00:00:24:00', title: 'Shoot days', body: 'On the studio’s calendar and the client’s.', media: 'crew-calendar', featureId: 'CRW-08' },
  { tc: '00:00:31:00', title: 'Call sheet', body: 'Sealed, numbered, sent in your voice.', featureId: 'CRW-06' },
  { tc: '00:00:44:00', title: 'Crew', body: 'Tasks, rooms and people on the job.', media: 'crew-tasks', featureId: 'CRW-04' },
  { tc: '00:00:58:00', title: 'Cut', body: 'Versions stacked in the vault.', media: 'portal-files', featureId: 'APR-08' },
  { tc: '00:01:09:00', title: 'Review', body: 'Notes on the timecode, in sync.', media: 'portal-review', featureId: 'APR-14' },
  { tc: '00:01:21:00', title: 'Approval', body: 'On the record, with a certificate.', media: 'client-review-record', featureId: 'APR-02' },
  { tc: '00:01:33:00', title: 'Contract', body: 'Consent, signature, seal.', media: 'client-contracts', featureId: 'DOC-05' },
  { tc: '00:01:45:00', title: 'Invoice', body: 'Numbered, in the client’s portal.', media: 'client-invoices', featureId: 'MON-01' },
]

const STRIP_A = ['MSG-08', 'MSG-12', 'MSG-15', 'MSG-27', 'APR-12', 'APR-16', 'APR-17', 'APR-19', 'MTG-04', 'MTG-10', 'FIL-03', 'DOC-02']
const STRIP_B = ['IDN-15', 'IDN-16', 'IDN-14', 'IDN-18', 'MON-05', 'MON-06', 'CLI-11', 'NTF-02', 'NTF-03', 'UX-02', 'IDN-19', 'APR-18']

function Strip({ ids, reverse }: { ids: string[]; reverse?: boolean }) {
  const items = [...ids, ...ids]
  return (
    <div className={`marquee ${reverse ? 'marquee-reverse' : ''}`} style={{ ['--marquee-dur' as string]: '70s' }}>
      <ul className="marquee-track py-2">
        {items.map((id, n) => (
          <li key={n} data-feature-id={id} className="mx-1.5 whitespace-nowrap rounded-full border border-border bg-card/50 px-4 py-2 text-[14px] text-foreground backdrop-blur">
            {feature(id).title.split(' — ')[0]}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Heading({ kicker, title, lead }: { kicker: string; title: React.ReactNode; lead?: string }) {
  return (
    <Reveal>
      <p className="font-display text-[13px] font-semibold text-primary">{kicker}</p>
      <h2 className="mt-3 max-w-[22ch] font-display text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[56px]">{title}</h2>
      {lead && <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{lead}</p>}
    </Reveal>
  )
}

export default function Home() {
  const segShots = Object.fromEntries(SEGMENTS.flatMap((s) => s.media).filter(hasMedia).map((id) => [id, shot(id, '(min-width: 1024px) 420px, 100vw')]))
  return (
    <>
      <HomeJsonLd />
      <HeroStage />

      {/* THE SUITE — the first argument */}
      <section id="suite" className="relative isolate overflow-hidden py-24 sm:py-32">
        <Motif name="nebula" />
        <div className="container-wide">
          <Heading kicker="The Suite" title="Write it. Board it. Generate it. Cut it. Finish it. Remaster it." lead="The whole making of a film, in one suite: script and storyboards, moodboards and workflows, the Stage where every major image and video model works inside your production, hybrid live-action and generated shots, sound, edit, finishing, remastering, translation and 3D sets — with a budget on every generation and a record of every asset." />
          <div className="mt-14"><SuiteSection /></div>
          <Link href="/product/suite" className="mt-10 inline-flex h-12 items-center rounded-lg border border-glow/50 bg-glow/10 px-6 text-[15px] font-medium text-foreground backdrop-blur hover:bg-glow/20">Explore the whole Suite</Link>
        </div>
      </section>

      {/* The three spaces */}
      <section id="spaces" className="relative py-24 sm:py-32">
        <div className="container-wide">
          <Heading kicker="Three spaces, one record" title="Everything a studio does, in the space it belongs." lead="Crew is where you work. Client is where your clients meet the work. The Suite is where the work is made. Underneath all three is one record of who did what, and when." />
          <div className="mt-14"><SpacesSection /></div>
        </div>
      </section>

      {/* THE TOOLS IT REPLACES — the second argument */}
      <section id="tools" className="relative isolate overflow-hidden py-24 sm:py-32">
        <Motif name="stripboard" />
        <div className="container-wide">
          <Heading kicker="What it replaces" title="A studio runs on dozens of tools. Genreline is one." lead="Chat, tasks, scheduling, call sheets, review, screening, transfer, signatures, invoices, screenwriting, storyboards, moodboards, image and video generation, upscaling, dubbing, sound, finishing — each a separate login, a separate bill and a gap where the record falls through." />
          <div className="mt-14"><ToolStack /></div>
        </div>
      </section>

      {/* Every capability */}
      <section id="capabilities" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading kicker="Capabilities" title="Everything in Genreline — live and being built." lead="Nothing hidden. Every capability across the three spaces, the platform and the network, with its honest status." />
          <div className="mt-14"><CapabilitySection initial={36} /></div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="relative overflow-hidden py-24 sm:py-32">
        <div className="aurora -z-10 opacity-60" />
        <div className="container-wide">
          <Heading kicker="Who it is for" title="Built for the companies that make the work." lead="Pick the one that sounds like you — and see your setup, who you invite and exactly what each of them can see." />
          <div className="mt-14"><WhoItsFor segments={SEGMENTS} shots={segShots} /></div>
        </div>
      </section>

      {/* Everyone on the production */}
      <section id="people" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading kicker="Collaboration" title="Everyone on the production. Each with exactly what they need." lead="Your staff, your freelancers, your clients’ teams, the colourist you bring in for one job, the agency producer watching a screener, the actor signing a release. One system, and none of them sees more than their part." />
          <div className="mt-16"><CollaboratorMap people={COLLABORATORS} /></div>
        </div>
      </section>

      {/* The production, as a reel */}
      <section id="production" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading kicker="The whole production" title="From the first page of the script to the last invoice." lead="One chain, not a dozen tools. Each step reads from the one before it, so nothing is retyped and nothing falls through a gap." />
        </div>
        <div className="mt-14"><ProductionReel frames={REEL} /></div>
        <div className="container-wide mt-8"><Link href="/product/production" className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">How production works in Genreline</Link></div>
      </section>

      {/* The record */}
      <section id="the-record" className="relative overflow-hidden py-24 sm:py-32">
        <div className="viewfinder -z-10" />
        <div className="container-wide grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <Heading kicker="Review and approval" title="Every sign‑off, provable." />
            <Reveal delay={100}>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Who it went to, how much of the cut they actually watched, what they said on which frame, and when they decided — kept as one record with a printable certificate. Years later, “who approved v4?” takes ten seconds to answer.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] leading-6 text-foreground">
                <Feature id="APR-20" as="li" className="flex items-start gap-2.5"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />What the approver watched, joined to the decision</Feature>
                <Feature id="APR-11" as="li" className="flex items-start gap-2.5"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />Notes anchored to the timecode</Feature>
                <Feature id="APR-01" as="li" className="flex items-start gap-2.5"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />Review windows and a reminder ladder</Feature>
                <Feature id="APR-02" as="li" className="flex items-start gap-2.5"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />A certificate anyone can be handed</Feature>
              </ul>
              <p className="mt-6 border-l-2 border-primary pl-4 text-[15px] leading-6 text-muted-foreground">
                And if a review window closes with no answer, the production moves on and the record says exactly that — never a sign-off nobody gave.
              </p>
              <Link href="/product/review" className="mt-6 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Review and approval, in full</Link>
            </Reveal>
          </div>
          <Reveal delay={150}><RecordLedger /></Reveal>
        </div>
      </section>

      {/* Your clients see your studio */}
      <section id="your-brand" className="relative overflow-hidden py-24 sm:py-32">
        <div className="aurora -z-10 opacity-50" />
        <div className="container-wide">
          <Heading kicker="White-label" title="Your clients see your studio. Not us." lead="The portal, the screening links, the signing pages, the email and the sealed PDF carry your name and your colour. A client of your studio bought from your studio." />
          {hasMedia('home-portal-brand-a') && hasMedia('home-portal-brand-b') && (
            <div className="stage-3d mt-14 grid gap-6 md:grid-cols-2">
              <Reveal><div style={{ transform: 'rotateY(8deg)' }}><Tilt className="screen" max={5}><Media id="home-portal-brand-a" frame={false} sizes="(min-width: 768px) 560px, 100vw" /></Tilt></div></Reveal>
              <Reveal delay={120}><div style={{ transform: 'rotateY(-8deg)' }}><Tilt className="screen" max={5}><Media id="home-portal-brand-b" frame={false} sizes="(min-width: 768px) 560px, 100vw" /></Tilt></div></Reveal>
            </div>
          )}
          <div className="mt-16 rounded-3xl border border-border bg-card/40 p-6 backdrop-blur sm:p-10">
            <h3 className="font-display text-2xl font-bold text-foreground">Try it: one colour in, an accessible palette out.</h3>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-7 text-muted-foreground"><Feature id="CLI-05">Pick any colour. The type that sits on it is chosen by measured contrast, so no choice produces an unreadable Approve button.</Feature></p>
            <div className="mt-8"><BrandDemo /></div>
          </div>
        </div>
      </section>

      {/* Contracts + review, side by side */}
      <section className="py-24 sm:py-32">
        <div className="container-wide grid gap-6 lg:grid-cols-2">
          <Spotlight as="article" className="overflow-hidden rounded-3xl border border-border bg-card/40 p-6 sm:p-8">
            <p className="font-display text-[13px] font-semibold text-primary">Contracts and signing</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-foreground">Contracts that hold up.</h3>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">Fields placed on the PDF, consent before signature, a cryptographic seal with the certificate inside the file — and a signed release writes the rights it proves.</p>
            <div className="mt-6 screen">{shot('client-contracts', '(min-width: 1024px) 560px, 100vw')}</div>
            <ul className="mt-6 grid gap-2 text-[14px] text-foreground sm:grid-cols-2">
              {([['DOC-02', 'Fields placed on the PDF'], ['DOC-04', 'Consent before signature'], ['DOC-05', 'A cryptographic seal'], ['DOC-10', 'Releases that write rights']] as const).map(([id, t]) => <Feature key={id} id={id} as="li" className="flex items-center gap-2"><Check aria-hidden className="size-4 text-primary" />{t}</Feature>)}
            </ul>
          </Spotlight>
          <Spotlight as="article" className="overflow-hidden rounded-3xl border border-border bg-card/40 p-6 sm:p-8">
            <p className="font-display text-[13px] font-semibold text-primary">Meetings and review sessions</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-foreground">Review together. Keep the notes.</h3>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">A shared playhead that stays in sync across the room, drawings on the frame that outlive the call, and markers straight into Resolve, Final Cut and Premiere.</p>
            <div className="mt-6 screen">{shot('portal-review', '(min-width: 1024px) 560px, 100vw')}</div>
            <ul className="mt-6 grid gap-2 text-[14px] text-foreground sm:grid-cols-2">
              {([['APR-15', 'Synchronised playback'], ['APR-13', 'Drawings kept after the call'], ['APR-16', 'Markers to Resolve, FCP, Premiere'], ['APR-19', 'A colour-space warning']] as const).map(([id, t]) => <Feature key={id} id={id} as="li" className="flex items-center gap-2"><Check aria-hidden className="size-4 text-primary" />{t}</Feature>)}
            </ul>
          </Spotlight>
        </div>
      </section>

      {/* Everything else, moving */}
      <section aria-label="More of what is in Genreline" className="py-10">
        <Strip ids={STRIP_A} />
        <Strip ids={STRIP_B} reverse />
      </section>

      {/* Security */}
      <section id="security" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading kicker="Built like infrastructure" title="What a studio’s security team asks first, answered precisely." />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: 'FND-01', title: 'Isolation in the database', body: 'Studio isolation is enforced in the database, and proven by 76 automated security checks.' },
              { id: 'IDN-15', title: 'Two-factor and passkeys', body: 'Two-factor sign-in, passkeys, recovery codes, and a second check before sensitive actions.' },
              { id: 'IDN-14', title: 'Single sign-on and SCIM', body: 'SAML and OIDC on a proved domain, enforcement, just-in-time provisioning and SCIM 2.0.' },
              { id: 'IDN-17', title: 'Your own rules', body: 'Required two-factor, a maximum session age and an idle timeout, set by the studio.' },
              { id: 'FND-19', title: 'Application protections', body: 'Rate limiting, a per-request content security policy, bot protection and breached-password checks.' },
              { id: 'FND-13', title: 'Retention and erasure', body: 'A grace window before purge, seven years of activity ledger, and erasure with a stable pseudonym.' },
            ].map((f, n) => (
              <Reveal as="li" key={f.id} delay={n * 60}>
                <Spotlight className="h-full rounded-2xl border border-border bg-card/40 p-6">
                  <Feature id={f.id} as="div">
                    <p className="font-display text-lg font-semibold text-foreground">{f.title}</p>
                    <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{f.body}</p>
                  </Feature>
                </Spotlight>
              </Reveal>
            ))}
          </ul>
          <Link href="/security" className="mt-8 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Every control, and every gap, on the security page</Link>
        </div>
      </section>

      {/* What's next: AI and the network */}
      <section id="next" className="relative overflow-hidden py-24 sm:py-32">
        <div className="aurora -z-10 opacity-70" />
        <div className="container-wide grid gap-6 lg:grid-cols-2">
          <Spotlight className="rounded-3xl border border-border bg-card/40 p-8 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold text-foreground">AI with a budget and a record.</h2>
              <FeatureLabel id="STG-01" />
            </div>
            <p className="mt-4 text-[16px] leading-7 text-muted-foreground">Image and video generation is being built inside the production: many models through one gate, a ceiling on every call, a budget for every person, and provenance on every asset.</p>
            <p className="mt-3 text-[15px] leading-6 text-muted-foreground">The controls already govern text: <Feature id="MON-05">a per-call ceiling</Feature> and <Feature id="MON-06">a budget per person</Feature>.</p>
            <Link href="/ai" className="mt-6 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">AI and provenance</Link>
          </Spotlight>
          <Spotlight className="rounded-3xl border border-border bg-card/40 p-8 backdrop-blur">
            <h2 className="font-display text-3xl font-bold text-foreground">The filmmaker network.</h2>
            <p className="mt-4 text-[16px] leading-7 text-muted-foreground">Theater, Community, streaming and a marketplace — for filmmakers, studios and working actors.</p>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {[['TOP-02', 'Theater'], ['TOP-03', 'Community'], ['TOP-05', 'Streaming'], ['TOP-01', 'Marketplace']].map(([id, name]) => (
                <Feature key={id} id={id} as="li" className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-2.5">
                  <span className="font-display text-[15px] font-semibold text-foreground">{name}</span>
                  <FeatureLabel id={id} />
                </Feature>
              ))}
            </ul>
            <Link href="/network#early-access" className="mt-6 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Join early access</Link>
          </Spotlight>
        </div>
      </section>

      {/* Close */}
      <section className="relative isolate overflow-hidden py-28 sm:py-40">
        <div className="aurora -z-10" />
        <div className="flare top-1/2 -z-10" />
        <div className="container-wide text-center">
          <Reveal>
            <h2 className="mx-auto max-w-[18ch] font-display text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-7xl">The record starts with the first approval.</h2>
            <p className="mx-auto mt-6 max-w-[48ch] text-lg text-muted-foreground">Open a studio, invite your team, add your first client.</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild variant="primary" size="lg" data-primary-cta className="h-12 px-7 text-[15px] shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.7)]"><a href={APP.signup}>Open your studio</a></Button>
              <a href={APP.login} className="inline-flex h-12 items-center rounded-lg border border-border bg-background/40 px-6 text-[15px] font-medium text-foreground backdrop-blur hover:bg-secondary/60">Sign in</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
