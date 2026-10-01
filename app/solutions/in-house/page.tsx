import { SegmentPage } from '@/components/site/SegmentPage'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/in-house')

export default function Page() {
  return <SegmentPage id="in-house" />
}
