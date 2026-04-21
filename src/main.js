import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/styles/main.css'

// Import views
import Dashboard from './views/Dashboard.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/vetting', name: 'vetting', component: () => import('./views/Vetting.vue') },
  { path: '/hosts', name: 'hosts', component: () => import('./views/Hosts.vue') },
  { path: '/host-invite', name: 'host-invite', component: () => import('./views/HostInvite.vue') },
  { path: '/screens', name: 'screens', component: () => import('./views/Screens.vue') },
  { path: '/screen-detail', name: 'screen-detail', component: () => import('./views/ScreenDetail.vue') },
  { path: '/payouts', name: 'payouts', component: () => import('./views/Payouts.vue') },
  { path: '/fraud', name: 'fraud', component: () => import('./views/Fraud.vue') },
  { path: '/fraud-evidence', name: 'fraud-evidence', component: () => import('./views/FraudEvidence.vue') },
  { path: '/support', name: 'support', component: () => import('./views/Support.vue') },
  { path: '/ticket-detail', name: 'ticket-detail', component: () => import('./views/TicketDetail.vue') },
  { path: '/advertisers', name: 'advertisers', component: () => import('./views/Advertisers.vue') },
  { path: '/advertiser-detail', name: 'advertiser-detail', component: () => import('./views/AdvertiserDetail.vue') },
  { path: '/campaigns', name: 'campaigns', component: () => import('./views/Campaigns.vue') },
  { path: '/audit', name: 'audit', component: () => import('./views/Audit.vue') },
  { path: '/compliance', name: 'compliance', component: () => import('./views/Compliance.vue') },
  { path: '/admins', name: 'admins', component: () => import('./views/AdminUsers.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
  { path: '/shortcuts', name: 'shortcuts', component: () => import('./views/Shortcuts.vue') },
  { path: '/components', name: 'components', component: () => import('./views/Components.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
