<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Fraud review</div>
        <span class="pill pill-failed lg">{{ MOCK.fraudFlags.length }} open</span>
        <div class="spacer"></div>
        <div class="flex gap-1">
          <button class="btn sm outline">Score · high to low <i class="ph ph-arrow-down"></i></button>
          <button class="btn sm ghost">Oldest first</button>
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Type</th>
              <th class="p-3">Target</th>
              <th class="p-3 text-right w-24">Score</th>
              <th class="p-3">Top flags</th>
              <th class="p-3">Assignee</th>
              <th class="p-3">Status</th>
              <th class="p-3">Detected</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="flag in MOCK.fraudFlags"
              :key="flag.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <span class="pill pill-neutral sm">
                  <i class="ph" :class="{
                    'ph-monitor': flag.type === 'screen',
                    'ph-megaphone': flag.type === 'advertiser',
                    'ph-storefront': flag.type === 'host'
                  }"></i>
                  {{ flag.type }}
                </span>
              </td>
              <td class="p-3">
                <div class="font-medium">{{ flag.target }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ flag.id }}</div>
              </td>
              <td class="p-3 text-right">
                <div class="inline-flex items-center gap-2">
                  <span class="font-bold" :class="{
                    'text-danger-500': flag.score >= 0.6,
                    'text-gold-500': flag.score >= 0.3 && flag.score < 0.6,
                    'text-moss-500': flag.score < 0.3
                  }">{{ flag.score.toFixed(2) }}</span>
                  <div class="w-10 h-1 rounded bg-[var(--bg-sunken)] overflow-hidden">
                    <div class="h-full" :class="{
                      'bg-danger-500': flag.score >= 0.6,
                      'bg-gold-500': flag.score >= 0.3 && flag.score < 0.6,
                      'bg-moss-500': flag.score < 0.3
                    }" :style="{ width: (flag.score * 100) + '%' }"></div>
                  </div>
                </div>
              </td>
              <td class="p-3">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="f in flag.flags.slice(0, 3)" :key="f" class="pill pill-failed sm">
                    {{ f.replace(/_/g, ' ') }}
                  </span>
                </div>
              </td>
              <td class="p-3 fg2 text-xs">{{ flag.assignee || '—' }}</td>
              <td class="p-3">
                <span class="pill" :class="{
                  'pill-pending': flag.status === 'pending',
                  'pill-hold': flag.status === 'reviewing'
                }">{{ flag.status }}</span>
              </td>
              <td class="p-3 mono fg2 text-xs">{{ fmt.rel(flag.detected) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMockData } from '../composables/useMockData'
import { fmt } from '../utils/format'

const { MOCK } = useMockData()
</script>
