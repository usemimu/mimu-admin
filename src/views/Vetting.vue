<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Creative vetting</div>
        <span class="fg2 text-xs">
          {{ vettingItems.length }} pending review · {{ apconItems.length }} awaiting APCON
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
          :class="{ active: activeTab === 'vetting' }"
          @click="activeTab = 'vetting'"
        >
          Internal review
          <span class="pill pill-pending sm" style="margin-left: 6px;">{{ vettingItems.length }}</span>
        </button>
        <button
          class="btn sm outline"
          :class="{ active: activeTab === 'apcon' }"
          @click="activeTab = 'apcon'"
        >
          APCON queue
          <span class="pill pill-neutral sm" style="margin-left: 6px;">{{ apconItems.length }}</span>
        </button>
      </div>

      <div class="card overflow-hidden">
        <RowSkeleton v-if="activeQuery.isLoading.value" :count="6" />
        <ErrorState
          v-else-if="activeQuery.error.value"
          title="Could not load creative queue"
          :message="activeQuery.error.value?.message"
          :on-retry="activeQuery.refetch"
        />
        <EmptyState
          v-else-if="!activeItems.length"
          :icon="activeTab === 'vetting' ? 'ph-eye' : 'ph-stamp'"
          :title="activeTab === 'vetting' ? 'Queue is clear' : 'Nothing awaiting APCON'"
          :message="
            activeTab === 'vetting'
              ? 'No creatives waiting on review. New uploads land here once their processing finishes.'
              : 'Internally-approved creatives appear here while waiting on APCON sign-off.'
          "
        />
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left">
              <th class="p-3 w-12">Format</th>
              <th class="p-3">Advertiser</th>
              <th class="p-3">Creative</th>
              <th class="p-3 text-right w-20">Duration</th>
              <th class="p-3 w-32">{{ activeTab === 'vetting' ? 'Submitted' : 'APCON sent' }}</th>
              <th class="p-3 w-56 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in activeItems"
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
                {{
                  activeTab === 'vetting'
                    ? relTime(item.vettingSubmittedAt || item.updatedAt)
                    : relTime(item.apconSubmittedAt || item.updatedAt)
                }}
              </td>
              <td class="p-3 text-right">
                <!-- Internal review tab actions -->
                <template v-if="activeTab === 'vetting'">
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
                </template>

                <!-- APCON tab actions -->
                <template v-else>
                  <!-- Before submission: button to mark "submitted to APCON".
                       After submission: shows the reference + Approve/Reject. -->
                  <button
                    v-if="!item.apconSubmittedAt && me.can(PERM.CREATIVES_APCON_SUBMIT)"
                    class="btn outline xs"
                    :disabled="busyId === item.id"
                    @click="openApconSubmit(item)"
                  >
                    Mark sent to APCON
                  </button>
                  <template v-else>
                    <button
                      v-if="me.can(PERM.CREATIVES_APCON_MARK)"
                      class="btn primary xs"
                      :disabled="busyId === item.id"
                      @click="openApconApprove(item)"
                    >
                      Mark approved
                    </button>
                    <button
                      v-if="me.can(PERM.CREATIVES_APCON_MARK)"
                      class="btn outline xs"
                      style="margin-left: 6px; color: var(--danger-500)"
                      :disabled="busyId === item.id"
                      @click="openApconReject(item)"
                    >
                      Mark rejected
                    </button>
                  </template>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- APCON: mark-submitted modal (just records the reference) -->
    <div
      v-if="apconSubmitItem"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
      @click.self="apconSubmitItem = null"
    >
      <div class="card" style="padding: 22px; width: 460px; max-width: 92vw;">
        <h3 style="margin: 0 0 4px;">Mark sent to APCON</h3>
        <p class="fg2 text-xs" style="margin: 0 0 14px;">
          Records that <strong>{{ apconSubmitItem.filename || apconSubmitItem.id }}</strong> was physically submitted to APCON. The reference number is optional.
        </p>
        <label class="text-xs fg2 block mb-1">APCON reference (optional)</label>
        <input
          v-model="apconRef"
          class="input"
          placeholder="e.g. APC/2026/04123"
          style="width: 100%; margin-bottom: 16px;"
        />
        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="apconSubmitItem = null">Cancel</button>
          <button
            class="btn primary sm"
            :disabled="apconSubmitMutation.isPending.value"
            @click="confirmApconSubmit"
          >
            {{ apconSubmitMutation.isPending.value ? 'Recording…' : 'Record' }}
          </button>
        </div>
      </div>
    </div>

    <!-- APCON: mark-approved modal (certificate number + expiry are required) -->
    <div
      v-if="apconApproveItem"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
      @click.self="apconApproveItem = null"
    >
      <div class="card" style="padding: 22px; width: 460px; max-width: 92vw;">
        <h3 style="margin: 0 0 4px;">APCON approval</h3>
        <p class="fg2 text-xs" style="margin: 0 0 14px;">
          Records the APCON certificate for <strong>{{ apconApproveItem.filename || apconApproveItem.id }}</strong>. This unlocks the creative for live campaigns.
        </p>
        <label class="text-xs fg2 block mb-1">Certificate number</label>
        <input
          v-model="apconCert"
          class="input"
          placeholder="APCON certificate reference"
          style="width: 100%; margin-bottom: 12px;"
        />
        <label class="text-xs fg2 block mb-1">Expiry date</label>
        <input
          v-model="apconExpiry"
          type="date"
          class="input"
          style="width: 100%; margin-bottom: 16px;"
        />
        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="apconApproveItem = null">Cancel</button>
          <button
            class="btn primary sm"
            :disabled="!canSubmitApconApprove || apconApproveMutation.isPending.value"
            @click="confirmApconApprove"
          >
            {{ apconApproveMutation.isPending.value ? 'Saving…' : 'Confirm approval' }}
          </button>
        </div>
      </div>
    </div>

    <!-- APCON: mark-rejected modal (reason required) -->
    <div
      v-if="apconRejectItem"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
      @click.self="apconRejectItem = null"
    >
      <div class="card" style="padding: 22px; width: 460px; max-width: 92vw;">
        <h3 style="margin: 0 0 4px;">APCON rejection</h3>
        <p class="fg2 text-xs" style="margin: 0 0 14px;">
          Records APCON's rejection of <strong>{{ apconRejectItem.filename || apconRejectItem.id }}</strong>. The advertiser will be notified.
        </p>
        <label class="text-xs fg2 block mb-1">Reason from APCON</label>
        <textarea
          v-model="apconRejectReason"
          class="input"
          rows="4"
          placeholder="What did APCON cite?"
          style="width: 100%; margin-bottom: 16px;"
        ></textarea>
        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="apconRejectItem = null">Cancel</button>
          <button
            class="btn primary sm"
            style="background: var(--danger-500);"
            :disabled="!apconRejectReason.trim() || apconRejectMutation.isPending.value"
            @click="confirmApconReject"
          >
            {{ apconRejectMutation.isPending.value ? 'Saving…' : 'Confirm rejection' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

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
const qc = useQueryClient()
const me = useCurrentAdmin()

const activeTab = ref('vetting')

const VETTING_KEY = qk.creativeVettingQueue()
const APCON_KEY = qk.creativeApconQueue()

// Both queries run from the start so the tab counters match reality.
const vettingQuery = useQuery({
  queryKey: VETTING_KEY,
  queryFn: () => vettingApi.creativeVettingQueue(),
})
const apconQuery = useQuery({
  queryKey: APCON_KEY,
  queryFn: () => vettingApi.creativeApconQueue(),
})

const vettingItems = computed(() => extractList(vettingQuery.data.value, 'queue'))
const apconItems = computed(() => extractList(apconQuery.data.value, 'queue'))

const activeQuery = computed(() => (activeTab.value === 'vetting' ? vettingQuery : apconQuery))
const activeItems = computed(() => (activeTab.value === 'vetting' ? vettingItems.value : apconItems.value))

function refreshActive() {
  activeQuery.value.refetch()
}

function formatIcon(format) {
  if (format === 'video') return 'ph-video'
  if (format === 'image') return 'ph-image'
  return 'ph-file'
}
function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

// ── Internal review mutations ────────────────────────────────────────
const approveMutation = useOptimisticRowMutation({
  queryKey: VETTING_KEY,
  mutationFn: ({ id }) => vettingApi.approveCreative(id),
  successLabel: ({ name }) => `${name || 'Creative'} approved.`,
  errorLabel: 'Could not approve.',
})

const rejectMutation = useOptimisticRowMutation({
  queryKey: VETTING_KEY,
  mutationFn: ({ id, reason }) => vettingApi.rejectCreative(id, reason),
  successLabel: ({ name }) => `${name || 'Creative'} rejected.`,
  errorLabel: 'Could not reject.',
})

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

// ── APCON mutations ──────────────────────────────────────────────────
const apconSubmitItem = ref(null)
const apconRef = ref('')

const apconSubmitMutation = useMutation({
  mutationFn: ({ id, referenceNumber }) =>
    vettingApi.markCreativeApconSubmitted(id, referenceNumber ? { referenceNumber } : {}),
  onSuccess: () => {
    apconSubmitItem.value = null
    apconRef.value = ''
    toast.success('Recorded as sent to APCON.')
    qc.invalidateQueries({ queryKey: APCON_KEY })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Could not record.')
  },
})

function openApconSubmit(item) {
  apconSubmitItem.value = item
  apconRef.value = ''
}

function confirmApconSubmit() {
  apconSubmitMutation.mutate({
    id: apconSubmitItem.value.id,
    referenceNumber: apconRef.value.trim() || undefined,
  })
}

const apconApproveItem = ref(null)
const apconCert = ref('')
const apconExpiry = ref('')
const canSubmitApconApprove = computed(
  () => apconCert.value.trim().length > 0 && apconExpiry.value,
)

const apconApproveMutation = useMutation({
  mutationFn: ({ id, certificateNumber, expiryDate }) =>
    vettingApi.markCreativeApconApproved(id, { certificateNumber, expiryDate }),
  onSuccess: () => {
    apconApproveItem.value = null
    apconCert.value = ''
    apconExpiry.value = ''
    toast.success('APCON approval recorded.')
    qc.invalidateQueries({ queryKey: APCON_KEY })
    qc.invalidateQueries({ queryKey: VETTING_KEY })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Could not record approval.')
  },
})

function openApconApprove(item) {
  apconApproveItem.value = item
  apconCert.value = ''
  apconExpiry.value = ''
}

function confirmApconApprove() {
  if (!canSubmitApconApprove.value) return
  apconApproveMutation.mutate({
    id: apconApproveItem.value.id,
    certificateNumber: apconCert.value.trim(),
    // Backend wants ISO; the date input gives YYYY-MM-DD which `new Date()`
    // interprets as UTC midnight — fine for an expiry date.
    expiryDate: new Date(apconExpiry.value).toISOString(),
  })
}

const apconRejectItem = ref(null)
const apconRejectReason = ref('')

const apconRejectMutation = useMutation({
  mutationFn: ({ id, reason }) =>
    vettingApi.markCreativeApconRejected(id, { reason }),
  onSuccess: () => {
    apconRejectItem.value = null
    apconRejectReason.value = ''
    toast.success('APCON rejection recorded.')
    qc.invalidateQueries({ queryKey: APCON_KEY })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Could not record rejection.')
  },
})

function openApconReject(item) {
  apconRejectItem.value = item
  apconRejectReason.value = ''
}

function confirmApconReject() {
  if (!apconRejectReason.value.trim()) return
  apconRejectMutation.mutate({
    id: apconRejectItem.value.id,
    reason: apconRejectReason.value.trim(),
  })
}

// ── Busy state covers all six in-flight mutations ────────────────────
const busyId = computed(() => {
  return (
    (approveMutation.isPending.value && approveMutation.variables.value?.id) ||
    (rejectMutation.isPending.value && rejectMutation.variables.value?.id) ||
    (apconSubmitMutation.isPending.value && apconSubmitMutation.variables.value?.id) ||
    (apconApproveMutation.isPending.value && apconApproveMutation.variables.value?.id) ||
    (apconRejectMutation.isPending.value && apconRejectMutation.variables.value?.id) ||
    null
  )
})
</script>
