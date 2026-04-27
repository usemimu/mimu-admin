import { http } from '../lib/http'

/**
 * Fraud queue — flagged plays / impressions / wallet anomalies. The `confirm`
 * action requires reauth (backend enforces with 403 + REAUTH_REQUIRED) since
 * confirmation suspends the offending entity.
 */
export const fraudApi = {
  async queue(params = {}) {
    const { data } = await http.get('/fraud/queue', { params })
    return data
  },
  async evidence(flagId) {
    const { data } = await http.get(`/fraud/${flagId}/evidence`)
    return data
  },
  async clear(flagId, body = {}) {
    const { data } = await http.post(`/fraud/${flagId}/clear`, body)
    return data
  },
  async hold(flagId, body = {}) {
    const { data } = await http.post(`/fraud/${flagId}/hold`, body)
    return data
  },
  async confirm(flagId, body = {}) {
    const { data } = await http.post(`/fraud/${flagId}/confirm`, body)
    return data
  },
  async refundAdvertisers(flagId, body = {}) {
    const { data } = await http.post(
      `/fraud/${flagId}/refund-advertisers`,
      body,
    )
    return data
  },
  async refunds(params = {}) {
    const { data } = await http.get('/fraud/refunds', { params })
    return data
  },
}
