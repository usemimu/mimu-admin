import { http } from '../lib/http'

/**
 * Admin advertiser management.
 *
 * Backed by `AdvertiserOperationsController` at `admin/advertisers/*`.
 * Sensitive ops (`walletAdjustment`, `processRefund`, `partialRefund`)
 * are reauth-gated; the global http interceptor surfaces a 403 with
 * `code: REAUTH_REQUIRED` and the UI re-prompts TOTP.
 *
 * Note: refund-queue routes here live under `admin/advertisers/refunds/*`.
 * They overlap in concept with `admin/refund-requests` (used by
 * `adminRefundsApi`) but expose richer review options (approve with a
 * trimmed amount, partial refund).
 */
export const advertisersApi = {
  /**
   * Filters (all optional, comma-joined for multi-value):
   *   kycStatus, spendTier, status, hasFraudFlags ('true'/'false'),
   *   offset, limit.
   */
  async list(params = {}) {
    const { data } = await http.get('/advertisers', { params })
    return data
  },

  async detail(id) {
    const { data } = await http.get(`/advertisers/${id}`)
    return data
  },

  /** Body: { notes? }. */
  async approveKyc(id, notes) {
    const { data } = await http.post(
      `/advertisers/${id}/approve-kyc`,
      notes ? { notes } : {},
    )
    return data
  },

  /**
   * Body: { amountKobo: string, direction: 'credit' | 'debit', reason }.
   * Requires reauth.
   */
  async walletAdjustment(id, body) {
    const { data } = await http.post(
      `/advertisers/${id}/wallet-adjustment`,
      body,
    )
    return data
  },

  /** Body: { reason }. */
  async suspend(id, reason) {
    const { data } = await http.post(`/advertisers/${id}/suspend`, { reason })
    return data
  },

  async reactivate(id) {
    const { data } = await http.post(`/advertisers/${id}/reactivate`)
    return data
  },

  // ── Refund queue (advertiser-scoped review) ─────────────────────
  async refundQueue(params = {}) {
    const { data } = await http.get('/advertisers/refunds/queue', { params })
    return data
  },

  /** Body: { approvedAmountKobo, notes? }. */
  async approveRefund(refundRequestId, approvedAmountKobo, notes) {
    const { data } = await http.post(
      `/advertisers/refunds/${refundRequestId}/approve`,
      { approvedAmountKobo, ...(notes ? { notes } : {}) },
    )
    return data
  },

  /** Body: { rejectionReason }. */
  async rejectRefund(refundRequestId, rejectionReason) {
    const { data } = await http.post(
      `/advertisers/refunds/${refundRequestId}/reject`,
      { rejectionReason },
    )
    return data
  },

  /**
   * Body: { partialAmountKobo, notes? }. Requires reauth.
   */
  async partialRefund(refundRequestId, partialAmountKobo, notes) {
    const { data } = await http.post(
      `/advertisers/refunds/${refundRequestId}/partial`,
      { partialAmountKobo, ...(notes ? { notes } : {}) },
    )
    return data
  },

  /** Process an approved refund — credits the advertiser wallet. Requires reauth. */
  async processRefund(refundRequestId) {
    const { data } = await http.post(
      `/advertisers/${refundRequestId}/refund`,
    )
    return data
  },
}
