<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Vetting queue</div>
        <span class="pill pill-pending lg">{{ items.length }} pending</span>
        <span v-if="oldestLabel" class="fg2 text-xs">Oldest: {{ oldestLabel }}</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="vettingQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <div v-if="vettingQuery.isLoading.value" class="p-6 fg2 text-sm">Loading…</div>
        <div
          v-else-if="vettingQuery.error.value"
          class="p-6 text-sm"
          style="color: var(--danger-500)"
        >
          {{ vettingQuery.error.value?.message || 'Could not load vetting queue.' }}
        </div>
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left">
              <th class="p-3 w-12"></th>
              <th class="p-3">Advertiser</th>
              <th class="p-3">Campaign</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right w-20">Duration</th>
              <th class="p-3 w-28">Submitted</th>
              <th class="p-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!items.length">
              <td colspan="7" class="p-6 fg2 text-center text-sm">
                Nothing in the queue right now.
              </td>
            </tr>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <div class="w-8 h-6 rounded bg-[var(--bg-sunken)] flex items-center justify-center text-sm">
                  {{ thumbFor(item) }}
                </div>
              </td>
              <td class="p-3">
                <div class="font-semibold">{{ item.advertiserName || item.advertiser?.businessName || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ item.advertiserId || item.id }}</div>
              </td>
              <td class="p-3 text-[var(--fg-2)] truncate max-w-[280px]">{{ item.name || item.campaignName || '—' }}</td>
              <td class="p-3">
                <span class="pill pill-pending">{{ item.status || 'pending' }}</span>
              </td>
              <td class="p-3 text-right mono">{{ item.creative?.durationSeconds ?? item.durationSeconds ?? '—' }}s</td>
              <td class="p-3 mono text-xs">{{ relTime(item.submittedAt || item.createdAt) }}</td>
              <td class="p-3 text-right">
                <button
                  class="btn outline xs"
                  :disabled="busyId === item.id"
                  @click="onApprove(item)"
                >
                  Approve
                </button>
                <button
                  class="btn outline xs"
                  style="margin-left: 6px; color: var(--danger-500)"
                  :disabled="busyId === item.id"
                  @click="onReject(item)"
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
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { vettingApi } from '../api/vetting'
import { useToastStore } from '../stores/toast'
import { useOptimisticRowMutation } from '../composables/useOptimisticRowMutation'
import { fmt } from '../utils/format'

const toast = useToastStore()
const QUERY_KEY = ['admin', 'campaigns', 'pending-vetting']

const vettingQuery = useQuery({
  queryKey: QUERY_KEY,
  queryFn: () => vettingApi.pendingVetting(),
})

const items = computed(() => {
  const raw = vettingQuery.data.value
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return raw.data || raw.items || raw.campaigns || []
})

const oldestLabel = computed(() => {
  const list = items.value
  if (!list.length) return ''
  const oldest = list.reduce((a, b) => {
    const at = new Date(a.submittedAt || a.createdAt || 0).getTime()
    const bt = new Date(b.submittedAt || b.createdAt || 0).getTime()
    return at < bt ? a : b
  })
  const ts = oldest.submittedAt || oldest.createdAt
  return ts ? fmt.rel(ts) : ''
})

function thumbFor(item) {
  const n = item.name || item.campaignName || '?'
  return n.charAt(0).toUpperCase()
}
function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

const approveMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id }) => vettingApi.vetCampaign(id, { decision: 'approve' }),
  successLabel: ({ name }) => `${name || 'Campaign'} approved.`,
  errorLabel: 'Could not approve.',
})

const rejectMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id, reason }) =>
    vettingApi.vetCampaign(id, { decision: 'reject', reason }),
  successLabel: ({ name }) => `${name || 'Campaign'} rejected.`,
  errorLabel: 'Could not reject.',
})

// Used by the disabled-state on the row buttons. The optimistic mutation
// removes the row from the cache instantly, but if a row hasn't drained
// yet (mutation in flight) we still want its action buttons disabled.
const busyId = computed(
  () =>
    (approveMutation.isPending.value && approveMutation.variables.value?.id) ||
    (rejectMutation.isPending.value && rejectMutation.variables.value?.id) ||
    null,
)

function onApprove(item) {
  approveMutation.mutate({ id: item.id, name: item.name })
}

function onReject(item) {
  const reason = prompt('Rejection reason (10–500 characters):')
  if (!reason || reason.trim().length < 10) {
    toast.error('Rejection requires a reason of at least 10 characters.')
    return
  }
  rejectMutation.mutate({ id: item.id, name: item.name, reason: reason.trim() })
}
</script>
