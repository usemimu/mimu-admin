<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Audit log</div>
        <span class="fg2 text-xs">
          {{ countLabel }}
        </span>
        <div class="spacer"></div>
        <div class="flex gap-1">
          <button class="btn sm outline"><i class="ph ph-list-bullets"></i> Timeline</button>
          <button class="btn sm ghost"><i class="ph ph-table"></i> Table</button>
        </div>
        <button class="btn outline sm"><i class="ph ph-download-simple"></i> Export CSV</button>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 16px;">
        <span class="chip"><strong>Admin</strong> {{ filters.adminUserId || 'Any' }}</span>
        <span class="chip"><strong>Action</strong> {{ filters.actionType || 'Any' }}</span>
        <span class="chip"><strong>Resource type</strong> {{ filters.resourceType || 'Any' }}</span>
        <span class="chip"><strong>Date</strong> {{ dateFilterLabel }}</span>
        <button class="btn ghost sm"><i class="ph ph-plus"></i> Add filter</button>
        <div class="spacer"></div>
        <div style="position: relative;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 8px; top: 8px; color: var(--fg-3); font-size: 14px;"></i>
          <input
            v-model="resourceIdInput"
            class="input"
            placeholder="Search by resource ID…"
            style="padding-left: 28px; width: 240px;"
            @keyup.enter="applyResourceIdFilter"
          />
          <div style="position: absolute; right: 6px; top: 6px;"><span class="kbd">/</span></div>
        </div>
      </div>

      <div v-if="isLoading" class="card overflow-hidden">
        <RowSkeleton :count="8" />
      </div>

      <div v-else-if="error" class="card">
        <ErrorState
          title="Could not load audit log"
          :message="error.message"
          :on-retry="refetch"
        />
      </div>

      <div v-else-if="entries.length === 0" class="card">
        <EmptyState
          icon="ph-scroll"
          title="No audit entries match"
          message="Widen the date range or clear filters to see admin activity."
        />
      </div>

      <div v-else class="card">
        <div
          v-for="(entry, i) in entries"
          :key="entry.id"
          :style="{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }"
        >
          <div
            style="display: grid; grid-template-columns: 200px 32px 1fr auto; gap: 12px; padding: 10px 16px; cursor: pointer; align-items: center;"
            @click="expandedIndex = expandedIndex === i ? -1 : i"
          >
            <div class="mono fg2" style="font-size: 11px;">
              {{ formatTimestamp(entry.createdAt) }}
            </div>
            <div
              class="avatar"
              :style="{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }"
            >
              {{ getInitials(entry.adminName) }}
            </div>
            <div style="font-size: 13px;">
              <strong>{{ entry.adminName }}</strong>
              <span class="fg2"> {{ verbLabel(entry.action) }} </span>
              <span
                v-if="entry.targetResourceId"
                class="mono"
                style="font-size: 11px; color: var(--fg-3); margin-left: 6px;"
              >
                · {{ shortId(entry.targetResourceId) }}
              </span>
            </div>
            <div class="flex ac g8">
              <span v-if="entry.targetResourceType" class="pill pill-neutral sm">
                {{ entry.targetResourceType }}
              </span>
              <i class="ph" :class="expandedIndex === i ? 'ph-caret-down' : 'ph-caret-right'" style="color: var(--fg-3);"></i>
            </div>
          </div>
          <div v-if="expandedIndex === i" style="padding: 0 16px 16px; margin-left: 212px;">
            <div style="background: var(--bg-sunken); border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: var(--f-mono); font-size: 11px; line-height: 1.6;">
              <div style="color: var(--danger-500); white-space: pre-wrap;">- {{ formatJson(entry.beforeJson) }}</div>
              <div style="color: var(--moss-500); white-space: pre-wrap;">+ {{ formatJson(entry.afterJson) }}</div>
              <div v-if="entry.metadata" class="fg2" style="margin-top: 6px; white-space: pre-wrap;">
                meta: {{ formatJson(entry.metadata) }}
              </div>
              <div v-if="entry.ipAddress" class="fg2" style="margin-top: 6px;">
                ip: {{ entry.ipAddress }}
              </div>
            </div>
            <div class="flex g8" style="margin-top: 8px;">
              <button class="btn ghost sm"><i class="ph ph-link"></i> Copy permalink</button>
              <button class="btn ghost sm"><i class="ph ph-arrow-square-out"></i> Open resource</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isLoading && entries.length > 0" class="flex ac" style="margin-top: 12px; gap: 8px; justify-content: flex-end;">
        <button
          class="btn sm outline"
          :disabled="filters.offset === 0"
          @click="prevPage"
        >
          Previous
        </button>
        <button
          class="btn sm outline"
          :disabled="entries.length < filters.limit"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { monitoringApi } from '../api/monitoring'
