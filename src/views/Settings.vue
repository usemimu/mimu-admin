<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Settings</div>
        <span class="fg2 text-xs">Account &amp; platform configuration</span>
      </div>
    </div>

    <div class="page-body">
      <div style="display: grid; grid-template-columns: 240px 1fr; gap: 16px;">
        <!-- Sidebar navigation -->
        <div class="card" style="height: fit-content;">
          <div
            v-for="section in sections"
            :key="section.id"
            class="p-3 cursor-pointer hover:bg-[var(--bg-hover)] flex items-center gap-2"
            :class="{ 'bg-[var(--bg-active)]': activeSection === section.id }"
            @click="activeSection = section.id"
          >
            <i class="ph" :class="section.icon"></i>
            <span class="font-medium text-sm">{{ section.label }}</span>
          </div>
        </div>

        <!-- Content area -->
        <div class="col" style="gap: 16px;">
          <!-- Account (read-only — live from /me via the auth store) -->
          <div v-if="activeSection === 'account'" class="card">
            <div class="card-head">
              <div class="card-title">Your admin session</div>
              <div class="spacer"></div>
              <span v-if="me.lastVerifiedAt.value" class="fg2 text-xs">
                Verified {{ formatRelative(me.lastVerifiedAt.value) }}
              </span>
            </div>
            <div class="card-body" style="display: grid; gap: 16px;">
              <div v-if="!me.user.value" class="fg2 text-sm">
                No active session — please sign in.
              </div>
              <div
                v-else
                style="display: grid; grid-template-columns: 140px 1fr; gap: 8px 16px;"
              >
                <span class="fg2 text-xs">Name</span>
                <span class="font-medium">{{ me.displayName.value }}</span>
                <span class="fg2 text-xs">Email</span>
                <span class="mono">{{ me.email.value }}</span>
                <span class="fg2 text-xs">Role</span>
                <span>
                  <span class="pill pill-neutral sm">{{ me.roleLabel.value || '—' }}</span>
                </span>
                <template v-if="me.user.value.adminUserId">
                  <span class="fg2 text-xs">Admin ID</span>
                  <span class="mono text-xs">{{ me.user.value.adminUserId }}</span>
                </template>
              </div>

              <div
                style="border-top: 1px solid var(--border); padding-top: 16px; display: flex; gap: 8px;"
              >
                <button
                  class="btn outline sm"
                  :disabled="reverifying"
                  @click="reverifySession"
                >
                  <i class="ph ph-arrow-clockwise"></i>
                  {{ reverifying ? 'Verifying…' : 'Refresh session' }}
                </button>
                <button class="btn outline sm" @click="logout">
                  <i class="ph ph-sign-out"></i> Sign out
                </button>
              </div>
            </div>
          </div>

          <!-- Notifications: live, per-admin -->
          <div v-else-if="activeSection === 'notifications'" class="card">
            <div class="card-head">
              <div class="card-title">Notification preferences</div>
              <div class="spacer"></div>
              <span v-if="prefsMutation.isPending.value" class="fg2 text-xs">Saving…</span>
              <span v-else-if="prefsQuery.isLoading.value" class="fg2 text-xs">Loading…</span>
              <span v-else class="fg2 text-xs">Per admin · auto-saves</span>
            </div>
            <div class="card-body" style="padding: 16px; display: grid; gap: 12px;">
              <div v-if="prefsQuery.error.value" style="color: var(--danger-500); font-size: 13px;">
                Failed to load preferences: {{ prefsQuery.error.value.message }}
              </div>
              <template v-else>
                <label
                  v-for="pref in prefsRows"
                  :key="pref.key"
                  class="flex ac"
                  style="gap: 10px; cursor: pointer; padding: 8px; border-radius: 6px;"
                  :class="{ 'opacity-50': prefsMutation.isPending.value }"
                >
                  <input
                    type="checkbox"
                    :checked="prefsLocal[pref.key]"
                    :disabled="prefsMutation.isPending.value || prefsQuery.isLoading.value"
                    @change="togglePref(pref.key, $event.target.checked)"
                  />
                  <div>
                    <div class="font-medium text-sm">{{ pref.label }}</div>
                    <div class="fg2 text-xs">{{ pref.help }}</div>
                  </div>
                </label>
              </template>
            </div>
          </div>

          <!-- Read-only / non-wired sections — clearly marked as backend-config -->
          <div v-else class="card">
            <div class="card-head">
              <div class="card-title">{{ currentSection.label }}</div>
              <div class="spacer"></div>
              <span class="pill pill-pending sm">Backend config</span>
            </div>
            <div class="card-body" style="padding: 16px;">
              <p class="fg2" style="margin: 0 0 12px; line-height: 1.5;">
                {{ currentSection.copy }}
              </p>
              <p class="fg2 text-xs" style="margin: 0;">
                Edit these via the API service's environment variables / config — the admin
                console doesn't expose write access yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { adminUsersApi } from '../api/admin-users'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { qk } from '../lib/queryKeys'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const qc = useQueryClient()

