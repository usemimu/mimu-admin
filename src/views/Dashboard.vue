<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Operations today</div>
        <span class="pill pill-active sm">
          <span class="sdot green pulse"></span>
          All systems
        </span>
        <div class="spacer"></div>
        <span class="fg2 text-xs">Monday, Apr 21 · 9:41 WAT</span>
        <button class="btn outline sm">
          <i class="ph ph-arrows-clockwise"></i> Refresh
        </button>
      </div>
      <div class="page-subtitle">Is the platform working? Scan this in 5 seconds.</div>
    </div>

    <div class="page-body">
      <!-- Metrics -->
      <div class="grid-4 mb-4">
        <div
          v-for="metric in metrics"
          :key="metric.key"
          class="metric"
        >
          <div class="metric-label">{{ metric.label }}</div>
          <div class="flex ac jb">
            <div class="metric-value">{{ formatMetric(metric) }}</div>
            <svg v-if="metric.data.spark" width="72" height="28" class="ml-2">
              <polyline
                :points="getSparkPoints(metric.data.spark, 72, 28)"
                fill="none"
                :stroke="metric.data.d > 0 ? '#2B7244' : '#B82828'"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="metric-delta" :class="metric.data.d > 0 ? 'up' : 'down'">
            <i class="ph" :class="metric.data.d > 0 ? 'ph-arrow-up-right' : 'ph-arrow-down-right'"></i>
            {{ Math.abs(metric.data.d) }}{{ metric.key === 'payoutRate' ? 'pp' : '%' }} vs yesterday
          </div>
        </div>
      </div>

      <!-- Queue depths & System health -->
      <div class="grid" style="grid-template-columns: 1.3fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div class="card">
          <div class="card-head">
            <div class="card-title">Queue depths</div>
            <div class="spacer"></div>
            <span class="fg2 text-xs">Live</span>
          </div>
          <div>
            <div
              v-for="queue in queues"
              :key="queue.key"
              class="flex ac py-3 px-4 border-t border-[var(--border)] first:border-t-0 cursor-pointer"
            >
              <div class="flex-1">
                <div class="text-[13px] font-semibold text-[var(--fg)]">{{ queue.label }}</div>
                <div class="text-[11px] text-[var(--fg-3)]">
                  Oldest {{ formatTime(queue.oldest) }} · {{ queue.subcrit ? `${queue.subcrit} SLA breach` : 'within SLA' }}
                </div>
              </div>
              <div
                class="font-display text-[32px] font-normal leading-none mr-4"
                :class="queue.crit ? 'text-danger-500' : 'text-clay-500'"
              >
                {{ queue.count }}
              </div>
              <i class="ph ph-caret-right text-[var(--fg-3)]"></i>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title">System health</div>
            <div class="spacer"></div>
            <span class="pill pill-pending sm">1 degraded</span>
          </div>
          <div class="p-0">
            <div
              v-for="(system, i) in MOCK.systems"
              :key="i"
              class="flex ac py-2.5 px-4"
              :class="i > 0 ? 'border-t border-[var(--border)]' : ''"
            >
              <span
                class="sdot"
                :class="{
                  green: system.status === 'ok',
                  amber: system.status === 'degraded',
                  red: system.status === 'error',
                  pulse: system.status !== 'ok'
                }"
              ></span>
              <div class="ml-2.5 flex-1">
                <div class="text-[13px] font-medium">{{ system.name }}</div>
                <div class="fg2 text-[11px]">{{ system.uptime }} · {{ system.last }}</div>
              </div>
              <span class="pill sm" :class="system.status === 'ok' ? 'pill-active' : 'pill-pending'">
                {{ system.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">Recent activity</div>
          <div class="spacer"></div>
          <span class="fg2 text-xs">High-priority only</span>
        </div>
        <div>
          <div
            v-for="(activity, i) in MOCK.activity"
            :key="i"
            class="flex ac py-2.5 px-4"
            :class="[
              i > 0 ? 'border-t border-[var(--border)]' : '',
              activity.ref ? 'cursor-pointer' : ''
            ]"
          >
            <i
              class="ph text-base w-6"
              :class="[
                activity.icon,
                activity.level === 'alert' ? 'text-danger-500' : activity.level === 'warn' ? 'text-gold-500' : 'text-[var(--fg-2)]'
              ]"
            ></i>
            <div class="flex-1 text-[13px]">{{ activity.msg }}</div>
            <div class="mono text-[11px] text-[var(--fg-3)]">{{ formatRel(activity.t) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMockData } from '../composables/useMockData'
import { fmt } from '../utils/format'

const { MOCK } = useMockData()

const metrics = computed(() => [
  { key: 'activeScreens', label: 'Active screens', fmt: fmt.num, data: MOCK.metrics.activeScreens },
  { key: 'plays24h', label: 'Plays · 24h', fmt: fmt.num, data: MOCK.metrics.plays24h },
  { key: 'revenue24h', label: 'Revenue · 24h', fmt: fmt.naira, data: MOCK.metrics.revenue24h },
  { key: 'payoutRate', label: 'Payout success · 7d', fmt: (v) => v.toFixed(1) + '%', data: MOCK.metrics.payoutRate },
])

const queues = computed(() => [
  { key: 'vetting', label: 'Creative vetting', count: MOCK.queues.vetting, oldest: 320, crit: false },
  { key: 'fraud', label: 'Fraud review', count: MOCK.queues.fraud, oldest: 180, crit: true },
  { key: 'payouts', label: 'Payouts · Approval', count: MOCK.queues.payouts, oldest: 18, crit: false },
  { key: 'support', label: 'Support inbox', count: MOCK.queues.support, oldest: 8, crit: false, subcrit: 3 },
])

const formatMetric = (metric) => {
  return metric.fmt(metric.data.v)
}

const getSparkPoints = (data, width, height) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(' ')
}

const formatTime = (mins) => {
  return fmt.time(mins)
}

const formatRel = (mins) => {
  return fmt.rel(mins)
}
</script>
