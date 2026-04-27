<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Hosts</div>
        <span class="fg2 text-xs">{{ statusSummary }}</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
        <button class="btn primary sm" @click="$router.push('/host-invite')">
          <i class="ph ph-plus"></i> New invite
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <div v-if="isLoading" class="p-6 fg2 text-sm">Loading hosts…</div>
        <div v-else-if="error" class="p-6 text-sm" style="color: var(--danger-500)">
          {{ error?.message || 'Could not load hosts.' }}
        </div>
        <table v-else class="w-full">
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
            <tr v-if="!hosts.length">
              <td colspan="7" class="p-6 fg2 text-center text-sm">
                No hosts yet — create an invite to onboard one.
              </td>
            </tr>
            <tr
              v-for="host in hosts"
              :key="host.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
              @click="goToDetail(host.id)"
            >
              <td class="p-3">
                <div class="font-semibold">{{ host.businessName || host.name || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ host.id }}</div>
              </td>
              <td class="p-3 fg2">{{ host.lga || '—' }}</td>
              <td class="p-3 fg2">{{ host.businessCategory || host.category || '—' }}</td>
              <td class="p-3 text-right mono">{{ host.screensCount ?? host.screens ?? 0 }}</td>
              <td class="p-3 text-right mono">
                <span v-if="host.monthEarningsKobo">{{ fmt.naira(host.monthEarningsKobo / 100) }}</span>
                <span v-else-if="host.earn">{{ fmt.naira(host.earn) }}</span>
                <span v-else class="text-[var(--fg-3)]">—</span>
              </td>
              <td class="p-3">
                <span class="pill" :class="pillClass(host.status)">
                  {{ host.status || 'unknown' }}
                </span>
              </td>
              <td class="p-3 mono text-xs">
                {{ host.lastSeenAt ? fmt.rel(host.lastSeenAt) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { hostsApi } from '../api/hosts'
import { fmt } from '../utils/format'

const router = useRouter()

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['admin', 'hosts'],
  queryFn: () => hostsApi.list(),
})

// Response shape isn't strictly documented; tolerate either an array, a
// `{ data: [...] }` envelope, or a `{ items: [...], total }` envelope.
const hosts = computed(() => {
  const raw = data.value
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.items)) return raw.items
  return []
})

const statusSummary = computed(() => {
  const total = hosts.value.length
  const active = hosts.value.filter((h) => h.status === 'active').length
  const pending = hosts.value.filter((h) => h.status === 'pending').length
  const hold = hosts.value.filter((h) => h.status === 'hold' || h.status === 'suspended').length
  return `${total} total · ${active} active · ${pending} pending · ${hold} hold`
})

function pillClass(status) {
  if (status === 'active') return 'pill-active'
  if (status === 'pending') return 'pill-pending'
  if (status === 'hold' || status === 'suspended') return 'pill-hold'
  return ''
}

function goToDetail(id) {
  router.push({ path: '/screen-detail', query: { hostId: id } })
}
</script>
