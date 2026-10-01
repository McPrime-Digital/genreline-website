/** "Who works here" — roles, and exactly what each reaches. */
import { Feature } from '@/components/FeatureLabel'
import { Spotlight } from '@/components/cinema/Spotlight'
import { Reveal } from '@/components/cinema/Reveal'

export function PeopleGrid({ people }: { people: readonly { role: string; sees: string; featureId: string }[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p, n) => (
        <Reveal as="li" key={p.role} delay={n * 60}>
          <Spotlight className="h-full rounded-2xl border border-border bg-card/40 p-6">
            <Feature id={p.featureId} as="div">
              <p className="font-display text-lg font-semibold text-foreground">{p.role}</p>
              <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{p.sees}</p>
            </Feature>
          </Spotlight>
        </Reveal>
      ))}
    </ul>
  )
}
