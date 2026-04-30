<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Payout approvals</div>
        <span class="pill pill-pending lg">{{ payouts.length }} pending</span>
        <span class="fg2 text-xs">
          Total gross: <strong class="mono text-[var(--fg)]">{{ fmt.naira(totals.gross) }}</strong>
          · WHT: <strong class="mono text-[var(--fg)]">{{ fmt.naira(totals.wht) }}</strong>
          · Net: <strong class="mono text-[var(--fg)]">{{ fmt.naira(totals.net) }}</strong>
        </span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="payoutsQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
        <button
          v-if="me.can(PERM.PAYOUTS_BULK_APPROVE)"
          class="btn primary sm"
          :disabled="!selected.length || busy"
          @click="onBulkApprove"
        >
          <i class="ph ph-check-circle"></i>
          Approve {{ selected.length || '' }}
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <RowSkeleton v-if="payoutsQuery.isLoading.value" :count="6" />
        <ErrorState
          v-else-if="payoutsQuery.error.value"
          title="Could not load payouts"
          :message="payoutsQuery.error.value?.message"
          :on-retry="payoutsQuery.refetch"
        />
        <EmptyState
          v-else-if="!payouts.length"
          icon="ph-bank"
          title="No payouts pending"
          message="Approved hosts get payouts on the configured schedule. Newly settled batches will show up here."
        />
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3 w-8">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected"
                  @change="toggleAll"
                />
              </th>
              <th class="p-3">Host</th>
              <th class="p-3">Period</th>
              <th class="p-3 text-right">Gross</th>
              <th class="p-3 text-right">WHT</th>
              <th class="p-3 text-right">Net</th>
              <th class="p-3">Destination</th>
              <th class="p-3">Computed</th>
              <th class="p-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in payouts"
              :key="p.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <input
                  type="checkbox"
                  :checked="selected.includes(p.id)"
                  @change="toggle(p.id)"
                />
              </td>
              <td class="p-3">
                <div class="font-semibold">{{ p.hostName || p.host?.businessName || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ p.id }}</div>
              </td>
              <td class="p-3 fg2">{{ p.periodLabel || formatPeriod(p) }}</td>
              <td class="p-3 text-right mono">{{ fmt.naira(toNaira(p.grossKobo ?? p.gross)) }}</td>
              <td class="p-3 text-right mono fg2 text-xs">{{ fmt.naira(toNaira(p.whtKobo ?? p.wht)) }}</td>
              <td class="p-3 text-right mono font-semibold">{{ fmt.naira(toNaira(p.netKobo ?? p.net)) }}</td>
              <td class="p-3 mono text-xs fg2">{{ destinationLabel(p) }}</td>
              <td class="p-3 mono fg2 text-[11px]">{{ relTime(p.computedAt || p.createdAt) }}</td>
              <td class="p-3 text-right">
                <button
                  v-if="me.can(PERM.PAYOUTS_APPROVE)"
                  class="btn outline xs"
                  :disabled="isBusy(p.id)"
                  @click="onApprove(p)"
                >
                  Approve
                </button>
                <button
                  v-if="me.can(PERM.PAYOUTS_APPROVE)"
                  class="btn outline xs"
                  style="margin-left: 6px; color: var(--danger-500)"
                  :disabled="isBusy(p.id)"
                  @click="onReject(p)"
                >
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { adminPayoutsApi } from '../api/payouts'
import { useToastStore } from '../stores/toast'
import { useOptimisticRowMutation } from '../composables/useOptimisticRowMutation'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const toast = useToastStore()
const qc = useQueryClient()
const me = useCurrentAdmin()
const QUERY_KEY = qk.payoutsPending()

const payoutsQuery = useQuery({
  queryKey: QUERY_KEY,
  queryFn: () => adminPayoutsApi.pending(),
  refetchInterval: 60_000,
})

const payouts = computed(() => extractList(payoutsQuery.data.value, 'payouts'))

