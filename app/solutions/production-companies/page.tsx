import { SegmentPage } from '@/components/site/SegmentPage'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/production-companies')

export default function Page() {
  return <SegmentPage id="production-companies" />
}
