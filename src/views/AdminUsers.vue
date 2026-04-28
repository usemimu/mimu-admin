<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Admin users</div>
        <span class="fg2 text-xs">{{ summaryLabel }}</span>
        <div class="spacer"></div>
        <button class="btn primary sm" @click="openInvite">
          <i class="ph ph-plus"></i> Invite admin
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 12px;">
        <button
          v-for="opt in statusOptions"
          :key="opt.value || 'all'"
          class="btn sm outline"
          :class="{ active: (filters.status || []).join(',') === (opt.value || '') }"
          @click="setStatus(opt.value)"
        >
          {{ opt.label }}
        </button>
        <div style="position: relative; margin-left: auto;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 8px; top: 8px; color: var(--fg-3); font-size: 14px;"></i>
          <input
            v-model="searchInput"
            class="input"
            placeholder="Search email or name…"
            style="padding-left: 28px; width: 240px;"
            @keyup.enter="applySearch"
          />
        </div>
      </div>

      <div v-if="isLoading" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">Loading admin users…</span>
      </div>

      <div v-else-if="error" class="card" style="padding: 24px;">
        <div style="color: var(--danger-500);">Failed to load: {{ error.message }}</div>
        <button class="btn sm outline" style="margin-top: 8px;" @click="refetch()">Retry</button>
      </div>

      <div v-else-if="users.length === 0" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">No admins match the current filters.</span>
      </div>

      <div v-else class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Name</th>
              <th class="p-3">Email</th>
              <th class="p-3">Role</th>
              <th class="p-3">Status</th>
              <th class="p-3">Last seen</th>
              <th class="p-3">Joined</th>
              <th class="p-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users"
              :key="u.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <div
                    class="avatar"
                    :style="{ width: '32px', height: '32px', fontSize: '12px', borderRadius: '6px' }"
                  >
                    {{ initials(u.name) }}
                  </div>
                  <div>
                    <div class="font-semibold">{{ u.name || '—' }}</div>
                    <div class="mono text-[11px] text-[var(--fg-3)]">{{ shortId(u.id) }}</div>
                  </div>
                </div>
              </td>
              <td class="p-3 mono fg2 text-xs">{{ u.email }}</td>
              <td class="p-3">
                <select
                  :value="u.role"
                  class="input sm"
                  :disabled="u.id === me?.adminUserId"
                  @change="changeRole(u, $event.target.value)"
                >
                  <option v-for="r in roleOptions" :key="r" :value="r">
                    {{ r.replace(/_/g, ' ') }}
                  </option>
                </select>
              </td>
              <td class="p-3">
                <span class="pill sm" :class="statusPill(u)">
                  {{ u.pendingInvite ? 'pending invite' : u.status }}
                </span>
              </td>
              <td class="p-3 mono fg2 text-xs">{{ relTime(u.lastLoginAt) }}</td>
              <td class="p-3 fg2 text-xs">{{ shortDate(u.createdAt) }}</td>
              <td class="p-3 text-right">
                <div class="flex" style="gap: 6px; justify-content: flex-end;">
                  <button
                    v-if="u.pendingInvite"
                    class="btn outline xs"
                    style="color: var(--danger-500);"
                    :disabled="busyId === u.id"
                    @click="revokeInvite(u)"
                  >
                    Revoke
                  </button>
                  <template v-else-if="u.id !== me?.adminUserId">
                    <button
                      v-if="u.status === 'active'"
                      class="btn outline xs"
                      :disabled="busyId === u.id"
                      @click="suspend(u)"
                    >
                      Suspend
                    </button>
                    <button
                      v-else-if="u.status === 'suspended'"
                      class="btn outline xs"
                      :disabled="busyId === u.id"
                      @click="reactivate(u)"
                    >
                      Reactivate
                    </button>
                    <span v-else class="fg2 text-xs">offboarded</span>
                  </template>
                  <span v-else class="fg2 text-xs">you</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!isLoading && users.length > 0" class="flex ac" style="margin-top: 12px; gap: 8px; justify-content: flex-end;">
        <button class="btn sm outline" :disabled="filters.offset === 0" @click="prevPage">Previous</button>
        <button class="btn sm outline" :disabled="users.length < filters.limit" @click="nextPage">Next</button>
      </div>
    </div>

    <!-- Invite modal -->
    <div
      v-if="showInvite"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50;"
      @click.self="showInvite = false"
    >
      <div class="card" style="padding: 24px; width: 480px; max-width: 90vw;">
        <h3 style="margin: 0 0 4px;">Invite admin</h3>
        <p class="fg2 text-xs" style="margin: 0 0 16px;">
          The row is created with the role you choose; on first Google
          sign-in by this email the invite is automatically adopted.
        </p>

        <label class="text-xs fg2 block mb-1">Email</label>
        <input
          v-model="inviteForm.email"
          class="input"
          type="email"
          placeholder="ops@mimu.ng"
          style="width: 100%; margin-bottom: 12px;"
        />

        <label class="text-xs fg2 block mb-1">Display name (optional)</label>
        <input
          v-model="inviteForm.name"
          class="input"
          placeholder="Jane Doe"
          style="width: 100%; margin-bottom: 12px;"
        />

        <label class="text-xs fg2 block mb-1">Role</label>
        <select v-model="inviteForm.role" class="input" style="width: 100%; margin-bottom: 16px;">
          <option v-for="r in roleOptions" :key="r" :value="r">
            {{ r.replace(/_/g, ' ') }}
          </option>
        </select>

        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="showInvite = false">Cancel</button>
          <button
            class="btn primary sm"
            :disabled="!canInvite || inviteMutation.isPending.value"
            @click="submitInvite"
          >
            {{ inviteMutation.isPending.value ? 'Sending…' : 'Send invite' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { adminUsersApi } from '../api/admin-users'
import { authApi } from '../api/auth'
import { useToastStore } from '../stores/toast'

const qc = useQueryClient()
const toast = useToastStore()

const roleOptions = [
  'admin_root',
  'ops_lead',
  'fraud_analyst',
  'vetting_agent',
  'finance',
  'field_ops',
  'support_agent',
]

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'offboarded', label: 'Offboarded' },
]

