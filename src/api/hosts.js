import { http } from '../lib/http'

export const hostsApi = {
  /**
   * The OpenAPI spec doesn't document filter params yet, so we pass
   * whatever the caller wants and let the backend ignore unknowns. When
   * filters are formalised this is the one place to tighten.
   */
  async list(params = {}) {
    const { data } = await http.get('/hosts', { params })
    return data
  },

  async detail(id) {
    const { data } = await http.get(`/hosts/${id}`)
    return data
  },

  async updateProfile(id, patch) {
    const { data } = await http.patch(`/hosts/${id}/profile`, patch)
    return data
  },

  async updateBankAccount(id, patch) {
    const { data } = await http.patch(`/hosts/${id}/bank-account`, patch)
    return data
  },

  /**
   * Suspend / reactivate / terminate are sensitive ops — the backend will
   * 403 with `code: REAUTH_REQUIRED` if the admin's reauth cookie has
   * lapsed. The reauth modal handles re-issuing this request transparently.
   */
  async suspend(id, body = {}) {
    const { data } = await http.post(`/hosts/${id}/suspend`, body)
    return data
  },

  async reactivate(id, body = {}) {
    const { data } = await http.post(`/hosts/${id}/reactivate`, body)
    return data
  },

  async terminate(id, body = {}) {
    const { data } = await http.post(`/hosts/${id}/terminate`, body)
    return data
  },
}

export const hostInvitesApi = {
  async list(params = {}) {
    const { data } = await http.get('/host-invites', { params })
    return data
  },

  async detail(id) {
    const { data } = await http.get(`/host-invites/${id}`)
    return data
  },

  /**
   * Body shape isn't documented in OpenAPI; backend likely accepts at
   * least `{ phone, email?, businessName? }`. Caller passes whatever they
   * have and we forward.
   */
  async create(body) {
    const { data } = await http.post('/host-invites', body)
    return data
  },

  async revoke(id, body = {}) {
    const { data } = await http.post(`/host-invites/${id}/revoke`, body)
    return data
  },

  async resend(id, body = {}) {
    const { data } = await http.post(`/host-invites/${id}/resend`, body)
    return data
  },
}
