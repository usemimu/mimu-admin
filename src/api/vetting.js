import { http } from '../lib/http'

/** Campaign + creative vetting queues. */
export const vettingApi = {
  // Campaigns ----
  async pendingVetting(params = {}) {
    const { data } = await http.get('/campaigns/pending-vetting', { params })
    return data
  },
  async pendingApproval(params = {}) {
    const { data } = await http.get('/campaigns/pending-approval', { params })
    return data
  },
  async campaignDetail(id) {
    const { data } = await http.get(`/campaigns/${id}`)
    return data
  },
  /**
   * Vet a campaign — body shape isn't documented but conventionally
   * `{ decision: 'approve' | 'reject', reason?, notes? }`.
   */
  async vetCampaign(id, body) {
    const { data } = await http.post(`/campaigns/${id}/vet`, body)
    return data
  },
  async markApconApproved(id, body = {}) {
    const { data } = await http.post(
      `/campaigns/${id}/apcon-approved`,
      body,
    )
    return data
  },

  // Creatives ----
  /**
   * Creatives awaiting internal vetting (`/v1/admin/creatives/vetting-queue`).
   * Distinct from `listCreatives` (the cross-status admin list) and the
   * campaign queue. Backend response shape:
   *   { queue: [...], pagination: { offset, limit, count } }
   */
  async creativeVettingQueue(params = {}) {
    const { data } = await http.get('/creatives/vetting-queue', { params })
    return data
  },
  async listCreatives(params = {}) {
    const { data } = await http.get('/creatives', { params })
    return data
  },
  async approveCreative(id, body = {}) {
    // body: { apconSubmissionId?, notes? }
    const { data } = await http.post(`/creatives/${id}/approve`, body)
    return data
  },
  async rejectCreative(id, reason) {
    // body.reason is required, 10–500 chars
    const { data } = await http.post(`/creatives/${id}/reject`, { reason })
    return data
  },
  async submitCreativeVetting(id, body = {}) {
    const { data } = await http.post(
      `/creatives/${id}/submit-vetting`,
      body,
    )
    return data
  },

  // APCON workflow on creatives — internal-approved creatives queue
  // here while we wait on the regulator. The mark-* actions are how
  // ops records the outcome of the physical APCON submission.
  async creativeApconQueue(params = {}) {
    const { data } = await http.get('/creatives/apcon-queue', { params })
    return data
  },
  async markCreativeApconSubmitted(id, body = {}) {
    // body: { referenceNumber? }
    const { data } = await http.post(`/creatives/${id}/apcon/submit`, body)
    return data
  },
  async markCreativeApconApproved(id, body) {
    // body: { certificateNumber, expiryDate }
    const { data } = await http.post(`/creatives/${id}/apcon/mark-approved`, body)
    return data
  },
  async markCreativeApconRejected(id, body) {
    // body: { reason }
    const { data } = await http.post(`/creatives/${id}/apcon/mark-rejected`, body)
    return data
  },
}
