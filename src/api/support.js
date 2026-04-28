import { http } from '../lib/http'

/**
 * Support ticket queue + actions.
 *
 * Backed by `SupportOperationsController` at `admin/support/*`. Each
 * action is permission-gated (`support.{view,reply,assign,escalate,close}`).
 */
export const supportApi = {
  /**
   * Ticket queue. Filters (all optional, comma-joined for multi-value):
   *   status, category, source, priority, slaStatus, assignedTo, userType,
   *   offset, limit.
   */
  async listTickets(params = {}) {
    const { data } = await http.get('/support/tickets', { params })
    return data
  },

  async ticketDetail(id) {
    const { data } = await http.get(`/support/tickets/${id}`)
    return data
  },

  /** Body: { message, isInternalNote? }. */
  async reply(id, message, isInternalNote = false) {
    const { data } = await http.post(`/support/tickets/${id}/reply`, {
      message,
      isInternalNote,
    })
    return data
  },

  /** Body: { assignedTo: <admin user id> }. */
  async assign(id, assignedTo) {
    const { data } = await http.post(`/support/tickets/${id}/assign`, {
      assignedTo,
    })
    return data
  },

  /** Body: { escalatedTo, reason }. */
  async escalate(id, escalatedTo, reason) {
    const { data } = await http.post(`/support/tickets/${id}/escalate`, {
      escalatedTo,
      reason,
    })
    return data
  },

  /** Body: { resolutionNotes, closureReason }. */
  async close(id, resolutionNotes, closureReason) {
    const { data } = await http.post(`/support/tickets/${id}/close`, {
      resolutionNotes,
      closureReason,
    })
    return data
  },

  async listCannedResponses(params = {}) {
    const { data } = await http.get('/support/canned-responses', { params })
    return data
  },

  async useCannedResponse(id) {
    const { data } = await http.post(`/support/canned-responses/${id}/use`)
    return data
  },

  /** SLA stats for a date range. Params: { fromDate, toDate } (ISO). */
  async slaStatistics(params = {}) {
    const { data } = await http.get('/support/sla-statistics', { params })
    return data
  },
}
