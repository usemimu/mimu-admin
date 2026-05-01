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

          <!-- Security · 2FA — live, lets the admin regenerate their
               TOTP secret + backup codes. Backend resets `totp_enrolled`
               on re-enroll, so the flow is: enroll → show QR/secret/codes
               → verify a code from the new authenticator → done.
               -->
          <div v-else-if="activeSection === 'security'" class="card">
            <div class="card-head">
              <div class="card-title">Two-factor authentication</div>
              <div class="spacer"></div>
              <span class="pill pill-active sm">
                <i class="ph ph-shield-check"></i> enrolled
              </span>
            </div>
            <div class="card-body" style="padding: 16px;">
              <p class="fg2 text-sm" style="margin: 0 0 14px;">
                Your account is protected by an authenticator app. You can
                regenerate the secret + backup codes at any time — this
                <strong>invalidates the old codes</strong>, so don't close this
                page until you've verified the new code.
              </p>

              <!-- Step 0: idle -->
              <div v-if="totpStep === 'idle'">
                <button
                  class="btn outline sm"
                  @click="startReenroll"
                  :disabled="enrollMutation.isPending.value"
                >
                  <i class="ph ph-arrows-clockwise"></i>
                  {{ enrollMutation.isPending.value ? 'Generating…' : 'Regenerate 2FA' }}
                </button>
              </div>

              <!-- Step 1: enrollment generated, show QR + codes + verify input -->
              <div v-else-if="totpStep === 'verify' && enrollData" style="display: grid; gap: 14px;">
                <div class="totp-grid">
                  <div>
                    <div class="totp-label">Scan with authenticator</div>
                    <img v-if="enrollData.qrCodeDataUrl" :src="enrollData.qrCodeDataUrl" class="totp-qr" alt="TOTP QR" />
                  </div>
                  <div>
                    <div class="totp-label">Or paste this secret manually</div>
                    <code class="totp-secret">{{ enrollData.secret }}</code>
                    <div class="totp-label" style="margin-top: 14px;">Backup codes (one-time use)</div>
                    <div class="totp-backup">
                      <code v-for="c in enrollData.backupCodes" :key="c">{{ c }}</code>
                    </div>
                    <button
                      class="btn ghost xs"
                      style="margin-top: 6px;"
                      @click="copyBackupCodes"
                    >
                      <i class="ph ph-copy"></i> Copy codes
                    </button>
                  </div>
                </div>

                <div style="border-top: 1px solid var(--border); padding-top: 14px;">
                  <label class="text-xs fg2 block mb-1">
                    Enter the 6-digit code from your authenticator to confirm
                  </label>
                  <div class="flex" style="gap: 8px;">
                    <input
                      v-model="totpCode"
                      class="input"
                      maxlength="6"
                      placeholder="123456"
                      style="width: 140px; font-family: var(--f-mono); letter-spacing: 0.2em; text-align: center;"
                      @keyup.enter="confirmReenroll"
                    />
                    <button
                      class="btn primary sm"
                      :disabled="totpCode.length !== 6 || verifyMutation.isPending.value"
                      @click="confirmReenroll"
                    >
                      {{ verifyMutation.isPending.value ? 'Verifying…' : 'Confirm' }}
                    </button>
                    <button class="btn ghost sm" @click="cancelReenroll">Cancel</button>
                  </div>
                  <p class="fg2 text-xs" style="margin: 8px 0 0;">
                    If you cancel before confirming, your old code stops working.
                    You'll need to sign out and re-enroll on next login.
                  </p>
                </div>
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

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import { adminUsersApi } from '../api/admin-users'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { useLogout } from '../composables/useLogout'
import { qk } from '../lib/queryKeys'

const auth = useAuthStore()
const toast = useToastStore()
const qc = useQueryClient()
// Same logout flow App.vue's Topbar dropdown uses — clears query
// cache, replaces history, toasts, redirects. One code path for all
// signout surfaces.
const { logout } = useLogout()

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
  { id: 'security', label: 'Security · 2FA', icon: 'ph-shield-check' },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bell' },
]

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

// `logout` comes from the useLogout() import above — single shared
// flow across the app (clears query cache, history-replaces to /auth,
// toasts). The Sign-out button on this page binds @click="logout".

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

// ── 2FA re-enrollment ────────────────────────────────────────────────
// Three-step flow shared with the initial-setup screen:
//   idle → click "Regenerate" → enroll endpoint returns { secret, qr,
//   backupCodes } and we move to `verify`. The user scans + types the
//   code from their authenticator. Verify endpoint promotes the new
//   secret to active. Cancelling mid-flow is destructive (the old
//   secret has already been replaced server-side) — the help text
//   explains it.
const totpStep = ref('idle') // 'idle' | 'verify'
const enrollData = ref(null)
const totpCode = ref('')

const enrollMutation = useMutation({
  mutationFn: () => authApi.enrollTotp(),
  onSuccess: (data) => {
    enrollData.value = data
    totpStep.value = 'verify'
    totpCode.value = ''
  },
  onError: (err) => {
    toast.error(err?.message || 'Could not start re-enrollment.')
  },
})

const verifyMutation = useMutation({
  mutationFn: (code) => authApi.verifyTotpEnrollment(code),
  onSuccess: () => {
    toast.success('2FA regenerated. Old codes no longer work.')
    enrollData.value = null
    totpCode.value = ''
    totpStep.value = 'idle'
  },
  onError: (err) => {
    toast.error(err?.message || 'Code did not verify — try again.')
  },
})

function startReenroll() {
  if (!confirm('Regenerate 2FA? Your current secret + backup codes will stop working immediately.')) return
  enrollMutation.mutate()
}

function confirmReenroll() {
  if (totpCode.value.length !== 6) return
  verifyMutation.mutate(totpCode.value)
}

function cancelReenroll() {
  // Server-side the new secret has already replaced the old one. We
  // can't undo that — best we can do is surface the implication.
  enrollData.value = null
  totpCode.value = ''
  totpStep.value = 'idle'
  toast.warning('Re-enrollment cancelled. Your old codes have been invalidated — sign out and back in to start over.')
}

async function copyBackupCodes() {
  if (!enrollData.value?.backupCodes?.length) return
  try {
    await navigator.clipboard.writeText(enrollData.value.backupCodes.join('\n'))
    toast.success('Backup codes copied.')
  } catch {
    toast.error('Clipboard unavailable — copy them manually.')
  }
}
</script>

<style scoped>
.totp-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: start;
}
.totp-label {
  font-size: 11px;
  color: var(--fg-3);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.totp-qr {
  width: 200px;
  height: 200px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: white;
  padding: 6px;
}
.totp-secret {
  display: inline-block;
  font-family: var(--f-mono);
  font-size: 12px;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  padding: 6px 8px;
  border-radius: 4px;
  word-break: break-all;
}
.totp-backup {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  font-family: var(--f-mono);
  font-size: 11px;
}
.totp-backup code {
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  padding: 4px 6px;
  border-radius: 3px;
  text-align: center;
}
</style>
