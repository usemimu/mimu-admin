<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Compliance · refunds</div>
        <span class="pill pill-pending lg">{{ refunds.length }} pending</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="refundsQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <div v-if="refundsQuery.isLoading.value" class="p-6 fg2 text-sm">Loading…</div>
        <div
          v-else-if="refundsQuery.error.value"
          class="p-6 text-sm"
          style="color: var(--danger-500)"
        >
          {{ refundsQuery.error.value?.message || 'Could not load refund requests.' }}
        </div>
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Advertiser</th>
              <th class="p-3">Reason</th>
              <th class="p-3 text-right">Amount</th>
              <th class="p-3">Submitted</th>
              <th class="p-3 w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!refunds.length">
              <td colspan="5" class="p-6 fg2 text-center text-sm">No pending refund requests.</td>
            </tr>
            <tr
              v-for="r in refunds"
              :key="r.id"
              class="border-t border-[var(--border)]"
            >
              <td class="p-3">
                <div class="font-semibold">{{ r.advertiserName || r.advertiser?.businessName || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ r.id }}</div>
              </td>
              <td class="p-3 fg2 truncate max-w-[360px]">{{ r.reason || r.description || '—' }}</td>
              <td class="p-3 text-right mono">{{ fmt.naira(toNaira(r.amountKobo ?? r.amount)) }}</td>
              <td class="p-3 mono fg2 text-xs">{{ relTime(r.createdAt || r.submittedAt) }}</td>
              <td class="p-3 text-right">
                <button class="btn outline xs" :disabled="isBusy(r.id)" @click="onApprove(r)">
                  Approve
                </button>
                <button
                  class="btn outline xs"
                  style="margin-left: 6px; color: var(--danger-500)"
                  :disabled="isBusy(r.id)"
                  @click="onDeny(r)"
                >
                  Deny
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
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { adminRefundsApi } from '../api/refunds'
import { useToastStore } from '../stores/toast'
import { useOptimisticRowMutation } from '../composables/useOptimisticRowMutation'
import { fmt } from '../utils/format'

const toast = useToastStore()
const QUERY_KEY = ['admin', 'refunds', 'pending']

const refundsQuery = useQuery({
  queryKey: QUERY_KEY,
  queryFn: () => adminRefundsApi.pending(),
})

const refunds = computed(() => {
  const raw = refundsQuery.data.value
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return raw.data || raw.items || raw.requests || []
})

function toNaira(v) {
  if (v == null) return 0
  if (typeof v === 'object' && v.kobo != null) return Math.round(Number(v.kobo) / 100)
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return 0
  return n > 1_000_000 ? Math.round(n / 100) : Math.round(n)
}

function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

const approveMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id, notes }) =>
    adminRefundsApi.review(id, { decision: 'approve', notes }),
  successLabel: 'Refund approved.',
  errorLabel: 'Could not approve.',
})

const denyMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id, denialReason }) =>
    adminRefundsApi.review(id, { decision: 'deny', denialReason }),
  successLabel: 'Refund denied.',
  errorLabel: 'Could not deny.',
})

function isBusy(id) {
  return (
    (approveMutation.isPending.value && approveMutation.variables.value?.id === id) ||
    (denyMutation.isPending.value && denyMutation.variables.value?.id === id)
  )
}

function onApprove(r) {
  const notes = prompt('Approval notes (optional):') || undefined
  approveMutation.mutate({ id: r.id, notes })
}

function onDeny(r) {
  const denialReason = prompt('Why are we denying this refund? (≥10 chars)')
  if (!denialReason || denialReason.trim().length < 10) {
    toast.error('A 10+ character denial reason is required.')
    return
  }
  denyMutation.mutate({ id: r.id, denialReason: denialReason.trim() })
}
</script>
