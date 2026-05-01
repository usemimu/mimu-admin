/**
 * Single source of truth for vue-query cache keys.
 *
 * Why this exists: scattering inline `['admin', 'hosts']` keys across
 * views means a typo silently creates a fresh, never-invalidated
 * cache entry. Keys are functions (not constants) so callers can pass
 * filter args; the function deterministically returns the same array
 * for the same args, which is exactly what vue-query needs.
 *
 * Convention: every key starts with `'admin'` so it's easy to spot
 * cross-feature invalidations (`qc.invalidateQueries({ queryKey: ['admin'] })`).
 */
export const qk = {
  // Auth + identity
  me: () => ['admin', 'me'],

  // Monitoring (used by Dashboard + Sidebar)
  dashboard: () => ['admin', 'monitoring', 'dashboard'],
  queueDepths: () => ['admin', 'monitoring', 'queue-depths'],
  auditLog: (filters = {}) => ['admin', 'monitoring', 'audit-log', filters],

  // Hosts
  hosts: (filters = {}) => ['admin', 'hosts', 'list', filters],
  hostDetail: (id) => ['admin', 'hosts', 'detail', id],
  hostInvites: (filters = {}) => ['admin', 'host-invites', 'list', filters],

  // Screens
  screens: (filters = {}) => ['admin', 'screens', 'list', filters],
  screenDetail: (id) => ['admin', 'screens', 'detail', id],
  screensMap: (filters = {}) => ['admin', 'screens', 'map', filters],

  // Advertisers
  advertisers: (filters = {}) => ['admin', 'advertisers', 'list', filters],
  advertiserDetail: (id) => ['admin', 'advertisers', 'detail', id],

  // Refunds (under advertisers)
  refundsQueue: (filters = {}) => ['admin', 'refunds', 'queue', filters],

  // Campaigns / Vetting
  campaignsPendingVetting: () => ['admin', 'campaigns', 'pending-vetting'],
  campaignsPendingApproval: () => ['admin', 'campaigns', 'pending-approval'],
  campaignDetail: (id) => ['admin', 'campaigns', 'detail', id],

  // Creatives
  creatives: (filters = {}) => ['admin', 'creatives', 'list', filters],
  creativeDetail: (id) => ['admin', 'creatives', 'detail', id],
  creativeVettingQueue: () => ['admin', 'creatives', 'vetting-queue'],
  creativeApconQueue: () => ['admin', 'creatives', 'apcon-queue'],

  // Fraud
  fraudQueue: (filters = {}) => ['admin', 'fraud', 'queue', filters],
  fraudEvidence: (id) => ['admin', 'fraud', 'evidence', id],
  fraudRefunds: (filters = {}) => ['admin', 'fraud', 'refunds', filters],

  // Finance / Paystack reconciliation
  reconciliationSummary: () => ['admin', 'finance', 'reconciliation', 'summary'],
  bankSettlementSummary: () => ['admin', 'finance', 'bank-settlement', 'summary'],

  // Payouts
  payoutsPending: () => ['admin', 'payouts', 'pending'],
  payoutDetail: (id) => ['admin', 'payouts', 'detail', id],

  // Support
  tickets: (filters = {}) => ['admin', 'support', 'tickets', filters],
  ticketDetail: (id) => ['admin', 'support', 'tickets', 'detail', id],
  cannedResponses: () => ['admin', 'support', 'canned-responses'],

  // Admin users
  adminUsers: (filters = {}) => ['admin', 'admin-users', 'list', filters],
  adminUserDetail: (id) => ['admin', 'admin-users', 'detail', id],
  notificationPrefs: () => ['admin', 'admin-users', 'notification-prefs'],
}
