/**
 * THE TOOLS GENRELINE REPLACES. Every scattered tool, by the job it does,
 * space by space — struck through as it scrolls in, with what replaces it.
 */
import { Reveal } from '@/components/cinema/Reveal'
import { TOOL_GROUPS } from '@/content/tools'
import { siteLabel } from '@/content/features'

export function ToolStack() {
  const all = TOOL_GROUPS.flatMap((g) => g.tools)
  const today = all.filter((t) => siteLabel(t.featureId) === 'Available').length
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <p className="font-display text-[88px] font-bold leading-none tracking-[-0.05em] text-foreground sm:text-[120px]">{all.length}</p>
        <p className="max-w-[34ch] pb-3 text-lg leading-snug text-muted-foreground">jobs a studio runs on separate tools today. <span className="text-foreground">{today} are already one place in Genreline</span>; the rest are being built into the Suite.</p>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {TOOL_GROUPS.map((g, gi) => (
          <Reveal key={g.space} delay={gi * 120} className="rounded-3xl border border-border bg-card/40 p-6 backdrop-blur">
            <p className="font-display text-2xl font-bold text-foreground">{g.space}</p>
            <p className="text-[13px] text-muted-foreground">{g.line}</p>
            <ul className="mt-5 divide-y divide-border">
              {g.tools.map((t) => {
                const label = siteLabel(t.featureId)
                return (
                  <li key={t.job} data-feature-id={t.featureId} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[15px] font-semibold text-foreground">{t.job}</span>
                      {label === 'Coming' ? (
                        <span data-feature-label="coming" data-feature-id={t.featureId} className="shrink-0 rounded-md bg-status-blue/15 px-1.5 py-0.5 text-[11px] font-medium text-status-blue">Coming</span>
                      ) : (
                        <span className="shrink-0 rounded-md bg-status-green/15 px-1.5 py-0.5 text-[11px] font-medium text-status-green">In Genreline</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground line-through decoration-destructive/50">{t.today}</p>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
