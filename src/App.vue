<template>
  <!-- Loading splash -->
  <div v-if="loading" class="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-[1000]">
    <Logo :size="120" />
  </div>

  <!-- Auth flow -->
  <div v-else-if="!isAuthenticated" class="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-[1000]">
    <PageAuth :flow="authFlow" @auth-complete="handleAuthComplete" />
  </div>

  <!-- Main app -->
  <div v-else>
    <!-- Main shell -->
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
          <component :is="Component" @toast="toast" />
        </router-view>
      </div>
    </div>

    <!-- Command palette -->
    <CmdK v-if="showCmdk" @close="closeCmdk" />

    <!-- Drawers and modals -->
    <DrawerCreativeReview
      v-if="reviewCreative"
      :creative="reviewCreative"
      @close="reviewCreative = null"
      @toast="toast"
    />

    <DrawerPayout
      v-if="payoutDetail"
      :payout="payoutDetail"
      @close="payoutDetail = null"
      @toast="toast"
      @approve="showTOTP = true"
    />

    <TOTPModal
      v-if="showTOTP"
      @close="showTOTP = false"
      @confirm="handleTOTPConfirm"
    />

    <!-- Toast notifications -->
    <ToastHost :toasts="toasts" @dismiss="dismissToast" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMockData } from './composables/useMockData'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import CmdK from './components/CmdK.vue'
import DrawerCreativeReview from './components/DrawerCreativeReview.vue'
import DrawerPayout from './components/DrawerPayout.vue'
import TOTPModal from './components/TOTPModal.vue'
import ToastHost from './components/ToastHost.vue'
import PageAuth from './views/Auth.vue'
import Logo from './components/Logo.vue'

const { MOCK } = useMockData()
const router = useRouter()

// State
const loading = ref(true)
const isAuthenticated = ref(false)
const authFlow = ref('login')
const theme = ref(localStorage.getItem('mimu-admin-theme') || 'light')
const collapsed = ref(false)
const showCmdk = ref(false)
const toasts = ref([])
const reviewCreative = ref(null)
const payoutDetail = ref(null)
const showTOTP = ref(false)
const seq = ref('')

// Theme management
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

// Toast management
const toast = (config) => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, ...config })
  if (config.kind !== 'error') {
    setTimeout(() => {
      dismissToast(id)
    }, 4000)
  }
}

const dismissToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

const handleNavigate = (page) => {
  router.push(`/${page === 'dashboard' ? '' : page}`)
}

const handleTOTPConfirm = () => {
  showTOTP.value = false
  payoutDetail.value = null
  toast({
    kind: 'success',
    title: 'Payout approved',
    body: 'Paystack Transfer initiated. Audit entry logged.'
  })
}

const handleAuthComplete = () => {
  isAuthenticated.value = true
  router.push('/')
}

const handleLogout = () => {
  isAuthenticated.value = false
  authFlow.value = 'login'
  router.push('/')
}

// Global keyboard shortcuts
const handleKeydown = (e) => {
  const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)

  // ⌘K
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showCmdk.value = true
    return
  }

  // ⌘⇧D
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault()
    toggleTheme()
    return
  }

  // ⌘/
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    router.push('/shortcuts')
    return
  }

  // Escape
  if (e.key === 'Escape') {
    if (showCmdk.value) showCmdk.value = false
    else if (reviewCreative.value) reviewCreative.value = null
    else if (payoutDetail.value) payoutDetail.value = null
    else if (showTOTP.value) showTOTP.value = false
    return
  }

  if (inInput || showCmdk.value) return

  // G-sequence navigation
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

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  window.addEventListener('keydown', handleKeydown)

  // Simulate loading delay
  setTimeout(() => {
    loading.value = false
  }, 1500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
#app {
  @apply h-full;
}
</style>
