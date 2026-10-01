import Link from 'next/link'

/** A sequence, so it is numbered (frontend-design: numbers only for sequences). */
export function DayInProduction({ steps }: { steps: ReadonlyArray<{ when: string; title: string; body: string; href: string }> }) {
  return (
    <ol className="relative space-y-8 border-l border-border pl-6 sm:pl-8">
      {steps.map((s) => (
        <li key={s.when + s.title} className="relative">
          <span aria-hidden className="absolute -left-[29px] top-1.5 size-2.5 rounded-full border-2 border-primary bg-background sm:-left-[37px]" />
          <p className="text-[13px] tabular-nums text-muted-foreground">{s.when}</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-foreground">{s.title}</p>
          <p className="mt-1 max-w-[62ch] text-[15px] leading-7 text-muted-foreground">{s.body}</p>
          <Link href={s.href} className="mt-1 inline-block text-[13px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">How it works</Link>
        </li>
      ))}
    </ol>
  )
}
