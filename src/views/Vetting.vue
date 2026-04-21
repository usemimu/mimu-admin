<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Vetting queue</div>
        <span class="pill pill-pending lg">{{ MOCK.vetting.length }} pending</span>
        <span class="fg2 text-xs">Oldest: 5h 20m · APCON SLA: 24h</span>
        <div class="spacer"></div>
        <div class="flex items-center gap-2 text-[11px] text-[var(--fg-3)]">
          <span class="kbd">J</span><span class="kbd">K</span> navigate ·
          <span class="kbd">enter</span> open ·
          <span class="kbd">A</span> approve ·
          <span class="kbd">R</span> reject
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="flex items-center gap-2 mb-3 text-xs">
        <span class="font-semibold uppercase tracking-wider text-[var(--fg-3)]">Filter</span>
        <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-sunken)] border border-[var(--border)] text-xs">
          <strong>Status</strong> Pending
          <span class="cursor-pointer hover:bg-[var(--bg-hover)] rounded px-1"><i class="ph ph-x text-[10px]"></i></span>
        </span>
        <button class="btn ghost sm"><i class="ph ph-plus"></i> Add filter</button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left">
              <th class="p-3 w-8"></th>
              <th class="p-3 w-12"></th>
              <th class="p-3">Advertiser</th>
              <th class="p-3">Campaign</th>
              <th class="p-3">Flags</th>
              <th class="p-3 text-right w-20">Duration</th>
              <th class="p-3 w-28">Uploaded</th>
              <th class="p-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in MOCK.vetting"
              :key="item.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <input type="checkbox" class="cursor-pointer" />
              </td>
              <td class="p-3">
                <div class="w-8 h-6 rounded bg-[var(--bg-sunken)] flex items-center justify-center text-sm">
                  {{ item.thumb }}
                </div>
              </td>
              <td class="p-3">
                <div class="font-semibold">{{ item.adv }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ item.id }}</div>
              </td>
              <td class="p-3 text-[var(--fg-2)] truncate max-w-[240px]">{{ item.camp }}</td>
              <td class="p-3">
                <div class="flex gap-1 flex-wrap">
                  <span
                    v-for="flag in item.flags"
                    :key="flag"
                    class="pill sm"
                    :class="{
                      'pill-active': flag === 'auto_safe',
                      'pill-pending': flag.includes('review') || flag.includes('verify'),
                      'pill-failed': !flag.includes('auto') && !flag.includes('review') && !flag.includes('verify')
                    }"
                  >
                    {{ flag.replace(/_/g, ' ') }}
                  </span>
                </div>
              </td>
              <td class="p-3 text-right mono">{{ item.dur }}s</td>
              <td class="p-3 mono text-xs" :class="{
                'text-danger-500': item.uploadedMin > 240,
                'text-gold-500': item.uploadedMin > 120 && item.uploadedMin <= 240,
                'text-[var(--fg-2)]': item.uploadedMin <= 120
              }">
                {{ formatRel(item.uploadedMin) }}
              </td>
              <td class="p-3">
                <button class="btn ghost sm" title="Review">
                  <i class="ph ph-arrow-square-out"></i>
                </button>
              </td>
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

const formatRel = (mins) => fmt.rel(mins)
</script>
