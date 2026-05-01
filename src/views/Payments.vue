<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Payments · Paystack reconciliation</div>
        <span class="fg2 text-xs">Daily cron at 03:00 Lagos · manual triggers below</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="refreshAll" :disabled="anyLoading">
          <i class="ph ph-arrows-clockwise"></i> Refresh
        </button>
      </div>
      <div class="page-subtitle">
        Two stages: drain <span class="mono">suspense.general</span> → <span class="mono">receivables.payment_processing</span>,
        then move <span class="mono">receivables.payment_processing</span> → <span class="mono">cash.bank.paystack_settlement</span>
        once Paystack actually deposits to our bank.
      </div>
    </div>

    <div class="page-body">
      <!-- Stage cards -->
      <div class="grid mb-4" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
        <!-- Stage 1 -->
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Stage 1 · Suspense drain</div>
              <div class="fg2 text-xs">DR receivables · CR suspense (per topup)</div>
            </div>
            <div class="spacer"></div>
            <span v-if="stage1.isLoading.value" class="fg2 text-xs">Loading…</span>
            <span
              v-else-if="stage1.error.value"
              class="pill pill-failed sm"
              :title="stage1.error.value?.message"
            >
              error
            </span>
            <span
              v-else
              class="pill sm"
              :class="reconciliationData?.pendingCount > 0 ? 'pill-pending' : 'pill-active'"
            >
              {{ reconciliationData?.pendingCount > 0 ? 'backlog' : 'caught up' }}
            </span>
          </div>
          <div class="p-4" v-if="!stage1.isLoading.value">
            <div class="finance-stat">
              <div class="finance-stat-label">Awaiting drain</div>
              <div class="finance-stat-value">
                {{ formatNum(reconciliationData?.pendingCount) }}
              </div>
              <div class="finance-stat-sub mono">
                {{ formatKobo(reconciliationData?.pendingAmountKobo) }}
              </div>
            </div>
            <div class="finance-stat">
              <div class="finance-stat-label">Drained · last 30d</div>
              <div class="finance-stat-value">
                {{ formatNum(reconciliationData?.reconciledLast30dCount) }}
              </div>
              <div class="finance-stat-sub fg2">topups</div>
            </div>
          </div>
          <div class="border-t border-[var(--border)] p-3 flex ac" style="gap: 8px;">
            <input
              v-model.number="stage1Limit"
              type="number"
              min="1"
              max="500"
              class="input sm"
              placeholder="limit"
              style="width: 80px;"
            />
            <span class="fg2 text-xs">rows · cap 500</span>
            <div class="spacer"></div>
            <button
              v-if="canRemit"
              class="btn primary sm"
              :disabled="stage1Mutation.isPending.value"
              @click="runStage1"
            >
              <i class="ph ph-play"></i>
              {{ stage1Mutation.isPending.value ? 'Running…' : 'Run drain' }}
            </button>
            <span v-else class="fg2 text-xs">read-only · needs tax.remit</span>
          </div>
        </div>

        <!-- Stage 2 -->
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Stage 2 · Bank settlement</div>
              <div class="fg2 text-xs">DR cash.bank.paystack_settlement · CR receivables</div>
            </div>
            <div class="spacer"></div>
            <span v-if="stage2.isLoading.value" class="fg2 text-xs">Loading…</span>
            <span
              v-else-if="stage2.error.value"
              class="pill pill-failed sm"
              :title="stage2.error.value?.message"
            >
              error
            </span>
            <span
              v-else
              class="pill sm"
              :class="bankData?.awaitingBankSettleCount > 0 ? 'pill-pending' : 'pill-active'"
            >
              {{ bankData?.awaitingBankSettleCount > 0 ? 'awaiting' : 'caught up' }}
            </span>
          </div>
          <div class="p-4" v-if="!stage2.isLoading.value">
            <div class="finance-stat">
              <div class="finance-stat-label">Awaiting bank-settle</div>
              <div class="finance-stat-value">
                {{ formatNum(bankData?.awaitingBankSettleCount) }}
              </div>
              <div class="finance-stat-sub mono">
                {{ formatKobo(bankData?.awaitingBankSettleAmountKobo) }}
              </div>
            </div>
            <div class="finance-stat">
              <div class="finance-stat-label">Bank-settled · last 30d</div>
              <div class="finance-stat-value">
                {{ formatNum(bankData?.bankSettledLast30dCount) }}
              </div>
              <div class="finance-stat-sub fg2">topups</div>
            </div>
          </div>
          <div class="border-t border-[var(--border)] p-3 flex ac" style="gap: 8px;">
            <input
              v-model.number="stage2Lookback"
              type="number"
              min="1"
              max="365"
              class="input sm"
              placeholder="days"
              style="width: 80px;"
            />
            <span class="fg2 text-xs">days lookback · cap 365</span>
            <div class="spacer"></div>
            <button
              v-if="canRemit"
              class="btn primary sm"
              :disabled="stage2Mutation.isPending.value"
              @click="runStage2"
            >
              <i class="ph ph-play"></i>
              {{ stage2Mutation.isPending.value ? 'Running…' : 'Settle to bank' }}
            </button>
            <span v-else class="fg2 text-xs">read-only · needs tax.remit</span>
          </div>
        </div>
      </div>

      <!-- Last-run report -->
      <div v-if="lastRun" class="card">
        <div class="card-head">
          <div class="card-title">Last run · {{ lastRun.label }}</div>
          <div class="spacer"></div>
          <button class="btn ghost sm" @click="lastRun = null">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="p-4">
          <div class="flex g8" style="margin-bottom: 12px; flex-wrap: wrap;">
            <span
              v-for="m in lastRun.metrics"
              :key="m.label"
              class="finance-chip"
              :class="m.tone || ''"
            >
              <span class="finance-chip-value">{{ m.value }}</span>
              <span class="finance-chip-label">{{ m.label }}</span>
            </span>
          </div>
          <details v-if="lastRun.raw" style="font-size: 11px;">
            <summary class="fg2" style="cursor: pointer;">Raw response</summary>
            <pre class="finance-pre">{{ JSON.stringify(lastRun.raw, null, 2) }}</pre>
          </details>
        </div>
      </div>

      <!-- Help text shown when both stages are caught up + no last run -->
      <div
        v-if="!lastRun && !stage1.isLoading.value && !stage2.isLoading.value && !anyBacklog"
        class="card p-4 fg2 text-sm"
      >
        Nothing to do — every completed topup has been drained from suspense and
        every reconciled topup has matched a Paystack settlement.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import { financeApi } from '../api/finance'
