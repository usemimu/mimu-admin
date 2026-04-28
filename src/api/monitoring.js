import { http } from '../lib/http'

/**
 * Ops dashboard, queue depths, and audit log.
 *
 * Backed by `MonitoringController` at `admin/monitoring/*`. All routes
 * require permission `monitoring.view` or `audit.view`.
 */
export const monitoringApi = {
  /**
   * Daily ops dashboard — aggregated KPIs for the current day. Returns a
   * provider-shaped object the dashboard view maps directly into tiles.
   */
  async dashboard() {
    const { data } = await http.get('/monitoring/dashboard')
    return data
  },

  /**
   * Queue depths with alert thresholds. Returns counts for vetting,
   * payouts, fraud, support and a flag per queue indicating whether it
   * has breached its threshold.
   */
  async queueDepths() {
    const { data } = await http.get('/monitoring/queue-depths')
    return data
  },

  /**
   * Search the admin audit log.
   *
   * Filters (all optional): adminUserId, actionType, resourceType,
   * resourceId, fromDate, toDate (ISO), offset, limit.
   */
  async auditLog(params = {}) {
    const { data } = await http.get('/monitoring/audit-log', { params })
    return data
  },

  /** Audit log statistics for a date range. */
  async auditLogStatistics(params = {}) {
    const { data } = await http.get('/monitoring/audit-log/statistics', {
      params,
    })
    return data
  },
}
