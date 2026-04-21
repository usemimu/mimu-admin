export const fmt = {
  naira: (n) => '₦' + (n || 0).toLocaleString('en-NG'),
  num: (n) => (n || 0).toLocaleString('en-NG'),
  pct: (n) => (n || 0).toFixed(1) + '%',
  time: (mins) => {
    if (mins < 60) return `${mins}m`
    if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`
    return `${Math.floor(mins / 1440)}d`
  },
  rel: (minsAgo) => {
    if (minsAgo < 1) return 'just now'
    if (minsAgo < 60) return `${minsAgo}m ago`
    if (minsAgo < 1440) return `${Math.floor(minsAgo / 60)}h ago`
    return `${Math.floor(minsAgo / 1440)}d ago`
  },
}
