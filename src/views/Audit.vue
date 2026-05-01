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
      <div class="filterbar" style="margin-bottom: 16px; gap: 8px; flex-wrap: wrap;">
        <div class="filter-group">
          <label class="filter-label">Action</label>
          <input
            v-model="actionInput"
            class="input sm"
            placeholder="e.g. role_updated"
            style="width: 180px;"
            @keyup.enter="applyActionFilter"
            @blur="applyActionFilter"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Resource type</label>
          <select v-model="resourceTypeInput" class="input sm" style="width: 160px;" @change="applyResourceTypeFilter">
            <option :value="undefined">Any</option>
            <option value="admin_user">admin user</option>
            <option value="advertiser">advertiser</option>
            <option value="campaign">campaign</option>
            <option value="creative">creative</option>
            <option value="payout">payout</option>
            <option value="host">host</option>
            <option value="screen">screen</option>
            <option value="refund">refund</option>
            <option value="fraud_flag">fraud flag</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">From</label>
          <input
            type="date"
            class="input sm"
            :value="dateInputValue(filters.fromDate)"
            style="width: 140px;"
            @change="applyFromDate($event.target.value)"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">To</label>
          <input
            type="date"
            class="input sm"
            :value="dateInputValue(filters.toDate)"
            style="width: 140px;"
            @change="applyToDate($event.target.value)"
          />
        </div>
        <button
          v-if="hasActiveFilters"
          class="btn ghost sm"
          @click="clearFilters"
          title="Clear all filters"
        >
          <i class="ph ph-x"></i> Clear
        </button>
        <div class="spacer"></div>
        <div style="position: relative;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 8px; top: 8px; color: var(--fg-3); font-size: 14px;"></i>
          <input
            v-model="resourceIdInput"
            class="input sm"
            placeholder="Resource ID (UUID)…"
            style="padding-left: 28px; width: 240px;"
            @keyup.enter="applyResourceIdFilter"
          />
          <div style="position: absolute; right: 6px; top: 6px;"><span class="kbd">↵</span></div>
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
            style="display: grid; grid-template-columns: 130px 28px minmax(0, 1fr) auto; gap: 12px; padding: 10px 16px; cursor: pointer; align-items: center;"
            @click="expandedIndex = expandedIndex === i ? -1 : i"
          >
            <div class="mono fg2" style="font-size: 11px;">
              <div>{{ formatDate(entry.createdAt) }}</div>
              <div style="color: var(--fg-3);">{{ formatTime(entry.createdAt) }}</div>
            </div>
            <div
              class="avatar"
              :title="entry.adminName"
              :style="{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }"
            >
              {{ getInitials(entry.adminName) }}
            </div>
            <div style="font-size: 13px; min-width: 0;">
              <div class="flex ac g8" style="margin-bottom: 2px;">
                <span class="pill sm" :class="methodPill(entry.metadata?.method)">
                  {{ entry.metadata?.method || methodFromAction(entry.action) }}
                </span>
                <strong>{{ humanAction(entry.action) }}</strong>
                <span
                  v-if="entry.targetResourceType || entry.targetResourceId"
                  class="fg2"
                  style="font-size: 12px;"
                >
                  ·
                  <span v-if="entry.targetResourceType">{{ entry.targetResourceType }}</span>
                  <span v-if="entry.targetResourceId" class="mono" style="font-size: 11px; margin-left: 4px;">
                    {{ shortId(entry.targetResourceId) }}
                  </span>
                </span>
              </div>
              <div
                class="mono fg2"
                style="font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
              >
                {{ entry.adminName }}
                <span v-if="entry.metadata?.path" style="margin-left: 6px;">{{ entry.metadata.path }}</span>
              </div>
            </div>
            <div class="flex ac g8">
              <span
                v-if="entry.metadata?.statusCode"
                class="pill sm"
                :class="statusPill(entry.metadata.statusCode)"
              >
                {{ entry.metadata.statusCode }}
              </span>
              <span v-if="entry.metadata?.duration != null" class="mono fg2" style="font-size: 11px;">
                {{ entry.metadata.duration }}ms
              </span>
              <i
                class="ph"
                :class="expandedIndex === i ? 'ph-caret-down' : 'ph-caret-right'"
                style="color: var(--fg-3);"
              ></i>
            </div>
          </div>
          <div v-if="expandedIndex === i" style="padding: 0 16px 16px; margin-left: 170px;">
            <div class="audit-detail">
              <template v-if="entry.beforeJson">
                <div class="audit-row">
                  <span class="audit-row-label">Request</span>
                  <pre class="audit-pre danger">{{ formatJson(entry.beforeJson) }}</pre>
                </div>
                <div v-if="entry.hiddenBefore.length" class="audit-row">
                  <span class="audit-row-label">Hidden · req</span>
                  <div class="masked-list">
                    <MaskedValue
                      v-for="h in entry.hiddenBefore"
                      :key="`b-${h.path}`"
                      :path="h.path"
                      :raw="h.raw"
                      :masked="h.masked"
                    />
                  </div>
                </div>
              </template>
              <template v-if="hasResponseBody(entry.afterJson)">
                <div class="audit-row">
                  <span class="audit-row-label">Response</span>
                  <pre class="audit-pre success">{{ formatJson(entry.afterJson) }}</pre>
                </div>
                <div v-if="entry.hiddenAfter.length" class="audit-row">
                  <span class="audit-row-label">Hidden · res</span>
                  <div class="masked-list">
                    <MaskedValue
                      v-for="h in entry.hiddenAfter"
                      :key="`a-${h.path}`"
                      :path="h.path"
                      :raw="h.raw"
                      :masked="h.masked"
                    />
                  </div>
                </div>
              </template>
              <div v-if="!entry.beforeJson && !hasResponseBody(entry.afterJson)" class="fg2" style="font-size: 12px;">
                No request or response payload captured.
              </div>
              <div class="audit-row">
                <span class="audit-row-label">Context</span>
                <div class="audit-context">
                  <!-- IP is PII, mask it the same way request payload IPs are masked. -->
                  <MaskedValue
                    v-if="entry.ipAddress"
                    path="ip"
                    :raw="entry.ipAddress"
                    :masked="maskIp(entry.ipAddress)"
                  />
                  <div v-if="entry.metadata?.path" class="mono fg2 audit-context-line">
                    {{ entry.metadata.method || '' }} <strong>{{ entry.metadata.path }}</strong>
                  </div>
                  <div class="mono fg2 audit-context-line">
                    log id <strong>{{ entry.id }}</strong>
                  </div>
                </div>
              </div>
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
import { redact } from '../lib/redaction'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'
import MaskedValue from '../components/MaskedValue.vue'

