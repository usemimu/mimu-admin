<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Operations today</div>
        <span class="pill sm" :class="systemPill">
          <span class="sdot" :class="systemDot"></span>
          {{ systemLabel }}
        </span>
        <div class="spacer"></div>
        <span class="fg2 text-xs">{{ nowLabel }}</span>
        <button class="btn outline sm" @click="refreshAll">
          <i class="ph ph-arrows-clockwise"></i> Refresh
        </button>
      </div>
      <div class="page-subtitle">Is the platform working? Scan this in 5 seconds.</div>
    </div>

    <div class="page-body">
      <!-- Metrics -->
      <div class="grid-4 mb-4">
        <div v-for="m in metrics" :key="m.key" class="metric">
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-value">{{ m.value }}</div>
          <div v-if="m.delta != null" class="metric-delta" :class="m.delta >= 0 ? 'up' : 'down'">
            <i class="ph" :class="m.delta >= 0 ? 'ph-arrow-up-right' : 'ph-arrow-down-right'"></i>
            {{ m.deltaLabel }}
          </div>
          <div v-else class="metric-delta fg2">{{ m.subtitle || '' }}</div>
        </div>
      </div>

      <!-- Queue depths & System health -->
      <div class="grid" style="grid-template-columns: 1.3fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div class="card">
          <div class="card-head">
            <div class="card-title">Queue depths</div>
            <div class="spacer"></div>
            <span v-if="queueAlertsCount > 0" class="pill pill-failed sm">
              {{ queueAlertsCount }} alert{{ queueAlertsCount > 1 ? 's' : '' }}
            </span>
            <span v-else class="fg2 text-xs">All within threshold</span>
          </div>
          <div>
            <div
              v-for="q in queues"
              :key="q.key"
              class="flex ac py-3 px-4 border-t border-[var(--border)] first:border-t-0 cursor-pointer"
              @click="goTo(q.path)"
            >
              <div class="flex-1">
                <div class="text-[13px] font-semibold text-[var(--fg)]">{{ q.label }}</div>
                <div class="text-[11px] text-[var(--fg-3)]">{{ q.subline }}</div>
              </div>
              <div
                class="font-display text-[32px] font-normal leading-none mr-4"
                :class="q.crit ? 'text-danger-500' : 'text-clay-500'"
              >
                {{ q.count }}
              </div>
              <i class="ph ph-caret-right text-[var(--fg-3)]"></i>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title">System health</div>
            <div class="spacer"></div>
            <span class="pill sm" :class="degradedSystemsCount > 0 ? 'pill-pending' : 'pill-active'">
              {{ degradedSystemsCount > 0 ? `${degradedSystemsCount} degraded` : 'all green' }}
            </span>
          </div>
          <div class="p-0">
            <div
              v-for="(system, i) in systems"
              :key="system.name"
              class="flex ac py-2.5 px-4"
              :class="i > 0 ? 'border-t border-[var(--border)]' : ''"
            >
              <span
                class="sdot"
                :class="{
                  green: system.status === 'ok',
                  amber: system.status === 'degraded',
                  red: system.status === 'error',
                  pulse: system.status !== 'ok',
                }"
              ></span>
              <div class="ml-2.5 flex-1">
                <div class="text-[13px] font-medium">{{ system.name }}</div>
                <div class="fg2 text-[11px]">{{ system.detail }}</div>
              </div>
              <span class="pill sm" :class="system.status === 'ok' ? 'pill-active' : 'pill-pending'">
                {{ system.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent admin activity (audit log). Hidden entirely for roles
           without `audit.view` — there's no value in showing a "you can't
           see this" placeholder, and the query above is gated so we
           never fire the 403 in the first place. -->
      <div v-if="canSeeAuditLog" class="card">
        <div class="card-head">
          <div class="card-title">Recent admin activity</div>
          <span v-if="recentActivity.length" class="fg2 text-xs" style="margin-left: 8px;">
            last {{ recentActivity.length }}
          </span>
          <div class="spacer"></div>
          <button class="btn ghost sm" @click="$router.push('/audit')">
            View all <i class="ph ph-arrow-right"></i>
          </button>
        </div>
        <div v-if="auditQuery.isLoading.value" class="p-4">
          <RowSkeleton :count="4" />
        </div>
        <div v-else-if="recentActivity.length === 0" class="activity-empty">
          <i class="ph ph-scroll" style="font-size: 24px; color: var(--fg-3); margin-bottom: 6px;"></i>
          <div class="fg2 text-sm">No recent admin actions.</div>
          <div class="fg2 text-xs" style="margin-top: 2px;">
            Mutations (approve, suspend, role change, etc.) appear here.
          </div>
        </div>
        <ul v-else class="activity-list">
          <li
            v-for="a in recentActivity"
            :key="a.id"
            class="activity-row"
            :title="`${a.adminName} · ${a.action}`"
            @click="$router.push('/audit')"
          >
            <div class="activity-avatar" :title="a.adminName">
              {{ getInitials(a.adminName) }}
            </div>
            <div class="activity-body">
              <div class="activity-line">
                <span class="pill sm activity-method" :class="methodPill(a.method)">
                  {{ a.method || methodFromAction(a.action) || '·' }}
                </span>
                <strong class="activity-action">{{ humanAction(a.action) }}</strong>
                <span
                  v-if="a.targetResourceType || a.targetResourceId"
                  class="activity-target"
                >
                  <span v-if="a.targetResourceType">{{ a.targetResourceType.replace(/_/g, ' ') }}</span>
                  <span v-if="a.targetResourceId" class="mono activity-target-id">
                    {{ shortId(a.targetResourceId) }}
                  </span>
                </span>
              </div>
              <div class="activity-meta">
                <span>{{ a.adminName }}</span>
                <span v-if="a.path" class="activity-path">· {{ a.path }}</span>
              </div>
            </div>
            <div class="activity-time" :title="formatExactTime(a.createdAt)">
              {{ relTime(a.createdAt) }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { monitoringApi } from '../api/monitoring'
import { qk } from '../lib/queryKeys'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { PERM } from '../lib/permissions'
import RowSkeleton from '../components/RowSkeleton.vue'

const router = useRouter()
const qc = useQueryClient()
const me = useCurrentAdmin()

// `monitoring.view` is granted to every role today, but gate explicitly
// so a future role split doesn't silently 403 the entire dashboard.
const canSeeDashboard = computed(() => me.can(PERM.MONITORING_VIEW))
const canSeeAuditLog = computed(() => me.can(PERM.AUDIT_VIEW))

const dashboardQuery = useQuery({
  queryKey: qk.dashboard(),
  queryFn: () => monitoringApi.dashboard(),
  enabled: canSeeDashboard,
  refetchInterval: 60_000,
})

// Same key the sidebar uses — both views share the cache and only
// one network round-trip per 30s window.
const queueQuery = useQuery({
  queryKey: qk.queueDepths(),
  queryFn: () => monitoringApi.queueDepths(),
  enabled: canSeeDashboard,
  refetchInterval: 30_000,
})

// Audit log is restricted (support_agent + vetting_agent + field_ops
// don't have `audit.view`). Skip the query for them so we don't
// generate noisy 403s on every dashboard load. The template branches
// on `canSeeAuditLog` to hide the panel.
const auditQuery = useQuery({
  queryKey: qk.auditLog({ limit: 8, offset: 0 }),
  queryFn: () => monitoringApi.auditLog({ limit: 8, offset: 0 }),
  enabled: canSeeAuditLog,
  refetchInterval: 30_000,
})

function refreshAll() {
  qc.invalidateQueries({ queryKey: qk.dashboard() })
  qc.invalidateQueries({ queryKey: qk.queueDepths() })
  qc.invalidateQueries({ queryKey: qk.auditLog({ limit: 8, offset: 0 }) })
}

const nowLabel = computed(() =>
  new Date().toLocaleString('en-NG', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Lagos',
  }),
)

const metrics = computed(() => {
  const d = dashboardQuery.data.value
  if (!d) return placeholderMetrics()
  return [
    {
      key: 'activeScreens',
      label: 'Active screens',
      value: formatNum(d.activeScreens?.count),
      delta: d.activeScreens?.delta,
      deltaLabel: `${Math.abs(d.activeScreens?.delta ?? 0)} vs yesterday`,
    },
    {
      key: 'plays24h',
      label: 'Plays · 24h',
      value: formatNum(d.playsLast24h?.count),
      delta: null,
      subtitle: 'Last 24h window',
    },
    {
      key: 'revenue24h',
      label: 'Revenue · 24h',
      value: formatNaira(d.revenueLast24h?.kobo),
      delta: null,
      subtitle: 'Gross plays-driven revenue',
    },
    {
      key: 'payoutRate',
      label: 'Payout success · 7d',
      value: `${d.payoutSuccessRate?.rate ?? '—'}%`,
      delta: null,
      subtitle: `${d.payoutSuccessRate?.last7Days?.successful ?? 0} of ${d.payoutSuccessRate?.last7Days?.total ?? 0}`,
    },
  ]
})

function placeholderMetrics() {
  return [
    { key: 'activeScreens', label: 'Active screens', value: '—', delta: null, subtitle: 'Loading…' },
    { key: 'plays24h', label: 'Plays · 24h', value: '—', delta: null, subtitle: 'Loading…' },
    { key: 'revenue24h', label: 'Revenue · 24h', value: '—', delta: null, subtitle: 'Loading…' },
    { key: 'payoutRate', label: 'Payout success · 7d', value: '—', delta: null, subtitle: 'Loading…' },
  ]
}

const queues = computed(() => {
  const d = dashboardQuery.data.value
  const q = queueQuery.data.value
  return [
    {
      key: 'vetting',
      label: 'Creative vetting',
      count: q?.vettingQueue ?? d?.vettingQueue?.depth ?? 0,
      crit: q?.alerts?.vettingQueueHigh,
      subline: d?.vettingQueue?.oldestAgeHours != null
        ? `Oldest ${d.vettingQueue.oldestAgeHours}h · ${q?.alerts?.vettingQueueHigh ? 'over threshold' : 'within threshold'}`
        : 'queue depth',
      path: '/vetting',
    },
    {
      key: 'fraud',
      label: 'Fraud review',
      count: q?.fraudQueue ?? d?.fraudQueue?.depth ?? 0,
      crit: q?.alerts?.fraudQueueHigh,
      subline: q?.alerts?.fraudQueueHigh ? 'over threshold' : 'within threshold',
      path: '/fraud',
    },
    {
      key: 'payouts',
      label: 'Payouts · approval',
      count: q?.payoutApprovalQueue ?? 0,
      crit: false,
      subline: 'pending ops review',
      path: '/payouts',
    },
    {
      key: 'support',
      label: 'Support inbox',
      count: q?.supportTickets ?? d?.supportTickets?.openCount ?? 0,
      crit: q?.alerts?.supportTicketsHigh,
      subline: d?.supportTickets?.oldestAgeHours != null
        ? `Oldest ${d.supportTickets.oldestAgeHours}h`
        : 'open tickets',
      path: '/support',
    },
  ]
})

const queueAlertsCount = computed(() => {
  const a = queueQuery.data.value?.alerts
  if (!a) return 0
  return [a.vettingQueueHigh, a.fraudQueueHigh, a.supportTicketsHigh].filter(Boolean).length
})

const systems = computed(() => {
  const d = dashboardQuery.data.value
  const paystackOk = d?.paystackIntegrationStatus === 'healthy'
  return [
    {
      name: 'Paystack',
      status: paystackOk ? 'ok' : 'degraded',
      detail: d?.paystackIntegrationStatus ?? 'unknown',
    },
    {
      name: 'API gateway',
      status: dashboardQuery.error.value ? 'error' : 'ok',
      detail: dashboardQuery.error.value ? 'unreachable' : 'reachable',
    },
    // Only report audit-log health for roles that actually probe it;
    // for everyone else the query is disabled and a "no data, no
    // error" check would render misleading green ticks.
    ...(canSeeAuditLog.value
      ? [
          {
            name: 'Audit log',
            status: auditQuery.error.value ? 'error' : 'ok',
            detail: auditQuery.error.value
              ? 'unreachable'
              : `${auditQuery.data.value?.logs?.length ?? 0} entries fetched`,
          },
        ]
      : []),
  ]
})

const degradedSystemsCount = computed(() =>
  systems.value.filter((s) => s.status !== 'ok').length,
)

const systemPill = computed(() => {
  if (degradedSystemsCount.value > 0) return 'pill-pending'
  if (queueAlertsCount.value > 0) return 'pill-pending'
  return 'pill-active'
})
const systemDot = computed(() => {
  if (degradedSystemsCount.value > 0) return 'amber pulse'
  return 'green pulse'
})
const systemLabel = computed(() => {
  if (degradedSystemsCount.value > 0) return `${degradedSystemsCount.value} degraded`
  return 'All systems'
})

const recentActivity = computed(() => {
  const rows = auditQuery.data.value?.logs ?? []
  return rows.map((row) => ({
    id: row.log?.id ?? row.id,
    action: row.log?.action ?? row.action,
    adminName: row.admin?.name || row.admin?.email || 'unknown',
    targetResourceType: row.log?.targetResourceType,
    targetResourceId: row.log?.targetResourceId,
    createdAt: row.log?.createdAt,
    method: row.log?.metadata?.method,
    path: row.log?.metadata?.path,
    statusCode: row.log?.metadata?.statusCode,
  }))
})

function formatNum(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-NG')
}

function formatNaira(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function relTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

// Same row helpers as Audit.vue. Kept inline rather than promoted to
// a shared module — only two callsites and the cost of a tiny bit of
// duplication is lower than another import boundary right now.
function humanAction(action) {
  if (!action) return ''
  const [resource, verb, ...rest] = action.split('.')
  if (!verb) return action
  const verbStr = verb.replace(/_/g, ' ')
  const tail = rest.length ? ` (${rest.join('.')})` : ''
  return `${verbStr.charAt(0).toUpperCase()}${verbStr.slice(1)} · ${resource.replace(/_/g, ' ')}${tail}`
}

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

function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatExactTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
  })
}

function goTo(path) {
  if (path) router.push(path)
}
</script>

<style scoped>
.activity-empty {
  padding: 28px 16px;
  text-align: center;
}
.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.activity-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 10px;
  padding: 10px 16px;
  align-items: center;
  cursor: pointer;
  border-top: 1px solid var(--border);
  transition: background 0.12s;
}
.activity-row:first-child {
  border-top: none;
}
.activity-row:hover {
  background: var(--bg-hover);
}
.activity-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--fg-2);
  flex-shrink: 0;
}
.activity-body {
  min-width: 0;
}
.activity-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}
.activity-method {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.02em;
}
.activity-action {
  color: var(--fg);
}
.activity-target {
  color: var(--fg-3);
  font-size: 12px;
}
.activity-target-id {
  font-size: 11px;
  margin-left: 4px;
  color: var(--fg-3);
}
.activity-meta {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--fg-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.activity-path {
  margin-left: 6px;
}
.activity-time {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--fg-3);
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 2px;
}
</style>
