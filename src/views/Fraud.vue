<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Fraud review</div>
        <span class="fg2 text-xs">
          {{ flags.length }} open · {{ refunds.length }} refunds
        </span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="refreshActive">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 12px;">
        <button
          class="btn sm outline"
          :class="{ active: activeTab === 'flags' }"
          @click="activeTab = 'flags'"
        >
          Open flags
          <span class="pill pill-failed sm" style="margin-left: 6px;">{{ flags.length }}</span>
        </button>
        <button
          class="btn sm outline"
          :class="{ active: activeTab === 'refunds' }"
          @click="activeTab = 'refunds'"
        >
          Refunds
          <span class="pill pill-neutral sm" style="margin-left: 6px;">{{ refunds.length }}</span>
        </button>
      </div>

      <!-- Open flags tab -->
      <div v-if="activeTab === 'flags'" class="card overflow-hidden">
        <RowSkeleton v-if="fraudQuery.isLoading.value" :count="6" />
        <ErrorState
          v-else-if="fraudQuery.error.value"
          title="Could not load fraud queue"
          :message="fraudQuery.error.value?.message"
          :on-retry="fraudQuery.refetch"
        />
        <EmptyState
          v-else-if="!flags.length"
          icon="ph-shield-check"
          title="Queue is clear"
          message="No fraud flags currently need review. Newly flagged items will appear here automatically."
        />
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Type</th>
              <th class="p-3">Target</th>
              <th class="p-3 text-right w-24">Score</th>
              <th class="p-3">Top flags</th>
              <th class="p-3">Status</th>
              <th class="p-3">Detected</th>
              <th class="p-3 w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="flag in flags"
              :key="flag.id"
              class="border-t border-[var(--border)]"
            >
              <td class="p-3">
                <span class="pill pill-neutral sm">
                  <i class="ph" :class="iconForType(flag.type)"></i>
                  {{ flag.type || '—' }}
                </span>
              </td>
              <td class="p-3">
                <div class="font-medium">{{ flag.target || flag.targetName || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ flag.id }}</div>
              </td>
              <td class="p-3 text-right">
                <div class="inline-flex items-center gap-2">
                  <span class="font-bold" :class="scoreClass(flag.score)">
                    {{ (flag.score ?? 0).toFixed(2) }}
                  </span>
                  <div class="w-10 h-1 rounded bg-[var(--bg-sunken)] overflow-hidden">
                    <div class="h-full" :class="scoreBgClass(flag.score)" :style="{ width: ((flag.score ?? 0) * 100) + '%' }"></div>
                  </div>
                </div>
              </td>
              <td class="p-3">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="f in (flag.flags || flag.reasons || []).slice(0, 3)" :key="f" class="pill pill-failed sm">
                    {{ String(f).replace(/_/g, ' ') }}
                  </span>
                </div>
              </td>
              <td class="p-3">
                <span class="pill" :class="statusPillClass(flag.status)">{{ flag.status || 'pending' }}</span>
              </td>
              <td class="p-3 mono fg2 text-xs">{{ relTime(flag.detectedAt || flag.createdAt) }}</td>
              <td class="p-3 text-right">
                <button
                  class="btn ghost xs"
                  :disabled="isBusy(flag.id)"
                  @click="openEvidence(flag)"
                  title="View evidence"
                >
                  <i class="ph ph-magnifying-glass"></i>
                </button>
                <button
                  v-if="me.can(PERM.FRAUD_VIEW)"
                  class="btn outline xs"
                  style="margin-left: 6px"
                  :disabled="isBusy(flag.id)"
                  @click="onClear(flag)"
                >
                  Clear
                </button>
                <button
                  v-if="me.can(PERM.FRAUD_VIEW)"
                  class="btn outline xs"
                  style="margin-left: 6px"
                  :disabled="isBusy(flag.id)"
                  @click="onHold(flag)"
                >
                  Hold
                </button>
                <button
                  v-if="me.can(PERM.FRAUD_CONFIRM)"
                  class="btn outline xs"
                  style="margin-left: 6px; color: var(--danger-500)"
                  :disabled="isBusy(flag.id)"
                  @click="onConfirm(flag)"
                >
                  Confirm
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Refunds tab -->
      <div v-else class="card overflow-hidden">
        <RowSkeleton v-if="refundsQuery.isLoading.value" :count="5" />
        <ErrorState
          v-else-if="refundsQuery.error.value"
          title="Could not load refund queue"
          :message="refundsQuery.error.value?.message"
          :on-retry="refundsQuery.refetch"
        />
        <EmptyState
          v-else-if="!refunds.length"
          icon="ph-arrow-counter-clockwise"
          title="No fraud refunds"
          message="Refunds appear here once a confirmed fraud flag triggers wallet credits to affected advertisers."
        />
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Advertiser</th>
              <th class="p-3 text-right w-32">Amount</th>
              <th class="p-3 w-28">Status</th>
              <th class="p-3">Source flag</th>
              <th class="p-3">Initiated by</th>
              <th class="p-3 w-28">When</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in refunds"
              :key="row.refund?.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <div class="font-semibold">
                  {{ row.advertiser?.businessName || '—' }}
                </div>
                <div class="mono text-[11px] text-[var(--fg-3)]">
                  {{ row.refund?.advertiserId }}
                </div>
              </td>
              <td class="p-3 text-right mono">
                {{ formatKobo(row.refund?.amountKobo) }}
              </td>
              <td class="p-3">
                <span class="pill sm" :class="refundStatusPill(row.refund?.status)">
                  {{ row.refund?.status || 'pending' }}
                </span>
              </td>
              <td class="p-3 mono text-[11px] text-[var(--fg-3)]">
                {{ row.refund?.fraudFlagId || row.fraudFlag?.id }}
              </td>
              <td class="p-3 text-xs">
                {{ row.initiator?.name || row.initiator?.email || '—' }}
              </td>
              <td class="p-3 mono fg2 text-xs">
                {{ relTime(row.refund?.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Evidence modal -->
    <div
      v-if="evidenceFlag"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 8vh; z-index: 60;"
      @click.self="closeEvidence"
    >
      <div class="card" style="width: 720px; max-width: 95vw; max-height: 84vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="card-head">
          <div>
            <div class="card-title">Evidence · {{ evidenceFlag.target || evidenceFlag.id }}</div>
            <div class="fg2 text-xs mono">{{ evidenceFlag.id }}</div>
          </div>
          <div class="spacer"></div>
          <button class="btn ghost sm" @click="closeEvidence"><i class="ph ph-x"></i></button>
        </div>
        <div style="overflow-y: auto; padding: 16px;">
          <RowSkeleton v-if="evidenceQuery.isLoading.value" :count="4" />
          <div v-else-if="evidenceQuery.error.value" class="fg2 text-sm">
            Could not load evidence: {{ evidenceQuery.error.value?.message }}
          </div>
          <div v-else-if="evidence">
            <!-- Score + flags summary -->
            <div class="ev-summary">
              <div>
                <div class="ev-label">Score</div>
                <div class="ev-score" :class="scoreClass(evidence.flag?.score)">
                  {{ (evidence.flag?.score ?? 0).toFixed(2) }}
                </div>
              </div>
              <div>
                <div class="ev-label">Status</div>
                <span class="pill" :class="statusPillClass(evidence.flag?.status)">
                  {{ evidence.flag?.status || 'pending' }}
                </span>
              </div>
              <div>
                <div class="ev-label">Detected</div>
                <div class="mono text-xs">
                  {{ relTime(evidence.flag?.detectedAt) }}
                </div>
              </div>
            </div>

            <div class="ev-section">
              <div class="ev-section-title">Reasons</div>
              <div class="flex g4" style="flex-wrap: wrap;">
                <span
                  v-for="r in (evidence.flag?.flags || evidence.flag?.reasons || [])"
                  :key="r"
                  class="pill pill-failed sm"
                >
                  {{ String(r).replace(/_/g, ' ') }}
                </span>
                <span v-if="!(evidence.flag?.flags || evidence.flag?.reasons || []).length" class="fg2 text-xs">
                  No reasons recorded.
                </span>
              </div>
            </div>

            <div class="ev-section" v-if="evidence.targetDetails">
              <div class="ev-section-title">Target</div>
              <pre class="ev-pre">{{ JSON.stringify(evidence.targetDetails, null, 2) }}</pre>
            </div>

            <div class="ev-section" v-if="evidence.evidence">
              <div class="ev-section-title">Detector evidence</div>
              <pre class="ev-pre">{{ JSON.stringify(evidence.evidence, null, 2) }}</pre>
            </div>

            <div class="ev-section" v-if="evidence.actionHistory?.length">
              <div class="ev-section-title">Action history</div>
              <ul class="ev-history">
                <li
                  v-for="action in evidence.actionHistory"
                  :key="action.id"
                  class="ev-history-row"
                >
                  <span class="pill sm pill-neutral mono">{{ action.actionType }}</span>
                  <span class="text-xs">
                    {{ action.actionTakenByUser?.name || action.actionTakenByUser?.email || 'system' }}
                  </span>
                  <span class="fg2 text-xs">{{ relTime(action.createdAt) }}</span>
                  <span v-if="action.notes" class="fg2 text-xs" style="grid-column: 1 / -1; margin-top: 2px;">
                    {{ action.notes }}
                  </span>
                </li>
              </ul>
            </div>

            <div class="ev-section" v-if="evidence.relatedFlags?.length">
              <div class="ev-section-title">
                Related flags · {{ evidence.relatedFlags.length }}
              </div>
              <ul class="ev-history">
                <li
                  v-for="rf in evidence.relatedFlags.slice(0, 5)"
                  :key="rf.id"
                  class="ev-history-row"
                >
                  <span class="pill sm" :class="statusPillClass(rf.status)">{{ rf.status }}</span>
                  <span class="mono text-[11px]">{{ rf.id }}</span>
                  <span class="fg2 text-xs">{{ relTime(rf.detectedAt) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Footer actions: same set as the row, plus refund advertisers
             when the flag is confirmed. Keep wired to the same mutations
             so `isBusy` and toast paths stay consistent. -->
        <div class="border-t border-[var(--border)] p-3 flex ac" style="gap: 6px;">
          <button class="btn ghost sm" @click="closeEvidence">Close</button>
          <div class="spacer"></div>
          <button
            v-if="canRefund && evidence?.flag?.status === 'confirmed'"
            class="btn outline sm"
            style="color: var(--danger-500);"
            :disabled="refundMutation.isPending.value"
            @click="onRefund(evidenceFlag)"
          >
            <i class="ph ph-arrow-counter-clockwise"></i>
            Refund advertisers
          </button>
          <button
            v-if="me.can(PERM.FRAUD_VIEW)"
            class="btn outline sm"
            :disabled="isBusy(evidenceFlag.id)"
            @click="onClear(evidenceFlag); closeEvidence()"
          >
            Clear
          </button>
          <button
            v-if="me.can(PERM.FRAUD_VIEW)"
            class="btn outline sm"
            :disabled="isBusy(evidenceFlag.id)"
            @click="onHold(evidenceFlag); closeEvidence()"
          >
            Hold
          </button>
          <button
            v-if="me.can(PERM.FRAUD_CONFIRM)"
            class="btn primary sm"
            style="background: var(--danger-500);"
            :disabled="isBusy(evidenceFlag.id)"
            @click="onConfirm(evidenceFlag); closeEvidence()"
          >
            Confirm fraud
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import { fraudApi } from '../api/fraud'
import { useOptimisticRowMutation } from '../composables/useOptimisticRowMutation'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { useToastStore } from '../stores/toast'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const me = useCurrentAdmin()
const toast = useToastStore()
const qc = useQueryClient()
const QUERY_KEY = qk.fraudQueue()
const REFUNDS_KEY = qk.fraudRefunds()
const canRefund = computed(() => me.can(PERM.FRAUD_REFUND))

const activeTab = ref('flags')

const fraudQuery = useQuery({
  queryKey: QUERY_KEY,
  queryFn: () => fraudApi.queue(),
  // Fraud queue is time-sensitive — refresh more aggressively than default.
  refetchInterval: 60_000,
})

const flags = computed(() => extractList(fraudQuery.data.value, 'flags'))

// Refunds queue — surfaces wallet credits that fraud confirmation
// triggered. Server-side gated on fraud.view, so anyone who can see
// the flags list can see the resulting refunds.
const refundsQuery = useQuery({
  queryKey: REFUNDS_KEY,
  queryFn: () => fraudApi.refunds(),
  refetchInterval: 60_000,
})

const refunds = computed(() => extractList(refundsQuery.data.value, 'refunds'))

function refreshActive() {
  if (activeTab.value === 'flags') fraudQuery.refetch()
  else refundsQuery.refetch()
}

function formatKobo(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
}

function refundStatusPill(s) {
  if (s === 'completed' || s === 'paid') return 'pill-active'
  if (s === 'failed') return 'pill-failed'
  return 'pill-pending'
}

function iconForType(t) {
  if (t === 'screen') return 'ph-monitor'
  if (t === 'advertiser') return 'ph-megaphone'
  if (t === 'host') return 'ph-storefront'
  return 'ph-warning'
}
function scoreClass(s) {
  if (s == null) return 'fg2'
  if (s >= 0.6) return 'text-danger-500'
  if (s >= 0.3) return 'text-gold-500'
  return 'text-moss-500'
}
function scoreBgClass(s) {
  if (s == null) return ''
  if (s >= 0.6) return 'bg-danger-500'
  if (s >= 0.3) return 'bg-gold-500'
  return 'bg-moss-500'
}
function statusPillClass(s) {
  if (s === 'reviewing' || s === 'hold') return 'pill-hold'
  if (s === 'cleared' || s === 'resolved') return 'pill-active'
  return 'pill-pending'
}
function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

const clearMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id }) => fraudApi.clear(id),
  successLabel: ({ id }) => `Flag ${id} cleared.`,
  errorLabel: 'Could not clear flag.',
})

const holdMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id }) => fraudApi.hold(id),
  successLabel: ({ id }) => `Flag ${id} on hold.`,
  errorLabel: 'Could not hold flag.',
})

const confirmMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id }) => fraudApi.confirm(id),
  successLabel: ({ id }) => `Fraud confirmed for ${id}.`,
  errorLabel: 'Could not confirm fraud.',
})

function isBusy(id) {
  return (
    (clearMutation.isPending.value && clearMutation.variables.value?.id === id) ||
    (holdMutation.isPending.value && holdMutation.variables.value?.id === id) ||
    (confirmMutation.isPending.value && confirmMutation.variables.value?.id === id) ||
    (refundMutation.isPending.value && refundMutation.variables.value?.id === id)
  )
}

function onClear(flag) {
  clearMutation.mutate({ id: flag.id })
}

function onHold(flag) {
  holdMutation.mutate({ id: flag.id })
}

function onConfirm(flag) {
  if (!confirm(`Confirm fraud on ${flag.target || flag.id}? This suspends the entity.`)) return
  confirmMutation.mutate({ id: flag.id })
}

// ── Evidence modal ────────────────────────────────────────────────────
const evidenceFlag = ref(null)

const evidenceQuery = useQuery({
  // The query is keyed on the *currently-open* flag's id and only
  // enabled while the modal is open, so closing the modal automatically
  // garbage-collects the in-flight request rather than racing.
  queryKey: computed(() => qk.fraudEvidence(evidenceFlag.value?.id ?? '__none__')),
  queryFn: () => fraudApi.evidence(evidenceFlag.value.id),
  enabled: computed(() => !!evidenceFlag.value),
})

