'use client'

/**
 * Which plan fits (S-W §7.9). Seats and client companies are the two limits
 * the plans declare; single sign-on is an Enterprise term. The finder points
 * at the smallest plan whose terms admit the answer. No price and no buy
 * button: prices are an owner input and subscription billing is not built
 * (S-F-A FND-07). "Talk to us" goes to the sales form.
 */
import * as React from 'react'
import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from '@/content/pricing'

const fmt = (n: number | null, unit = '') => (n === null ? 'No limit' : `${n.toLocaleString('en-US')}${unit}`)

export function PlanFinder({ plans }: { plans: readonly Plan[] }) {
  const [seats, setSeats] = React.useState(4)
  const [clients, setClients] = React.useState(10)
  const [sso, setSso] = React.useState(false)

  const fits = (p: Plan) => (p.seats === null || seats <= p.seats) && (p.clientCompanies === null || clients <= p.clientCompanies) && (!sso || p.sso)
  const pick = plans.find(fits) ?? plans[plans.length - 1]

  const rows: { label: string; value: (p: Plan) => React.ReactNode }[] = [
    { label: 'Crew seats', value: (p) => fmt(p.seats) },
    { label: 'Client companies', value: (p) => fmt(p.clientCompanies) },
    { label: 'Storage', value: (p) => (p.storageGb === null ? 'No limit' : p.storageGb >= 1000 ? `${p.storageGb / 1000} TB` : `${p.storageGb} GB`) },
    { label: 'Meeting minutes a month', value: (p) => fmt(p.meetingMinutesPerMonth) },
    { label: 'Your studio’s name and logo on the portal', value: () => <Check aria-label="Included" className="size-4 text-status-green" /> },
    { label: 'The brand kit, everywhere it leaves the building', value: (p) => (p.whiteLabel ? <Check aria-label="Included" className="size-4 text-status-green" /> : <Minus aria-label="Not included" className="size-4 text-faint" />) },
    { label: 'No “Powered by Genreline” line', value: (p) => (p.hidesAttribution ? <Check aria-label="Included" className="size-4 text-status-green" /> : <Minus aria-label="Not included" className="size-4 text-faint" />) },
    { label: 'Single sign-on and SCIM', value: (p) => (p.sso ? <Check aria-label="Included" className="size-4 text-status-green" /> : <Minus aria-label="Not included" className="size-4 text-faint" />) },
  ]

  return (
    <div className="space-y-10">
      <div className="grid gap-6 squircle-lg border border-border bg-card/40 p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <label htmlFor="pf-seats" className="flex items-baseline justify-between text-[13px] font-medium text-foreground">
            Crew seats <span className="tabular-nums text-muted-foreground">{seats >= 60 ? '60 or more' : seats}</span>
          </label>
          <input id="pf-seats" type="range" min={1} max={60} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-3 w-full accent-[hsl(var(--primary))]" />
        </div>
        <div>
          <label htmlFor="pf-clients" className="flex items-baseline justify-between text-[13px] font-medium text-foreground">
            Client companies <span className="tabular-nums text-muted-foreground">{clients >= 100 ? '100 or more' : clients}</span>
          </label>
          <input id="pf-clients" type="range" min={0} max={100} value={clients} onChange={(e) => setClients(Number(e.target.value))} className="mt-3 w-full accent-[hsl(var(--primary))]" />
        </div>
        <label className="flex items-center gap-3 self-end text-[13px] font-medium text-foreground">
          <input type="checkbox" checked={sso} onChange={(e) => setSso(e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" />
          We need single sign-on
        </label>
        <p aria-live="polite" className="text-[15px] text-muted-foreground sm:col-span-3">
          <span className="font-semibold text-foreground">{pick.name}</span> fits {seats >= 60 ? 'sixty or more' : seats} crew seat{seats === 1 ? '' : 's'} and {clients >= 100 ? 'a hundred or more' : clients} client compan{clients === 1 ? 'y' : 'ies'}{sso ? ', with single sign-on' : ''}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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
              <p className="mt-6 font-display text-2xl font-semibold text-foreground">{p.price ? `$${p.price.amount}` : 'Talk to us'}</p>
              <dl className="mt-6 flex-1 divide-y divide-border border-t border-border">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-[13px] text-muted-foreground">{r.label}</dt>
                    <dd className="text-[13px] font-medium tabular-nums text-foreground">{r.value(p)}</dd>
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
    </div>
  )
}
