import Link from 'next/link'
import { Feature, FeatureLabel } from '@/components/FeatureLabel'
import { Media, hasMedia } from '@/components/site/Media'
import { BrandDemo } from '@/components/interactive/BrandDemo'
import { HomeJsonLd } from '@/components/site/JsonLd'
import { HeroStage } from '@/components/cinema/HeroStage'
import { SpacesBento } from '@/components/cinema/SpacesBento'
import { SuiteSection } from '@/components/cinema/SuiteSection'
import { ToolStack } from '@/components/cinema/ToolStack'
import { CapabilitySection } from '@/components/cinema/CapabilitySection'
import { WhoItsFor } from '@/components/cinema/WhoItsFor'
import { CollaboratorMap } from '@/components/cinema/CollaboratorMap'
import { ProductionReel, type ReelFrame } from '@/components/cinema/ProductionReel'
import { RecordLedger } from '@/components/cinema/RecordLedger'
import { Reveal } from '@/components/cinema/Reveal'
import { Tilt } from '@/components/cinema/Tilt'
import { Spotlight } from '@/components/cinema/Spotlight'
import { Motif } from '@/components/cinema/Motif'
import { Icon, type IconName } from '@/components/Icon'
import { feature, siteLabel } from '@/content/features'
import { COLLABORATORS, SEGMENTS } from '@/content/segments'
import { APP } from '@/lib/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/')

const shot = (id: string, sizes = '(min-width: 1024px) 680px, 100vw') => (hasMedia(id) ? <Media id={id} frame={false} sizes={sizes} /> : null)

/** The AI and hybrid production cycle, as a strip of film. */
const REEL: ReelFrame[] = (
  [
    ['00:00:01:00', 'Script', 'Written and co-edited live in Script Design.', undefined, 'SWR-01'],
    ['00:00:09:00', 'Breakdown', 'Scenes, characters and looks read from the script.', 'crew-production', 'CRW-07'],
    ['00:00:17:00', 'Boards', 'Storyboards shot by shot, prompts on every frame.', undefined, 'SWR-09'],
    ['00:00:24:00', 'Moodboards', 'References and palettes pinned to scenes.', undefined, 'NEW-01'],
    ['00:00:33:00', 'Generate', 'The Stage — every major image and video model, one gate.', undefined, 'STG-01'],
    ['00:00:41:00', 'Continuity', 'The same character and look, shot after shot.', undefined, 'STG-07'],
    ['00:00:47:00', 'Assemble', 'Build the cut from takes and generations.', undefined, 'PST-01'],
    ['00:00:52:00', 'Versions', 'Every new cut stacks on the last, compared side by side.', 'portal-files', 'APR-08'],
    ['00:01:03:00', 'Review', 'Notes on the timecode, sessions in sync.', 'portal-review', 'APR-14'],
    ['00:01:14:00', 'Approve', 'On the record, with a certificate.', 'client-review-record', 'APR-02'],
    ['00:01:22:00', 'Rights', 'Releases write the rights they prove.', 'client-contracts', 'DOC-10'],
    ['00:01:31:00', 'Finish', 'Grade, captions, delivery specs.', undefined, 'PST-04'],
    ['00:01:39:00', 'Every version', 'Cutdowns, ratios and languages from one master.', undefined, 'STG-13'],
    ['00:01:48:00', 'Invoice', 'Numbered, in the client’s portal.', 'client-invoices', 'MON-01'],
  ] as const
).map(([tc, title, body, media, featureId]) => ({ tc, title, body, media, featureId, coming: siteLabel(featureId) === 'Coming' }))

const STRIP_A = ['MSG-08', 'MSG-12', 'MSG-15', 'MSG-27', 'APR-12', 'APR-16', 'APR-17', 'APR-19', 'MTG-04', 'MTG-10', 'FIL-03', 'DOC-02']
const STRIP_B = ['IDN-15', 'IDN-16', 'IDN-14', 'IDN-18', 'MON-05', 'MON-06', 'CLI-11', 'NTF-02', 'NTF-03', 'UX-02', 'IDN-19', 'APR-18']