// Read directly from the auth store — no parallel /me call. The
// heartbeat in App.vue keeps `me.user` and `me.lastVerifiedAt` fresh.
const me = useCurrentAdmin()

function formatRelative(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  return `${hr}h ago`
}

const activeSection = ref('account')

const sections = [
  { id: 'account', label: 'Account', icon: 'ph-user' },
  {
    id: 'payments',
    label: 'Payments',
    icon: 'ph-currency-circle-dollar',
    copy: 'Paystack keys, WHT rate, payout schedule and minimum payout threshold are loaded from the API service env (PAYSTACK_*, WHT_RATE, PAYOUT_*).',
  },
  {
    id: 'apcon',
    label: 'APCON',
    icon: 'ph-shield-check',
    copy: 'APCON auto-approve categories and SLA are configured in the campaigns/creatives services. There is no UI surface to edit them yet.',
  },
  {
    id: 'fraud',
    label: 'Fraud detection',
    icon: 'ph-shield-warning',
    copy: 'Fraud thresholds (score cutoff, auto-hold trigger, CV confidence) live in the fraud service. They are tuned in code, not via the console.',
  },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bell' },
]

const currentSection = computed(() =>
  sections.find((s) => s.id === activeSection.value) ?? sections[0],
)

// ── Notification preferences ────────────────────────────────────────
const prefsRows = [
  {
    key: 'highFraudAlerts',
    label: 'High fraud score alerts',
    help: 'Notify me when a fraud flag with score ≥ 0.80 lands in the queue.',
  },
  {
    key: 'systemDowntime',
    label: 'System downtime',
    help: 'Outages or degraded health on Paystack, the API gateway, or worker queues.',
  },
  {
    key: 'slaBreach',
    label: 'SLA breach warnings',
    help: 'Tickets and vetting items that have breached their SLA window.',
  },
  {
    key: 'dailySummary',
    label: 'Daily summary digest',
    help: 'A once-a-day email with yesterday\'s queue activity and KPIs.',
  },
]

const prefsLocal = reactive({
  highFraudAlerts: true,
  systemDowntime: true,
  slaBreach: true,
  dailySummary: false,
})

const prefsQuery = useQuery({
  queryKey: qk.notificationPrefs(),
  queryFn: () => adminUsersApi.getMyPreferences(),
  retry: false,
})

// Sync the server response into the local mirror so the checkboxes
// reflect the persisted values without losing the optimistic update
// during a save.
watch(
  () => prefsQuery.data.value,
  (val) => {
    if (!val) return
    prefsLocal.highFraudAlerts = !!val.highFraudAlerts
    prefsLocal.systemDowntime = !!val.systemDowntime
    prefsLocal.slaBreach = !!val.slaBreach
    prefsLocal.dailySummary = !!val.dailySummary
  },
  { immediate: true },
)

const prefsMutation = useMutation({
  mutationFn: (patch) => adminUsersApi.updateMyPreferences(patch),
  onSuccess: (data) => {
    qc.setQueryData(qk.notificationPrefs(), data)
  },
  onError: (err, patch) => {
    // Revert the local checkbox if the save failed. The query data
    // already holds the server-truth value.
    const previous = prefsQuery.data.value
    if (previous) {
      Object.assign(prefsLocal, previous)
    }
    toast.error(err?.response?.data?.message || err?.message || 'Could not save preference.')
  },
})

function togglePref(key, value) {
  prefsLocal[key] = value
  prefsMutation.mutate({ [key]: value })
}

async function logout() {
  // Route through the store so cookie clear, state flip, and any
  // cross-tab listeners stay in sync. The store swallows network
  // failures on the remote logout call (best-effort).
  await auth.logout()
  toast.success('Signed out.')
  router.push('/auth')
}

const reverifying = ref(false)

/**
 * Manual heartbeat. The auto-heartbeat in App.vue runs every 60s and
 * on visibility-change, but admins occasionally want a force-refresh
 * after an ops change in another tool (role swap, suspend reversal).
 * Routing through `auth.bootstrap()` reuses the same logic the
 * heartbeat uses — single code path for "did /me succeed?".
 */
async function reverifySession() {
  reverifying.value = true
  try {
    const ok = await auth.bootstrap()
    if (ok) toast.success('Session refreshed.')
    else toast.warning('Session looks stale — try signing out and back in.')
  } finally {
    reverifying.value = false
  }
}
</script>
