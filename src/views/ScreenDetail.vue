<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <button class="btn ghost sm" @click="$router.push('/screens')">
          <i class="ph ph-arrow-left"></i> Screens
        </button>
        <div class="page-title" style="margin-left: 8px;">
          {{ venueName }}
        </div>
        <span class="pill sm" :class="statusPillClass">{{ status }}</span>
        <span v-if="isOnline" class="pill sm pill-active"><span class="sdot green"></span> online</span>
        <div class="spacer"></div>

        <!-- Status-specific lifecycle actions. Buttons appear only when
             they're a valid next step for the current status, so the
             admin always has the right verb in front of them rather
             than a wall of disabled options. -->
        <button
          v-if="canResume && status === 'pending_install'"
          class="btn primary sm"
          :disabled="activateMutation.isPending.value"
          @click="onActivate"
        >
          <i class="ph ph-check-circle"></i>
          {{ activateMutation.isPending.value ? 'Activating…' : 'Mark as installed' }}
        </button>
        <button
          v-if="canPause && status === 'active'"
          class="btn outline sm"
          :disabled="pauseMutation.isPending.value"
          @click="onPause"
        >
          <i class="ph ph-pause"></i>
          {{ pauseMutation.isPending.value ? 'Pausing…' : 'Pause' }}
        </button>
        <button
          v-if="canResume && (status === 'suspended' || status === 'offline')"
          class="btn primary sm"
          :disabled="resumeMutation.isPending.value"
          @click="onResume"
        >
          <i class="ph ph-play"></i>
          {{ resumeMutation.isPending.value ? 'Resuming…' : 'Resume' }}
        </button>
        <button
          v-if="canRetire && status !== 'decommissioned'"
          class="btn outline sm"
          style="color: var(--danger-500); border-color: rgba(220,80,80,0.3);"
          :disabled="retireMutation.isPending.value"
          @click="onRetire"
        >
          <i class="ph ph-archive"></i>
          {{ retireMutation.isPending.value ? 'Retiring…' : 'Retire' }}
        </button>

        <button class="btn ghost sm" @click="detailQuery.refetch">
          <i class="ph ph-arrow-clockwise"></i>
        </button>
        <button v-if="canManageScreens" class="btn outline sm" @click="openEdit">
          <i class="ph ph-pencil-simple"></i> Edit
        </button>
      </div>
      <div class="page-subtitle">
        <span class="mono fg2 text-xs">{{ screenId }}</span>
        <span v-if="status === 'pending_install'" class="fg2 text-xs" style="margin-left: 12px;">
          · Awaiting field install. Click <span class="font-medium">Mark as installed</span> once the hardware is up.
        </span>
      </div>
    </div>

    <div class="page-body">
      <div v-if="detailQuery.isLoading.value" class="card">
        <RowSkeleton :count="6" />
      </div>

      <ErrorState
        v-else-if="detailQuery.error.value"
        title="Could not load screen"
        :message="detailQuery.error.value?.message"
        :on-retry="detailQuery.refetch"
      />

      <div v-else-if="detail" style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
        <!-- Left column -->
        <div class="col" style="gap: 16px;">
          <!-- Identity & venue -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Venue</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid">
                <div class="kv-label">Venue name</div>
                <div>{{ screen?.venueName || '—' }}</div>
                <div class="kv-label">Venue type</div>
                <div>{{ screen?.venueType || '—' }}</div>
                <div class="kv-label">Display name</div>
                <div>{{ screen?.name || '—' }}</div>
                <div class="kv-label">Status</div>
                <div>
                  <span class="pill sm" :class="statusPillClass">
                    <span class="sdot" :class="dotClass"></span>
                    {{ status }}
                  </span>
                  <span v-if="screen?.suspensionReason" class="fg2 text-xs" style="margin-left: 8px;">
                    {{ screen.suspensionReason }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Location</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid">
                <div class="kv-label">Address</div>
                <div>{{ screen?.address || '—' }}</div>
                <div class="kv-label">Neighborhood</div>
                <div>{{ screen?.neighborhood || '—' }}</div>
                <div class="kv-label">LGA</div>
                <div>{{ screen?.lga || '—' }}</div>
                <div class="kv-label">City / state</div>
                <div>{{ screen?.city || '—' }}, {{ screen?.state || '—' }}</div>
                <div class="kv-label">Country</div>
                <div class="mono">{{ screen?.country || '—' }}</div>
                <div class="kv-label">Coordinates</div>
                <div class="mono fg2 text-xs">
                  <span v-if="screen?.latitude && screen?.longitude">
                    {{ screen.latitude }}, {{ screen.longitude }}
                  </span>
                  <span v-else>not set</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hardware spec -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Hardware</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid">
                <div class="kv-label">Screen size</div>
                <div>{{ screen?.screenSizeInches ? `${screen.screenSizeInches}"` : '—' }}</div>
                <div class="kv-label">Resolution</div>
                <div class="mono">{{ screen?.resolution || '—' }}</div>
                <div class="kv-label">Orientation</div>
                <div>{{ screen?.orientation || '—' }}</div>
                <div class="kv-label">Calibrated</div>
                <div>
                  <span class="pill sm" :class="screen?.isCalibrated ? 'pill-active' : 'pill-pending'">
                    {{ screen?.isCalibrated ? 'calibrated' : 'uncalibrated' }}
                  </span>
                  <span v-if="screen?.calibrationFactor" class="mono fg2 text-xs" style="margin-left: 8px;">
                    factor {{ screen.calibrationFactor }}
                  </span>
                </div>
                <div class="kv-label">Photo</div>
                <div>
                  <a v-if="screen?.photoUrl" :href="screen.photoUrl" target="_blank" rel="noopener">
                    {{ screen.photoUrl }}
                  </a>
                  <span v-else>—</span>
                </div>
                <div class="kv-label">Installed</div>
                <div class="mono fg2 text-xs">{{ relTime(screen?.installedAt) }}</div>
                <div class="kv-label">Last seen</div>
                <div class="mono fg2 text-xs">{{ relTime(screen?.lastSeenAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Pricing & audience -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Pricing & audience</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div class="kv-grid">
                <div class="kv-label">Base price</div>
                <div>{{ formatKobo(screen?.basePriceKobo) }}</div>
                <div class="kv-label">Daily reach</div>
                <div>{{ screen?.estimatedDailyReach != null ? screen.estimatedDailyReach.toLocaleString('en-NG') : '—' }}</div>
                <div class="kv-label">Avg. attention</div>
                <div>{{ screen?.averageAttentionSeconds != null ? `${screen.averageAttentionSeconds}s` : '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Recent plays -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Recent plays</div>
              <div class="spacer"></div>
              <span class="fg2 text-xs">{{ recentPlays.length }} shown · last 7d</span>
            </div>
            <div v-if="recentPlays.length === 0" style="padding: 24px; text-align: center;" class="fg2 text-xs">
              No plays recorded yet.
            </div>
            <table v-else class="w-full">
              <thead class="border-b border-[var(--border)]">
                <tr class="text-left text-xs">
                  <th class="p-3">When</th>
                  <th class="p-3">Creative</th>
                  <th class="p-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in recentPlays.slice(0, 20)"
                  :key="p.id"
                  class="border-t border-[var(--border)]"
                >
                  <td class="p-3 mono text-xs">{{ relTime(p.playedAt) }}</td>
                  <td class="p-3 mono text-xs">{{ p.creativeId?.slice(0, 8) || '—' }}…</td>
                  <td class="p-3 text-right mono">
                    {{ formatKobo(p.actualRevenueKobo ?? p.expectedRevenueKobo) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right column -->
        <div class="col" style="gap: 16px;">
          <!-- Host -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Host</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div v-if="detail.host" class="kv-grid">
                <div class="kv-label">Business</div>
                <div>
                  <router-link :to="`/hosts/${detail.host.id}`" class="font-medium" style="color: var(--fg);">
                    {{ detail.host.businessName || '—' }}
                  </router-link>
                </div>
                <div class="kv-label">Type</div>
                <div>{{ detail.host.businessType || '—' }}</div>
                <div class="kv-label">Owner</div>
                <div>{{ detail.user?.name || '—' }}</div>
                <div class="kv-label">Phone</div>
                <div class="mono">{{ detail.user?.phoneNumber || '—' }}</div>
                <div class="kv-label">Email</div>
                <div class="mono">{{ detail.user?.email || '—' }}</div>
              </div>
              <div v-else class="fg2 text-xs">
                No host assigned. Use Assign on the screens list to attach this row to a host.
              </div>
            </div>
          </div>

          <!-- Earnings (last 7 days) -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Earnings (7 days)</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div v-if="earningsTrend.length === 0" class="fg2 text-xs">
                No revenue in the last 7 days.
              </div>
              <div v-else class="kv-grid">
                <template v-for="row in earningsTrend" :key="row.date">
                  <div class="kv-label mono">{{ row.date }}</div>
                  <div>
                    <span class="font-medium">{{ formatKobo(row.totalEarningsKobo) }}</span>
                    <span class="fg2 text-xs"> · {{ row.playCount }} plays</span>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Latest heartbeat -->
          <div class="card">
            <div class="card-head">
              <div class="card-title">Player health</div>
            </div>
            <div class="card-body" style="padding: 16px;">
              <div v-if="!detail.latestHeartbeat" class="fg2 text-xs">
                No heartbeat received yet.
              </div>
              <div v-else class="kv-grid">
                <div class="kv-label">State</div>
                <div>
                  <span class="pill sm" :class="hbStatePill(detail.latestHeartbeat.playerState)">
                    {{ detail.latestHeartbeat.playerState }}
                  </span>
                </div>
                <div class="kv-label">Last beat</div>
                <div class="mono fg2 text-xs">{{ relTime(detail.latestHeartbeat.timestamp) }}</div>
                <div class="kv-label">Online</div>
                <div>
                  <span class="pill sm" :class="isOnline ? 'pill-active' : 'pill-failed'">
                    {{ isOnline ? 'online' : 'offline' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <ScreenEditModal
      v-if="editing"
      :screen="screen"
      :busy="updateMutation.isPending.value"
      :venue-types="VENUE_TYPES"
      :lgas="LAGOS_LGAS"
      @cancel="cancelEdit"
      @submit="onSubmitEdit"
    />

    <ScreenActivateModal
      v-if="activating && screen"
      :screen="screen"
      :busy="activateMutation.isPending.value"
      @cancel="cancelActivate"
      @confirm="confirmActivate"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query'

import { adminScreensApi } from '../api/screens'
import { useToastStore } from '../stores/toast'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { PERM } from '../lib/permissions'

import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'
import ScreenEditModal from '../components/ScreenEditModal.vue'
import ScreenActivateModal from '../components/ScreenActivateModal.vue'

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()
const toast = useToastStore()
const me = useCurrentAdmin()

const VENUE_TYPES = [
  'pharmacy', 'salon', 'restaurant', 'eatery', 'supermarket',
  'electronics', 'fashion', 'fitness', 'clinic', 'other',
]
const LAGOS_LGAS = [
  'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
]

const screenId = computed(() => String(route.params.id))

const detailQuery = useQuery({
  queryKey: computed(() => qk.screenDetail(screenId.value)),
  queryFn: () => adminScreensApi.detail(screenId.value),
  enabled: computed(() => !!screenId.value),
})

const detail = computed(() => detailQuery.data.value)
const screen = computed(() => detail.value?.screen)

const venueName = computed(() => screen.value?.venueName || 'Screen')
const status = computed(() => screen.value?.status || 'unknown')
const isOnline = computed(() => Boolean(detail.value?.stats?.isOnline))
const recentPlays = computed(() => detail.value?.recentPlays || [])
const earningsTrend = computed(() => detail.value?.earningsTrend || [])

const statusPillClass = computed(() => {
  const s = status.value
  if (s === 'active') return 'pill-active'
  if (s === 'pending_install') return 'pill-pending'
  if (s === 'suspended' || s === 'paused' || s === 'decommissioned') return 'pill-failed'
  return 'pill-pending'
})

const dotClass = computed(() => {
  const s = status.value
  if (s === 'active') return 'green'
  if (s === 'pending_install') return 'amber'
  return 'red'
})

const canManageScreens = computed(() => me.can(PERM.SCREENS_REASSIGN))
const canPause = computed(() => me.can(PERM.SCREENS_PAUSE))
const canResume = computed(() => me.can(PERM.SCREENS_RESUME))
const canRetire = computed(() => me.can(PERM.SCREENS_RETIRE))

// ── Mutations ────────────────────────────────────────────────────────
function invalidate() {
  qc.invalidateQueries({ queryKey: qk.screenDetail(screenId.value) })
  qc.invalidateQueries({ queryKey: qk.screens() })
}

const updateMutation = useMutation({
  mutationFn: (patch) => adminScreensApi.update(screenId.value, patch),
  onSuccess: () => {
    toast.success('Screen updated.')
    editing.value = false
    invalidate()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Update failed.')
  },
})

const activateMutation = useMutation({
  mutationFn: () => adminScreensApi.activate(screenId.value),
  onSuccess: () => {
    toast.success('Screen activated. Ad serving begins on next heartbeat.')
    invalidate()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Activate failed.')
  },
})

const pauseMutation = useMutation({
  mutationFn: (reason) => adminScreensApi.pause(screenId.value, { reason }),
  onSuccess: () => {
    toast.success('Screen paused.')
    invalidate()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Pause failed.')
  },
})

const resumeMutation = useMutation({
  mutationFn: () => adminScreensApi.resume(screenId.value),
  onSuccess: () => {
    toast.success('Screen resumed.')
    invalidate()
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Resume failed.')
  },
})

const retireMutation = useMutation({
  mutationFn: (reason) => adminScreensApi.retire(screenId.value, { reason }),
  onSuccess: () => {
    toast.success('Screen retired.')
    invalidate()
    router.push('/screens')
  },
  onError: (err) => {
    if (!err?.needsReauth) toast.error(err?.message || 'Retire failed.')
  },
})

// ── Edit modal wiring ────────────────────────────────────────────────
const editing = ref(false)
function openEdit() {
  editing.value = true
}
function cancelEdit() {
  if (updateMutation.isPending.value) return
  editing.value = false
}
function onSubmitEdit(patch) {
  if (!patch || Object.keys(patch).length === 0) {
    toast.success('No changes.')
    editing.value = false
    return
  }
  updateMutation.mutate(patch)
}

// ── Lifecycle actions ────────────────────────────────────────────────
const activating = ref(false)
function onActivate() {
  activating.value = true
}
function cancelActivate() {
  if (activateMutation.isPending.value) return
  activating.value = false
}
function confirmActivate() {
  activateMutation.mutate(undefined, {
    onSuccess: () => {
      activating.value = false
    },
  })
}

function onPause() {
  const reason = prompt('Pause reason (visible in audit log):')
  if (!reason) return
  pauseMutation.mutate(reason.trim())
}

function onResume() {
  if (!confirm('Resume this screen? Ad serving will start on the next heartbeat.')) return
  resumeMutation.mutate()
}

function onRetire() {
  const reason = prompt(
    'Retiring removes the screen from inventory permanently. Type a reason to confirm:',
  )
  if (!reason) return
  retireMutation.mutate(reason.trim())
}

// ── Formatters ──────────────────────────────────────────────────────
function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}

function hbStatePill(s) {
  if (s === 'ONLINE') return 'pill-active'
  if (s === 'DEGRADED') return 'pill-pending'
  return 'pill-failed'
}

function formatKobo(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  if (!Number.isFinite(naira)) return '—'
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
</style>
