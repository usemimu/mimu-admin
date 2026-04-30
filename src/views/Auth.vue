<template>
  <div class="auth-shell">
    <div style="width: 400px">
      <!-- LOGIN: Google OAuth start -->
      <div v-if="step === 'login'">
        <div style="text-align: center; margin-bottom: 32px">
          <div style="display: inline-flex; align-items: center; gap: 12px">
            <Logo :size="80" />
          </div>
          <div class="auth-eyebrow">Admin Console</div>
        </div>
        <div class="card raised" style="padding: 28px">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px">Sign in</div>
          <div class="fg2" style="font-size: 12px; margin-bottom: 20px">
            Restricted to staff with @mimu accounts.
          </div>
          <button
            class="btn outline"
            style="width: 100%; padding: 10px; justify-content: center; gap: 10px"
            @click="auth.signInWithGoogle()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      <!-- TOTP enrollment (first-time) -->
      <div v-else-if="step === 'enroll'">
        <div style="text-align: center; margin-bottom: 24px">
          <Logo :size="32" />
          <div class="auth-eyebrow">Admin Console</div>
        </div>
        <div class="card raised" style="padding: 28px">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px">Set up two-factor</div>
          <div class="fg2" style="font-size: 12px; margin-bottom: 16px">
            Scan this QR code with your authenticator app, then enter the 6-digit code below.
          </div>
          <div
            v-if="enrollData?.qrCodeDataUrl"
            style="display: flex; justify-content: center; margin-bottom: 16px"
          >
            <img
              :src="enrollData.qrCodeDataUrl"
              alt="TOTP QR code"
              style="width: 180px; height: 180px; background: #fff; padding: 8px; border-radius: 8px"
            />
          </div>
          <div v-if="enrollData?.secret" class="fg2" style="font-size: 11px; text-align: center; margin-bottom: 16px; font-family: var(--f-mono)">
            Or paste the secret manually:
            <div style="font-size: 13px; color: var(--fg); margin-top: 4px; letter-spacing: 0.05em">
              {{ enrollData.secret }}
            </div>
          </div>

          <input
            v-model="code"
            class="input"
            style="width: 100%; text-align: center; font-size: 22px; font-family: var(--f-mono); letter-spacing: 0.5em; padding: 12px"
            placeholder="000000"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
          />

          <button
            class="btn primary"
            style="width: 100%; padding: 10px; margin-top: 16px"
            :disabled="busy || code.length !== 6"
            @click="completeEnrollment"
          >
            {{ busy ? 'Verifying…' : 'Verify & finish setup' }}
          </button>

          <div v-if="enrollData?.backupCodes?.length" style="margin-top: 16px; font-size: 11px">
            <div class="fg2" style="margin-bottom: 4px">Save your backup codes — you won't see them again:</div>
            <div style="font-family: var(--f-mono); display: grid; grid-template-columns: 1fr 1fr; gap: 4px">
              <div v-for="bc in enrollData.backupCodes" :key="bc">{{ bc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TOTP verify (returning admin) -->
      <div v-else-if="step === 'verify'">
        <div style="text-align: center; margin-bottom: 24px">
          <Logo :size="32" />
          <div class="auth-eyebrow">Admin Console</div>
        </div>
        <div class="card raised" style="padding: 28px">
          <div class="flex ac g8" style="margin-bottom: 4px">
            <i class="ph ph-shield-check" style="font-size: 18px; color: var(--moss-500)"></i>
            <div style="font-size: 16px; font-weight: 700">Two-factor verification</div>
          </div>
          <div class="fg2" style="font-size: 12px; margin-bottom: 20px">
            Enter the 6-digit code from your authenticator app.
          </div>
          <input
            v-model="code"
            class="input"
            style="width: 100%; text-align: center; font-size: 22px; font-family: var(--f-mono); letter-spacing: 0.5em; padding: 12px"
            placeholder="000000"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
          />
          <button
            class="btn primary"
            style="width: 100%; padding: 10px; margin-top: 16px"
            :disabled="busy || code.length !== 6"
            @click="verifyLogin"
          >
            {{ busy ? 'Verifying…' : 'Verify & continue' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Logo from '../components/Logo.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()

const step = ref('login')
const code = ref('')
const busy = ref(false)
const enrollData = ref(null)

/**
 * The Google callback redirects the browser back to this route. The OAuth
 * flow leaves a partial-auth cookie set; the backend signals which TOTP
 * sub-flow to drive via either:
 *   - a query param (?totp=enroll | ?totp=verify), if backend sets one, OR
 *   - we infer from a 401 on /me with code=PARTIAL_AUTH plus a probe call
 *     to /auth/totp/enroll (which 200s for unenrolled, 401s otherwise).
 *
 * We honour the query param first; fall back to "verify" otherwise. If the
 * user is already fully authed, the route guard sends them home.
 */
onMounted(async () => {
  if (auth.isAuthenticated) {
    router.replace('/')
    return
  }
  const totpHint = route.query.totp
  if (totpHint === 'enroll') {
    await startEnrollment()
  } else if (totpHint === 'verify') {
    step.value = 'verify'
  }
  // No hint → stay on the login screen showing "Continue with Google".
})

async function startEnrollment() {
  busy.value = true
  try {
    enrollData.value = await auth.enrollTotp()
    step.value = 'enroll'
  } catch (err) {
    toast.error(err?.message || 'Could not start TOTP enrollment.')
    step.value = 'login'
  } finally {
    busy.value = false
  }
}

async function completeEnrollment() {
  busy.value = true
  try {
    await auth.verifyTotpEnrollment(code.value)
    router.replace('/')
  } catch (err) {
    toast.error(err?.message || 'Invalid TOTP code.')
  } finally {
    busy.value = false
  }
}

async function verifyLogin() {
  busy.value = true
  try {
    await auth.verifyTotp(code.value)
    router.replace('/')
  } catch (err) {
    toast.error(err?.message || 'Invalid TOTP code.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.auth-eyebrow {
  font-size: 13px;
  color: var(--fg-3);
  margin-top: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: var(--f-mono);
}
</style>
