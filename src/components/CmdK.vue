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
import { useMockData } from '../composables/useMockData'

const emit = defineEmits(['close'])
const router = useRouter()
const { MOCK } = useMockData()

const query = ref('')
const focused = ref(0)
const searchInput = ref(null)

// Build searchable items
const allItems = computed(() => {
  const items = []

  // Pages
  items.push(
    { type: 'page', title: 'Dashboard', subtitle: 'Operations overview', icon: 'ph-house', route: '/' },
    { type: 'page', title: 'Vetting Queue', subtitle: MOCK.queues.vetting + ' pending', icon: 'ph-eye', route: '/vetting', badge: MOCK.queues.vetting },
    { type: 'page', title: 'Fraud Review', subtitle: MOCK.queues.fraud + ' open', icon: 'ph-shield-warning', route: '/fraud', badge: MOCK.queues.fraud, color: 'var(--danger-500)' },
    { type: 'page', title: 'Payouts', subtitle: MOCK.queues.payouts + ' pending', icon: 'ph-bank', route: '/payouts', badge: MOCK.queues.payouts },
    { type: 'page', title: 'Support Inbox', subtitle: MOCK.queues.support + ' open', icon: 'ph-chat-centered-dots', route: '/support', badge: MOCK.queues.support },
    { type: 'page', title: 'Hosts', subtitle: 'Host management', icon: 'ph-storefront', route: '/hosts' },
    { type: 'page', title: 'Screens', subtitle: 'Screen inventory', icon: 'ph-monitor', route: '/screens' },
    { type: 'page', title: 'Advertisers', subtitle: 'Advertiser management', icon: 'ph-megaphone', route: '/advertisers' },
    { type: 'page', title: 'Audit Log', subtitle: 'Activity history', icon: 'ph-scroll', route: '/audit' }
  )

  // Hosts
  MOCK.hosts.forEach(host => {
    items.push({
      type: 'host',
      title: host.name,
      subtitle: host.lga + ' · ' + host.cat + ' · ' + host.id,
      icon: 'ph-storefront',
      route: '/hosts',
      searchTerms: host.name + ' ' + host.lga + ' ' + host.cat + ' ' + host.id
    })
  })

  // Advertisers
  MOCK.advertisers.forEach(adv => {
    items.push({
      type: 'advertiser',
      title: adv.name,
      subtitle: adv.lga + ' · ' + adv.cat + ' · ' + adv.id,
      icon: 'ph-megaphone',
      route: '/advertisers',
      searchTerms: adv.name + ' ' + adv.lga + ' ' + adv.cat + ' ' + adv.id
    })
  })

  // Screens
  MOCK.screens.forEach(screen => {
    items.push({
      type: 'screen',
      title: screen.id,
      subtitle: screen.host + ' · ' + screen.lga,
      icon: 'ph-monitor',
      route: '/screens',
      searchTerms: screen.id + ' ' + screen.host + ' ' + screen.lga
    })
  })

  return items
})

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
