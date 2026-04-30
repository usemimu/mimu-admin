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
          <div class="spacer"></div>
          <button class="btn ghost sm" @click="$router.push('/audit')">
            View all <i class="ph ph-arrow-right"></i>
          </button>
        </div>
        <div v-if="auditQuery.isLoading.value" class="p-4 fg2 text-sm">Loading…</div>
        <div v-else-if="recentActivity.length === 0" class="p-4 fg2 text-sm">
          No recent admin actions.
        </div>
        <div v-else>
          <div
            v-for="(a, i) in recentActivity"
            :key="a.id"
            class="flex ac py-2.5 px-4"
            :class="i > 0 ? 'border-t border-[var(--border)]' : ''"
          >
            <i class="ph text-base w-6 text-[var(--fg-2)]" :class="actionIcon(a.action)"></i>
            <div class="flex-1 text-[13px]">
              <strong>{{ a.adminName }}</strong>
              <span class="fg2"> {{ verbLabel(a.action) }} </span>
              <span v-if="a.targetResourceType" class="fg2">
                · {{ a.targetResourceType }}
              </span>
              <span v-if="a.targetResourceId" class="mono fg2 text-[11px]" style="margin-left: 4px;">
                {{ shortId(a.targetResourceId) }}
              </span>
            </div>
            <div class="mono text-[11px] text-[var(--fg-3)]">{{ relTime(a.createdAt) }}</div>
          </div>
        </div>
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

function verbLabel(action) {
  if (!action) return ''
  const [resource, verb] = action.split('.')
  if (!verb) return action
  const past = verb.endsWith('e') ? `${verb}d` : `${verb}ed`
  return `${past} ${resource}`
}

function actionIcon(action) {
  if (!action) return 'ph-circle'
  if (action.includes('reject')) return 'ph-x-circle text-danger-500'
  if (action.includes('approve')) return 'ph-check-circle text-moss-500'
  if (action.includes('hold') || action.includes('suspend')) return 'ph-pause-circle text-gold-500'
  if (action.includes('refund')) return 'ph-arrow-counter-clockwise'
  return 'ph-circle'
}

function goTo(path) {
  if (path) router.push(path)
}
</script>
