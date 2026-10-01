import { SegmentPage } from '@/components/site/SegmentPage'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/agencies')

export default function Page() {
  return <SegmentPage id="agencies" />
}
