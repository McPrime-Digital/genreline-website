import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Rule } from '@/components/site/Frame'
import { APP } from '@/lib/site'

export const metadata = { title: 'Not found', robots: { index: false } }

export default function NotFound() {
  return (
    <section className="container-measure py-24 sm:py-32">
      <Rule />
      <h1 className="mt-7 font-display text-4xl font-bold text-foreground sm:text-display">This page isn’t here.</h1>
      <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
        The address may have changed. If you were looking for your studio, it lives at app.genreline.com.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button asChild variant="primary" size="lg" data-primary-cta><Link href="/">Go to the home page</Link></Button>
        <a href={APP.login} className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Sign in to your studio</a>
      </div>
    </section>
  )
}
