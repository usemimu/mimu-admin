<template>
  <div class="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="modal md" @click.stop>
      <div class="p-4 border-b border-[var(--border)]">
        <div class="flex items-center gap-2">
          <i class="ph ph-magnifying-glass text-[var(--fg-3)]"></i>
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            class="flex-1 bg-transparent border-0 outline-none text-[15px] text-[var(--fg)]"
            placeholder="Search hosts, screens, advertisers, actions…"
            @keydown.down.prevent="focusNext"
            @keydown.up.prevent="focusPrev"
            @keydown.enter.prevent="selectCurrent"
            @keydown.esc="$emit('close')"
          />
          <span class="kbd text-[10px]">esc</span>
        </div>
      </div>

      <div class="max-h-[400px] overflow-y-auto">
        <div v-if="filteredResults.length === 0" class="p-8 text-center text-[var(--fg-3)]">
          No results found
        </div>

        <div v-else>
          <div
            v-for="(item, i) in filteredResults"
            :key="i"
            class="flex items-center gap-3 p-3 cursor-pointer border-b border-[var(--border)] hover:bg-[var(--bg-hover)]"
            :class="{ 'bg-[var(--bg-active)]': i === focused }"
            @click="select(item)"
            @mouseenter="focused = i"
          >
            <i class="ph text-base" :class="item.icon" :style="{ color: item.color || 'var(--fg-2)' }"></i>
            <div class="flex-1">
              <div class="text-[13px] font-medium text-[var(--fg)]">{{ item.title }}</div>
              <div v-if="item.subtitle" class="text-[11px] text-[var(--fg-3)]">{{ item.subtitle }}</div>
            </div>
            <span v-if="item.badge" class="pill pill-neutral sm">{{ item.badge }}</span>
          </div>
        </div>
      </div>

      <div class="p-3 bg-[var(--bg-sunken)] border-t border-[var(--border)] flex items-center gap-4 text-[11px] text-[var(--fg-3)]">
        <span><span class="kbd">↑</span> <span class="kbd">↓</span> navigate</span>
        <span><span class="kbd">enter</span> select</span>
        <span><span class="kbd">esc</span> close</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQueueDepths } from '../composables/useQueueDepths'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'

const emit = defineEmits(['close'])
const router = useRouter()

// Real-time queue counts shared with the Sidebar/Dashboard. The
// palette is only opened from authenticated views, so polling is
// already paid for elsewhere — just read the same cache.
const me = useCurrentAdmin()
const { counts: queueCounts } = useQueueDepths({ enabled: me.isAuthenticated })

const query = ref('')
const focused = ref(0)
const searchInput = ref(null)

// Page-level navigation only. Entity search (a specific host, screen
// or advertiser) routes the user to the relevant list view where the
// real filter UI lives — we don't pre-fetch the entire inventory
// just to power a quick-jump palette.
const PAGES = computed(() => {
  const c = queueCounts.value
  return [
    { title: 'Dashboard', subtitle: 'Operations overview', icon: 'ph-house', route: '/' },
    { title: 'Vetting queue', subtitle: countLabel(c.vetting, 'creative'), icon: 'ph-eye', route: '/vetting', badge: c.vetting || null },
    { title: 'Fraud review', subtitle: countLabel(c.fraud, 'flag'), icon: 'ph-shield-warning', route: '/fraud', badge: c.fraud || null, color: c.fraud ? 'var(--danger-500)' : undefined },
    { title: 'Payouts', subtitle: countLabel(c.payouts, 'payout'), icon: 'ph-bank', route: '/payouts', badge: c.payouts || null },
    { title: 'Support inbox', subtitle: countLabel(c.support, 'ticket'), icon: 'ph-chat-centered-dots', route: '/support', badge: c.support || null },
    { title: 'Campaigns', subtitle: 'Campaign vetting + APCON', icon: 'ph-flag', route: '/campaigns' },
    { title: 'Hosts', subtitle: 'Host management', icon: 'ph-storefront', route: '/hosts' },
    { title: 'Screens', subtitle: 'Screen inventory', icon: 'ph-monitor', route: '/screens' },
    { title: 'Advertisers', subtitle: 'Advertiser management', icon: 'ph-megaphone', route: '/advertisers' },
    { title: 'Admin users', subtitle: 'Roles, invites, suspend', icon: 'ph-users-three', route: '/admins' },
    { title: 'Audit log', subtitle: 'Activity history', icon: 'ph-scroll', route: '/audit' },
    { title: 'Settings', subtitle: 'Account + preferences', icon: 'ph-gear-six', route: '/settings' },
  ].map((p) => ({ ...p, type: 'page', searchTerms: `${p.title} ${p.subtitle}` }))
})

function countLabel(n, noun) {
  const num = Number(n) || 0
  if (num === 0) return `No ${noun}s`
  return `${num.toLocaleString('en-NG')} ${noun}${num === 1 ? '' : 's'} pending`
}

const allItems = computed(() => PAGES.value)

const filteredResults = computed(() => {
  if (!query.value) return allItems.value.slice(0, 12)

  const q = query.value.toLowerCase()
  return allItems.value
    .filter(item => {
      const searchText = item.searchTerms || (item.title + ' ' + (item.subtitle || ''))
      return searchText.toLowerCase().includes(q)
    })
    .slice(0, 12)
})

const focusNext = () => {
  focused.value = Math.min(focused.value + 1, filteredResults.value.length - 1)
}

const focusPrev = () => {
  focused.value = Math.max(focused.value - 1, 0)
}

const selectCurrent = () => {
  if (filteredResults.value[focused.value]) {
    select(filteredResults.value[focused.value])
  }
}

const select = (item) => {
  router.push(item.route)
  emit('close')
}

onMounted(() => {
  nextTick(() => {
    searchInput.value?.focus()
  })
})
</script>
