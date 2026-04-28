import { http } from '../lib/http'

/**
 * Admin team management. Backed by `AdminUsersController` at
 * `admin/admin-users/*`. Write actions require `admin_users.{create,
 * update,suspend,offboard}` permissions which only `admin_root` holds
 * by default.
 *
 * Notification preferences are scoped to the calling admin (no id
 * needed) and live under `admin/admin-users/me/notification-preferences`.
 */
export const adminUsersApi = {
  /** Filters: status, role (comma-joined), q, offset, limit. */
  async list(params = {}) {
    const { data } = await http.get('/admin-users', { params })
    return data
  },

  async detail(id) {
    const { data } = await http.get(`/admin-users/${id}`)
    return data
  },

  /** Body: { email, name?, role }. Pre-creates an admin row that the invitee adopts on first Google sign-in. */
  async invite(body) {
    const { data } = await http.post('/admin-users', body)
    return data
  },

  /** Body: { role?, name? }. */
  async update(id, body) {
    const { data } = await http.patch(`/admin-users/${id}`, body)
    return data
  },

  /** Body: { reason? }. */
  async suspend(id, reason) {
    const { data } = await http.post(
      `/admin-users/${id}/suspend`,
      reason ? { reason } : {},
    )
    return data
  },

  async reactivate(id) {
    const { data } = await http.post(`/admin-users/${id}/reactivate`)
    return data
  },

  /** Body: { reason? }. Permanent — use suspend for reversible holds. */
  async offboard(id, reason) {
    const { data } = await http.post(
      `/admin-users/${id}/offboard`,
      reason ? { reason } : {},
    )
    return data
  },

  /** Withdraw a pending invite. Only valid while the row is still pending. */
  async revokeInvite(id) {
    const { data } = await http.delete(`/admin-users/${id}`)
    return data
  },

  // ── Per-admin notification preferences ─────────────────────────────
  async getMyPreferences() {
    const { data } = await http.get('/admin-users/me/notification-preferences')
    return data
  },

  /** Body: partial { highFraudAlerts, systemDowntime, slaBreach, dailySummary }. */
  async updateMyPreferences(patch) {
    const { data } = await http.patch(
      '/admin-users/me/notification-preferences',
      patch,
    )
    return data
  },
}
