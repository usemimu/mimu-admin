/**
 * Defensive list extraction for backend responses.
 *
 * The admin endpoints don't share a single response shape — different
 * controllers return:
 *   - a bare array
 *   - `{ data: [...] }`
 *   - `{ items: [...], total, hasMore }`
 *   - resource-named: `{ campaigns: [...] }`, `{ screens: [...] }`,
 *     `{ tickets: [...] }`, etc.
 *
 * Rather than every view forking on these shapes (and silently
 * returning `[]` when a new endpoint adds a fourth shape), call this
 * once per query.
 *
 * `extractList(raw)` — tries the generic envelopes first.
 * `extractList(raw, 'campaigns', 'items')` — also tries those keys
 * before falling back to `[]`. Pass the resource-specific key first
 * since it's the most likely.
 */
export function extractList(raw, ...preferredKeys) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return []
  for (const key of preferredKeys) {
    if (Array.isArray(raw[key])) return raw[key]
  }
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.items)) return raw.items
  if (Array.isArray(raw.results)) return raw.results
  return []
}

/**
 * Extract pagination metadata from a list response. Returns
 * `{ limit, offset, total, hasMore }` with sensible fallbacks so
 * pagers don't crash on partial responses.
 */
export function extractPagination(raw, fallbackLimit = 20) {
  if (!raw || typeof raw !== 'object') {
    return { limit: fallbackLimit, offset: 0, total: 0, hasMore: false }
  }
  const p = raw.pagination ?? raw
  return {
    limit: Number(p.limit ?? fallbackLimit),
    offset: Number(p.offset ?? 0),
    total: Number(p.total ?? 0),
    hasMore: Boolean(p.hasMore ?? false),
  }
}
