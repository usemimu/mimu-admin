import { http } from '../lib/http'

export const adminRefundsApi = {
  async pending(params = {}) {
    const { data } = await http.get('/refund-requests/pending', { params })
    return data
  },
  async detail(id) {
    const { data } = await http.get(`/refund-requests/${id}`)
    return data
  },
  /** Body: { decision: 'approve' | 'deny', notes?, denialReason? } */
  async review(id, body) {
    const { data } = await http.post(
      `/refund-requests/${id}/review`,
      body,
    )
    return data
  },
}
