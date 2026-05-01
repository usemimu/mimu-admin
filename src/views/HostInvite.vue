<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Host invites</div>
        <span class="fg2 text-xs">{{ summary }}</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="invitesQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
      </div>
    </div>

    <div class="page-body" style="display: grid; grid-template-columns: 1fr 360px; gap: 24px">
      <!-- LIST -->
      <div class="card overflow-hidden">
        <div v-if="invitesQuery.isLoading.value" class="p-6 fg2 text-sm">Loading invites…</div>
        <div v-else-if="invitesQuery.error.value" class="p-6 text-sm" style="color: var(--danger-500)">
          {{ invitesQuery.error.value?.message || 'Could not load invites.' }}
        </div>
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Recipient</th>
              <th class="p-3">Status</th>
              <th class="p-3">Created</th>
              <th class="p-3">Expires</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!invites.length">
              <td colspan="5" class="p-6 fg2 text-center text-sm">No invites yet.</td>
            </tr>
            <tr
              v-for="iv in invites"
              :key="iv.id"
              class="border-t border-[var(--border)]"
            >
              <td class="p-3">
                <div class="font-semibold">{{ iv.businessName || iv.phoneNumber || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">
                  {{ iv.phoneNumber || iv.id }}
                  <span v-if="iv.lga" class="fg2"> · {{ iv.lga }}</span>
                </div>
              </td>
              <td class="p-3">
                <span class="pill" :class="pillClass(iv.status)">{{ iv.status || 'pending' }}</span>
              </td>
              <td class="p-3 mono text-xs">{{ iv.createdAt ? fmt.rel(iv.createdAt) : '—' }}</td>
              <td class="p-3 mono text-xs">{{ iv.expiresAt ? fmt.rel(iv.expiresAt) : '—' }}</td>
              <td class="p-3 text-right">
                <button
                  v-if="iv.status === 'pending' || !iv.status"
                  class="btn outline xs"
                  :disabled="busyId === iv.id"
                  @click="onResend(iv.id)"
                >
                  Resend
                </button>
                <button
                  v-if="iv.status === 'pending' || !iv.status"
                  class="btn outline xs"
                  :disabled="busyId === iv.id"
                  style="margin-left: 6px; color: var(--danger-500)"
                  @click="onRevoke(iv.id)"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CREATE FORM -->
      <div class="card" style="padding: 20px; height: fit-content">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px">New invite</div>
        <form class="space-y-3" @submit.prevent="onCreate">
          <div>
            <label class="text-xs fg2 block mb-1">
              Owner name <span class="fg2">(used as dashboard greeting)</span>
            </label>
            <input
              v-model.trim="form.recipientName"
              class="input"
              placeholder="e.g. Tunde Adebayo"
            />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Business name</label>
            <input
              v-model.trim="form.businessName"
              class="input"
              placeholder="e.g. Apex Pharmacy"
              required
            />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">
              Business address <span class="fg2">(street, building, landmark)</span>
            </label>
            <textarea
              v-model.trim="form.businessAddress"
              class="input"
              rows="2"
              placeholder="e.g. 12 Allen Avenue, opposite Shoprite, Ikeja"
            ></textarea>
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Phone</label>
            <input
              v-model.trim="form.phoneNumber"
              class="input"
              placeholder="+2348012345678"
              inputmode="tel"
              required
            />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">
              Email <span class="fg2">(optional · used on create + resend)</span>
            </label>
            <input
              v-model.trim="form.email"
              class="input"
              type="email"
              placeholder="host@example.com"
            />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Business category</label>
            <select v-model="form.businessCategory" class="input" required>
              <option value="" disabled>Select category…</option>
              <option v-for="c in BUSINESS_CATEGORIES" :key="c" :value="c">
                {{ c.charAt(0).toUpperCase() + c.slice(1) }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">LGA</label>
            <select v-model="form.lga" class="input" required>
              <option value="" disabled>Select LGA…</option>
              <option v-for="l in LAGOS_LGAS" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Notes (optional)</label>
            <textarea
              v-model.trim="form.notes"
              class="input"
              rows="2"
              placeholder="e.g. screen reserved at lobby entrance"
            ></textarea>
          </div>
          <button
            type="submit"
            class="btn primary"
            style="width: 100%; margin-top: 8px"
            :disabled="creating || !canSubmit"
          >
            {{ creating ? 'Sending…' : 'Send invite' }}
          </button>
          <p class="fg2 text-xs" style="margin: 0;">
            SMS + email fire automatically; the WhatsApp link is returned for ops to share.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { hostInvitesApi } from '../api/hosts'
import { useToastStore } from '../stores/toast'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'

const toast = useToastStore()
const qc = useQueryClient()

const invitesQuery = useQuery({
  queryKey: qk.hostInvites(),
  queryFn: () => hostInvitesApi.list(),
})

const invites = computed(() => extractList(invitesQuery.data.value, 'invites'))

const summary = computed(() => {
  const list = invites.value
  const total = list.length
  const pending = list.filter((i) => !i.status || i.status === 'pending').length
  const claimed = list.filter((i) => i.status === 'claimed').length
  const revoked = list.filter((i) => i.status === 'revoked').length
  return `${total} total · ${pending} pending · ${claimed} claimed · ${revoked} revoked`
})

function pillClass(status) {
  if (status === 'claimed' || status === 'active') return 'pill-active'
  if (status === 'revoked' || status === 'expired') return 'pill-hold'
  return 'pill-pending'
}

// Backend DTO requires phoneNumber, businessName, businessCategory,
// lga (all NOT NULL on the host_invites table). The earlier form
// shape (phone/email-only) crashed the service before it could even
// run validation. The lists below are kept inline rather than
// imported from a shared module — they're presentational and only
// needed here.
const BUSINESS_CATEGORIES = [
  'pharmacy',
  'salon',
  'restaurant',
  'eatery',
  'supermarket',
  'electronics',
  'fashion',
  'fitness',
  'automotive',
  'grocery',
  'clinic',
  'other',
]

const LAGOS_LGAS = [
  'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
]

const form = reactive({
  recipientName: '',
  businessName: '',
  phoneNumber: '',
  email: '',
  businessCategory: '',
  businessAddress: '',
  lga: '',
  notes: '',
})
const creating = ref(false)
const busyId = ref(null)

const canSubmit = computed(
  () =>
    form.businessName.trim().length > 0 &&
    form.phoneNumber.trim().length > 0 &&
    !!form.businessCategory &&
    !!form.lga,
)

async function onCreate() {
  if (!canSubmit.value) return
  creating.value = true
  try {
    const body = {
      phoneNumber: form.phoneNumber,
      businessName: form.businessName,
      businessCategory: form.businessCategory,
      lga: form.lga,
    }
    if (form.recipientName) body.recipientName = form.recipientName
    if (form.businessAddress) body.businessAddress = form.businessAddress
    if (form.email) body.email = form.email
    if (form.notes) body.notes = form.notes
    await hostInvitesApi.create(body)
    toast.success('Invite sent.')
    form.recipientName = ''
    form.businessName = ''
    form.phoneNumber = ''
    form.email = ''
    form.businessCategory = ''
    form.businessAddress = ''
    form.lga = ''
    form.notes = ''
    await qc.invalidateQueries({ queryKey: qk.hostInvites() })
  } catch (err) {
    toast.error(err?.response?.data?.message || err?.message || 'Could not send invite.')
  } finally {
    creating.value = false
  }
}

async function onResend(id) {
  busyId.value = id
  try {
    await hostInvitesApi.resend(id)
    toast.success('Invite resent.')
    await qc.invalidateQueries({ queryKey: qk.hostInvites() })
  } catch (err) {
    toast.error(err?.message || 'Could not resend invite.')
  } finally {
    busyId.value = null
  }
}

async function onRevoke(id) {
  if (!confirm('Revoke this invite? The link will stop working immediately.')) return
  busyId.value = id
  try {
    await hostInvitesApi.revoke(id)
    toast.success('Invite revoked.')
    await qc.invalidateQueries({ queryKey: qk.hostInvites() })
  } catch (err) {
    toast.error(err?.message || 'Could not revoke invite.')
  } finally {
    busyId.value = null
  }
}
</script>
