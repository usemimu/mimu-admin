<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Support inbox</div>
        <span class="pill pill-pending lg">{{ openCount }} open</span>
        <span class="fg2 text-xs">
          {{ slaBreachedCount }} SLA breach · {{ slaAtRiskCount }} at risk
        </span>
        <div class="spacer"></div>
        <div class="flex items-center gap-2 text-[11px] text-[var(--fg-3)]">
          <span class="kbd">J</span><span class="kbd">K</span> navigate ·
          <span class="kbd">A</span> assign ·
          <span class="kbd">C</span> close
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 16px;">
        <span class="chip">
          <strong>Status</strong> {{ filters.status?.length ? filters.status.join(', ') : 'Any' }}
        </span>
        <span class="chip">
          <strong>Priority</strong> {{ filters.priority?.length ? filters.priority.join(', ') : 'Any' }}
        </span>
        <span class="chip">
          <strong>SLA</strong> {{ filters.slaStatus || 'Any' }}
        </span>
        <button class="btn ghost sm" @click="clearFilters"><i class="ph ph-x"></i> Clear</button>
        <div class="spacer"></div>
        <button
          class="btn sm outline"
          :class="{ active: filters.slaStatus === 'breached' }"
          @click="toggleSlaFilter('breached')"
        >
          SLA breached
        </button>
      </div>

      <div v-if="isLoading" class="card overflow-hidden">
        <RowSkeleton :count="6" />
      </div>

      <div v-else-if="error" class="card">
        <ErrorState
          title="Could not load tickets"
          :message="error.message"
          :on-retry="refetch"
        />
      </div>

      <div v-else-if="tickets.length === 0" class="card">
        <EmptyState
          icon="ph-chat-centered-dots"
          title="No tickets match"
          message="Either nothing's in the inbox, or your filters are too tight. Clear filters to see everything."
          cta-label="Clear filters"
          @cta="clearFilters"
        />
      </div>

      <div v-else class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3 w-8"></th>
              <th class="p-3">Subject</th>
              <th class="p-3">Author</th>
              <th class="p-3">Category</th>
              <th class="p-3">Priority</th>
              <th class="p-3">Assigned</th>
              <th class="p-3">SLA</th>
              <th class="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in tickets"
              :key="t.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
              @click="openTicket(t.id)"
            >
              <td class="p-3">
                <i class="ph text-sm" :class="sourceIcon(t.source)"></i>
              </td>
              <td class="p-3">
                <div class="font-medium">{{ t.subject }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ t.ticketNumber }}</div>
              </td>
              <td class="p-3">
                <div class="text-xs">{{ t.authorName || t.userContactEmail || t.userContactPhone || '—' }}</div>
                <div class="fg2 text-[10px] uppercase tracking-wider">{{ t.userType }}</div>
              </td>
              <td class="p-3"><span class="pill pill-neutral sm">{{ formatCategory(t.category) }}</span></td>
              <td class="p-3">
                <span class="pill sm" :class="priorityClass(t.priority)">{{ t.priority }}</span>
              </td>
              <td class="p-3 fg2 text-xs">{{ t.assigneeName || '—' }}</td>
              <td class="p-3">
                <span class="pill sm" :class="slaClass(t.slaStatus)">
                  {{ slaLabel(t.slaStatus) }}
                </span>
              </td>
              <td class="p-3 mono fg2 text-[11px]">{{ relativeTime(t.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!isLoading && tickets.length > 0" class="flex ac" style="margin-top: 12px; gap: 8px; justify-content: flex-end;">
        <button class="btn sm outline" :disabled="filters.offset === 0" @click="prevPage">Previous</button>
        <button class="btn sm outline" :disabled="tickets.length < filters.limit" @click="nextPage">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import { supportApi } from '../api/support'
import { qk } from '../lib/queryKeys'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const router = useRouter()

const filters = ref({
  status: undefined,
  category: undefined,
  source: undefined,
  priority: undefined,
  slaStatus: undefined,
  assignedTo: undefined,
  userType: undefined,
  offset: 0,
  limit: 50,
})

// Backend accepts comma-joined multi-values for array fields, so we stringify
// before posting them as query params.
const params = computed(() => ({
  ...filters.value,
  status: filters.value.status?.join(',') || undefined,
  category: filters.value.category?.join(',') || undefined,
  source: filters.value.source?.join(',') || undefined,
  priority: filters.value.priority?.join(',') || undefined,
}))

const queryKey = computed(() => qk.tickets(params.value))
const { data, isLoading, error, refetch } = useQuery({
  queryKey,
  queryFn: () => supportApi.listTickets(params.value),
  keepPreviousData: true,
})

// Backend returns rows shaped `{ ticket, user, assignee, slaStatus }` —
// flatten so the template doesn't have to dig.
const tickets = computed(() => {
  const rows = data.value?.tickets ?? []
  return rows.map((r) => ({
    id: r.ticket?.id ?? r.id,
    ticketNumber: r.ticket?.ticketNumber,
    subject: r.ticket?.subject,
    category: r.ticket?.category,
    priority: r.ticket?.priority,
    status: r.ticket?.status,
    userType: r.ticket?.userType,
    source: r.ticket?.source,
    userContactEmail: r.ticket?.userContactEmail,
    userContactPhone: r.ticket?.userContactPhone,
    updatedAt: r.ticket?.updatedAt,
    authorName: r.user?.name,
    assigneeName: r.assignee?.name,
    slaStatus: r.slaStatus,
  }))
})

const openCount = computed(() => tickets.value.filter((t) => t.status !== 'closed').length)
const slaBreachedCount = computed(() => tickets.value.filter((t) => t.slaStatus === 'breached').length)
const slaAtRiskCount = computed(() => tickets.value.filter((t) => t.slaStatus === 'at_risk').length)

function sourceIcon(source) {
  if (source === 'whatsapp') return 'ph-whatsapp-logo text-moss-500'
  if (source === 'email') return 'ph-envelope'
  if (source === 'in_app' || source === 'in-app') return 'ph-chat-circle'
  return 'ph-chat-circle'
}

function formatCategory(c) {
  return c?.replace(/_/g, ' ') ?? ''
}

function priorityClass(p) {
  if (p === 'urgent' || p === 'high') return 'pill-failed'
  if (p === 'medium') return 'pill-pending'
  return 'pill-neutral'
}

function slaClass(status) {
  if (status === 'breached') return 'pill-failed'
  if (status === 'at_risk') return 'pill-pending'
  return 'pill-active'
}

function slaLabel(status) {
  if (status === 'breached') return 'breached'
  if (status === 'at_risk') return 'at risk'
  return 'on track'
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

function toggleSlaFilter(value) {
  filters.value = {
    ...filters.value,
    slaStatus: filters.value.slaStatus === value ? undefined : value,
    offset: 0,
  }
}

function clearFilters() {
  filters.value = { ...filters.value, status: undefined, category: undefined, source: undefined, priority: undefined, slaStatus: undefined, offset: 0 }
}

function nextPage() {
  filters.value = { ...filters.value, offset: filters.value.offset + filters.value.limit }
}
function prevPage() {
  filters.value = { ...filters.value, offset: Math.max(0, filters.value.offset - filters.value.limit) }
}

function openTicket(id) {
  router.push({ path: '/ticket-detail', query: { id } })
}
</script>
