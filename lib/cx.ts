/**
 * Class joining for CLIENT components: clsx only. tailwind-merge (~8 KB
 * gzipped) stays on the server, in lib/utils.ts's `cn`. A client component
 * therefore never passes two classes for the same property — conditional
 * sets are written whole (`active ? 'text-foreground' : 'text-muted-foreground'`).
 */
export { clsx as cx } from 'clsx'
