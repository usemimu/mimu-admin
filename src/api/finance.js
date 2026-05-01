import { http } from '../lib/http'

/**
 * Paystack reconciliation, two stages:
 *
 *   Stage 1 — drain `suspense.general` for completed topups by posting
 *             the receivables/expense legs against Paystack's reported fee.
 *   Stage 2 — once Paystack settles to our bank account, drain
 *             `receivables.payment_processing` into `cash.bank.paystack_settlement`.
 *
 * Both stages run on a daily cron (3am Lagos) and can also be invoked
 * manually here. Mutations are gated on `tax.remit`; reads on `tax.view`.
 */
export const financeApi = {
  // ── Stage 1: suspense drain ─────────────────────────────────────────
  async reconciliationSummary() {
    const { data } = await http.get('/finance/paystack/reconciliation')
    return data
  },
  /** `limit` caps rows scanned per run. Defaults to 200 server-side. */
  async runReconciliation({ limit } = {}) {
    const { data } = await http.post(
      '/finance/paystack/reconciliation/run',
      undefined,
      { params: limit ? { limit } : {} },
    )
    return data
  },
  /** Body: { reference, amountKobo } — confirms which topup we're targeting. */
  async reconcileOne(topupId, { reference, amountKobo }) {
    const { data } = await http.post(
      `/finance/paystack/reconciliation/${topupId}`,
      { reference, amountKobo },
    )
    return data
  },

  // ── Stage 2: bank settlement ────────────────────────────────────────
  async bankSettlementSummary() {
    const { data } = await http.get('/finance/paystack/bank-settlement')
    return data
  },
  /**
   * Lookback defaults to 30d server-side; bump to 365 on a fresh deploy.
   * `maxSettlements` caps how many Paystack settlements we walk per run.
   */
  async runBankSettlement({ lookbackDays, maxSettlements } = {}) {
    const params = {}
    if (lookbackDays != null) params.lookbackDays = lookbackDays
    if (maxSettlements != null) params.maxSettlements = maxSettlements
    const { data } = await http.post(
      '/finance/paystack/bank-settlement/run',
      undefined,
      { params },
    )
    return data
  },
}
