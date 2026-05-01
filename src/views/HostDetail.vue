<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <button class="btn ghost sm" @click="$router.push('/hosts')">
          <i class="ph ph-arrow-left"></i> Hosts
        </button>
        <div class="page-title" style="margin-left: 8px;">
          {{ businessName }}
        </div>
        <span class="pill sm" :class="statusPillClass">{{ status }}</span>
        <div class="spacer"></div>
        <button class="btn outline sm" @click="detailQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i> Refresh
        </button>
      </div>
      <div class="page-subtitle">
        <span class="mono fg2 text-xs">{{ hostId }}</span>
      </div>
    </div>

    <div class="page-body">
      <div v-if="detailQuery.isLoading.value" class="card">
        <RowSkeleton :count="6" />
      </div>

      <ErrorState
        v-else-if="detailQuery.error.value"
        title="Could not load host"
        :message="detailQuery.error.value?.message"
        :on-retry="detailQuery.refetch"
      />

      <div v-else-if="detail" style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
        <!-- Left column -->
        <div class="col" style="gap: 16px;">
          <!-- Owner / contact -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Owner</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid">
                <div class="kv-label">Name</div>
                <div>{{ detail.user?.name || '—' }}</div>
                <div class="kv-label">Email</div>
                <div class="mono">{{ detail.user?.email || '—' }}</div>
                <div class="kv-label">Phone</div>
                <div class="mono">{{ detail.user?.phoneNumber || '—' }}</div>
                <div class="kv-label">Email verified</div>
                <div>
                  <span class="pill sm" :class="detail.user?.isEmailVerified ? 'pill-active' : 'pill-pending'">
                    {{ detail.user?.isEmailVerified ? 'verified' : 'unverified' }}
                  </span>
                </div>
                <div class="kv-label">Phone verified</div>
                <div>
                  <span class="pill sm" :class="detail.user?.isPhoneVerified ? 'pill-active' : 'pill-pending'">
                    {{ detail.user?.isPhoneVerified ? 'verified' : 'unverified' }}
                  </span>
                </div>
                <div class="kv-label">Last sign-in</div>
                <div class="mono fg2 text-xs">{{ relTime(detail.user?.lastLoginAt) }}</div>
                <div class="kv-label">Joined</div>
                <div class="mono fg2 text-xs">{{ relTime(detail.user?.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Business -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Business</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid">
                <div class="kv-label">Business name</div>
                <div>{{ detail.profile?.businessName || '—' }}</div>
                <div class="kv-label">Category</div>
                <div>{{ detail.profile?.businessType || '—' }}</div>
                <div class="kv-label">Address</div>
                <div>{{ detail.profile?.businessAddress || '—' }}</div>
                <div class="kv-label">LGA</div>
                <div>{{ detail.profile?.lga || '—' }}</div>
                <div class="kv-label">State</div>
                <div>{{ detail.profile?.state || '—' }}</div>
                <div class="kv-label">Profile complete</div>
                <div>
                  <span class="pill sm" :class="detail.profile?.isComplete ? 'pill-active' : 'pill-pending'">
                    {{ detail.profile?.isComplete ? 'complete' : 'incomplete' }}
                  </span>
                </div>
                <div class="kv-label">KYC verified</div>
                <div>
                  <span class="pill sm" :class="detail.profile?.isKycVerified ? 'pill-active' : 'pill-pending'">
                    {{ detail.profile?.isKycVerified ? 'verified' : 'pending' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Banking -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Banking</div>
              <div class="spacer"></div>
              <span
                v-if="detail.profile?.bankAccountVerified"
                class="pill pill-active sm"
              >
                <i class="ph ph-check-circle"></i> verified
              </span>
              <span v-else class="pill pill-pending sm">unverified</span>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid" v-if="detail.profile?.bankAccountNumber">
                <div class="kv-label">Bank</div>
                <div>{{ detail.profile?.bankName || '—' }}</div>
                <div class="kv-label">Account number</div>
                <div class="mono">
                  ••••{{ String(detail.profile?.bankAccountNumber || '').slice(-4) }}
                </div>
                <div class="kv-label">Account name</div>
                <div>
                  {{ detail.profile?.accountName || detail.profile?.accountHolderName || '—' }}
                </div>
                <div class="kv-label">Bank code</div>
                <div class="mono fg2 text-xs">{{ detail.profile?.bankCode || '—' }}</div>
              </div>
              <div v-else class="fg2 text-sm">
                No bank account on file. The host adds this from their account screen.
              </div>
            </div>
          </div>

          <!-- Screens -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Screens</div>
              <span class="fg2 text-xs" style="margin-left: 8px;">
                {{ detail.stats?.activeScreens ?? 0 }} active /
                {{ detail.stats?.totalScreens ?? 0 }} total
              </span>
            </div>
            <table v-if="detail.screens?.length" class="w-full">
              <thead class="border-b border-[var(--border)]">
                <tr class="text-left text-xs">
                  <th class="p-3">ID</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">LGA</th>
                  <th class="p-3 mono">Last seen</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="screen in detail.screens"
                  :key="screen.id"
                  class="border-t border-[var(--border)]"
                >
                  <td class="p-3 mono text-xs">{{ shortId(screen.id) }}</td>
                  <td class="p-3">
                    <span class="pill sm" :class="screenPill(screen.status)">
                      {{ screen.status || '—' }}
                    </span>
                  </td>
                  <td class="p-3 fg2 text-xs">{{ screen.lga || '—' }}</td>
                  <td class="p-3 mono fg2 text-xs">{{ relTime(screen.lastSeenAt) }}</td>
                </tr>
              </tbody>
            </table>
            <EmptyState
              v-else
              icon="ph-monitor"
              title="No screens"
              message="This host has no screens deployed yet."
              style="padding: 24px;"
            />
          </div>

          <!-- Payout history (12 months) -->
          <div class="card" v-if="detail.payoutHistory?.length">
            <div class="card-head">
              <div class="card-title">Payout history · last 12 months</div>
            </div>
            <table class="w-full">
              <thead class="border-b border-[var(--border)]">
                <tr class="text-left text-xs">
                  <th class="p-3">Month</th>
                  <th class="p-3 text-right">Total paid</th>
                  <th class="p-3 text-right">Payouts</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="m in detail.payoutHistory"
                  :key="m.month"
                  class="border-t border-[var(--border)]"
                >
                  <td class="p-3 mono">{{ m.month }}</td>
                  <td class="p-3 text-right mono">{{ formatKobo(m.totalPaidKobo) }}</td>
                  <td class="p-3 text-right mono">{{ m.payoutCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right column -->
        <div class="col" style="gap: 16px;">
          <!-- Earnings balance -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Earnings balance</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="font-display" style="font-size: 28px; line-height: 1; color: var(--fg);">
                {{ formatNaira(detail.balance?.currentBalanceNaira) }}
              </div>
              <div class="fg2 text-xs" style="margin-top: 4px;">pending payout</div>
            </div>
          </div>

          <!-- Status + admin actions -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Account status</div>
            </div>
            <div class="card-body" style="padding: 16px; display: grid; gap: 10px;">
              <div v-if="detail.user?.isSuspended" class="suspended-banner">
                <strong>Suspended</strong>
                <div v-if="detail.user?.suspensionReason" class="fg2 text-xs">
                  Reason: {{ detail.user.suspensionReason }}
                </div>
                <div class="fg2 text-xs mono">
                  {{ relTime(detail.user.suspendedAt) }}
                </div>
              </div>

              <button
                v-if="!detail.user?.isSuspended && canSuspend"
                class="btn outline sm"
                style="color: var(--gold-500);"
                :disabled="suspendMutation.isPending.value"
                @click="onSuspend"
              >
                <i class="ph ph-pause"></i> Suspend
              </button>

              <button
                v-if="detail.user?.isSuspended && canSuspend"
                class="btn outline sm"
                style="color: var(--moss-500);"
                :disabled="reactivateMutation.isPending.value"
                @click="onReactivate"
              >
                <i class="ph ph-play"></i> Reactivate
              </button>

              <button
                v-if="canTerminate"
                class="btn outline sm"
                style="color: var(--danger-500);"
                :disabled="terminateMutation.isPending.value"
                @click="onTerminate"
              >
                <i class="ph ph-trash"></i> Terminate
              </button>

              <p v-if="!canSuspend && !canTerminate" class="fg2 text-xs" style="margin: 0;">
                You don't have permission to take ops actions on this host.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import { hostsApi } from '../api/hosts'
import { useToastStore } from '../stores/toast'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const qc = useQueryClient()
const me = useCurrentAdmin()

const hostId = computed(() => String(route.params.id))

const detailQuery = useQuery({
  queryKey: computed(() => qk.hostDetail(hostId.value)),
  queryFn: () => hostsApi.detail(hostId.value),
  enabled: computed(() => !!hostId.value),
})

const detail = computed(() => detailQuery.data.value)

const businessName = computed(() => detail.value?.profile?.businessName || 'Host')

const status = computed(() => {
  const u = detail.value?.user
  const p = detail.value?.profile
  if (u?.isSuspended) return 'suspended'
  if (p?.isComplete) return 'active'
  return 'pending'
})

const statusPillClass = computed(() => {
  if (status.value === 'active') return 'pill-active'
  if (status.value === 'suspended') return 'pill-failed'
  return 'pill-pending'
})

const canSuspend = computed(() => me.can(PERM.HOSTS_SUSPEND))
const canTerminate = computed(() => me.can(PERM.HOSTS_TERMINATE))

// ── Mutations ────────────────────────────────────────────────────────
function invalidate() {
  qc.invalidateQueries({ queryKey: qk.hostDetail(hostId.value) })
  qc.invalidateQueries({ queryKey: qk.hosts() })
}

const suspendMutation = useMutation({
  mutationFn: (body) => hostsApi.suspend(hostId.value, body),
  onSuccess: () => {
    toast.success('Host suspended.')
    invalidate()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Suspend failed.')
  },
})

const reactivateMutation = useMutation({
  mutationFn: (body) => hostsApi.reactivate(hostId.value, body),
  onSuccess: () => {
    toast.success('Host reactivated.')
    invalidate()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Reactivate failed.')
  },
})

const terminateMutation = useMutation({
  mutationFn: (body) => hostsApi.terminate(hostId.value, body),
  onSuccess: () => {
    toast.success('Host terminated.')
    qc.invalidateQueries({ queryKey: qk.hosts() })
    router.push('/hosts')
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Terminate failed.')
  },
})

function onSuspend() {
  const reason = prompt('Suspension reason (visible in audit log):')
  if (!reason) return
  suspendMutation.mutate({ reason: reason.trim() })
}

function onReactivate() {
  if (!confirm('Reactivate this host? They will be able to sign in again.')) return
  reactivateMutation.mutate({})
}

function onTerminate() {
  const reason = prompt(
    'Termination is permanent. Type a reason to confirm:',
  )
  if (!reason) return
  terminateMutation.mutate({ reason: reason.trim() })
}

// ── Formatters ──────────────────────────────────────────────────────
function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

function screenPill(s) {
  if (s === 'active' || s === 'online') return 'pill-active'
  if (s === 'paused' || s === 'degraded') return 'pill-pending'
  if (s === 'offline' || s === 'retired') return 'pill-failed'
  return 'pill-neutral'
}

function formatNaira(value) {
  if (value == null) return '—'
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
}

function formatKobo(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
}
</script>

<style scoped>
.kv-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 16px;
  font-size: 13px;
}
.kv-label {
  font-size: 12px;
  color: var(--fg-2);
}
.suspended-banner {
  padding: 10px 12px;
  background: rgba(180, 136, 28, 0.08);
  border: 1px solid rgba(180, 136, 28, 0.25);
  border-radius: 6px;
  font-size: 12px;
  display: grid;
  gap: 4px;
}
</style>
