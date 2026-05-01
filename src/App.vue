<template>
  <!-- Auth-screen layout: centered card, no shell. -->
  <template v-if="$route.name === 'auth' || !auth.isAuthenticated">
    <div class="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-[1000]">
      <router-view />
    </div>
  </template>

  <!-- Authenticated shell -->
  <template v-else>
    <div
      class="app-shell"
      :class="{ collapsed }"
    >
      <Sidebar
        :collapsed="collapsed"
        @navigate="handleNavigate"
      />

      <Topbar
        :theme="theme"
        @toggle-theme="toggleTheme"
        @toggle-sidebar="toggleSidebar"
        @open-cmdk="openCmdk"
        @logout="handleLogout"
      />

      <div class="page">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </div>
    </div>

    <CmdK v-if="showCmdk" @close="closeCmdk" />

    <DrawerCreativeReview
      v-if="reviewCreative"
      :creative="reviewCreative"
      @close="reviewCreative = null"
    />

    <DrawerPayout
      v-if="payoutDetail"
      :payout="payoutDetail"
      @close="payoutDetail = null"
    />

    <ReauthModal />
  </template>

  <ToastHost />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import CmdK from './components/CmdK.vue'
import DrawerCreativeReview from './components/DrawerCreativeReview.vue'
import DrawerPayout from './components/DrawerPayout.vue'
import ToastHost from './components/ToastHost.vue'
import ReauthModal from './components/ReauthModal.vue'
import { useAuthStore } from './stores/auth'
import { useLogout } from './composables/useLogout'

const router = useRouter()
const auth = useAuthStore()
const { logout } = useLogout()

const theme = ref(localStorage.getItem('mimu-admin-theme') || 'light')
const collapsed = ref(false)
const showCmdk = ref(false)
const reviewCreative = ref(null)
const payoutDetail = ref(null)
const seq = ref('')

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('mimu-admin-theme', theme.value)
}

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const openCmdk = () => {
  showCmdk.value = true
}

const closeCmdk = () => {
  showCmdk.value = false
}

const handleNavigate = (page) => {
  router.push(`/${page === 'dashboard' ? '' : page}`)
}

// Single source of truth for "user signed out" — see useLogout.
// The Topbar emits this; the Settings page calls the same composable.
const handleLogout = () => logout()

// Global keyboard shortcuts.
const handleKeydown = (e) => {
  const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)

  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showCmdk.value = true
    return
  }

  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault()
    toggleTheme()
    return
  }

  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    router.push('/shortcuts')
    return
  }

  if (e.key === 'Escape') {
    if (showCmdk.value) showCmdk.value = false
    else if (reviewCreative.value) reviewCreative.value = null
    else if (payoutDetail.value) payoutDetail.value = null
    return
  }

  if (inInput || showCmdk.value) return

  if (e.key === 'g') {
    seq.value = 'g'
    setTimeout(() => { seq.value = '' }, 900)
    return
  }

  if (seq.value === 'g') {
    const map = {
      h: '',
      v: 'vetting',
      p: 'payouts',
      f: 'fraud',
      t: 'support',
      s: 'screens',
      a: 'advertisers'
    }
    if (map[e.key] !== undefined) {
      router.push(`/${map[e.key]}`)
      seq.value = ''
    }
  }
}

// Session heartbeat: re-verify /me every 60s while the tab is visible
// and the admin is signed in. Catches server-side revocation (admin
// account disabled, password change, manual session kill) early —
// without it, the user only finds out when they click something. Also
// re-verifies on visibilitychange so coming back to a long-idle tab
// doesn't show stale state.
const HEARTBEAT_INTERVAL_MS = 60_000
let heartbeatTimer = null

const beat = () => {
  if (document.hidden) return
  if (!auth.isAuthenticated) return
  // Skip if we just verified — guards against tab-flip storms.
  if (auth.lastVerifiedAt) {
    const ageMs = Date.now() - new Date(auth.lastVerifiedAt).getTime()
    if (ageMs < HEARTBEAT_INTERVAL_MS - 1_000) return
  }
  // Errors are handled inside `bootstrap` (it flips status on
  // terminal codes and ignores transient ones), so no try/catch here.
  auth.bootstrap()
}

const handleVisibility = () => {
  if (!document.hidden) beat()
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('visibilitychange', handleVisibility)
  heartbeatTimer = setInterval(beat, HEARTBEAT_INTERVAL_MS)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('visibilitychange', handleVisibility)
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
})
</script>

<style>
#app {
  @apply h-full;
}
</style>
