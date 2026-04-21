<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Hosts</div>
        <span class="fg2 text-xs">427 total · 412 active · 12 pending · 3 hold</span>
        <div class="spacer"></div>
        <button class="btn outline sm"><i class="ph ph-download-simple"></i> Export CSV</button>
        <button class="btn primary sm" @click="$router.push('/host-invite')">
          <i class="ph ph-plus"></i> New invite
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Business</th>
              <th class="p-3">LGA</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Screens</th>
              <th class="p-3 text-right">This month</th>
              <th class="p-3">Status</th>
              <th class="p-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="host in MOCK.hosts"
              :key="host.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <div class="font-semibold">{{ host.name }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ host.id }}</div>
              </td>
              <td class="p-3 fg2">{{ host.lga }}</td>
              <td class="p-3 fg2">{{ host.cat }}</td>
              <td class="p-3 text-right mono">{{ host.screens }}</td>
              <td class="p-3 text-right mono">
                <span v-if="host.earn">{{ fmt.naira(host.earn) }}</span>
                <span v-else class="text-[var(--fg-3)]">—</span>
              </td>
              <td class="p-3">
                <span class="pill" :class="{
                  'pill-active': host.status === 'active',
                  'pill-pending': host.status === 'pending',
                  'pill-hold': host.status === 'hold'
                }">
                  {{ host.status }}
                </span>
              </td>
              <td class="p-3 mono text-xs">
                {{ host.last === null ? '—' : fmt.rel(host.last) }}
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
</script>
