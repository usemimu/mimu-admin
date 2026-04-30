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
        <button
          v-if="canInvite"
          class="btn primary sm"
          @click="$router.push('/host-invite')"
        >
          <i class="ph ph-plus"></i> New invite
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <RowSkeleton v-if="isLoading" :count="6" />
        <ErrorState
          v-else-if="error"
          title="Could not load hosts"
          :message="error?.message"
          :on-retry="refetch"
        />
        <EmptyState
          v-else-if="!hosts.length"
          icon="ph-storefront"
          title="No hosts yet"
          message="Hosts onboard via WhatsApp invites — start one to get a venue paired and earning."
          :cta-label="canInvite ? 'Create invite' : ''"
          @cta="$router.push('/host-invite')"
        />
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
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const router = useRouter()
const me = useCurrentAdmin()
const canInvite = computed(() => me.can(PERM.HOSTS_CREATE_INVITE))

const { data, isLoading, error, refetch } = useQuery({
  queryKey: qk.hosts(),
  queryFn: () => hostsApi.list(),
})

const hosts = computed(() => extractList(data.value, 'hosts'))

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
