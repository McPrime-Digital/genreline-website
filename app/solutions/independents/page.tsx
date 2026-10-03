import { SegmentPage } from '@/components/site/SegmentPage'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/independents')

export default function Page() {
  return <SegmentPage id="independents" />
}