import { qk } from '../lib/queryKeys'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const expandedIndex = ref(-1)
const resourceIdInput = ref('')
const filters = ref({
  adminUserId: undefined,
  actionType: undefined,
  resourceType: undefined,
  resourceId: undefined,
  fromDate: defaultFromDate(),
  toDate: undefined,
  offset: 0,
  limit: 100,
})

function defaultFromDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString()
}

const queryKey = computed(() => qk.auditLog(filters.value))
const { data, isLoading, error, refetch } = useQuery({
  queryKey,
  queryFn: () => monitoringApi.auditLog(filters.value),
  keepPreviousData: true,
})

// Backend returns rows shaped `{ log, admin }`. Flatten so the template
// can read fields without a separate join handle.
const entries = computed(() => {
  const rows = data.value?.logs ?? []
  return rows.map((row) => ({
    id: row.log?.id ?? row.id,
    action: row.log?.action ?? row.action,
    adminName:
      row.admin?.name ||
      row.admin?.email ||
      row.log?.adminUserId?.slice(0, 8) ||
      'unknown',
    targetResourceType: row.log?.targetResourceType ?? row.targetResourceType,
    targetResourceId: row.log?.targetResourceId ?? row.targetResourceId,
    beforeJson: row.log?.beforeJson ?? row.beforeJson,
    afterJson: row.log?.afterJson ?? row.afterJson,
    metadata: row.log?.metadata ?? row.metadata,
    ipAddress: row.log?.ipAddress ?? row.ipAddress,
    createdAt: row.log?.createdAt ?? row.createdAt,
  }))
})

const countLabel = computed(() => {
  if (isLoading.value) return 'Loading…'
  const count = entries.value.length
  const start = filters.value.offset + 1
  const end = filters.value.offset + count
  return `Showing ${start}–${end}`
})

const dateFilterLabel = computed(() => {
  if (filters.value.fromDate && filters.value.toDate) {
    return `${shortDate(filters.value.fromDate)} → ${shortDate(filters.value.toDate)}`
  }
  if (filters.value.fromDate) return `From ${shortDate(filters.value.fromDate)}`
  return 'Any'
})

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-NG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Lagos',
  })
}

// "creative.approve" -> "approved creative"
function verbLabel(action) {
  if (!action) return ''
  const [resource, verb] = action.split('.')
  if (!verb) return action
  const verbPast = verb.endsWith('e') ? `${verb}d` : `${verb}ed`
  return `${verbPast} ${resource}`
}

function formatJson(value) {
  if (value == null) return '—'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function nextPage() {
  filters.value = {
    ...filters.value,
    offset: filters.value.offset + filters.value.limit,
  }
  expandedIndex.value = -1
}

function prevPage() {
  filters.value = {
    ...filters.value,
    offset: Math.max(0, filters.value.offset - filters.value.limit),
  }
  expandedIndex.value = -1
}

function applyResourceIdFilter() {
  filters.value = {
    ...filters.value,
    resourceId: resourceIdInput.value || undefined,
    offset: 0,
  }
}
</script>
