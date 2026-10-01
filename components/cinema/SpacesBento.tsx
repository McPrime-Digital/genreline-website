/**
 * The spaces and portals, as a bento: each tile its icon, its name, what it
 * is for, a real screen and what is in it — straight under the hero.
 */
import Link from 'next/link'
import { Media, hasMedia } from '@/components/site/Media'
import { Icon, type IconName } from '@/components/Icon'
import { SUITE_STAGES } from '@/content/suite'

type Item = { icon: IconName; text: string; id: string }
const STAGE_ICON: Record<string, IconName> = { write: 'PenTool', visualise: 'LayoutGrid', stage: 'WandSparkles', hybrid: 'Combine', automate: 'Workflow', sound: 'AudioWaveform', post: 'Scissors', adapt: 'ImageUpscale', worlds: 'Box', keep: 'Library' }

function Items({ items }: { items: Item[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i.text} data-feature-id={i.id} className="flex items-start gap-2.5 text-[14px] leading-5 text-foreground">
          <Icon name={i.icon} className="mt-0.5 size-4 text-primary" />{i.text}
        </li>
      ))}
    </ul>
  )
}

function Tile({ id, icon, kicker, title, line, href, media, items, className = '', children }: { id: string; icon: IconName; kicker: string; title: string; line: string; href: string; media?: string; items?: Item[]; className?: string; children?: React.ReactNode }) {
  return (
    <article id={id} className={`group flex flex-col overflow-hidden rounded-3xl border border-border bg-card/40 ${className}`}>
      <div className="p-7 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-primary"><Icon name={icon} className="size-5" /></span>
          <span className="font-display text-[13px] font-semibold text-muted-foreground">{kicker}</span>
        </div>
        <h3 className="mt-5 font-display text-3xl font-bold tracking-[-0.02em] text-foreground">{title}</h3>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-6 text-muted-foreground">{line}</p>
        {items && <div className="mt-6"><Items items={items} /></div>}
        {children}
        <Link href={href} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Explore {title}</Link>
      </div>
      {media && hasMedia(media) && (
        <div className="mt-auto px-7 sm:px-8">
          <div className="overflow-hidden rounded-t-xl border border-b-0 border-border transition-transform duration-500 ease-[--ease-out] group-hover:-translate-y-1">
            <Media id={media} frame={false} sizes="(min-width: 1024px) 560px, 100vw" className="!rounded-none" />
          </div>
        </div>
      )}
    </article>
  )
}