function toNaira(v) {
  if (v == null) return 0
  if (typeof v === 'object' && v.kobo != null) return Math.round(Number(v.kobo) / 100)
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return 0
  return n > 1_000_000 ? Math.round(n / 100) : Math.round(n)
}

const totals = computed(() => {
  const acc = { gross: 0, wht: 0, net: 0 }
  for (const p of payouts.value) {
    acc.gross += toNaira(p.grossKobo ?? p.gross)
    acc.wht += toNaira(p.whtKobo ?? p.wht)
    acc.net += toNaira(p.netKobo ?? p.net)
  }
  return acc
})

const selected = ref([])
const allSelected = computed(
  () => payouts.value.length > 0 && selected.value.length === payouts.value.length,
)
const someSelected = computed(
  () => selected.value.length > 0 && selected.value.length < payouts.value.length,
)

function toggle(id) {
  const i = selected.value.indexOf(id)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(id)
}
function toggleAll() {
  if (allSelected.value) selected.value = []
  else selected.value = payouts.value.map((p) => p.id)
}

function destinationLabel(p) {
  const acct = p.bankAccount || p.destination
  if (!acct) return '—'
  return `${acct.bankName || ''} ••${(acct.accountNumber || '').slice(-4)}`
}
function formatPeriod(p) {
  if (p.periodStart && p.periodEnd) return `${p.periodStart.slice(0, 10)} → ${p.periodEnd.slice(0, 10)}`
  return '—'
}
function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

const approveMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id }) => adminPayoutsApi.approve(id),
  successLabel: ({ name, id }) => `Payout to ${name || id} approved.`,
  errorLabel: 'Could not approve.',
})

const rejectMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id, reason }) => adminPayoutsApi.reject(id, reason),
  successLabel: ({ name, id }) => `Payout to ${name || id} rejected.`,
  errorLabel: 'Could not reject.',
})

function isBusy(id) {
  return (
    (approveMutation.isPending.value && approveMutation.variables.value?.id === id) ||
    (rejectMutation.isPending.value && rejectMutation.variables.value?.id === id)
  )
}

function onApprove(p) {
  approveMutation.mutate({ id: p.id, name: p.hostName })
}

function onReject(p) {
  const reason = prompt('Rejection reason:')
  if (!reason) return
  rejectMutation.mutate({ id: p.id, name: p.hostName, reason })
}

// Bulk approve does its own optimistic update because it removes a *set*
// of rows rather than a single one. We snapshot the selected ids,
// optimistically strip them all, then on settle the cache invalidates and
// re-syncs with whatever the server actually approved.
const busy = ref(false)
async function onBulkApprove() {
  if (!selected.value.length) return
  if (!confirm(`Approve ${selected.value.length} payouts?`)) return
  busy.value = true
  const ids = [...selected.value]
  await qc.cancelQueries({ queryKey: QUERY_KEY })
  const previous = qc.getQueryData(QUERY_KEY)
  qc.setQueryData(QUERY_KEY, (old) => {
    if (!old) return old
    if (Array.isArray(old)) return old.filter((p) => !ids.includes(p.id))
    for (const key of ['data', 'items', 'payouts']) {
      if (Array.isArray(old[key])) {
        return { ...old, [key]: old[key].filter((p) => !ids.includes(p.id)) }
      }
    }
    return old
  })
  try {
    const res = await adminPayoutsApi.bulkApprove(ids)
    const approved = res?.approvedCount ?? ids.length
    const skipped = res?.skippedCount ?? 0
    toast.success(`${approved} approved · ${skipped} skipped.`)
    selected.value = []
  } catch (err) {
    qc.setQueryData(QUERY_KEY, previous)
    if (!err?.needsReauth) toast.error(err?.message || 'Bulk approve failed.')
  } finally {
    qc.invalidateQueries({ queryKey: QUERY_KEY })
    busy.value = false
  }
}
</script>
