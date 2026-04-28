<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Campaigns · vetting queue</div>
        <span class="fg2 text-xs">
          {{ pendingVettingCount }} pending vetting · {{ pendingApprovalCount }} awaiting APCON
        </span>
        <div class="spacer"></div>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 12px;">
        <button
          class="btn sm outline"
          :class="{ active: activeTab === 'vetting' }"
          @click="activeTab = 'vetting'"
        >
          Pending vetting
          <span class="pill pill-pending sm" style="margin-left: 6px;">{{ pendingVettingCount }}</span>
        </button>
        <button
          class="btn sm outline"
          :class="{ active: activeTab === 'approval' }"
          @click="activeTab = 'approval'"
        >
          Pending APCON
          <span class="pill pill-neutral sm" style="margin-left: 6px;">{{ pendingApprovalCount }}</span>
        </button>
      </div>

      <div v-if="isLoading" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">Loading queue…</span>
      </div>

      <div v-else-if="error" class="card" style="padding: 24px;">
        <div style="color: var(--danger-500);">Failed to load campaigns: {{ error.message }}</div>
        <button class="btn sm outline" style="margin-top: 8px;" @click="refetch()">Retry</button>
      </div>

      <div v-else-if="campaigns.length === 0" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">Queue is empty.</span>
      </div>

      <div v-else class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Campaign</th>
              <th class="p-3">Period</th>
              <th class="p-3 text-right">Budget</th>
              <th class="p-3">Objective</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in campaigns"
              :key="c.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <div class="font-semibold">{{ c.name }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ shortId(c.id) }}</div>
              </td>
              <td class="p-3 fg2 text-xs">
                {{ formatDate(c.startDate) }} – {{ formatDate(c.endDate) }}
              </td>
              <td class="p-3 text-right mono">{{ c.formattedBudget }}</td>
              <td class="p-3 fg2 text-xs">{{ c.objective }}</td>
              <td class="p-3">
                <span class="pill pill-pending sm">{{ c.status }}</span>
              </td>
              <td class="p-3 text-right">
                <div v-if="activeTab === 'vetting'" class="flex" style="gap: 6px; justify-content: flex-end;">
                  <button
                    class="btn primary sm"
                    :disabled="vetMutation.isPending.value"
                    @click="approve(c.id)"
                  >
                    Approve
                  </button>
                  <button
                    class="btn outline sm"
                    style="color: var(--danger-500);"
                    @click="openReject(c)"
                  >
                    Reject
                  </button>
                </div>
                <div v-else>
                  <button
                    class="btn primary sm"
                    @click="openApcon(c)"
                  >
                    Mark APCON-approved
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reject modal -->
    <div
      v-if="rejectingCampaign"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50;"
      @click.self="rejectingCampaign = null"
    >
      <div class="card" style="padding: 24px; width: 480px; max-width: 90vw;">
        <h3 style="margin: 0 0 12px;">Reject {{ rejectingCampaign.name }}</h3>
        <label class="text-xs fg2 block mb-1">Reason (required)</label>
        <textarea
          v-model="rejectReason"
          class="input"
          rows="4"
          placeholder="Why is this campaign being rejected?"
          style="width: 100%; margin-bottom: 12px;"
        ></textarea>
        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="rejectingCampaign = null">Cancel</button>
          <button
            class="btn primary sm"
            style="background: var(--danger-500);"
            :disabled="!rejectReason.trim() || vetMutation.isPending.value"
            @click="confirmReject"
          >
            {{ vetMutation.isPending.value ? 'Rejecting…' : 'Confirm reject' }}
          </button>
        </div>
      </div>
    </div>

    <!-- APCON modal -->
    <div
      v-if="apconingCampaign"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50;"
      @click.self="apconingCampaign = null"
    >
      <div class="card" style="padding: 24px; width: 480px; max-width: 90vw;">
        <h3 style="margin: 0 0 12px;">Mark APCON approval</h3>
        <label class="text-xs fg2 block mb-1">APCON submission ID</label>
        <input
          v-model="apconSubmissionId"
          class="input"
          placeholder="APCON certificate reference"
          style="width: 100%; margin-bottom: 12px;"
        />
        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="apconingCampaign = null">Cancel</button>
          <button
            class="btn primary sm"
            :disabled="!apconSubmissionId.trim() || apconMutation.isPending.value"
            @click="confirmApcon"
          >
            {{ apconMutation.isPending.value ? 'Saving…' : 'Confirm' }}
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

const qc = useQueryClient()
const toast = useToastStore()

const activeTab = ref('vetting')

// Run both queries up front so the tab counters always reflect reality.
const vettingQuery = useQuery({
  queryKey: ['campaigns-pending-vetting'],
  queryFn: () => vettingApi.pendingVetting(),
})
const approvalQuery = useQuery({
  queryKey: ['campaigns-pending-approval'],
  queryFn: () => vettingApi.pendingApproval(),
})

const pendingVettingCount = computed(() => vettingQuery.data.value?.campaigns?.length ?? 0)
const pendingApprovalCount = computed(() => approvalQuery.data.value?.campaigns?.length ?? 0)

const isLoading = computed(() =>
  activeTab.value === 'vetting' ? vettingQuery.isLoading.value : approvalQuery.isLoading.value,
)
const error = computed(() =>
  activeTab.value === 'vetting' ? vettingQuery.error.value : approvalQuery.error.value,
)
const campaigns = computed(() => {
  const data = activeTab.value === 'vetting' ? vettingQuery.data.value : approvalQuery.data.value
  return data?.campaigns ?? []
})

function refetch() {
  if (activeTab.value === 'vetting') vettingQuery.refetch()
  else approvalQuery.refetch()
}

const rejectingCampaign = ref(null)
const rejectReason = ref('')
const apconingCampaign = ref(null)
const apconSubmissionId = ref('')

const vetMutation = useMutation({
  mutationFn: ({ id, body }) => vettingApi.vetCampaign(id, body),
  onSuccess: () => {
    rejectingCampaign.value = null
    rejectReason.value = ''
    toast.success('Campaign updated.')
    qc.invalidateQueries({ queryKey: ['campaigns-pending-vetting'] })
    qc.invalidateQueries({ queryKey: ['campaigns-pending-approval'] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Action failed.')
  },
})

const apconMutation = useMutation({
  mutationFn: ({ id, body }) => vettingApi.markApconApproved(id, body),
  onSuccess: () => {
    apconingCampaign.value = null
    apconSubmissionId.value = ''
    toast.success('APCON approval recorded.')
    qc.invalidateQueries({ queryKey: ['campaigns-pending-approval'] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Action failed.')
  },
})

function approve(id) {
  vetMutation.mutate({ id, body: { decision: 'approve' } })
}

function openReject(campaign) {
  rejectingCampaign.value = campaign
  rejectReason.value = ''
}

function confirmReject() {
  if (!rejectReason.value.trim()) return
  vetMutation.mutate({
    id: rejectingCampaign.value.id,
    body: { decision: 'reject', reason: rejectReason.value.trim() },
  })
}

function openApcon(campaign) {
  apconingCampaign.value = campaign
  apconSubmissionId.value = ''
}

function confirmApcon() {
  if (!apconSubmissionId.value.trim()) return
  apconMutation.mutate({
    id: apconingCampaign.value.id,
    body: { apconSubmissionId: apconSubmissionId.value.trim() },
  })
}

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}
</script>
