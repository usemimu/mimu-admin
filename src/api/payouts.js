import { http } from '../lib/http'

/** Admin payouts queue + bulk-approve. Approve/reject are reauth-gated. */
export const adminPayoutsApi = {
  async pending(params = {}) {
    const { data } = await http.get('/payouts/pending', { params })
    return data
  },
  async detail(id) {
    const { data } = await http.get(`/payouts/${id}`)
    return data
  },
  async approve(id, body = {}) {
    const { data } = await http.post(`/payouts/${id}/approve`, body)
    return data
  },
  async reject(id, reason) {
    const { data } = await http.post(`/payouts/${id}/reject`, { reason })
    return data
  },
  /**
   * Body: { payoutIds: string[] }. Returns { approvedCount, skippedCount }.
   * Backend ignores any extra fields, so the optional `reason` is dropped
   * to match the documented DTO.
   */
  async bulkApprove(payoutIds) {
    const { data } = await http.post('/payouts/bulk-approve', { payoutIds })
    return data
  },
}
