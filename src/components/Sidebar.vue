<template>
  <aside class="sidebar flex flex-col">
    <div class="sb-logo" @click="$emit('navigate', 'dashboard')">
      <Logo :size="32" />
    </div>

    <nav class="flex-1 overflow-y-auto">
      <div v-for="(group, i) in visibleNav" :key="i" class="sb-section">
        <div v-if="!collapsed && group.group !== 'main'" class="sb-section-label">
          {{ group.group }}
        </div>
        <div
          v-for="item in group.items"
          :key="item.id"
          class="sb-item"
          :class="{ active: isActive(item.id) }"
          :title="collapsed ? item.label : ''"
          @click="$emit('navigate', item.id)"
        >
          <i class="ph" :class="item.icon"></i>
          <template v-if="!collapsed">
            <span class="sb-item-label">{{ item.label }}</span>
            <span
              v-if="item.badge != null && item.badge !== 0"
              class="sb-badge"
              :class="item.type || ''"
            >
              {{ item.badge }}
            </span>
          </template>
        </div>
      </div>
    </nav>

    <div v-if="!collapsed && me.user.value" class="sb-user">
      <img
        v-if="me.avatarUrl.value"
        :src="me.avatarUrl.value"
        :alt="me.displayName.value"
        class="sb-user-avatar"
        referrerpolicy="no-referrer"
      />
      <div
        v-else
        class="avatar"
        :style="{ width: '30px', height: '30px', fontSize: '12px', borderRadius: '6px' }"
      >
        {{ me.initials.value }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="sb-user-name truncate">{{ me.displayName.value }}</div>
        <div class="sb-user-role">{{ me.roleLabel.value }}</div>
      </div>
      <i class="ph ph-caret-up-down text-[var(--fg-3)] text-sm"></i>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import Logo from './Logo.vue'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { useQueueDepths } from '../composables/useQueueDepths'
import { PERM } from '../lib/permissions'

defineProps({
  collapsed: Boolean,
})

defineEmits(['navigate'])

const me = useCurrentAdmin()
const route = useRoute()

// Shared queue-depths query. Only ping while signed in; the
// composable handles 30s polling and Dashboard reads the same cache.
const { counts: queueCounts } = useQueueDepths({ enabled: me.isAuthenticated })

/**
 * Sidebar entries with the permission they require. `requires: null`
 * means visible to anyone authenticated (e.g. dashboard, monitoring
 * pages everyone with `monitoring.view` gets — which is all roles).
 *
 * Badge counts are deliberately stubbed to `null` for now — Phase 3
 * wires them to `/v1/admin/monitoring/queue-depths` so the numbers
 * match what's actually waiting in each queue.
 */
const NAV = [
  {
    group: 'main',
    items: [
      { id: 'dashboard', icon: 'ph-house', label: 'Dashboard', requires: PERM.MONITORING_VIEW },
    ],
  },
  {
    group: 'Queues',
    items: [
      { id: 'vetting', icon: 'ph-eye', label: 'Vetting', requires: PERM.CREATIVES_VIEW, badgeKey: 'vetting', type: 'attn' },
      { id: 'fraud', icon: 'ph-shield-warning', label: 'Fraud', requires: PERM.FRAUD_VIEW, badgeKey: 'fraud', type: 'alert' },
      { id: 'payouts', icon: 'ph-bank', label: 'Payouts', requires: PERM.PAYOUTS_VIEW, badgeKey: 'payouts', type: 'attn' },
      { id: 'support', icon: 'ph-chat-centered-dots', label: 'Support', requires: PERM.SUPPORT_VIEW, badgeKey: 'support', type: 'attn' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { id: 'hosts', icon: 'ph-storefront', label: 'Hosts', requires: PERM.HOSTS_VIEW },
      { id: 'screens', icon: 'ph-monitor', label: 'Screens', requires: PERM.SCREENS_VIEW },
      { id: 'advertisers', icon: 'ph-megaphone', label: 'Advertisers', requires: PERM.ADVERTISERS_VIEW },
      { id: 'campaigns', icon: 'ph-flag', label: 'Campaigns', requires: PERM.CREATIVES_VIEW },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'audit', icon: 'ph-scroll', label: 'Audit log', requires: PERM.AUDIT_VIEW },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { id: 'admins', icon: 'ph-users-three', label: 'Admin users', requires: PERM.ADMIN_USERS_VIEW },
      // Settings is a per-user account view, available to anyone signed in.
      { id: 'settings', icon: 'ph-gear-six', label: 'Settings', requires: null },
    ],
  },
]

/**
 * Filter entries by what this admin's role can do. Hide entire groups
 * that come out empty (e.g. `vetting_agent` doesn't see "Operations").
 * Permission missing on the SPA-side map (or unknown role) hides the
 * item — fail closed; the backend will still 403 the underlying call
 * if the user somehow URL-types in.
 *
 * Also resolves `badgeKey` against the live queue-depths so we don't
 * have to plumb counts down via props.
 */
const visibleNav = computed(() => {
  const counts = queueCounts.value
  return NAV.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => !item.requires || me.can(item.requires))
      .map((item) => ({
        ...item,
        badge: item.badgeKey ? counts[item.badgeKey] ?? 0 : item.badge,
      })),
  })).filter((group) => group.items.length > 0)
})

function isActive(id) {
  return (
    route.name === id ||
    route.path === `/${id}` ||
    (id === 'dashboard' && route.path === '/')
  )
}
</script>

<style scoped>
.sb-user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  object-fit: cover;
}
</style>
