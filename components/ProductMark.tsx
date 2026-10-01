import Image from 'next/image'
import { PRODUCT_NAME } from '@/lib/site'

/** The product's mark — the owner's artwork from the app's public/brand
 *  (1024 × 815, never stretched). Gold on transparent reads on both themes. */
const RATIO = 1024 / 815

export function ProductMark({ size = 32, showName = true, className = '', nameClassName = '' }: { size?: number; showName?: boolean; className?: string; nameClassName?: string }) {
  const height = Math.round(size * 0.8)
  const width = Math.round(height * RATIO)
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/brand/genreline-mark-gold-96.png" alt="" aria-hidden width={width} height={height} priority className="select-none" style={{ width, height }} />
      {showName && (
        <span translate="no" className={`font-display text-[17px] font-bold tracking-[-0.01em] text-foreground ${nameClassName}`}>
          {PRODUCT_NAME}
        </span>
      )}
    </span>
  )
}
