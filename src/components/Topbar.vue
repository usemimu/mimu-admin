<template>
  <div class="topbar">
    <button class="tb-btn" @click="$emit('toggle-sidebar')" title="Toggle sidebar">
      <i class="ph ph-sidebar-simple"></i>
    </button>

    <div class="tb-search" @click="$emit('open-cmdk')">
      <i class="ph ph-magnifying-glass"></i>
      <span class="tb-search-flex">Search hosts, screens, advertisers, actions…</span>
      <span class="flex items-center gap-0.5">
        <span class="kbd">⌘</span>
        <span class="kbd">K</span>
      </span>
    </div>

    <div class="tb-right">
      <button class="tb-btn" @click="$emit('toggle-theme')" title="Toggle theme">
        <i class="ph" :class="theme === 'dark' ? 'ph-sun' : 'ph-moon'"></i>
      </button>

      <button class="tb-btn" title="Notifications">
        <i class="ph ph-bell"></i>
        <span class="dot"></span>
      </button>

      <div class="w-px h-5 bg-[var(--border)] mx-1"></div>

      <button class="tb-btn" title="Keyboard shortcuts (⌘/)">
        <i class="ph ph-keyboard"></i>
      </button>

      <div class="relative">
        <div class="flex items-center gap-2 px-1.5 cursor-pointer hover:bg-[var(--bg-hover)] rounded" @click="showProfileMenu = !showProfileMenu">
          <div
            class="avatar"
            :style="{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }"
          >
            {{ getInitials(MOCK.user.name) }}
          </div>
          <i class="ph ph-caret-down text-xs text-[var(--fg-3)]"></i>
        </div>

        <!-- Profile dropdown -->
        <div
          v-if="showProfileMenu"
          @click.stop
          class="absolute right-0 top-full mt-1 w-56 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg shadow-lg z-50"
        >
          <div class="p-3 border-b border-[var(--border)]">
            <div class="font-semibold text-sm">{{ MOCK.user.name }}</div>
            <div class="text-xs text-[var(--fg-3)]">{{ MOCK.user.email }}</div>
            <div class="pill pill-neutral sm mt-1">{{ MOCK.user.role.replace('_', ' ') }}</div>
          </div>
          <div class="p-1">
            <button class="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] rounded flex items-center gap-2 text-sm" @click="navigateToSettings">
              <i class="ph ph-gear-six"></i> Settings
            </button>
            <button class="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] rounded flex items-center gap-2 text-sm" @click="navigateToProfile">
              <i class="ph ph-user"></i> Profile
            </button>
          </div>
          <div class="p-1 border-t border-[var(--border)]">
            <button class="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] rounded flex items-center gap-2 text-sm text-danger-500" @click="handleLogout">
              <i class="ph ph-sign-out"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Overlay to close dropdown -->
  <div v-if="showProfileMenu" @click="showProfileMenu = false" class="fixed inset-0 z-40"></div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMockData } from '../composables/useMockData'

const router = useRouter()

defineProps({
  theme: String
})

const emit = defineEmits(['toggle-theme', 'toggle-sidebar', 'open-cmdk', 'logout'])

const { MOCK } = useMockData()

const showProfileMenu = ref(false)

const getInitials = (name) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const navigateToSettings = () => {
  showProfileMenu.value = false
  router.push('/settings')
}

const navigateToProfile = () => {
  showProfileMenu.value = false
  // Profile page not implemented yet
}

const handleLogout = () => {
  showProfileMenu.value = false
  emit('logout')
}
</script>
