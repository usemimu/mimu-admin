import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

import App from './App.vue'
import './assets/styles/main.css'

import {
  setUnauthenticatedHandler,
  setForbiddenHandler,
  setReauthRequiredHandler,
} from './lib/http'
import { useAuthStore } from './stores/auth'
import { useToastStore } from './stores/toast'

import Dashboard from './views/Dashboard.vue'

const routes = [
  // Public auth route — Google OAuth lands the browser back here, and the
  // view inspects the URL for partial-session signals.
  { path: '/auth', name: 'auth', component: () => import('./views/Auth.vue'), meta: { guestOnly: true } },

  { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/vetting', name: 'vetting', component: () => import('./views/Vetting.vue'), meta: { requiresAuth: true } },
  { path: '/hosts', name: 'hosts', component: () => import('./views/Hosts.vue'), meta: { requiresAuth: true } },
  { path: '/host-invite', name: 'host-invite', component: () => import('./views/HostInvite.vue'), meta: { requiresAuth: true } },
  { path: '/screens', name: 'screens', component: () => import('./views/Screens.vue'), meta: { requiresAuth: true } },
  { path: '/screen-detail', name: 'screen-detail', component: () => import('./views/ScreenDetail.vue'), meta: { requiresAuth: true } },
  { path: '/payouts', name: 'payouts', component: () => import('./views/Payouts.vue'), meta: { requiresAuth: true } },
  { path: '/fraud', name: 'fraud', component: () => import('./views/Fraud.vue'), meta: { requiresAuth: true } },
  { path: '/fraud-evidence', name: 'fraud-evidence', component: () => import('./views/FraudEvidence.vue'), meta: { requiresAuth: true } },
  { path: '/support', name: 'support', component: () => import('./views/Support.vue'), meta: { requiresAuth: true } },
  { path: '/ticket-detail', name: 'ticket-detail', component: () => import('./views/TicketDetail.vue'), meta: { requiresAuth: true } },
  { path: '/advertisers', name: 'advertisers', component: () => import('./views/Advertisers.vue'), meta: { requiresAuth: true } },
  { path: '/advertiser-detail', name: 'advertiser-detail', component: () => import('./views/AdvertiserDetail.vue'), meta: { requiresAuth: true } },
  { path: '/campaigns', name: 'campaigns', component: () => import('./views/Campaigns.vue'), meta: { requiresAuth: true } },
  { path: '/audit', name: 'audit', component: () => import('./views/Audit.vue'), meta: { requiresAuth: true } },
  { path: '/compliance', name: 'compliance', component: () => import('./views/Compliance.vue'), meta: { requiresAuth: true } },
  { path: '/admins', name: 'admins', component: () => import('./views/AdminUsers.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue'), meta: { requiresAuth: true } },
  { path: '/shortcuts', name: 'shortcuts', component: () => import('./views/Shortcuts.vue'), meta: { requiresAuth: true } },
  { path: '/components', name: 'components', component: () => import('./views/Components.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Admin queues (fraud, payouts pending, vetting) are time-sensitive.
      // Keep stale-time short so navigating back shows fresh counts.
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
})
app.use(VueQueryPlugin, { queryClient })

const auth = useAuthStore()
const toast = useToastStore()

// 401 → boot to /auth. Don't redirect-loop if we're already there.
setUnauthenticatedHandler(() => {
  auth.forceSignOut()
  if (router.currentRoute.value.name !== 'auth') {
    router.replace({ name: 'auth' })
  }
})

setForbiddenHandler(() => {
  toast.error("You don't have permission to perform this action.")
})

// 403 + REAUTH_REQUIRED → queue the original request and surface a TOTP modal.
// The modal lives in App.vue (Stage 2 wires it); for now we queue the
// request and show a placeholder toast so it's visible during dev.
setReauthRequiredHandler((originalRequest) => {
  auth.queueReauth(originalRequest)
  toast.error('This action requires re-authentication. Open the TOTP prompt to continue.')
})

// Bootstrap auth before mounting so the route guard has a real status.
auth.bootstrap().finally(() => {
  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'auth', query: { redirect: to.fullPath } }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
  })

  app.use(router)
  app.mount('#app')
})