const expandedIndex = ref(-1)
const resourceIdInput = ref('')
const actionInput = ref('')
const resourceTypeInput = ref(undefined)
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

const hasActiveFilters = computed(() => {
  const f = filters.value
  return Boolean(f.actionType || f.resourceType || f.resourceId || f.adminUserId)
    || (f.fromDate && f.fromDate !== defaultFromDate())
    || Boolean(f.toDate)
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
//
// Each entry's request/response is pre-redacted: secrets and PII are
// replaced with `[hidden]` in the JSON we render, and a parallel
// `hiddenBefore`/`hiddenAfter` list carries (path, raw, masked) so
// the `<MaskedValue>` chips below the pre-block can offer copy-on-
// demand without ever exposing the value as plain text in the DOM.
const entries = computed(() => {
  const rows = data.value?.logs ?? []
  return rows.map((row) => {
    const before = row.log?.beforeJson ?? row.beforeJson
    const after = row.log?.afterJson ?? row.afterJson
    const beforeRedacted = before == null ? { scrubbed: null, hidden: [] } : redact(before)
    const afterRedacted = after == null ? { scrubbed: null, hidden: [] } : redact(after)
    return {
      id: row.log?.id ?? row.id,
      action: row.log?.action ?? row.action,
      adminName:
        row.admin?.name ||
        row.admin?.email ||
        row.log?.adminUserId?.slice(0, 8) ||
        'unknown',
      targetResourceType: row.log?.targetResourceType ?? row.targetResourceType,
      targetResourceId: row.log?.targetResourceId ?? row.targetResourceId,
      beforeJson: beforeRedacted.scrubbed,
      afterJson: afterRedacted.scrubbed,
      hiddenBefore: beforeRedacted.hidden,
      hiddenAfter: afterRedacted.hidden,
      metadata: row.log?.metadata ?? row.metadata,
      ipAddress: row.log?.ipAddress ?? row.ipAddress,
      createdAt: row.log?.createdAt ?? row.createdAt,
    }
  })
})

const countLabel = computed(() => {
  if (isLoading.value) return 'Loading…'
  const count = entries.value.length
  const start = filters.value.offset + 1
  const end = filters.value.offset + count
  return `Showing ${start}–${end}`
})

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    month: 'short', day: 'numeric',
    timeZone: 'Africa/Lagos',
  })
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Africa/Lagos',
  })
}

