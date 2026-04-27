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
                <div class="font-semibold">{{ iv.businessName || iv.email || iv.phone || '—' }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ iv.phone || iv.email || iv.id }}</div>
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
            <label class="text-xs fg2 block mb-1">Business name</label>
            <input v-model="form.businessName" class="input" placeholder="e.g. Apex Pharmacy" />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Phone</label>
            <input v-model="form.phone" class="input" placeholder="+2348012345678" />
          </div>
          <div>
            <label class="text-xs fg2 block mb-1">Email (optional)</label>
            <input v-model="form.email" type="email" class="input" placeholder="host@example.com" />
          </div>
          <button
            type="submit"
            class="btn primary"
            style="width: 100%; margin-top: 8px"
            :disabled="creating || !form.phone"
          >
            {{ creating ? 'Sending…' : 'Send invite' }}
          </button>
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

const toast = useToastStore()
const qc = useQueryClient()

const invitesQuery = useQuery({
  queryKey: ['admin', 'host-invites'],
  queryFn: () => hostInvitesApi.list(),
})

const invites = computed(() => {
  const raw = invitesQuery.data.value
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.items)) return raw.items
  return []
})

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

const form = reactive({ businessName: '', phone: '', email: '' })
const creating = ref(false)
const busyId = ref(null)

async function onCreate() {
  creating.value = true
  try {
    const body = { phone: form.phone }
    if (form.businessName) body.businessName = form.businessName
    if (form.email) body.email = form.email
    await hostInvitesApi.create(body)
    toast.success('Invite sent.')
    form.businessName = ''
    form.phone = ''
    form.email = ''
    await qc.invalidateQueries({ queryKey: ['admin', 'host-invites'] })
  } catch (err) {
    toast.error(err?.message || 'Could not send invite.')
  } finally {
    creating.value = false
  }
}

async function onResend(id) {
  busyId.value = id
  try {
    await hostInvitesApi.resend(id)
    toast.success('Invite resent.')
    await qc.invalidateQueries({ queryKey: ['admin', 'host-invites'] })
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
    await qc.invalidateQueries({ queryKey: ['admin', 'host-invites'] })
  } catch (err) {
    toast.error(err?.message || 'Could not revoke invite.')
  } finally {
    busyId.value = null
  }
}
</script>
