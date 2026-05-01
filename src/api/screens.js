import { http } from '../lib/http'

/** Admin screen ops. Reassign-host triggers reauth. */
export const adminScreensApi = {
  async list(params = {}) {
    const { data } = await http.get('/screens', { params })
    return data
  },
  /**
   * Create a new screen row. `hostId` is optional — leaving it null
   * stages the screen for later assignment via reassign-host.
   */
  async create(body) {
    const { data } = await http.post('/screens', body)
    return data
  },
  async detail(id) {
    const { data } = await http.get(`/screens/${id}`)
    return data
  },
  /**
   * Patch venue / location / spec / pricing fields. Status, host,
   * install, and calibration have their own endpoints.
   */
  async update(id, body) {
    const { data } = await http.patch(`/screens/${id}`, body)
    return data
  },
  /** Mark a pending_install screen as live. Stamps installedAt/By. */
  async activate(id, body = {}) {
    const { data } = await http.post(`/screens/${id}/activate`, body)
    return data
  },
  async pause(id, body = {}) {
    const { data } = await http.post(`/screens/${id}/pause`, body)
    return data
  },
  async resume(id, body = {}) {
    const { data } = await http.post(`/screens/${id}/resume`, body)
    return data
  },
  async reassignHost(id, body) {
    const { data } = await http.post(
      `/screens/${id}/reassign-host`,
      body,
    )
    return data
  },
  async retire(id, body = {}) {
    const { data } = await http.post(`/screens/${id}/retire`, body)
    return data
  },
  async mapData(params = {}) {
    const { data } = await http.get('/screens/map/data', { params })
    return data
  },
}

export const adminAdvertisersApi = {
  /** Reason ≥10 chars. Negative amountKobo = debit. */
  async walletAdjustment(advertiserId, { amountKobo, reason, metadata }) {
    const { data } = await http.post(
      `/advertiser/${advertiserId}/wallet/adjustment`,
      {
        amountKobo,
        reason,
        ...(metadata ? { metadata } : {}),
      },
    )
    return data
  },
}
