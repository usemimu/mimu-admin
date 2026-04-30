<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Fraud review</div>
        <span class="pill pill-failed lg">{{ flags.length }} open</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="fraudQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
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
                  v-if="me.can(PERM.FRAUD_VIEW)"
                  class="btn outline xs"
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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { fraudApi } from '../api/fraud'
import { useOptimisticRowMutation } from '../composables/useOptimisticRowMutation'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const me = useCurrentAdmin()
const QUERY_KEY = qk.fraudQueue()

const fraudQuery = useQuery({
  queryKey: QUERY_KEY,
  queryFn: () => fraudApi.queue(),
  // Fraud queue is time-sensitive — refresh more aggressively than default.
  refetchInterval: 60_000,
})

const flags = computed(() => extractList(fraudQuery.data.value, 'flags'))

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
    (confirmMutation.isPending.value && confirmMutation.variables.value?.id === id)
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
</script>
