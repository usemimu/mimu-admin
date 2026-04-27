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
  /** Body: { ids: string[], reason? }. Returns { approvedCount, skippedCount }. */
  async bulkApprove(ids, reason) {
    const { data } = await http.post('/payouts/bulk-approve', {
      ids,
      ...(reason ? { reason } : {}),
    })
    return data
  },
}