import { qk } from '../lib/queryKeys'
import { useToastStore } from '../stores/toast'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { PERM } from '../lib/permissions'

const qc = useQueryClient()
const toast = useToastStore()
const me = useCurrentAdmin()

const canRemit = computed(() => me.can(PERM.TAX_REMIT))

const stage1 = useQuery({
  queryKey: qk.reconciliationSummary(),
  queryFn: () => financeApi.reconciliationSummary(),
  refetchInterval: 60_000,
})

const stage2 = useQuery({
  queryKey: qk.bankSettlementSummary(),
  queryFn: () => financeApi.bankSettlementSummary(),
  refetchInterval: 60_000,
})

const reconciliationData = computed(() => stage1.data.value)
const bankData = computed(() => stage2.data.value)

const anyLoading = computed(() => stage1.isLoading.value || stage2.isLoading.value)
const anyBacklog = computed(
  () =>
    Number(reconciliationData.value?.pendingCount ?? 0) > 0 ||
    Number(bankData.value?.awaitingBankSettleCount ?? 0) > 0,
)

// ── Manual triggers ────────────────────────────────────────────────────

const stage1Limit = ref(200)
const stage2Lookback = ref(30)
const lastRun = ref(null)

const stage1Mutation = useMutation({
  mutationFn: () => financeApi.runReconciliation({ limit: stage1Limit.value || undefined }),
  onSuccess: (out) => {
    lastRun.value = {
      label: 'Stage 1 · Suspense drain',
      raw: out,
      metrics: [
        { label: 'drained', value: formatNum(out?.drained), tone: 'good' },
        { label: 'skipped', value: formatNum(out?.skipped) },
        { label: 'failed', value: formatNum(out?.failed), tone: out?.failed ? 'bad' : '' },
      ],
    }
    toast.success(`Drain done: ${out?.drained ?? 0} drained, ${out?.failed ?? 0} failed.`)
    qc.invalidateQueries({ queryKey: qk.reconciliationSummary() })
    qc.invalidateQueries({ queryKey: qk.bankSettlementSummary() })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Drain failed.')
  },
})

const stage2Mutation = useMutation({
  mutationFn: () =>
    financeApi.runBankSettlement({
      lookbackDays: stage2Lookback.value || undefined,
    }),
  onSuccess: (out) => {
    lastRun.value = {
      label: 'Stage 2 · Bank settlement',
      raw: out,
      metrics: [
        { label: 'settled', value: formatNum(out?.topupsSettled), tone: 'good' },
        { label: 'settlements scanned', value: formatNum(out?.settlementsScanned) },
        { label: 'failed', value: formatNum(out?.topupsFailed), tone: out?.topupsFailed ? 'bad' : '' },
      ],
    }
    toast.success(`Bank-settle done: ${out?.topupsSettled ?? 0} topups settled.`)
    qc.invalidateQueries({ queryKey: qk.reconciliationSummary() })
    qc.invalidateQueries({ queryKey: qk.bankSettlementSummary() })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Bank-settle failed.')
  },
})

function runStage1() {
  if (!canRemit.value) return
  stage1Mutation.mutate()
}
function runStage2() {
  if (!canRemit.value) return
  stage2Mutation.mutate()
}

function refreshAll() {
  qc.invalidateQueries({ queryKey: qk.reconciliationSummary() })
  qc.invalidateQueries({ queryKey: qk.bankSettlementSummary() })
}

// ── Formatting ─────────────────────────────────────────────────────────
function formatNum(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-NG')
}
function formatKobo(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
}
</script>

<style scoped>
.finance-stat {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border);
}
.finance-stat:last-child {
  border-bottom: none;
}
.finance-stat-label {
  font-size: 12px;
  color: var(--fg-2);
}
.finance-stat-value {
  font-family: var(--f-display);
  font-size: 24px;
  line-height: 1;
  color: var(--fg);
}
.finance-stat-sub {
  font-size: 11px;
  color: var(--fg-3);
  text-align: right;
}
.finance-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  min-width: 100px;
}
.finance-chip.good {
  border-left: 2px solid var(--moss-500);
}
.finance-chip.bad {
  border-left: 2px solid var(--danger-500);
}
.finance-chip-value {
  font-family: var(--f-display);
  font-size: 18px;
  color: var(--fg);
}
.finance-chip-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-3);
}
.finance-pre {
  font-family: var(--f-mono);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
  overflow: auto;
  margin: 8px 0 0;
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}
</style>
