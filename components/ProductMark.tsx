import Image from 'next/image'
import { PRODUCT_NAME } from '@/lib/site'

/**
 * The product's mark, as a tile that answers the theme (owner, 2026-10-01:
 * "use the white / gold logo for all dark mode and dark / gold for all light
 * mode"). Both tiles are in the page and CSS shows one (`.theme-light` /
 * `.theme-dark`), so the right mark paints before any script runs. The art is
 * the owner's 1024 tiles, cut to 96 and 256 — never stretched, never redrawn.
 */
export function ProductMark({ size = 32, showName = true, className = '', nameClassName = '' }: { size?: number; showName?: boolean; className?: string; nameClassName?: string }) {
  const src = size > 44 ? 256 : 96
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span aria-hidden className="shrink-0" style={{ width: size, height: size }}>
        <Image src={`/brand/genreline-dark-gold-${src}.png`} alt="" width={size} height={size} priority className="theme-light select-none" style={{ width: size, height: size }} />
        <Image src={`/brand/genreline-white-gold-${src}.png`} alt="" width={size} height={size} priority className="theme-dark select-none" style={{ width: size, height: size }} />
      </span>
      {showName && (
        <span translate="no" className={`font-display text-[17px] font-bold tracking-[-0.01em] text-foreground ${nameClassName}`}>
          {PRODUCT_NAME}
        </span>
      )}
    </span>
  )
}
