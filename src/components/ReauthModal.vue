<template>
  <transition name="modal">
    <div v-if="open" class="reauth-backdrop" @click.self="cancel">
      <div class="card raised reauth-card">
        <div class="flex ac g8" style="margin-bottom: 4px">
          <i
            class="ph ph-shield-warning"
            style="font-size: 18px; color: var(--clay-500)"
          ></i>
          <div style="font-size: 16px; font-weight: 700">Re-authenticate</div>
        </div>
        <div class="fg2" style="font-size: 12px; margin-bottom: 16px">
          This action requires a fresh TOTP code. The verification stays
          valid for 5 minutes.
        </div>

        <input
          ref="codeInput"
          v-model="code"
          class="input"
          style="
            width: 100%;
            text-align: center;
            font-size: 22px;
            font-family: var(--f-mono);
            letter-spacing: 0.5em;
            padding: 12px;
          "
          placeholder="000000"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          :disabled="busy"
          @keyup.enter="confirm"
        />

        <div
          v-if="errorMsg"
          class="fg2"
          style="font-size: 12px; color: var(--danger-500); margin-top: 8px"
        >
          {{ errorMsg }}
        </div>

        <div class="flex" style="gap: 8px; margin-top: 16px">
          <button
            class="btn outline"
            style="flex: 1; padding: 10px"
            :disabled="busy"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            class="btn primary"
            style="flex: 1; padding: 10px"
            :disabled="busy || code.length !== 6"
            @click="confirm"
          >
            {{ busy ? 'Verifying…' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import { http } from '../lib/http'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

/**
 * Step-up TOTP modal.
 *
 * Lifecycle (the deferred-promise handshake):
 *   1. View calls a sensitive mutation (e.g. `hostsApi.suspend(id)`).
 *   2. Backend returns 403 with `code: 'REAUTH_REQUIRED'`.
 *   3. http interceptor builds a fresh Promise and stashes
 *      `{ config, resolve, reject }` into `auth.pendingReauthRequest`.
 *      The original axios call returns this promise — the view's
 *      `await` is now waiting on US, not on the original 403.
 *   4. This component opens, captures the TOTP code.
 *   5. On confirm: hit `/auth/reauth` to set the 5-min reauth
 *      cookie, then replay the original request via `http.request`,
 *      then `auth.resolveReauth(replayResponse)` which fulfils the
 *      view's `await` with the *retry's* response. The view never
 *      knows there was a step-up.
 *   6. On cancel / TOTP failure: `auth.rejectReauth(err)` so the
 *      view sees a normal cancellation and renders accordingly.
 */
const auth = useAuthStore()
const toast = useToastStore()

const code = ref('')
const busy = ref(false)
const errorMsg = ref('')
const codeInput = ref(null)

const open = computed(() => Boolean(auth.pendingReauthRequest))

watch(open, (v) => {
  if (v) {
    code.value = ''
    errorMsg.value = ''
    nextTick(() => codeInput.value?.focus())
  }
})

async function confirm() {
  busy.value = true
  errorMsg.value = ''
  const pending = auth.pendingReauthRequest
  if (!pending) {
    busy.value = false
    return
  }
  try {
    // Step-up the session cookie. On success the backend sets
    // `admin_reauth_time` (5 min sliding window). Failure here
    // means the TOTP code was wrong / expired — show inline,
    // don't close the modal so the user can retry.
    await auth.reauth(code.value)
  } catch (err) {
    errorMsg.value = err?.message || 'TOTP verification failed.'
    busy.value = false
    code.value = ''
    nextTick(() => codeInput.value?.focus())
    return
  }

  // Reauth cookie is on the wire now. Replay the original request
  // through the same axios instance so the cookie + auth headers
  // attach automatically. Whatever the replay returns (or throws)
  // we forward to the view's deferred promise — no double-toasting,
  // no double-rendering of the error.
  try {
    const response = await http.request(pending.config)
    auth.resolveReauth(response)
  } catch (err) {
    auth.rejectReauth(err)
  } finally {
    busy.value = false
  }
}

function cancel() {
  // Reject the deferred promise so the view's await throws normally.
  // It's the same shape it would have seen if reauth never existed,
  // so existing error handling works unmodified.
  auth.rejectReauth(new Error('Re-authentication cancelled.'))
  toast.info('Action cancelled — re-authentication required.')
}
</script>

<style scoped>
.reauth-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}
.reauth-card {
  width: 100%;
  max-width: 380px;
  padding: 24px;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
