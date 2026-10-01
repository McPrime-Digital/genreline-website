import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Feature, FeatureLabel, FeatureList } from '@/components/FeatureLabel'
import { CtaBand, Rule, Section } from '@/components/site/Frame'
import { Media, firstMedia, hasMedia } from '@/components/site/Media'
import { CaptureTabs } from '@/components/interactive/CaptureTabs'
import { RecordDemo } from '@/components/interactive/RecordDemo'
import { StackRow, type StackJob } from '@/components/interactive/StackRow'
import { BrandDemo } from '@/components/interactive/BrandDemo'
import { APP, SUBLINE, TAGLINE } from '@/lib/site'
import { pageMeta } from '@/lib/meta'
import { HomeJsonLd } from '@/components/site/JsonLd'

export const metadata = pageMeta('/')

const JOBS: StackJob[] = [
  { job: 'Chat', surface: 'Rooms where the client company is the other side', body: 'Each client company is a room the studio and the client share, with project tags, threads, mentions, read receipts and voice notes. The crew has its own rooms the client never sees.', href: '/product/client' },
  { job: 'Review', surface: 'Frame-accurate review that ends in a record', body: 'Notes anchored to a timecode, drawings on the frame, version compare, and markers out to Resolve, Final Cut and Premiere — attached to the approval they inform.', href: '/product/review' },
  { job: 'Approvals', surface: 'Approval as a record, not a status', body: 'Stages, review windows and reminders. When nobody answers, the stage advances and the record says so — never written as a sign-off nobody gave.', href: '/product/review' },
  { job: 'Signing', surface: 'Contracts sealed with the evidence inside', body: 'Templates, fields placed on the PDF, consent before signature, a cryptographic seal and a certificate of completion inside the file.', href: '/product/contracts' },
  { job: 'Scheduling', surface: 'A calendar and booking where the meeting is the booking', body: 'Approval deadlines, invoice dates and shoot days land on the calendar by themselves. Clients book from your availability.', href: '/product/meetings' },
  { job: 'Files', surface: 'A vault with resumable uploads and versions', body: 'Large uploads pause and resume. A new version stacks on its predecessor. Screening links record how far a guest actually watched.', href: '/product/files' },
  { job: 'Invoices', surface: 'Invoices and credits in the same place as the work', body: 'Invoices for clients, credits for metered work, a budget per person, and a ceiling on every AI call.', href: '/product/money' },
  { job: 'Scripts', surface: 'A screenplay editor the production reads from', body: 'Industry formatting, locked scenes, tracked changes and live co-editing. The breakdown is read from the script, not retyped from it.', href: '/product/suite' },
  { job: 'Call sheets', surface: 'Call sheets sealed, numbered and sent in your voice', body: 'Scenes, breakdown, stripboard and shoot days lead to a call sheet that goes out under your studio’s name, with every change a new version.', href: '/product/production' },
]

