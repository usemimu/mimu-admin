<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <button class="btn ghost sm" @click="$router.push('/support')">
          <i class="ph ph-arrow-left"></i> Back
        </button>
        <div class="page-title" style="margin-left: 8px;">
          {{ ticket?.subject || 'Ticket' }}
        </div>
        <span v-if="ticket?.ticketNumber" class="mono fg2 text-xs" style="margin-left: 8px;">
          {{ ticket.ticketNumber }}
        </span>
        <div class="spacer"></div>
        <span v-if="ticket" class="pill sm" :class="statusPill(ticket.status)">
          {{ ticket.status }}
        </span>
      </div>
    </div>

    <div class="page-body">
      <div v-if="isLoading" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">Loading ticket…</span>
      </div>

      <div v-else-if="error" class="card" style="padding: 24px;">
        <div style="color: var(--danger-500);">Failed to load ticket: {{ error.message }}</div>
        <button class="btn sm outline" style="margin-top: 8px;" @click="refetch()">Retry</button>
      </div>

      <div v-else-if="!ticketId" class="card" style="padding: 24px;">
        <span class="fg2">No ticket id provided.</span>
      </div>

      <div v-else style="display: grid; grid-template-columns: 1fr 320px; gap: 16px;">
        <!-- Conversation column -->
        <div class="card" style="padding: 16px;">
          <h3 style="margin: 0 0 12px;">Conversation</h3>

          <div v-if="messages.length === 0" class="fg2" style="text-align: center; padding: 16px;">
            No messages yet.
          </div>

          <div
            v-for="(m, i) in messages"
            :key="m.id || i"
            style="border-top: 1px solid var(--border); padding: 12px 0;"
            :style="{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }"
          >
            <div class="flex ac" style="margin-bottom: 4px; gap: 8px;">
              <strong>{{ m.senderName || 'system' }}</strong>
              <span v-if="m.isInternalNote" class="pill pill-pending sm">internal note</span>
              <span class="fg2 mono text-[11px]" style="margin-left: auto;">
                {{ relativeTime(m.createdAt) }}
              </span>
            </div>
            <div style="white-space: pre-wrap; font-size: 14px;">{{ m.body }}</div>
          </div>

          <!-- Reply composer -->
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
            <textarea
              v-model="replyText"
              class="input"
              placeholder="Type a reply…"
              rows="4"
              style="width: 100%; resize: vertical;"
            ></textarea>
            <div class="flex ac" style="margin-top: 8px; gap: 8px;">
              <label class="flex ac" style="gap: 6px; font-size: 12px;">
                <input v-model="isInternalNote" type="checkbox" />
                Internal note
              </label>
              <div class="spacer"></div>
              <button
                class="btn primary sm"
                :disabled="!replyText.trim() || replyMutation.isPending.value"
                @click="sendReply"
              >
                <i class="ph ph-paper-plane-right"></i>
                {{ replyMutation.isPending.value ? 'Sending…' : (isInternalNote ? 'Add note' : 'Reply') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">Author</h4>
            <div style="font-size: 13px;">{{ user?.name || '—' }}</div>
            <div class="fg2 text-xs">{{ user?.email || ticket?.userContactEmail || '' }}</div>
            <div v-if="user?.phoneNumber || ticket?.userContactPhone" class="fg2 text-xs">
              {{ user?.phoneNumber || ticket?.userContactPhone }}
            </div>
            <div v-if="ticket?.userType" class="fg2 text-[10px] uppercase tracking-wider" style="margin-top: 4px;">
              {{ ticket.userType }}
            </div>
          </div>

          <div class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">Meta</h4>
            <div class="text-xs" style="display: grid; grid-template-columns: 90px 1fr; gap: 4px 8px;">
              <span class="fg2">Category</span>
              <span>{{ ticket?.category || '—' }}</span>
              <span class="fg2">Priority</span>
              <span>{{ ticket?.priority || '—' }}</span>
              <span class="fg2">Source</span>
              <span>{{ ticket?.source || '—' }}</span>
              <span class="fg2">Assigned</span>
              <span>{{ assignee?.name || '—' }}</span>
              <span class="fg2">Created</span>
              <span>{{ formatDateTime(ticket?.createdAt) }}</span>
              <span class="fg2">Updated</span>
              <span>{{ formatDateTime(ticket?.updatedAt) }}</span>
            </div>
          </div>

          <div class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">Actions</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button
                class="btn sm outline"
                :disabled="ticket?.status === 'closed' || closeMutation.isPending.value"
                @click="showClosePanel = !showClosePanel"
              >
                <i class="ph ph-check-circle"></i> Close ticket
              </button>
              <div v-if="showClosePanel" style="display: flex; flex-direction: column; gap: 6px;">
                <input
                  v-model="closeReason"
                  class="input sm"
                  placeholder="Closure reason (e.g., resolved)"
                />
                <textarea
                  v-model="closeNotes"
                  class="input sm"
                  placeholder="Resolution notes…"
                  rows="3"
                ></textarea>
                <button
                  class="btn primary sm"
                  :disabled="!closeReason.trim() || !closeNotes.trim() || closeMutation.isPending.value"
                  @click="closeTicket"
                >
                  Confirm close
                </button>
              </div>
            </div>
          </div>

          <div v-if="relatedContext && hasRelated" class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">Related</h4>
            <div class="text-xs fg2">
              <div v-if="relatedContext.screen">screen · {{ relatedContext.screen.screen?.name || relatedContext.screen.screen?.id }}</div>
              <div v-if="relatedContext.payout">payout · {{ relatedContext.payout.id }}</div>
              <div v-if="relatedContext.campaign">campaign · {{ relatedContext.campaign.name || relatedContext.campaign.id }}</div>
              <div v-if="relatedContext.creative">creative · {{ relatedContext.creative.filename || relatedContext.creative.id }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import { supportApi } from '../api/support'
import { useToastStore } from '../stores/toast'
import { qk } from '../lib/queryKeys'

const route = useRoute()
const qc = useQueryClient()
const toast = useToastStore()

const ticketId = computed(() => route.query.id || null)

const replyText = ref('')
const isInternalNote = ref(false)
const showClosePanel = ref(false)
const closeReason = ref('resolved')
const closeNotes = ref('')

const queryKey = computed(() => qk.ticketDetail(ticketId.value))
const { data, isLoading, error, refetch } = useQuery({
  queryKey,
  queryFn: () => supportApi.ticketDetail(ticketId.value),
  enabled: computed(() => !!ticketId.value),
})

const ticket = computed(() => data.value?.ticket)
const user = computed(() => data.value?.user)
const assignee = computed(() => data.value?.assignee)
const relatedContext = computed(() => data.value?.relatedContext)

const hasRelated = computed(() =>
  Boolean(
    relatedContext.value?.screen ||
    relatedContext.value?.payout ||
    relatedContext.value?.campaign ||
    relatedContext.value?.creative,
  ),
)

const messages = computed(() => {
  const rows = data.value?.messages ?? []
  return rows.map((row) => ({
    id: row.message?.id,
    body: row.message?.body || row.message?.message,
    isInternalNote: row.message?.isInternalNote,
    createdAt: row.message?.createdAt,
    senderName: row.sender?.name || row.sender?.email,
  }))
})

const replyMutation = useMutation({
  mutationFn: () => supportApi.reply(ticketId.value, replyText.value, isInternalNote.value),
  onSuccess: () => {
    replyText.value = ''
    isInternalNote.value = false
    toast.success('Reply sent.')
    qc.invalidateQueries({ queryKey: qk.ticketDetail(ticketId.value) })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Reply failed.')
  },
})

const closeMutation = useMutation({
  mutationFn: () => supportApi.close(ticketId.value, closeNotes.value, closeReason.value),
  onSuccess: () => {
    showClosePanel.value = false
    toast.success('Ticket closed.')
    qc.invalidateQueries({ queryKey: qk.ticketDetail(ticketId.value) })
    qc.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Close failed.')
  },
})

function sendReply() {
  if (!replyText.value.trim()) return
  replyMutation.mutate()
}

function closeTicket() {
  if (!closeReason.value.trim() || !closeNotes.value.trim()) return
  closeMutation.mutate()
}

function statusPill(status) {
  if (status === 'closed' || status === 'resolved') return 'pill-active'
  if (status === 'pending' || status === 'waiting_user') return 'pill-pending'
  if (status === 'escalated') return 'pill-failed'
  return 'pill-neutral'
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-NG', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