// "creative.approved" → "Approved creative"
// "admin_user.role_updated" → "Role updated · admin user"
// Underscores become spaces; falls back to the raw action string for
// anything our `<resource>.<verb>` convention doesn't cover.
function humanAction(action) {
  if (!action) return ''
  const [resource, verb, ...rest] = action.split('.')
  if (!verb) return action
  const verbStr = capitalize(verb.replace(/_/g, ' '))
  const resourceStr = resource.replace(/_/g, ' ')
  const tail = rest.length ? ` (${rest.join('.')})` : ''
  return `${verbStr} · ${resourceStr}${tail}`
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

// Method might not be in metadata for older rows — derive from the
// action verb so the badge still renders something useful.
function methodFromAction(action) {
  if (!action) return ''
  if (action.endsWith('.deleted')) return 'DELETE'
  if (action.endsWith('.created')) return 'POST'
  if (action.endsWith('.updated')) return 'PATCH'
  return ''
}

function methodPill(method) {
  if (!method) return 'pill-neutral'
  if (method === 'POST') return 'pill-active'
  if (method === 'PATCH' || method === 'PUT') return 'pill-pending'
  if (method === 'DELETE') return 'pill-failed'
  return 'pill-neutral'
}

function statusPill(code) {
  if (!code) return 'pill-neutral'
  if (code >= 500) return 'pill-failed'
  if (code >= 400) return 'pill-pending'
  return 'pill-active'
}

// `afterJson` for capped responses comes back as `{ truncated: true,
// size, note }`. Treat that as "no body to show" rather than dumping
// the marker as if it were the response.
function hasResponseBody(value) {
  if (value == null) return false
  if (typeof value === 'object' && value.truncated === true) return false
  return true
}

/**
 * IP-specific mask: keeps the address family hint (the `::` for IPv6,
 * the dot pattern for IPv4) without revealing geolocation. `::1` and
 * `127.0.0.1` are loopback and safe to show in full — masking them
 * is just noise on the localhost-development path.
 */
function maskIp(ip) {
  if (!ip) return '••••'
  const str = String(ip)
  if (str === '::1' || str === '127.0.0.1') return str
  // IPv4: keep first octet, mask the rest.
  const v4 = str.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) return `${v4[1]}.•••.•••.•••`
  // IPv6 / anything else: generic mask.
  if (str.length <= 6) return '••••'
  return `${str.slice(0, 4)}••••${str.slice(-2)}`
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

function applyActionFilter() {
  const next = actionInput.value.trim() || undefined
  if (next === filters.value.actionType) return
  filters.value = { ...filters.value, actionType: next, offset: 0 }
  expandedIndex.value = -1
}

function applyResourceTypeFilter() {
  filters.value = {
    ...filters.value,
    resourceType: resourceTypeInput.value || undefined,
    offset: 0,
  }
  expandedIndex.value = -1
}

// `<input type="date">` round-trips as YYYY-MM-DD. Convert back and
// forth so the picker shows what the filter currently holds and we
// store the value as ISO for the API.
function dateInputValue(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

function applyFromDate(value) {
  filters.value = {
    ...filters.value,
    fromDate: value ? new Date(value).toISOString() : undefined,
    offset: 0,
  }
}

function applyToDate(value) {
  // Make `to` inclusive — bump to end-of-day so a "May 1 → May 1"
  // range still includes today's mutations.
  if (!value) {
    filters.value = { ...filters.value, toDate: undefined, offset: 0 }
    return
  }
  const d = new Date(value)
  d.setHours(23, 59, 59, 999)
  filters.value = { ...filters.value, toDate: d.toISOString(), offset: 0 }
}

function clearFilters() {
  actionInput.value = ''
  resourceTypeInput.value = undefined
  resourceIdInput.value = ''
  filters.value = {
    adminUserId: undefined,
    actionType: undefined,
    resourceType: undefined,
    resourceId: undefined,
    fromDate: defaultFromDate(),
    toDate: undefined,
    offset: 0,
    limit: 100,
  }
  expandedIndex.value = -1
}
</script>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.filter-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-3);
}
.audit-detail {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px 16px;
  padding: 12px;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 11px;
}
.audit-row {
  display: contents;
}
.audit-row-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-3);
  padding-top: 4px;
}
.audit-pre {
  font-family: var(--f-mono);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 360px;
  overflow: auto;
  margin: 0;
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.audit-pre.danger {
  border-left: 2px solid var(--danger-500);
}
.audit-pre.success {
  border-left: 2px solid var(--moss-500);
}
.masked-list {
  display: grid;
  gap: 4px;
}
.audit-context {
  display: grid;
  gap: 6px;
  font-size: 11px;
  line-height: 1.6;
}
.audit-context-line {
  padding-left: 2px;
}
</style>
