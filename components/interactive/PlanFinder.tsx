'use client'

/**
 * Which plan fits (S-W §7.9; S-PR §3.2 / §6, B-13). Every plan is priced PER
 * STAFF SEAT and takes a RANGE of seats — the slider picks the plan whose
 * range holds the answer and prices it for that many seats. Single sign-on is
 * Business (linked) and Enterprise (managed). Prices are the catalog's and are
 * provisional until launch; there is no buy button here — a studio opens free
 * at app.genreline.com/signup and chooses a plan inside.
 */
import * as React from 'react'
import Link from 'next/link'
import { Check, Minus } from '@/components/icons'
import { cx as cn } from '@/lib/cx'
import type { Plan } from '@/content/pricing'

const n = (v: number | null, unit = '') => (v === null ? 'By contract' : `${v.toLocaleString('en-US')}${unit}`)
const money = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: v % 1 ? 2 : 0 })}`
const gb = (v: number | null) => (v === null ? 'By contract' : v >= 1000 ? `${v / 1000} TB` : `${v} GB`)

export function PlanFinder({ plans }: { plans: readonly Plan[] }) {
  const [seats, setSeats] = React.useState(4)
  const [yearly, setYearly] = React.useState(false)
  const [sso, setSso] = React.useState<'none' | 'linked' | 'managed'>('none')

  const fits = (p: Plan) => seats >= p.seatRange.min && (p.seatRange.max === null || seats <= p.seatRange.max) && (sso === 'none' || p.sso === sso || (sso === 'linked' && p.sso === 'managed'))
  const pick = plans.find(fits) ?? plans[plans.length - 1]
  const seatsOn = (p: Plan) => Math.max(p.seatRange.min, Math.min(seats, p.seatRange.max ?? seats))
  const billFor = (p: Plan) => (p.price ? (yearly ? p.price.annual ?? p.price.amount * 10 : p.price.amount) * seatsOn(p) : null)

  const rows: { label: string; value: (p: Plan) => React.ReactNode }[] = [
    { label: 'Staff seats', value: (p) => (p.seatRange.max === null ? `${p.seatRange.min} and up` : `${p.seatRange.min}–${p.seatRange.max}`) },
    { label: 'Client companies included', value: (p) => n(p.clientCompanies) },
    { label: 'More companies', value: (p) => (p.extraCompany === null ? 'By contract' : `${money(p.extraCompany)} a month each`) },
    { label: 'People per company', value: (p) => `${p.peoplePerCompany}${p.extraPerson === null ? '' : `, then ${money(p.extraPerson)} each`}` },
    { label: 'Collaborator, per active month', value: (p) => (p.collaboratorMonth === null ? 'By contract' : money(p.collaboratorMonth)) },
    { label: 'Active storage, per seat', value: (p) => gb(p.storageGbPerSeat) },
    { label: 'Meeting minutes, per seat a month', value: (p) => n(p.meetingMinutesPerSeat) },
    { label: 'Largest call', value: (p) => n(p.largestCall) },
    { label: 'Playable video, per seat', value: (p) => n(p.playableMinutesPerSeat, ' min') },
    { label: 'Watched video, per seat a month', value: (p) => n(p.watchedMinutesPerSeat, ' min') },
    { label: 'Your studio’s name and logo on the portal', value: () => <Check aria-label="Included" className="size-4 text-status-green" /> },
    { label: 'White-label, everywhere it leaves the building', value: (p) => (p.whiteLabel === 'included' ? <Check aria-label="Included" className="size-4 text-status-green" /> : <span>Add-on</span>) },
    { label: 'Single sign-on', value: (p) => (p.sso === 'none' ? <Minus aria-label="Not included" className="size-4 text-faint" /> : p.sso === 'linked' ? 'Linked' : 'Linked + managed, SCIM') },
    { label: 'Job posts included', value: (p) => (p.jobPostsIncluded ? `${p.jobPostsIncluded} a month` : <Minus aria-label="None" className="size-4 text-faint" />) },
  ]

  return (
    <div className="space-y-10">
      <div className="grid gap-6 squircle-lg border border-border bg-card/40 p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <label htmlFor="pf-seats" className="flex items-baseline justify-between text-[13px] font-medium text-foreground">
            Staff seats <span className="tabular-nums text-muted-foreground">{seats >= 120 ? '120 or more' : seats}</span>
          </label>
          <input id="pf-seats" type="range" min={1} max={120} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-3 w-full accent-[hsl(var(--primary))]" />
          <p className="mt-2 text-[12px] text-muted-foreground">People who work for your studio and log in. Collaborators and your clients’ people are not seats.</p>
        </div>
        <div>
          <span className="block text-[13px] font-medium text-foreground">Billing</span>
          <div role="radiogroup" aria-label="Billing interval" className="mt-3 flex rounded-lg bg-secondary/60 p-0.5 text-[12px]">
            {([false, true] as const).map((y) => (
              <button key={String(y)} type="button" role="radio" aria-checked={yearly === y} onClick={() => setYearly(y)} className={cn('min-h-[36px] flex-1 rounded-md px-3', yearly === y ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>{y ? 'Yearly · two months free' : 'Monthly'}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="block text-[13px] font-medium text-foreground">Sign-in</span>
          <div role="radiogroup" aria-label="Single sign-on" className="mt-3 flex rounded-lg bg-secondary/60 p-0.5 text-[12px]">
            {(['none', 'linked', 'managed'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={sso === m} onClick={() => setSso(m)} className={cn('min-h-[36px] flex-1 rounded-md px-2', sso === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>{m === 'none' ? 'Passwords' : m === 'linked' ? 'Linked SSO' : 'Managed'}</button>
            ))}
          </div>
        </div>
        <p className="text-[15px] text-foreground sm:col-span-3" aria-live="polite">
          <span className="font-semibold text-foreground">{pick.name}</span> takes {seats >= 120 ? 'a hundred and twenty or more' : seats} staff seat{seats === 1 ? '' : 's'}{sso !== 'none' ? ` with ${sso === 'linked' ? 'linked' : 'managed'} sign-in` : ''}
          {billFor(pick) !== null ? <> — <span className="tabular-nums">{money(billFor(pick)!)}</span> {yearly ? 'a year' : 'a month'} for {seatsOn(pick)} seat{seatsOn(pick) === 1 ? '' : 's'}.</> : ' — by contract.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((p) => {
          const chosen = p.id === pick.id
          return (
            <section
              key={p.id}
              aria-labelledby={`plan-${p.id}`}
              data-chosen={chosen}
              className={cn('flex flex-col squircle-lg border bg-background p-6 transition-[border-color,box-shadow] duration-[--dur-panel]', chosen ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.5)]' : 'border-border')}
            >
              <h3 id={`plan-${p.id}`} className="font-display text-xl font-semibold text-foreground">{p.name}</h3>
              <p className="mt-1 text-[14px] text-muted-foreground">{p.forWhom}</p>
              <p className="mt-6 font-display text-2xl font-semibold text-foreground">
                {p.price ? <>{money(yearly ? (p.price.annual ?? p.price.amount * 10) / 12 : p.price.amount)}<span className="text-[13px] font-normal text-muted-foreground"> per seat a month{yearly ? ', billed yearly' : ''}</span></> : 'Talk to us'}
              </p>
              <dl className="mt-6 flex-1 divide-y divide-border border-t border-border">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-[13px] text-muted-foreground">{r.label}</dt>
                    <dd className="text-right text-[13px] font-medium tabular-nums text-foreground">{r.value(p)}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={`/contact?topic=sales&plan=${p.id}`}
                className={cn('mt-6 inline-flex h-10 items-center justify-center rounded-lg border text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring', chosen ? 'border-foreground/20 bg-secondary text-foreground hover:bg-secondary/80' : 'border-border text-foreground hover:bg-secondary/60')}
              >
                Talk to us about {p.name}
              </Link>
            </section>
          )
        })}
      </div>
      <p className="text-[12px] text-muted-foreground">Prices are provisional until launch and are stated in US dollars. Per-seat allowances pool across the studio: a five-seat Pro studio has 1 TB of active storage, 1,500 meeting minutes and 1,500 playable minutes a month for anyone in it to use.</p>
    </div>
  )
}
