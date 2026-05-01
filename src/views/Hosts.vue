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
              <th class="p-3">Owner</th>
              <th class="p-3">LGA</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Screens</th>
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
                <div class="font-semibold">{{ host.businessName }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ shortId(host.id) }}</div>
              </td>
              <td class="p-3">
                <div>{{ host.ownerName }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ host.contactLine }}</div>
              </td>
              <td class="p-3 fg2">{{ host.lga }}</td>
              <td class="p-3 fg2">{{ host.category }}</td>
              <td class="p-3 text-right mono">{{ host.screenCount }}</td>
              <td class="p-3">
                <span class="pill" :class="pillClass(host.status)">
                  {{ host.status }}
                </span>
              </td>
              <td class="p-3 mono text-xs">
                {{ host.lastSeenAt ? fmt.rel(host.lastSeenAt) : 'never' }}
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

// Backend returns rows shaped `{ user, profile, screenCount }`.
// Flatten into the row shape the template renders against. Status is
// derived from the user record (suspended vs active) and the profile's
// completion flag, since the rows themselves don't carry a top-level
// `status` field.
const hosts = computed(() =>
  extractList(data.value, 'hosts').map((row) => {
    const user = row.user ?? {}
    const profile = row.profile ?? {}
    return {
      // The detail endpoint (`GET /admin/hosts/:id`) keys on the
      // host_profiles row id, not the user id. Use that as the row's
      // navigation target so clicking through actually loads.
      id: profile.id || user.id,
      userId: user.id,
      businessName: profile.businessName || '—',
      ownerName: user.name || '—',
      contactLine: user.email || user.phoneNumber || '',
      lga: profile.lga || '—',
      // host_profiles column is `business_type`; we expose it as
      // category in the table for symmetry with the admin invite UI.
      category: profile.businessType || '—',
      screenCount: Number(row.screenCount ?? 0),
      status: deriveStatus(user, profile),
      lastSeenAt: user.lastLoginAt || null,
    }
  }),
)

function deriveStatus(user, profile) {
  if (user?.isSuspended) return 'suspended'
  if (profile?.isComplete) return 'active'
  return 'pending'
}

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

const statusSummary = computed(() => {
  const total = hosts.value.length
  const active = hosts.value.filter((h) => h.status === 'active').length
  const pending = hosts.value.filter((h) => h.status === 'pending').length
  const hold = hosts.value.filter((h) => h.status === 'suspended').length
  return `${total} total · ${active} active · ${pending} pending · ${hold} suspended`
})

function pillClass(status) {
  if (status === 'active') return 'pill-active'
  if (status === 'pending') return 'pill-pending'
  if (status === 'suspended') return 'pill-failed'
  return 'pill-neutral'
}

function goToDetail(id) {
  router.push({ name: 'host-detail', params: { id } })
}
</script>