const evidence = computed(() => evidenceQuery.data.value)

function openEvidence(flag) {
  evidenceFlag.value = flag
}

function closeEvidence() {
  evidenceFlag.value = null
}

// ── Refund advertisers (reauth-gated server-side) ─────────────────────
const refundMutation = useMutation({
  mutationFn: ({ id }) => fraudApi.refundAdvertisers(id),
  onSuccess: (_out, vars) => {
    toast.success(`Refund initiated for flag ${vars.id}.`)
    qc.invalidateQueries({ queryKey: QUERY_KEY })
    qc.invalidateQueries({ queryKey: qk.fraudRefunds() })
    closeEvidence()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Refund failed.')
  },
})

function onRefund(flag) {
  if (!confirm(`Initiate advertiser refunds for flag ${flag.id}? This is reauth-protected.`)) return
  refundMutation.mutate({ id: flag.id })
}
</script>

<style scoped>
.ev-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 12px 14px;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 14px;
}
.ev-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-3);
  margin-bottom: 4px;
}
.ev-score {
  font-family: var(--f-display);
  font-size: 22px;
  line-height: 1;
}
.ev-section {
  margin-bottom: 14px;
}
.ev-section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-3);
  margin-bottom: 6px;
}
.ev-pre {
  font-family: var(--f-mono);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 240px;
  overflow: auto;
  margin: 0;
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.ev-history {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ev-history-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-top: 1px dashed var(--border);
}
.ev-history-row:first-child {
  border-top: none;
}
</style>
