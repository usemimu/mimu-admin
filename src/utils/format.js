export const fmt = {
  naira: (n) => '₦' + (n || 0).toLocaleString('en-NG'),
  num: (n) => (n || 0).toLocaleString('en-NG'),
  pct: (n) => (n || 0).toFixed(1) + '%',
  time: (mins) => {
    if (mins < 60) return `${mins}m`
    if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`
    return `${Math.floor(mins / 1440)}d`
  },
  /**
   * Relative time formatter — accepts either a minutes-ago number
   * (legacy callers) or any timestamp Date/ISO/epoch can parse.
   *
   * Past dates: "just now" / "5m ago" / "3h ago" / "2d ago"
   * Future dates: "in 6d" / "in 4h" — used for `expiresAt` columns
   * Falsy / unparseable: "—"
   */
  rel: (input) => {
    if (input == null) return '—'

    let minsAgo
    if (typeof input === 'number') {
      // Legacy: caller already computed minutes ago.
      minsAgo = input
    } else {
      const t = input instanceof Date ? input.getTime() : new Date(input).getTime()
      if (Number.isNaN(t)) return '—'
      minsAgo = Math.floor((Date.now() - t) / 60000)
    }

    if (minsAgo < 0) {
      // Future timestamp — invert and label.
      const mins = -minsAgo
      if (mins < 1) return 'in <1m'
      if (mins < 60) return `in ${mins}m`
      if (mins < 1440) return `in ${Math.floor(mins / 60)}h`
      return `in ${Math.floor(mins / 1440)}d`
    }

    if (minsAgo < 1) return 'just now'
    if (minsAgo < 60) return `${minsAgo}m ago`
    if (minsAgo < 1440) return `${Math.floor(minsAgo / 60)}h ago`
    return `${Math.floor(minsAgo / 1440)}d ago`
  },
}