function Strip({ ids, reverse }: { ids: string[]; reverse?: boolean }) {
  const items = [...ids, ...ids]
  return (
    <div className={`marquee ${reverse ? 'marquee-reverse' : ''}`} style={{ ['--marquee-dur' as string]: '80s' }}>
      <ul className="marquee-track py-2">
        {items.map((id, n) => (
          <li key={n} data-feature-id={id} className="mx-1.5 whitespace-nowrap rounded-lg border border-border bg-card/60 px-4 py-2 text-[14px] text-foreground">
            {feature(id).title.split(' — ')[0]}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Heading({ kicker, title, lead, icon }: { kicker: string; title: React.ReactNode; lead?: string; icon?: IconName }) {
  return (
    <Reveal>
      <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-primary">{icon && <Icon name={icon} className="size-4" />}{kicker}</p>
      <h2 className="mt-3 max-w-[22ch] font-display text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[56px]">{title}</h2>
      {lead && <p className="mt-5 max-w-[64ch] text-lg leading-relaxed text-muted-foreground">{lead}</p>}
    </Reveal>
  )
}

const SECURITY: { id: string; icon: IconName; title: string; body: string }[] = [
  { id: 'FND-01', icon: 'Database', title: 'Isolation in the database', body: 'Studio isolation is enforced in the database, and proven by 76 automated security checks.' },
  { id: 'IDN-15', icon: 'KeyRound', title: 'Two-factor and passkeys', body: 'Two-factor sign-in, passkeys, recovery codes, and a second check before sensitive actions.' },
  { id: 'IDN-14', icon: 'Fingerprint', title: 'Single sign-on and SCIM', body: 'SAML and OIDC on a proved domain, enforcement, just-in-time provisioning and SCIM 2.0.' },
  { id: 'IDN-17', icon: 'Timer', title: 'Your own rules', body: 'Required two-factor, a maximum session age and an idle timeout, set by the studio.' },
  { id: 'FND-19', icon: 'ShieldCheck', title: 'Application protections', body: 'Rate limiting, a per-request content security policy, bot protection and breached-password checks.' },
  { id: 'FND-13', icon: 'Archive', title: 'Retention and erasure', body: 'A grace window before purge, seven years of activity ledger, and erasure with a stable pseudonym.' },
]

export default function Home() {
  const segShots = Object.fromEntries(SEGMENTS.flatMap((s) => s.media).filter(hasMedia).map((id) => [id, shot(id, '(min-width: 1024px) 420px, 100vw')]))
  return (
    <>
      <HomeJsonLd />
      <HeroStage />

      {/* 1 — THE SPACES AND PORTALS */}
      <section id="spaces" className="relative py-20 sm:py-28">
        <div className="container-wide">
          <Heading icon="LayoutDashboard" kicker="Spaces and portals" title="Three spaces, the portals between them, one record." lead="The Crew space is where your studio works. The Client space is where every client company is run, and the portal is what they sign into — in your brand. The Suite is where the film is made. Guests and signers come in through links of their own." />
          <div className="mt-14"><SpacesBento /></div>
        </div>
      </section>

      {/* 2 — THE SUITE, IN FULL */}
      <section id="suite" className="relative isolate overflow-hidden py-24 sm:py-32">
        <Motif name="contactsheet" />
        <div className="container-wide">
          <Heading icon="Clapperboard" kicker="The Suite" title="Write it. Board it. Generate it. Cut it. Finish it. Remaster it." lead="Ten stages of making an AI or hybrid film — from the first line of the script, through boards, moodboards and the Stage where every major model works inside your production, to sound, edit, finishing, remastering, every language and every ratio, and 3D worlds. Each tool below says what it does, live today or being built." />
          <div className="mt-14"><SuiteSection /></div>
          <Link href="/product/suite" className="mt-10 inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-6 text-[15px] font-medium text-foreground hover:bg-secondary/60"><Icon name="Clapperboard" className="size-4 text-primary" />Explore the whole Suite</Link>
        </div>
      </section>

      {/* 3 — WHAT IT REPLACES */}
      <section id="tools" className="relative py-24 sm:py-32">
        <div className="container-wide">
          <Heading icon="Layers" kicker="What it replaces" title="A studio runs on dozens of tools. Genreline is one." lead="Chat, tasks, scheduling, review, screening, transfer, signatures, invoices, screenwriting, storyboards, moodboards, image and video generation, upscaling, dubbing, sound and finishing — each a separate login, a separate bill, and a gap where the record falls through." />
          <div className="mt-14"><ToolStack /></div>
        </div>
      </section>

      {/* 4 — EVERY CAPABILITY */}
      <section id="capabilities" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading icon="Grid3x3" kicker="Capabilities" title="Everything in Genreline — live, and being built." lead="Nothing hidden. Every capability across the Suite, the Crew and Client spaces, the portal, the platform and the network, with its honest status." />
          <div className="mt-14"><CapabilitySection initial={36} /></div>
        </div>
      </section>

      {/* 5 — WHO IT IS FOR */}
      <section id="who" className="relative py-24 sm:py-32">
        <div className="container-wide">
          <Heading icon="Building2" kicker="Who it is for" title="Built for the companies that make the work." lead="Pick the one that sounds like you — and see your setup, who you invite and exactly what each of them can see." />
          <div className="mt-14"><WhoItsFor segments={SEGMENTS} shots={segShots} /></div>
        </div>
      </section>

      {/* 6 — EVERYONE ON THE PRODUCTION */}
      <section id="people" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading icon="Network" kicker="Collaboration" title="Everyone on the production. Each with exactly what they need." lead="Your staff, your freelancers, your clients’ teams, the artist you bring in for one job, the agency producer watching a screener, the performer signing a likeness release. One system, and none of them sees more than their part." />
          <div className="mt-16"><CollaboratorMap people={COLLABORATORS} /></div>
        </div>
      </section>

      {/* 7 — THE AI PRODUCTION CYCLE */}
      <section id="production" className="py-24 sm:py-32">
        <div className="container-wide">
          <Heading icon="Film" kicker="The production cycle" title="From the first line to the delivered master." lead="Script, breakdown, boards, generation, continuity, assembly, review, approval, rights, finishing, every version and the invoice — one chain, each stage reading from the one before it." />
        </div>
        <div className="mt-14"><ProductionReel frames={REEL} /></div>
        <div className="container-wide mt-8"><Link href="/product/production" className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">The whole cycle, stage by stage</Link></div>
      </section>

      {/* 8 — THE RECORD */}
      <section id="the-record" className="relative isolate overflow-hidden py-24 sm:py-32">
        <Motif name="timecode" />
        <div className="container-wide grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <Heading icon="BadgeCheck" kicker="Review and approval" title="Every sign‑off, provable." />
            <Reveal delay={100}>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Who it went to, how much of the cut they actually watched, what they said on which frame, and when they decided — kept as one record with a printable certificate. Years later, “who approved v4?” takes ten seconds to answer.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] leading-6 text-foreground">
                {([['APR-20', 'Eye', 'What the approver watched, joined to the decision'], ['APR-11', 'Timer', 'Notes anchored to the timecode'], ['APR-01', 'Bell', 'Review windows and a reminder ladder'], ['APR-02', 'Award', 'A certificate anyone can be handed']] as [string, IconName, string][]).map(([id, ic, t]) => (
                  <Feature key={id} id={id} as="li" className="flex items-start gap-3"><Icon name={ic} className="mt-0.5 size-5 text-primary" />{t}</Feature>
                ))}
              </ul>
              <p className="mt-6 border-l-2 border-primary pl-4 text-[15px] leading-6 text-muted-foreground">
                And if a review window closes with no answer, the production moves on and the record says exactly that — never a sign-off nobody gave.
              </p>
            </Reveal>
          </div>
          <Reveal delay={150}><RecordLedger /></Reveal>
        </div>
      </section>

      {/* 9 — YOUR BRAND */}
      <section id="your-brand" className="relative isolate overflow-hidden py-24 sm:py-32">
        <Motif name="brand" />
        <div className="container-wide">
          <Heading icon="Palette" kicker="White-label" title="Your clients see your studio. Not us." lead="The portal, the screening links, the signing pages, the email and the sealed PDF carry your name and your colour. A client of your studio bought from your studio." />
          {hasMedia('home-portal-brand-a') && hasMedia('home-portal-brand-b') && (
            <div className="stage-3d mt-14 grid gap-6 md:grid-cols-2">
              <Reveal><div className="float-a" style={{ transform: 'rotateY(8deg)' }}><Tilt className="screen" max={5}><Media id="home-portal-brand-a" frame={false} sizes="(min-width: 768px) 560px, 100vw" /></Tilt></div></Reveal>
              <Reveal delay={120}><div className="float-b" style={{ transform: 'rotateY(-8deg)' }}><Tilt className="screen" max={5}><Media id="home-portal-brand-b" frame={false} sizes="(min-width: 768px) 560px, 100vw" /></Tilt></div></Reveal>
            </div>
          )}
          <div className="mt-16 rounded-3xl border border-border bg-card/40 p-6 sm:p-10">
            <h3 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground"><Icon name="Pipette" className="size-5 text-primary" />Try it: one colour in, an accessible palette out.</h3>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-7 text-muted-foreground"><Feature id="CLI-05">Pick any colour. The type that sits on it is chosen by measured contrast, so no choice produces an unreadable Approve button.</Feature></p>
            <div className="mt-8"><BrandDemo /></div>
          </div>
        </div>
      </section>

      {/* 10 — CONTRACTS AND REVIEW SESSIONS */}
      <section className="py-24 sm:py-32">
        <div className="container-wide grid gap-6 lg:grid-cols-2">
          {[
            { kicker: 'Contracts and signing', icon: 'FileSignature' as IconName, title: 'Contracts that hold up.', body: 'Fields placed on the PDF, consent before signature, a cryptographic seal with the certificate inside the file — and a signed release writes the rights it proves.', media: 'client-contracts', items: [['DOC-02', 'Fields placed on the PDF'], ['DOC-04', 'Consent before signature'], ['DOC-05', 'A cryptographic seal'], ['DOC-10', 'Releases that write rights']] },
            { kicker: 'Meetings and review sessions', icon: 'MonitorPlay' as IconName, title: 'Review together. Keep the notes.', body: 'A shared playhead that stays in sync across the room, drawings on the frame that outlive the call, and markers straight into Resolve, Final Cut and Premiere.', media: 'portal-review', items: [['APR-15', 'Synchronised playback'], ['APR-13', 'Drawings kept after the call'], ['APR-16', 'Markers to Resolve, FCP, Premiere'], ['APR-19', 'A colour-space warning']] },
          ].map((c) => (
            <Spotlight key={c.title} as="article" className="overflow-hidden rounded-3xl border border-border bg-card/40 p-6 sm:p-8">
              <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-primary"><Icon name={c.icon} className="size-4" />{c.kicker}</p>
              <h3 className="mt-2 font-display text-3xl font-bold text-foreground">{c.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{c.body}</p>
              <div className="mt-6 screen">{shot(c.media, '(min-width: 1024px) 560px, 100vw')}</div>
              <ul className="mt-6 grid gap-2 text-[14px] text-foreground sm:grid-cols-2">
                {c.items.map(([id, t]) => <Feature key={id} id={id} as="li" className="flex items-center gap-2"><Icon name="Check" className="size-4 text-primary" />{t}</Feature>)}
              </ul>
            </Spotlight>
          ))}
        </div>
      </section>

      {/* everything else, moving */}
      <section aria-label="More of what is in Genreline" className="border-y border-border py-8">
        <Strip ids={STRIP_A} />
        <Strip ids={STRIP_B} reverse />
      </section>

      {/* 11 — SECURITY */}
      <section id="security" className="relative isolate overflow-hidden py-24 sm:py-32">
        <Motif name="vault" />
        <div className="container-wide">
          <Heading icon="ShieldCheck" kicker="Built like infrastructure" title="What a studio’s security team asks first, answered precisely." />
          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((f) => (
              <li key={f.id} className="bg-background p-7">
                <Feature id={f.id} as="div">
                  <span className="grid size-11 place-items-center rounded-xl border border-border bg-card text-primary"><Icon name={f.icon} className="size-5" /></span>
                  <p className="mt-5 font-display text-lg font-semibold text-foreground">{f.title}</p>
                  <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{f.body}</p>
                </Feature>
              </li>
            ))}
          </ul>
          <Link href="/security" className="mt-8 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Every control, and every gap, on the security page</Link>
        </div>
      </section>

      {/* 12 — WHAT'S NEXT */}
      <section id="next" className="py-24 sm:py-32">
        <div className="container-wide grid gap-6 lg:grid-cols-2">
          <Spotlight className="rounded-3xl border border-border bg-card/40 p-8">
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-primary"><Icon name="WandSparkles" className="size-5" /></span>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold text-foreground">AI with a budget and a record.</h2>
              <FeatureLabel id="STG-01" />
            </div>
            <p className="mt-4 text-[16px] leading-7 text-muted-foreground">Every generation goes through one gate: the studio’s budget, the person’s budget, a ceiling on the call, the right model for the shot, the queue, the meter — and provenance written onto the asset.</p>
            <p className="mt-3 text-[15px] leading-6 text-muted-foreground">The controls already govern text: <Feature id="MON-05">a per-call ceiling</Feature> and <Feature id="MON-06">a budget per person</Feature>.</p>
            <Link href="/ai" className="mt-6 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">AI and provenance</Link>
          </Spotlight>
          <Spotlight className="rounded-3xl border border-border bg-card/40 p-8">
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-primary"><Icon name="Globe" className="size-5" /></span>
            <h2 className="mt-5 font-display text-3xl font-bold text-foreground">The filmmaker network.</h2>
            <p className="mt-4 text-[16px] leading-7 text-muted-foreground">Theater, Community, streaming and a marketplace for likenesses, avatars and voices — for filmmakers, studios and working actors.</p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([['TOP-02', 'Theater', 'Tv'], ['TOP-03', 'Community', 'UsersRound'], ['TOP-05', 'Streaming', 'MonitorPlay'], ['TOP-01', 'Marketplace', 'Store']] as [string, string, IconName][]).map(([id, name, ic]) => (
                <Feature key={id} id={id} as="li" className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5">
                  <span className="flex items-center gap-2 font-display text-[15px] font-semibold text-foreground"><Icon name={ic} className="size-4 text-primary" />{name}</span>
                  <FeatureLabel id={id} />
                </Feature>
              ))}
            </ul>
            <Link href="/network#early-access" className="mt-6 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Join early access</Link>
          </Spotlight>
        </div>
      </section>

      {/* CLOSE */}
      <section className="relative isolate overflow-hidden border-t border-border py-28 sm:py-36">
        <Motif name="slate" />
        <div className="container-wide">
          <Reveal>
            <h2 className="max-w-[18ch] font-display text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-7xl">Every space of production. One operating system.</h2>
            <p className="mt-6 max-w-[52ch] text-lg text-muted-foreground">Open a studio, invite your team, add your first client — and make the film in the Suite.</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href={APP.signup} data-primary-cta className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Open Studio OS</a>
              <a href="/contact?topic=sales" className="liquid-pill liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Talk to sales</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