export function SpacesBento() {
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* THE SUITE — widest, first */}
      <article id="space-suite" className="overflow-hidden rounded-3xl border border-border bg-card/40 lg:col-span-12">
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-primary"><Icon name="Clapperboard" className="size-5" /></span>
              <span className="font-display text-[13px] font-semibold text-muted-foreground">Space · where the work is made</span>
            </div>
            <h3 className="mt-5 font-display text-4xl font-bold tracking-[-0.025em] text-foreground">The Suite</h3>
            <p className="mt-3 text-[16px] leading-7 text-muted-foreground">The whole making of an AI or hybrid film in one place: script and boards, moodboards and workflows, the Stage where every major image and video model works inside your production, sound, edit, finishing, remastering, translation and 3D worlds.</p>
            <Link href="/product/suite" className="mt-6 inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-secondary/60">Explore the Suite</Link>
          </div>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">
            {SUITE_STAGES.map((s, i) => (
              <li key={s.id}>
                <Link href={`/product/suite#${s.id}`} className="flex h-full flex-col gap-3 bg-background p-4 transition-colors hover:bg-card">
                  <span className="flex items-center justify-between"><Icon name={STAGE_ICON[s.id]} className="size-5 text-primary" /><span className="font-display text-[11px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span></span>
                  <span className="font-display text-[14px] font-semibold leading-tight text-foreground">{s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <Tile className="lg:col-span-6" id="space-crew" icon="UsersRound" kicker="Space · where the studio works" title="Crew" href="/product/crew" media="crew-tasks"
        line="Your producers, editors, artists and freelancers — who is on the job, what they are doing and exactly what they may see."
        items={[
          { icon: 'Contact', text: 'A directory with skills, rates and availability', id: 'CRW-02' },
          { icon: 'ListChecks', text: 'Tasks across your team and the client’s', id: 'CRW-04' },
          { icon: 'MessagesSquare', text: 'Internal rooms, threads and calls', id: 'MSG-02' },
          { icon: 'KeyRound', text: 'Roles, project roles, grants and denials', id: 'IDN-04' },
        ]} />
      <Tile className="lg:col-span-6" id="space-client" icon="Building2" kicker="Space · where clients are run" title="Client" href="/product/client" media="client-messages"
        line="Every client company with its projects, its team and one shared room — the cuts, the approvals, the contracts and the invoices in one place."
        items={[
          { icon: 'MessagesSquare', text: 'One room per client company', id: 'MSG-01' },
          { icon: 'ScanEye', text: 'Approvals with a certificate', id: 'APR-02' },
          { icon: 'FileSignature', text: 'Contracts, sealed and certified', id: 'DOC-05' },
          { icon: 'Receipt', text: 'Invoices and payment details', id: 'MON-01' },
        ]} />
      <Tile className="lg:col-span-7" id="space-portal" icon="AppWindow" kicker="Portal · in your brand" title="Client portal" href="/product/client" media="home-portal-brand-a"
        line="What your client signs into: your name, your logo, your colour. They review frame by frame, approve, sign, book meetings and pay — and never see a vendor’s name but yours."
        items={[
          { icon: 'ScanEye', text: 'Frame-accurate review and notes', id: 'APR-14' },
          { icon: 'PenLine', text: 'Consent, then signature', id: 'DOC-04' },
          { icon: 'CalendarClock', text: 'Booking from your availability', id: 'MTG-04' },
          { icon: 'Palette', text: 'One colour in, a full brand out', id: 'CLI-05' },
        ]} />
      <Tile className="lg:col-span-5" id="space-guests" icon="Link" kicker="Portals · no account needed" title="Guest links" href="/product/files"
        line="For the people who never log in: the agency producer, the performer, the editor in another studio.">
        <ul className="mt-6 space-y-3">
          {[
            { icon: 'Eye' as IconName, t: 'Screening links', d: 'A cut behind a passcode, watermarked with the viewer’s name — and how far they watched.', id: 'CLI-08' },
            { icon: 'Stamp' as IconName, t: 'Signing links', d: 'One release to sign, once, from a phone.', id: 'DOC-09' },
            { icon: 'Plug' as IconName, t: 'Editor panel bridge', d: 'Notes and resolves from inside the editor.', id: 'APR-17' },
          ].map((g) => (
            <li key={g.t} data-feature-id={g.id} className="flex gap-3 rounded-xl border border-border bg-background/60 p-4">
              <Icon name={g.icon} className="mt-0.5 size-5 text-primary" />
              <span><span className="block font-display text-[15px] font-semibold text-foreground">{g.t}</span><span className="text-[13px] leading-5 text-muted-foreground">{g.d}</span></span>
            </li>
          ))}
        </ul>
      </Tile>
      <article id="space-platform" className="rounded-3xl border border-border bg-card/40 p-7 sm:p-8 lg:col-span-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-primary"><Icon name="ShieldCheck" className="size-5" /></span>
            <div><p className="font-display text-xl font-bold text-foreground">The platform underneath</p><p className="text-[14px] text-muted-foreground">Identity, isolation and one record across every space</p></div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:gap-6">
            {([['Fingerprint', 'SSO and SCIM', 'IDN-14'], ['KeyRound', 'Two-factor and passkeys', 'IDN-15'], ['Database', 'Isolation in the database', 'FND-01'], ['ScrollText', 'Permission ledger', 'IDN-06']] as [IconName, string, string][]).map(([ic, t, id]) => (
              <li key={t} data-feature-id={id} className="flex items-center gap-2 text-[14px] text-foreground"><Icon name={ic} className="size-4 text-primary" />{t}</li>
            ))}
          </ul>
          <Link href="/security" className="text-[14px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Security</Link>
        </div>
      </article>
    </div>
  )
}
