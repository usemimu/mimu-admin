<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Audit log</div>
        <span class="fg2 text-xs">Showing {{ MOCK.audit.length }} of 14,284 entries · last 30 days</span>
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
        <span class="chip"><strong>Admin</strong> Any</span>
        <span class="chip"><strong>Action</strong> Any</span>
        <span class="chip"><strong>Resource type</strong> Any</span>
        <span class="chip"><strong>Date</strong> Last 30 days</span>
        <button class="btn ghost sm"><i class="ph ph-plus"></i> Add filter</button>
        <div class="spacer"></div>
        <div style="position: relative;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 8px; top: 8px; color: var(--fg-3); font-size: 14px;"></i>
          <input class="input" placeholder="Search by resource ID…" style="padding-left: 28px; width: 240px;"/>
          <div style="position: absolute; right: 6px; top: 6px;"><span class="kbd">/</span></div>
        </div>
      </div>

      <div class="card">
        <div
          v-for="(entry, i) in MOCK.audit"
          :key="i"
          style="border-top: 1px solid var(--border);"
          :style="{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }"
        >
          <div
            style="display: grid; grid-template-columns: 160px 32px 1fr auto; gap: 12px; padding: 10px 16px; cursor: pointer; align-items: center;"
            @click="expandedIndex = expandedIndex === i ? -1 : i"
          >
            <div class="mono fg2" style="font-size: 11px;">
              {{ formatTimestamp(entry.t) }}
            </div>
            <div
              class="avatar"
              :style="{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }"
            >
              {{ getInitials(entry.admin) }}
            </div>
            <div style="font-size: 13px;">
              <strong>{{ entry.admin }}</strong>
              <span class="fg2"> {{ verbLabel(entry.verb) }} </span>
              <span style="color: var(--clay-500); font-weight: 500;">{{ entry.target.name }}</span>
              <span class="mono" style="font-size: 11px; color: var(--fg-3); margin-left: 6px;">· {{ entry.target.id }}</span>
            </div>
            <div class="flex ac g8">
              <span class="pill pill-neutral sm">{{ entry.target.type }}</span>
              <i class="ph" :class="expandedIndex === i ? 'ph-caret-down' : 'ph-caret-right'" style="color: var(--fg-3);"></i>
            </div>
          </div>
          <div v-if="expandedIndex === i" style="padding: 0 16px 16px; margin-left: 172px;">
            <div style="background: var(--bg-sunken); border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: var(--f-mono); font-size: 11px; line-height: 1.6;">
              <div style="color: var(--danger-500);">- {{ getDiffBefore(entry) }}</div>
              <div style="color: var(--moss-500);">+ {{ getDiffAfter(entry) }}</div>
            </div>
            <div class="flex g8" style="margin-top: 8px;">
              <button class="btn ghost sm"><i class="ph ph-link"></i> Copy permalink</button>
              <button class="btn ghost sm"><i class="ph ph-arrow-square-out"></i> Open resource</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMockData } from '../composables/useMockData'
import { fmt } from '../utils/format'

const { MOCK } = useMockData()
const expandedIndex = ref(-1)

const getInitials = (name) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const formatTimestamp = (minsAgo) => {
  const now = new Date()
  const date = new Date(now.getTime() - minsAgo * 60000)
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `2026-04-21 ${hours}:${mins} WAT`
}

const verbLabel = (verb) => {
  const labels = {
    approved_creative: 'approved creative',
    rejected_creative: 'rejected creative',
    held_payout: 'held payout',
    processed_refund: 'processed refund',
    invited_host: 'invited host',
    cleared_fraud_flag: 'cleared fraud flag',
    updated_role: 'updated role',
    retired_screen: 'retired screen',
  }
  return labels[verb] || verb
}

const getDiffBefore = (entry) => {
  if (entry.verb === 'held_payout') {
    return JSON.stringify({ status: 'pending', fraud_hold: false, amount: entry.meta.amount }, null, 2)
  }
  if (entry.verb === 'updated_role') {
    return JSON.stringify({ role: entry.meta.from }, null, 2)
  }
  return JSON.stringify({ status: 'active' }, null, 2)
}

const getDiffAfter = (entry) => {
  if (entry.verb === 'held_payout') {
    return JSON.stringify({ status: 'held', fraud_hold: true, amount: entry.meta.amount, reason: entry.meta.reason }, null, 2)
  }
  if (entry.verb === 'updated_role') {
    return JSON.stringify({ role: entry.meta.to }, null, 2)
  }
  if (entry.verb === 'retired_screen') {
    return JSON.stringify({ status: 'retired', reason: entry.meta.reason }, null, 2)
  }
  return JSON.stringify({ status: 'completed' }, null, 2)
}
</script>
