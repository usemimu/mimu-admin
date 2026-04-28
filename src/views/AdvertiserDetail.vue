<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <button class="btn ghost sm" @click="$router.back()">
          <i class="ph ph-arrow-left"></i> Back
        </button>
        <div class="page-title">{{ advertiser?.businessName || 'Advertiser detail' }}</div>
        <span v-if="advertiser" class="pill sm" :class="statusPill(advertiser.status)" style="margin-left: 8px;">
          {{ advertiser.status }}
        </span>
        <span v-if="advertiser" class="pill sm" :class="kycPill(advertiser.kycStatus)" style="margin-left: 4px;">
          KYC: {{ advertiser.kycStatus }}
        </span>
        <div class="spacer"></div>
      </div>
    </div>

    <div class="page-body">
      <div v-if="!advertiserId" class="card" style="padding: 24px;">
        <span class="fg2">No advertiser id provided. Pass <code>?id=…</code> in the URL.</span>
      </div>

      <div v-else-if="isLoading" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">Loading advertiser…</span>
      </div>

      <div v-else-if="error" class="card" style="padding: 24px;">
        <div style="color: var(--danger-500);">Failed to load advertiser: {{ error.message }}</div>
        <button class="btn sm outline" style="margin-top: 8px;" @click="refetch()">Retry</button>
      </div>

      <div v-else style="display: grid; grid-template-columns: 1fr 360px; gap: 24px">
        <!-- LEFT: profile + activity -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="card" style="padding: 20px">
            <h3 style="margin: 0 0 12px;">Business profile</h3>
            <div class="text-xs" style="display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px;">
              <span class="fg2">Business name</span>
              <span class="font-semibold">{{ advertiser?.businessName }}</span>
              <span class="fg2">Category</span>
              <span>{{ advertiser?.businessCategory }}</span>
              <span class="fg2">LGA</span>
              <span>{{ advertiser?.lga }}</span>
              <span class="fg2">Type</span>
              <span>{{ advertiser?.businessType }}</span>
              <span class="fg2">RC number</span>
              <span class="mono">{{ advertiser?.rcNumber || '—' }}</span>
              <span class="fg2">Tax ID</span>
              <span class="mono">{{ advertiser?.taxId || '—' }}</span>
              <span class="fg2">Owner</span>
              <span>{{ user?.name || '—' }} · {{ user?.email || user?.phoneNumber || '' }}</span>
            </div>
          </div>

          <div class="card" style="padding: 20px">
            <h3 style="margin: 0 0 12px;">Wallet &amp; spend</h3>
            <div class="flex" style="gap: 24px;">
              <div>
                <div class="fg2 text-xs">Wallet balance</div>
                <div class="mono" style="font-size: 18px; font-weight: 600;">{{ formatNaira(walletBalanceKobo) }}</div>
              </div>
              <div>
                <div class="fg2 text-xs">First-week spend</div>
                <div class="mono" style="font-size: 14px;">{{ formatNaira(advertiser?.firstWeekSpendKobo) }}</div>
              </div>
              <div>
                <div class="fg2 text-xs">Total topups</div>
                <div class="mono" style="font-size: 14px;">{{ advertiser?.totalTopupsCount ?? 0 }}</div>
              </div>
            </div>
          </div>

          <div class="card" style="padding: 20px">
            <h3 style="margin: 0 0 12px;">Recent campaigns ({{ campaigns.length }})</h3>
            <div v-if="campaigns.length === 0" class="fg2 text-xs">No campaigns yet.</div>
            <div
              v-for="c in campaigns.slice(0, 10)"
              :key="c.id"
              style="border-top: 1px solid var(--border); padding: 8px 0;"
            >
              <div class="flex ac" style="gap: 8px;">
                <span class="font-medium">{{ c.name || 'untitled' }}</span>
                <span class="pill pill-neutral sm">{{ c.status }}</span>
                <span class="fg2 mono text-xs" style="margin-left: auto;">
                  {{ formatDate(c.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="fraudFlags.length > 0" class="card" style="padding: 20px">
            <h3 style="margin: 0 0 12px;">Fraud flags ({{ fraudFlags.length }})</h3>
            <div
              v-for="f in fraudFlags"
              :key="f.id"
              style="border-top: 1px solid var(--border); padding: 8px 0;"
            >
              <span class="pill pill-failed sm">{{ f.flagType }}</span>
              <span class="fg2 text-xs" style="margin-left: 8px;">
                {{ formatDate(f.detectedAt) }} · {{ f.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- RIGHT: actions -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- KYC approval -->
          <div class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">KYC</h4>
            <div v-if="advertiser?.kycStatus === 'approved'" class="fg2 text-xs">
              KYC already approved.
            </div>
            <div v-else>
              <textarea
                v-model="kycNotes"
                class="input sm"
                placeholder="Approval notes (optional)"
                rows="2"
                style="width: 100%; margin-bottom: 6px;"
              ></textarea>
              <button
                class="btn primary sm"
                :disabled="approveKycMutation.isPending.value"
                @click="approveKycMutation.mutate()"
                style="width: 100%;"
              >
                {{ approveKycMutation.isPending.value ? 'Approving…' : 'Approve KYC' }}
              </button>
            </div>
          </div>

          <!-- Suspend / reactivate -->
          <div class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">Account state</h4>
            <div v-if="advertiser?.status === 'suspended'">
              <button
                class="btn sm outline"
                :disabled="reactivateMutation.isPending.value"
                @click="reactivateMutation.mutate()"
                style="width: 100%;"
              >
                {{ reactivateMutation.isPending.value ? 'Reactivating…' : 'Reactivate' }}
              </button>
            </div>
            <div v-else>
              <textarea
                v-model="suspendReason"
                class="input sm"
                placeholder="Suspension reason (required)"
                rows="2"
                style="width: 100%; margin-bottom: 6px;"
              ></textarea>
              <button
                class="btn sm outline"
                :disabled="!suspendReason.trim() || suspendMutation.isPending.value"
                @click="suspendMutation.mutate()"
                style="width: 100%; color: var(--danger-500);"
              >
                {{ suspendMutation.isPending.value ? 'Suspending…' : 'Suspend advertiser' }}
              </button>
            </div>
          </div>

          <!-- Wallet adjustment -->
          <div class="card" style="padding: 16px;">
            <h4 style="margin: 0 0 8px;">Wallet adjustment</h4>
            <div class="fg2 text-xs" style="margin-bottom: 8px;">
              Reauth required. Reason ≥ 10 chars; shows in the audit log.
            </div>
            <form @submit.prevent="onAdjust">
              <label class="text-xs fg2 block mb-1">Direction</label>
              <select v-model="adjustForm.direction" class="input sm" style="width: 100%; margin-bottom: 6px;">
                <option value="credit">Credit (add funds)</option>
                <option value="debit">Debit (remove funds)</option>
              </select>
              <label class="text-xs fg2 block mb-1">Amount (kobo)</label>
              <input
                v-model="adjustForm.amountKobo"
                inputmode="numeric"
                class="input sm"
                placeholder="500000 = ₦5,000"
                style="width: 100%; margin-bottom: 6px;"
              />
              <label class="text-xs fg2 block mb-1">Reason</label>
              <textarea
                v-model="adjustForm.reason"
                class="input sm"
                rows="3"
                placeholder="Why is this adjustment being made?"
                style="width: 100%; margin-bottom: 8px;"
              ></textarea>
              <button
                type="submit"
                class="btn primary sm"
                :disabled="!canAdjust || adjustMutation.isPending.value"
                style="width: 100%;"
              >
                {{ adjustMutation.isPending.value ? 'Applying…' : 'Apply adjustment' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { advertisersApi } from '../api/advertisers'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const qc = useQueryClient()
const toast = useToastStore()

const advertiserId = computed(() => (route.query.id ? String(route.query.id) : ''))

const queryKey = computed(() => ['advertiser-detail', advertiserId.value])
const { data, isLoading, error, refetch } = useQuery({
  queryKey,
  queryFn: () => advertisersApi.detail(advertiserId.value),
  enabled: computed(() => !!advertiserId.value),
})

const advertiser = computed(() => data.value?.advertiser)
const user = computed(() => data.value?.user)
const walletBalanceKobo = computed(() => data.value?.walletBalanceKobo)
const campaigns = computed(() => data.value?.campaigns ?? [])
const fraudFlags = computed(() => data.value?.fraudFlags ?? [])

const kycNotes = ref('')
const suspendReason = ref('')
const adjustForm = reactive({ direction: 'credit', amountKobo: '', reason: '' })

const canAdjust = computed(() => {
  if (!advertiserId.value) return false
  if (!/^\d+$/.test(adjustForm.amountKobo)) return false
  if (adjustForm.reason.trim().length < 10) return false
  return true
})

const approveKycMutation = useMutation({
  mutationFn: () => advertisersApi.approveKyc(advertiserId.value, kycNotes.value || undefined),
  onSuccess: () => {
    kycNotes.value = ''
    toast.success('KYC approved.')
    qc.invalidateQueries({ queryKey: ['advertiser-detail', advertiserId.value] })
    qc.invalidateQueries({ queryKey: ['advertisers'] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'KYC approval failed.')
  },
})

const suspendMutation = useMutation({
  mutationFn: () => advertisersApi.suspend(advertiserId.value, suspendReason.value.trim()),
  onSuccess: () => {
    suspendReason.value = ''
    toast.success('Advertiser suspended.')
    qc.invalidateQueries({ queryKey: ['advertiser-detail', advertiserId.value] })
    qc.invalidateQueries({ queryKey: ['advertisers'] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Suspend failed.')
  },
})

const reactivateMutation = useMutation({
  mutationFn: () => advertisersApi.reactivate(advertiserId.value),
  onSuccess: () => {
    toast.success('Advertiser reactivated.')
    qc.invalidateQueries({ queryKey: ['advertiser-detail', advertiserId.value] })
    qc.invalidateQueries({ queryKey: ['advertisers'] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Reactivate failed.')
  },
})

const adjustMutation = useMutation({
  mutationFn: () =>
    advertisersApi.walletAdjustment(advertiserId.value, {
      amountKobo: adjustForm.amountKobo,
      direction: adjustForm.direction,
      reason: adjustForm.reason.trim(),
    }),
  onSuccess: () => {
    adjustForm.amountKobo = ''
    adjustForm.reason = ''
    toast.success('Adjustment applied.')
    qc.invalidateQueries({ queryKey: ['advertiser-detail', advertiserId.value] })
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Adjustment failed.')
  },
})

function onAdjust() {
  if (!canAdjust.value) return
  adjustMutation.mutate()
}

function formatNaira(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function kycPill(status) {
  if (status === 'approved') return 'pill-active'
  if (status === 'pending') return 'pill-pending'
  if (status === 'rejected') return 'pill-failed'
  return 'pill-neutral'
}

function statusPill(status) {
  if (status === 'active') return 'pill-active'
  if (status === 'suspended') return 'pill-failed'
  return 'pill-neutral'
}
</script>