const filters = ref({
  status: undefined,
  q: undefined,
  offset: 0,
  limit: 50,
})

const searchInput = ref('')

const params = computed(() => ({
  ...filters.value,
  status: filters.value.status?.join(',') || undefined,
}))

const meQuery = useQuery({
  queryKey: ['admin-me'],
  queryFn: () => authApi.me(),
  retry: false,
})
const me = computed(() => meQuery.data.value?.user || meQuery.data.value)

const queryKey = computed(() => ['admin-users', params.value])
const { data, isLoading, error, refetch } = useQuery({
  queryKey,
  queryFn: () => adminUsersApi.list(params.value),
  keepPreviousData: true,
})

const users = computed(() => data.value?.adminUsers ?? [])
const total = computed(() => data.value?.pagination?.total ?? 0)

const summaryLabel = computed(() => {
  if (isLoading.value) return 'Loading…'
  return `${users.value.length} of ${total.value} admins shown`
})

// ── Mutations ────────────────────────────────────────────────────────

const busyId = ref(null)

const inviteMutation = useMutation({
  mutationFn: () => adminUsersApi.invite({
    email: inviteForm.email.trim(),
    name: inviteForm.name.trim() || undefined,
    role: inviteForm.role,
  }),
  onSuccess: () => {
    showInvite.value = false
    inviteForm.email = ''
    inviteForm.name = ''
    inviteForm.role = 'support_agent'
    toast.success('Invite sent.')
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  },
  onError: (err) => toast.error(err?.response?.data?.message || err?.message || 'Invite failed.'),
})

async function changeRole(user, role) {
  if (!role || role === user.role) return
  busyId.value = user.id
  try {
    await adminUsersApi.update(user.id, { role })
    toast.success(`${user.email} → ${role.replace(/_/g, ' ')}`)
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  } catch (err) {
    toast.error(err?.response?.data?.message || err?.message || 'Role change failed.')
  } finally {
    busyId.value = null
  }
}

async function suspend(user) {
  const reason = window.prompt(`Suspend ${user.email}? Optional reason:`)
  if (reason === null) return
  busyId.value = user.id
  try {
    await adminUsersApi.suspend(user.id, reason || undefined)
    toast.success(`${user.email} suspended.`)
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  } catch (err) {
    toast.error(err?.response?.data?.message || err?.message || 'Suspend failed.')
  } finally {
    busyId.value = null
  }
}

async function reactivate(user) {
  busyId.value = user.id
  try {
    await adminUsersApi.reactivate(user.id)
    toast.success(`${user.email} reactivated.`)
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  } catch (err) {
    toast.error(err?.response?.data?.message || err?.message || 'Reactivate failed.')
  } finally {
    busyId.value = null
  }
}

async function revokeInvite(user) {
  if (!window.confirm(`Revoke invite for ${user.email}?`)) return
  busyId.value = user.id
  try {
    await adminUsersApi.revokeInvite(user.id)
    toast.success(`Invite for ${user.email} revoked.`)
    qc.invalidateQueries({ queryKey: ['admin-users'] })
  } catch (err) {
    toast.error(err?.response?.data?.message || err?.message || 'Revoke failed.')
  } finally {
    busyId.value = null
  }
}

// ── Invite modal state ───────────────────────────────────────────────
const showInvite = ref(false)
const inviteForm = reactive({ email: '', name: '', role: 'support_agent' })

const canInvite = computed(() => {
  return !!inviteForm.email.trim() && !!inviteForm.role
})

function openInvite() {
  inviteForm.email = ''
  inviteForm.name = ''
  inviteForm.role = 'support_agent'
  showInvite.value = true
}

function submitInvite() {
  if (canInvite.value) inviteMutation.mutate()
}

// ── Filters ───────────────────────────────────────────────────────────
function setStatus(value) {
  filters.value = {
    ...filters.value,
    status: value ? [value] : undefined,
    offset: 0,
  }
}

function applySearch() {
  filters.value = { ...filters.value, q: searchInput.value || undefined, offset: 0 }
}

function nextPage() {
  filters.value = { ...filters.value, offset: filters.value.offset + filters.value.limit }
}
function prevPage() {
  filters.value = { ...filters.value, offset: Math.max(0, filters.value.offset - filters.value.limit) }
}

// ── Format helpers ────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function statusPill(u) {
  if (u.pendingInvite) return 'pill-pending'
  if (u.status === 'active') return 'pill-active'
  if (u.status === 'suspended') return 'pill-failed'
  return 'pill-neutral'
}

function relTime(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function shortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}
</script>
