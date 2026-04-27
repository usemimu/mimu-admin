<template>
  <transition name="modal">
    <div v-if="open" class="reauth-backdrop" @click.self="cancel">
      <div class="card raised reauth-card">
        <div class="flex ac g8" style="margin-bottom: 4px">
          <i class="ph ph-shield-warning" style="font-size: 18px; color: var(--clay-500)"></i>
          <div style="font-size: 16px; font-weight: 700">Re-authenticate</div>
        </div>
        <div class="fg2" style="font-size: 12px; margin-bottom: 16px">
          This action requires a fresh TOTP code. The verification stays valid for 5 minutes.
        </div>

        <input
          ref="codeInput"
          v-model="code"
          class="input"
          style="width: 100%; text-align: center; font-size: 22px; font-family: var(--f-mono); letter-spacing: 0.5em; padding: 12px"
          placeholder="000000"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          @keyup.enter="confirm"
        />

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
import { ref, computed, watch, nextTick } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { http } from '../lib/http'

const auth = useAuthStore()
const toast = useToastStore()

const code = ref('')
const busy = ref(false)
const codeInput = ref(null)

const open = computed(() => Boolean(auth.pendingReauthRequest))

watch(open, (v) => {
  if (v) {
    code.value = ''
    nextTick(() => codeInput.value?.focus())
  }
})

async function confirm() {
  busy.value = true
  try {
    await auth.reauth(code.value)
    const original = auth.pendingReauthRequest
    auth.clearReauthQueue()
    if (original) {
      // Replay the original request through the same axios instance so it
      // picks up the freshly minted reauth cookie. Result is intentionally
      // discarded here — the calling component holds its own promise for
      // success/failure handling. This is "queued + replay" semantics.
      try {
        await http.request(original)
      } catch {
        // The replay's failure surfaces to the original caller via the
        // axios promise chain; we don't double-toast it here.
      }
    }
  } catch (err) {
    if (axios.isAxiosError?.(err) || err?.name === 'ApiError') {
      toast.error(err.message || 'TOTP verification failed.')
    } else {
      toast.error('TOTP verification failed.')
    }
  } finally {
    busy.value = false
  }
}

function cancel() {
  auth.clearReauthQueue()
  toast.error('Action cancelled — re-authentication required.')
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
