<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Creative vetting</div>
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
        <RowSkeleton v-if="vettingQuery.isLoading.value" :count="6" />
        <ErrorState
          v-else-if="vettingQuery.error.value"
          title="Could not load creative queue"
          :message="vettingQuery.error.value?.message"
          :on-retry="vettingQuery.refetch"
        />
        <EmptyState
          v-else-if="!items.length"
          icon="ph-eye"
          title="Queue is clear"
          message="No creatives waiting on review. New uploads land here once their processing finishes."
        />
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left">
              <th class="p-3 w-12">Format</th>
              <th class="p-3">Advertiser</th>
              <th class="p-3">Creative</th>
              <th class="p-3 text-right w-20">Duration</th>
              <th class="p-3 w-28">Submitted</th>
              <th class="p-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <i class="ph text-base" :class="formatIcon(item.format)"></i>
              </td>
              <td class="p-3">
                <div class="font-semibold">
                  {{ item.advertiserName || item.advertiser?.businessName || '—' }}
                </div>
                <div class="mono text-[11px] text-[var(--fg-3)]">
                  {{ item.advertiserId || '—' }}
                </div>
              </td>
              <td class="p-3 text-[var(--fg-2)] truncate max-w-[280px]">
                {{ item.filename || item.id }}
              </td>
              <td class="p-3 text-right mono">
                {{ item.durationSeconds != null ? `${item.durationSeconds}s` : '—' }}
              </td>
              <td class="p-3 mono text-xs">
                {{ relTime(item.vettingSubmittedAt || item.updatedAt) }}
              </td>
              <td class="p-3 text-right">
                <button
                  v-if="me.can(PERM.CREATIVES_APPROVE)"
                  class="btn outline xs"
                  :disabled="busyId === item.id"
                  @click="onApprove(item)"
                >
                  Approve
                </button>
                <button
                  v-if="me.can(PERM.CREATIVES_REJECT)"
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
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const toast = useToastStore()
const me = useCurrentAdmin()
const QUERY_KEY = qk.creativeVettingQueue()

// Distinct from the campaign vetting queue (handled in Campaigns.vue).
// This view focuses on individual creatives that need APCON-style
// review before they can be attached to a live campaign.
const vettingQuery = useQuery({
  queryKey: QUERY_KEY,
  queryFn: () => vettingApi.creativeVettingQueue(),
})

const items = computed(() => extractList(vettingQuery.data.value, 'queue'))

const oldestLabel = computed(() => {
  const list = items.value
  if (!list.length) return ''
  const oldest = list.reduce((a, b) => {
    const at = new Date(a.vettingSubmittedAt || a.updatedAt || 0).getTime()
    const bt = new Date(b.vettingSubmittedAt || b.updatedAt || 0).getTime()
    return at < bt ? a : b
  })
  const ts = oldest.vettingSubmittedAt || oldest.updatedAt
  return ts ? fmt.rel(ts) : ''
})

function formatIcon(format) {
  if (format === 'video') return 'ph-video'
  if (format === 'image') return 'ph-image'
  return 'ph-file'
}
function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

const approveMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id }) => vettingApi.approveCreative(id),
  successLabel: ({ name }) => `${name || 'Creative'} approved.`,
  errorLabel: 'Could not approve.',
})

const rejectMutation = useOptimisticRowMutation({
  queryKey: QUERY_KEY,
  mutationFn: ({ id, reason }) => vettingApi.rejectCreative(id, reason),
  successLabel: ({ name }) => `${name || 'Creative'} rejected.`,
  errorLabel: 'Could not reject.',
})

const busyId = computed(
  () =>
    (approveMutation.isPending.value && approveMutation.variables.value?.id) ||
    (rejectMutation.isPending.value && rejectMutation.variables.value?.id) ||
    null,
)

function onApprove(item) {
  approveMutation.mutate({ id: item.id, name: item.filename })
}

function onReject(item) {
  const reason = prompt('Rejection reason (10–500 characters):')
  if (!reason || reason.trim().length < 10) {
    toast.error('Rejection requires a reason of at least 10 characters.')
    return
  }
  rejectMutation.mutate({
    id: item.id,
    name: item.filename,
    reason: reason.trim(),
  })
}
</script>
