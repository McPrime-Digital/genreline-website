/** Subsequence match, ranked so a word-boundary hit beats a scattered one —
 *  "csm" finds "Contracts · sealed" the way a fuzzy finder does. */
export function fuzzyScore(needle: string, hay: string): number {
  const n = needle.trim().toLowerCase()
  if (!n) return 1
  const h = hay.toLowerCase()
  let i = 0
  let score = 0
  let streak = 0
  for (let j = 0; j < h.length && i < n.length; j++) {
    if (h[j] === n[i]) {
      streak += 1
      score += j === 0 || h[j - 1] === ' ' || h[j - 1] === '—' ? 12 : 4 + streak
      i += 1
    } else streak = 0
  }
  return i === n.length ? score : 0
}
