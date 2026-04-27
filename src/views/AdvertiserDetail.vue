<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <button class="btn ghost sm" @click="$router.back()">
          <i class="ph ph-arrow-left"></i> Back
        </button>
        <div class="page-title">Advertiser detail</div>
        <div class="spacer"></div>
      </div>
    </div>

    <div class="page-body" style="display: grid; grid-template-columns: 1fr 360px; gap: 24px">
      <!-- LEFT: would be advertiser metadata once a per-advertiser
           detail endpoint exists; for now we render the id + a wallet
           adjustment form against `/admin/advertiser/{id}/wallet/adjustment`. -->
      <div class="card" style="padding: 24px">
        <div class="fg2 text-xs" style="margin-bottom: 4px">ADVERTISER ID</div>
        <div class="mono" style="font-size: 14px; font-weight: 600; margin-bottom: 24px">
          {{ advertiserId || '— pass ?id= in the URL —' }}
        </div>

        <div class="fg2 text-xs" style="margin-bottom: 8px">
          Per-advertiser detail endpoint isn't exposed yet — landing on the
          wallet-adjustment surface (the only documented action against this
          ID).
        </div>
      </div>

      <!-- RIGHT: wallet adjustment -->
      <div class="card" style="padding: 20px; height: fit-content">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px">
          Wallet adjustment
        </div>
        <div class="fg2 text-xs" style="margin-bottom: 16px">
          Negative amounts debit the wallet. Reason is required (≥10 chars) and
          shows up in the audit log.
        </div>

        <form class="space-y-3" @submit.prevent="onSubmit">
          <div>
            <label class="text-xs fg2 block mb-1">Amount (kobo)</label>
            <input
              v-model="form.amountKobo"
              inputmode="numeric"
              class="input"
              placeholder="500000 = ₦5,000 ; -250000 = -₦2,500"
            />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Reason</label>
            <textarea
              v-model="form.reason"
              rows="3"
              class="input"
              placeholder="Why is this adjustment being made?"
            ></textarea>
          </div>
          <button
            type="submit"
            class="btn primary"
            style="width: 100%; padding: 10px"
            :disabled="busy || !canSubmit"
          >
            {{ busy ? 'Applying…' : 'Apply adjustment' }}
          </button>
        </form>

        <div v-if="lastResult" class="card" style="margin-top: 16px; padding: 12px; background: var(--bg-sunken)">
          <div class="fg2 text-xs">Last applied</div>
          <div class="mono" style="font-size: 13px">{{ JSON.stringify(lastResult) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { adminAdvertisersApi } from '../api/screens'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const toast = useToastStore()

const advertiserId = computed(() => route.query.id ? String(route.query.id) : '')
const form = reactive({ amountKobo: '', reason: '' })
const busy = ref(false)
const lastResult = ref(null)

const canSubmit = computed(() => {
  if (!advertiserId.value) return false
  if (!/^-?\d+$/.test(form.amountKobo)) return false
  if (form.reason.trim().length < 10) return false
  return true
})

async function onSubmit() {
  if (!canSubmit.value) return
  busy.value = true
  try {
    const res = await adminAdvertisersApi.walletAdjustment(advertiserId.value, {
      amountKobo: form.amountKobo,
      reason: form.reason.trim(),
    })
    lastResult.value = res
    toast.success('Adjustment applied.')
    form.amountKobo = ''
    form.reason = ''
  } catch (err) {
    if (!err?.needsReauth) toast.error(err?.message || 'Adjustment failed.')
  } finally {
    busy.value = false
  }
}
</script>