export default function Home() {
  const hero = firstMedia(['home-hero-room', 'client-messages', 'client-review-record'])
  const brandPair = hasMedia('home-portal-brand-a') && hasMedia('home-portal-brand-b')
  return (
    <>
      <HomeJsonLd />
      {/* 1. Hero */}
      <section className="pb-10 pt-14 sm:pt-20">
        <div className="container-wide">
          <Rule />
          <h1 className="mt-7 max-w-[15ch] font-display text-[40px] font-bold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-display-lg">{TAGLINE}</h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-8">{SUBLINE}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button asChild variant="primary" size="lg" data-primary-cta><a href={APP.signup}>Open your studio</a></Button>
            <Link href="#the-record" className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary">See how approval works</Link>
          </div>
          <p className="mt-5 text-[13px] text-muted-foreground">Inside in under a minute. Your clients are invited by you, never by us.</p>
        </div>
        <div className="container-wide mt-12">
          <CaptureTabs
            label="Screens from the product"
            tabs={[
              ...(hero ? [{ value: 'room', label: hero === 'client-review-record' ? 'An approval record' : 'A client room', panel: <Media id={hero} priority sizes="(min-width: 1200px) 1136px, 100vw" /> }] : []),
              // Further tabs appear only when their capture exists — a hero is
              // never a row of placeholders.
              ...[
                { value: 'record', label: 'An approval record', id: 'client-review-record' },
                { value: 'portal', label: 'The client’s calendar', id: 'portal-calendar' },
                { value: 'production', label: 'Production', id: 'crew-production' },
              ].filter((t) => t.id !== hero && hasMedia(t.id)).map((t) => ({ value: t.value, label: t.label, panel: <Media id={t.id} /> })),
            ]}
          />
        </div>
      </section>

      {/* 2. The stack you're replacing */}
      <Section id="the-stack" title="Production lives across a dozen tools. The seams are where time and money go." lead="Pick a job your studio does today, and see where it lives in Genreline.">
        <StackRow jobs={JOBS} />
      </Section>

      {/* 3. The record — the wedge */}
      <Section
        id="the-record"
        title="When a client doesn’t respond, the production moves on — and the record says exactly that."
        lead="Not “approved”. Not a red badge. A named, timestamped automatic advance, and a certificate that says so in plain words. Step through it."
      >
        <RecordDemo />
        <p className="mt-10 max-w-[60ch] border-l-2 border-primary pl-4 text-lg leading-relaxed text-foreground">
          Every other tool reminds you. This one can tell you what happens if nobody answers, because it is the system that will do it.
        </p>
        <p className="mt-6"><Link href="/product/review" className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Review and approval, in full</Link></p>
      </Section>

      {/* 4. Three spaces */}
      <Section id="three-spaces" title="Three spaces, one record." lead="The studio works in Crew, serves clients in Client, and makes the work in the Suite. Everything they do lands in the same record.">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { name: 'Crew', href: '/product/crew', body: 'The team and the production: who is on the job, what they may see, and the schedule that comes out of the script.', items: ['CRW-04', 'CRW-07', 'CRW-06'] },
            { name: 'Client', href: '/product/client', body: 'Client work in your studio’s brand: the room, the cuts, the approvals, the contracts and the invoices.', items: ['MSG-01', 'APR-01', 'CLI-08'] },
            { name: 'The Suite', href: '/product/suite', body: 'Writing, boards and the library — and image and video generation, being built.', items: ['SWR-01', 'FIL-07', 'STG-01'] },
          ].map((s) => (
            <div key={s.name} className="flex flex-col squircle-lg border border-border bg-card/40 p-6">
              <h3 className="font-display text-xl font-semibold text-foreground">{s.name}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.body}</p>
              <FeatureList items={s.items} className="mt-5 flex-1" />
              <Link href={s.href} className="mt-6 text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">The {s.name === 'The Suite' ? 'Suite' : `${s.name} space`}</Link>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Your clients see your studio */}
      <Section id="your-brand" title="Your clients see your studio." lead="The portal, the screening links, the signing pages, the email and the sealed PDF wear your name and your colour. A client of your studio bought from your studio; nothing here says otherwise.">
        {brandPair && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Media id="home-portal-brand-a" sizes="(min-width: 1200px) 560px, (min-width: 768px) 50vw, 100vw" />
              <Media id="home-portal-brand-b" sizes="(min-width: 1200px) 560px, (min-width: 768px) 50vw, 100vw" />
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">The same portal screen, in two studios’ brands.</p>
          </>
        )}
        <div className={brandPair ? 'mt-14' : ''}>
          <h3 className="font-display text-2xl font-semibold text-foreground">One colour in. Readable type out, chosen by measurement.</h3>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-7 text-muted-foreground">
            <Feature id="CLI-05">A studio picks one colour and the rest is derived — including the colour of the type that sits on it, so no choice produces an unreadable Approve button.</Feature>
          </p>
          <div className="mt-8"><BrandDemo /></div>
        </div>
      </Section>

      {/* 6. Contracts that hold up */}
      <Section id="contracts" title="Contracts that hold up.">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">Fields placed on the PDF, consent before signature, a cryptographic seal, and a certificate of completion sealed inside the file — so the file proves itself to anybody who holds it.</p>
            <p className="mt-4 text-lg font-medium leading-relaxed text-foreground">A signed release writes the rights it proves.</p>
            <FeatureList items={['DOC-02', 'DOC-04', 'DOC-05', 'DOC-06', 'DOC-10']} className="mt-6" />
            <Link href="/product/contracts" className="mt-6 inline-block text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Contracts and signing</Link>
          </div>
          <Media id="client-contracts" sizes="(min-width: 1200px) 660px, 100vw" />
        </div>
      </Section>

      {/* 7. Review together, keep the notes */}
      <Section id="review-together" title="Review together, keep the notes.">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Media id="portal-review" sizes="(min-width: 1200px) 660px, 100vw" />
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">A shared playhead that stays in sync across the room, drawings on the frame that outlive the call, and markers that go straight into the edit.</p>
            <FeatureList items={['APR-15', 'APR-13', { id: 'APR-16', text: 'Marker export to Resolve, Final Cut and Premiere' }, 'APR-19']} className="mt-6" />
            <Link href="/product/meetings" className="mt-6 inline-block text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Meetings and review sessions</Link>
          </div>
        </div>
      </Section>

      {/* 8. AI with a budget and a record */}
      <Section id="ai">
        <div className="squircle-xl border border-border bg-card/40 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="ai-title" className="font-display text-3xl font-bold text-foreground sm:text-4xl">AI with a budget and a record.</h2>
            <FeatureLabel id="STG-01" />
          </div>
          <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            Image and video generation is being built inside the production, not beside it: many models through one gate, a ceiling on every call, a budget for every person, and provenance on every asset.
          </p>
          <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-muted-foreground">
            The controls already exist for text: <Feature id="MON-05">a per-call ceiling that asks before anything expensive runs</Feature>, and <Feature id="MON-06">a budget per person, visible to the person it governs</Feature>.
          </p>
          <Link href="/ai" className="mt-6 inline-block text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">AI and provenance</Link>
        </div>
      </Section>

      {/* 9. Built like infrastructure */}
      <Section id="infrastructure" title="Built like infrastructure." lead="What a studio’s security team asks first, answered precisely.">
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 'FND-01', title: 'Isolation in the database', body: 'Studio isolation is enforced in the database, and proven by 76 automated security checks.' },
            { id: 'IDN-15', title: 'Two-factor and passkeys', body: 'Two-factor sign-in, passkeys, recovery codes, and a second check before sensitive actions.' },
            { id: 'IDN-14', title: 'Single sign-on and SCIM', body: 'SAML and OIDC with a proved domain, enforcement, just-in-time provisioning and SCIM 2.0.' },
            { id: 'IDN-17', title: 'Your own rules', body: 'A studio can require two-factor and set its own session limits.' },
            { id: 'FND-19', title: 'Application protections', body: 'Rate limiting, a per-request content security policy, bot protection and breached-password checks.' },
            { id: 'FND-13', title: 'Retention and erasure', body: 'Soft delete with a grace window, seven-year retention of the activity ledger, and person erasure with a stable pseudonym.' },
          ].map((f) => (
            <Feature key={f.id} id={f.id} as="li">
              <Link href="/security" className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="font-display text-[17px] font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-primary">{f.title}</span>
                <span className="mt-1 block text-[15px] leading-7 text-muted-foreground">{f.body}</span>
              </Link>
            </Feature>
          ))}
        </ul>
      </Section>

      {/* 10. The network */}
      <Section id="network" title="The filmmaker network." lead="Theater, Community, streaming and a marketplace — for filmmakers, studios and working actors. Being built, with early access open.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: 'TOP-02', name: 'Theater', body: 'Filmmakers show their films, and what went into them.' },
            { id: 'TOP-03', name: 'Community', body: 'Live feeds for the professional industry.' },
            { id: 'TOP-05', name: 'Streaming', body: 'Free or by subscription.' },
            { id: 'TOP-01', name: 'Marketplace', body: 'Likenesses, avatars and voices, licensed with contracts.' },
          ].map((n) => (
            <Feature key={n.id} id={n.id} as="li" className="squircle border border-border bg-card/40 p-5">
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-lg font-semibold text-foreground">{n.name}</span>
                <FeatureLabel id={n.id} />
              </span>
              <span className="mt-2 block text-[14px] leading-6 text-muted-foreground">{n.body}</span>
            </Feature>
          ))}
        </ul>
        <Link href="/network#early-access" className="mt-8 inline-block text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Join early access</Link>
      </Section>

      {/* 11. Close */}
      <CtaBand />
    </>
  )
}
