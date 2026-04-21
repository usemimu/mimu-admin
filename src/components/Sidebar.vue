<template>
  <aside class="sidebar flex flex-col">
    <div class="sb-logo" @click="$emit('navigate', 'dashboard')">
      <Logo :size="32" />
    </div>

    <nav class="flex-1 overflow-y-auto">
      <div v-for="(group, i) in nav" :key="i" class="sb-section">
        <div v-if="!collapsed && group.group !== 'main'" class="sb-section-label">
          {{ group.group }}
        </div>
        <div
          v-for="item in group.items"
          :key="item.id"
          class="sb-item"
          :class="{ active: $route.name === item.id || $route.path === `/${item.id}` || (item.id === 'dashboard' && $route.path === '/') }"
          :title="collapsed ? item.label : ''"
          @click="$emit('navigate', item.id)"
        >
          <i class="ph" :class="item.icon"></i>
          <template v-if="!collapsed">
            <span class="sb-item-label">{{ item.label }}</span>
            <span v-if="item.badge != null" class="sb-badge" :class="item.type || ''">
              {{ item.badge }}
            </span>
          </template>
        </div>
      </div>
    </nav>

    <div v-if="!collapsed" class="sb-user">
      <div
        class="avatar"
        :style="{ width: '30px', height: '30px', fontSize: '12px', borderRadius: '6px' }"
      >
        {{ getInitials(MOCK.user.name) }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="sb-user-name truncate">{{ MOCK.user.name }}</div>
        <div class="sb-user-role">{{ MOCK.user.role.replace('_', ' ') }}</div>
      </div>
      <i class="ph ph-caret-up-down text-[var(--fg-3)] text-sm"></i>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useMockData } from '../composables/useMockData'
import Logo from './Logo.vue'

const props = defineProps({
  collapsed: Boolean
})

defineEmits(['navigate'])

const { MOCK } = useMockData()

const nav = computed(() => [
  {
    group: 'main',
    items: [
      { id: 'dashboard', icon: 'ph-house', label: 'Dashboard' },
    ]
  },
  {
    group: 'Queues',
    items: [
      { id: 'vetting', icon: 'ph-eye', label: 'Vetting', badge: MOCK.queues.vetting, type: 'attn' },
      { id: 'fraud', icon: 'ph-shield-warning', label: 'Fraud', badge: MOCK.queues.fraud, type: 'alert' },
      { id: 'payouts', icon: 'ph-bank', label: 'Payouts', badge: MOCK.queues.payouts, type: 'attn' },
      { id: 'support', icon: 'ph-chat-centered-dots', label: 'Support', badge: MOCK.queues.support, type: 'attn' },
    ]
  },
  {
    group: 'Inventory',
    items: [
      { id: 'hosts', icon: 'ph-storefront', label: 'Hosts' },
      { id: 'screens', icon: 'ph-monitor', label: 'Screens' },
      { id: 'advertisers', icon: 'ph-megaphone', label: 'Advertisers' },
      { id: 'campaigns', icon: 'ph-flag', label: 'Campaigns' },
    ]
  },
  {
    group: 'Operations',
    items: [
      { id: 'audit', icon: 'ph-scroll', label: 'Audit log' },
      { id: 'compliance', icon: 'ph-gavel', label: 'Tax & Compliance' },
    ]
  },
  {
    group: 'Configuration',
    items: [
      { id: 'admins', icon: 'ph-users-three', label: 'Admin users' },
      { id: 'settings', icon: 'ph-gear-six', label: 'Settings' },
    ]
  },
])

const getInitials = (name) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
</script>
