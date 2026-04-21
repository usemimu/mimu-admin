<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Campaigns</div>
        <span class="fg2 text-xs">8 total · 5 active · 2 paused · 1 completed</span>
        <div class="spacer"></div>
        <button class="btn outline sm"><i class="ph ph-download-simple"></i> Export CSV</button>
        <button class="btn primary sm"><i class="ph ph-plus"></i> New campaign</button>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 12px;">
        <span class="chip"><strong>Status</strong> All</span>
        <span class="chip"><strong>Advertiser</strong> Any</span>
        <button class="btn ghost sm"><i class="ph ph-plus"></i> Add filter</button>
        <div class="spacer"></div>
        <div class="flex gap-2">
          <button class="btn outline sm">Spend · high to low <i class="ph ph-arrow-down"></i></button>
          <button class="btn ghost sm">Recently created</button>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Campaign</th>
              <th class="p-3">Advertiser</th>
              <th class="p-3">Period</th>
              <th class="p-3 text-right">Spend</th>
              <th class="p-3 text-right">Budget</th>
              <th class="p-3 text-right">Plays</th>
              <th class="p-3">Targeting</th>
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="campaign in MOCK.campaigns"
              :key="campaign.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <div class="font-semibold">{{ campaign.name }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ campaign.id }}</div>
              </td>
              <td class="p-3 font-medium">{{ campaign.advertiser }}</td>
              <td class="p-3 fg2 text-xs">
                {{ formatDate(campaign.startDate) }} – {{ formatDate(campaign.endDate) }}
              </td>
              <td class="p-3 text-right mono">{{ fmt.naira(campaign.spend) }}</td>
              <td class="p-3 text-right mono fg2">{{ fmt.naira(campaign.budget) }}</td>
              <td class="p-3 text-right mono">{{ fmt.num(campaign.plays) }}</td>
              <td class="p-3 fg2 text-xs">{{ campaign.targeting }}</td>
              <td class="p-3">
                <span class="pill" :class="{
                  'pill-active': campaign.status === 'active',
                  'pill-pending': campaign.status === 'paused',
                  'pill-neutral': campaign.status === 'completed'
                }">
                  {{ campaign.status }}
                </span>
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

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const month = d.toLocaleString('en', { month: 'short' })
  const day = d.getDate()
  return `${month} ${day}`
}
</script>
