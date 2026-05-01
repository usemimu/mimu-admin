<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Screens</div>
        <span class="fg2 text-xs">{{ summaryLabel }}</span>
        <div class="spacer"></div>
        <div class="flex gap-1">
          <button class="btn sm" :class="view === 'map' ? 'outline' : 'ghost'" @click="view = 'map'">
            <i class="ph ph-map-pin"></i> Map
          </button>
          <button class="btn sm" :class="view === 'table' ? 'outline' : 'ghost'" @click="view = 'table'">
            <i class="ph ph-table"></i> Table
          </button>
        </div>
        <button v-if="canManageScreens" class="btn primary sm" @click="openCreate">
          <i class="ph ph-plus"></i> New screen
        </button>
      </div>
    </div>

    <!-- Map View -->
    <div v-if="view === 'map'" style="position: relative; height: calc(100vh - 44px - 73px); overflow: hidden;">
      <!-- Fake map background -->
      <div style="position: absolute; inset: 0; background: radial-gradient(circle at 30% 40%, var(--bg-sunken) 0%, var(--bg) 60%), linear-gradient(135deg, var(--bg) 0%, var(--bg-sunken) 100%);">
        <svg width="100%" height="100%" style="position: absolute; inset: 0;">
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)"/>
          <!-- Fake roads -->
          <path d="M 100 200 Q 400 180 700 250 T 1400 300" stroke="var(--border-strong)" stroke-width="3" fill="none" opacity="0.5"/>
          <path d="M 200 100 L 250 700" stroke="var(--border-strong)" stroke-width="2" fill="none" opacity="0.5"/>
          <path d="M 600 50 Q 620 400 680 750" stroke="var(--border-strong)" stroke-width="2" fill="none" opacity="0.5"/>
          <path d="M 900 80 Q 880 380 1000 700" stroke="var(--border-strong)" stroke-width="2" fill="none" opacity="0.5"/>
          <path d="M 50 450 L 1500 470" stroke="var(--border-strong)" stroke-width="2" fill="none" opacity="0.5"/>
          <!-- LGA cluster labels -->
          <text x="200" y="170" fill="var(--fg-3)" font-size="10" font-family="var(--f-mono)" opacity="0.6">YABA</text>
          <text x="600" y="170" fill="var(--fg-3)" font-size="10" font-family="var(--f-mono)" opacity="0.6">SURULERE</text>
          <text x="900" y="170" fill="var(--fg-3)" font-size="10" font-family="var(--f-mono)" opacity="0.6">IKEJA</text>
          <text x="1200" y="400" fill="var(--fg-3)" font-size="10" font-family="var(--f-mono)" opacity="0.6">LEKKI</text>
        </svg>
        <!-- Screen pins -->
        <div
          v-for="(pin, i) in mapPins"
          :key="i"
          @click="selectedPin = { id: `MMU-${4700 + i}`, c: pin.c, n: pin.n }"
          :style="{
            position: 'absolute',
            left: pin.x + 'px',
            top: pin.y + 'px',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer'
          }"
        >
          <!-- Cluster (multiple screens) -->
          <div
            v-if="pin.n > 1"
            :style="{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: pin.c === 'green' ? 'var(--moss-500)' : pin.c === 'amber' ? 'var(--gold-500)' : 'var(--danger-500)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700',
              fontFamily: 'var(--f-mono)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              border: '2px solid var(--bg)'
            }"
          >
            {{ pin.n }}
          </div>
          <!-- Single screen -->
          <div
            v-else
            :class="{ pulse: pin.c !== 'green' }"
            :style="{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: pin.c === 'green' ? 'var(--moss-500)' : pin.c === 'amber' ? 'var(--gold-500)' : 'var(--danger-500)',
              boxShadow: '0 0 0 3px var(--bg), 0 2px 4px rgba(0,0,0,0.3)'
            }"
          ></div>
        </div>
      </div>

      <!-- Filter panel -->
      <div style="position: absolute; top: 16px; left: 16px; width: 260px;" class="card raised">
        <div class="card-head">
          <div class="card-title">Filters</div>
          <div class="spacer"></div>
          <button
            class="btn ghost sm"
            :disabled="!hasActiveFilters"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
        <div style="padding: 14px;">
          <div class="field" style="margin-bottom: 10px;">
            <label>Status</label>
            <div class="flex g4" style="flex-wrap: wrap;">
              <button
                class="btn outline sm"
                :class="{ active: filters.status === 'active' }"
                @click="toggleStatus('active')"
              >
                <span class="sdot green"></span> Active {{ statusCounts.active }}
              </button>
              <button
                class="btn outline sm"
                :class="{ active: filters.status === 'pending_install' }"
                @click="toggleStatus('pending_install')"
              >
                <span class="sdot amber"></span> Pending {{ statusCounts.pending_install }}
              </button>
              <button
                class="btn outline sm"
                :class="{ active: filters.status === 'offline' }"
                @click="toggleStatus('offline')"
              >
                <span class="sdot red"></span> Offline {{ statusCounts.offline }}
              </button>
              <button
                class="btn outline sm"
                :class="{ active: filters.status === 'suspended' }"
                @click="toggleStatus('suspended')"
              >
                <span class="sdot red"></span> Suspended {{ statusCounts.suspended }}
              </button>
            </div>
          </div>
          <div class="field" style="margin-bottom: 10px;">
            <label>LGA</label>
            <select v-model="filters.lga" class="select">
              <option :value="undefined">All LGAs</option>
              <option v-for="lga in availableLgas" :key="lga" :value="lga">
                {{ humanLga(lga) }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div style="position: absolute; top: 16px; left: 50%; transform: translateX(-50%); width: 360px;">
        <div class="card raised" style="display: flex; align-items: center; padding: 6px 10px; gap: 8px;">
          <i class="ph ph-magnifying-glass" style="color: var(--fg-3);"></i>
          <input
            v-model="searchInput"
            class="input"
            style="border: none; padding: 0;"
            placeholder="Find screen by ID, host, or address…"
            @keyup.enter="applySearch"
          />
          <button v-if="filters.search" class="btn ghost sm" @click="clearSearch">
            <i class="ph ph-x"></i>
          </button>
        </div>
      </div>

      <!-- Legend -->
      <div style="position: absolute; bottom: 16px; right: 16px;" class="card raised">
        <div style="padding: 10px; font-size: 11px;">
          <div class="flex ac g8" style="margin-bottom: 4px;"><span class="sdot green"></span> Active ({{ statusCounts.active }})</div>
          <div class="flex ac g8" style="margin-bottom: 4px;"><span class="sdot amber"></span> Pending ({{ statusCounts.pending_install }})</div>
          <div class="flex ac g8" style="margin-bottom: 4px;"><span class="sdot red"></span> Offline ({{ statusCounts.offline }})</div>
          <div class="flex ac g8"><span class="sdot red"></span> Suspended ({{ statusCounts.suspended }})</div>
        </div>
      </div>

      <!-- Side panel on select -->
      <div v-if="selectedPin" style="position: absolute; top: 16px; right: 16px; bottom: 16px; width: 320px;" class="card raised">
        <div class="card-head">
          <div>
            <div style="font-size: 11px; color: var(--fg-3); font-family: var(--f-mono);">SCREEN</div>
            <div style="font-weight: 700;">{{ selectedPin.id }}</div>
          </div>
          <div class="spacer"></div>
          <button class="btn ghost sm" @click="selectedPin = null"><i class="ph ph-x"></i></button>
        </div>
        <div style="padding: 14px;">
          <div style="aspect-ratio: 16/9; background: var(--bg-sunken); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--fg-3); font-size: 11px; margin-bottom: 12px;">
            <i class="ph ph-image" style="font-size: 24px;"></i>
          </div>
          <div class="flex ac g8" style="margin-bottom: 10px;">
            <span class="pill" :class="{
              'pill-active': selectedPin.c === 'green',
              'pill-pending': selectedPin.c === 'amber',
              'pill-failed': selectedPin.c === 'red'
            }">
              {{ selectedPin.c === 'green' ? 'online' : selectedPin.c === 'amber' ? 'degraded' : 'offline' }}
            </span>
          </div>
          <div class="fg2 text-xs" style="margin-bottom: 14px;">
            Detail metrics will populate once the map is wired to live screen data.
          </div>
          <button class="btn primary" style="width: 100%;" @click="$router.push('/screens')">
            Open screen detail <i class="ph ph-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="page-body">
      <div class="filterbar" style="margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
        <button
          v-for="opt in STATUS_FILTERS"
          :key="opt.value || 'all'"
          class="btn sm outline"
          :class="{ active: filters.status === opt.value }"
          @click="filters.status = opt.value"
        >
          <span v-if="opt.dot" class="sdot" :class="opt.dot"></span> {{ opt.label }}
        </button>
        <select v-model="filters.lga" class="input sm" style="width: 180px;">
          <option :value="undefined">All LGAs</option>
          <option v-for="lga in availableLgas" :key="lga" :value="lga">
            {{ humanLga(lga) }}
          </option>
        </select>
        <button v-if="hasActiveFilters" class="btn ghost sm" @click="resetFilters">
          <i class="ph ph-x"></i> Clear
        </button>
        <div class="spacer"></div>
        <div style="position: relative;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 8px; top: 8px; color: var(--fg-3); font-size: 14px;"></i>
          <input
            v-model="searchInput"
            class="input sm"
            placeholder="Find screen by ID, host, or address…"
            style="padding-left: 28px; width: 280px;"
            @keyup.enter="applySearch"
          />
        </div>
      </div>
      <div class="card overflow-hidden">
        <RowSkeleton v-if="screensQuery.isLoading.value" :count="6" />
        <ErrorState
          v-else-if="screensQuery.error.value"
          title="Could not load screens"
          :message="screensQuery.error.value?.message"
          :on-retry="screensQuery.refetch"
        />
        <EmptyState
          v-else-if="!screens.length"
          icon="ph-monitor"
          title="No screens deployed yet"
          message="Screens come online once a host completes pairing. Pending invites will surface here when they activate."
        />
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Venue</th>
              <th class="p-3">Host</th>
              <th class="p-3">Location</th>
              <th class="p-3">Status</th>
              <th class="p-3">Last seen</th>
              <th class="p-3">Type</th>
              <th class="p-3 w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="screen in screens"
              :key="screen.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <router-link
                  :to="`/screens/${screen.id}`"
                  class="font-medium"
                  style="color: var(--fg);"
                >
                  {{ screen.venueName || '—' }}
                </router-link>
                <div class="mono text-xs fg2">{{ screen.id?.slice(0, 8) }}…</div>
              </td>
              <td class="p-3">
                <span v-if="screen.hostName" class="font-medium">{{ screen.hostName }}</span>
                <span v-else class="pill pill-pending sm">unassigned</span>
              </td>
              <td class="p-3 fg2 text-xs">
                <div>{{ screen.neighborhood || humanLga(screen.lga) || '—' }}</div>
                <div class="fg2">{{ screen.address || '' }}</div>
              </td>
              <td class="p-3">
                <span class="pill" :class="pillClass(screen.status)">
                  <span class="sdot" :class="dotClass(screen.status)"></span>
                  {{ screen.status }}
                </span>
              </td>
              <td class="p-3 mono text-xs">
                {{ relTime(screen.lastSeenAt) }}
              </td>
              <td class="p-3 fg2 text-xs">{{ screen.venueType || '—' }}</td>
              <td class="p-3 text-right">
                <div class="flex" style="gap: 4px; justify-content: flex-end;">
                  <button
                    v-if="canManageScreens"
                    class="btn ghost xs"
                    :disabled="busyId === screen.id"
                    @click="openEdit(screen)"
                    title="Edit screen"
                  >
                    <i class="ph ph-pencil-simple"></i> Edit
                  </button>
                  <button
                    v-if="!isAssigned(screen)"
                    class="btn primary xs"
                    :disabled="busyId === screen.id"
                    @click="openAssign(screen)"
                  >
                    Assign host
                  </button>
                  <button
                    v-else-if="screen.status === 'pending_install'"
                    class="btn primary xs"
                    :disabled="busyId === screen.id"
                    @click="onActivate(screen)"
                    title="Mark as installed and live"
                  >
                    Mark installed
                  </button>
                  <button
                    v-else-if="screen.status === 'active'"
                    class="btn outline xs"
                    :disabled="busyId === screen.id"
                    @click="onPause(screen)"
                  >
                    Pause
                  </button>
                  <button
                    v-else-if="screen.status === 'paused' || screen.status === 'inactive' || screen.status === 'suspended' || screen.status === 'offline'"
                    class="btn outline xs"
                    :disabled="busyId === screen.id"
                    @click="onResume(screen)"
                  >
                    Resume
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign-host modal — shown when admin clicks "Assign host" on
         an unassigned screen. Reauth-gated server-side; if the
         admin's reauth window has lapsed the global reauth modal
         picks up the 403 and replays the request. -->
    <div
      v-if="assignTarget"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
      @click.self="cancelAssign"
    >
      <div class="card" style="padding: 22px; width: 480px; max-width: 92vw;">
        <h3 style="margin: 0 0 4px;">Assign screen to host</h3>
        <p class="fg2 text-xs" style="margin: 0 0 14px;">
          Screen <span class="mono">{{ assignTarget.id }}</span>
          will be assigned to the host you choose. Their dashboard updates
          immediately and ad serving begins on the next heartbeat.
        </p>

        <label class="text-xs fg2 block mb-1">Host</label>
        <select
          v-model="assignHostId"
          class="input"
          style="width: 100%; margin-bottom: 12px;"
          :disabled="hostsForAssignmentQuery.isLoading.value"
        >
          <option value="" disabled>
            {{ hostsForAssignmentQuery.isLoading.value ? 'Loading hosts…' : 'Select a host…' }}
          </option>
          <option v-for="h in hostOptions" :key="h.id" :value="h.id">
            {{ h.label }}
          </option>
        </select>

        <label class="text-xs fg2 block mb-1">Reason (audited)</label>
        <input
          v-model="assignReason"
          class="input"
          style="width: 100%; margin-bottom: 16px;"
          placeholder="e.g. Initial install at venue"
        />

        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="cancelAssign">Cancel</button>
          <button
            class="btn primary sm"
            :disabled="!assignHostId || busyId === assignTarget.id"
            @click="confirmAssign"
          >
            {{ busyId === assignTarget.id ? 'Assigning…' : 'Assign' }}
          </button>
        </div>
      </div>
    </div>

    <!-- New-screen modal — stages a screen row before hardware install.
         host_id stays null until ops uses "Assign host" or the
         host claims an invite that referenced the screen id. -->
    <div
      v-if="creatingScreen"
      class="modal-backdrop"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
      @click.self="cancelCreate"
    >
      <div class="card" style="padding: 22px; width: 520px; max-width: 92vw;">
        <h3 style="margin: 0 0 4px;">New screen</h3>
        <p class="fg2 text-xs" style="margin: 0 0 14px;">
          Creates a screen row in <span class="mono">pending_install</span>.
          Assign it to a host now or leave for later.
        </p>

        <div class="flex" style="gap: 12px; margin-bottom: 12px;">
          <div style="flex: 2;">
            <label class="text-xs fg2 block mb-1">Venue name</label>
            <input
              v-model.trim="newScreen.venueName"
              class="input"
              style="width: 100%;"
              placeholder="Apex Pharmacy"
              required
            />
          </div>
          <div style="flex: 1;">
            <label class="text-xs fg2 block mb-1">Venue type</label>
            <select v-model="newScreen.venueType" class="input" style="width: 100%;">
              <option value="" disabled>Select…</option>
              <option v-for="t in VENUE_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <label class="text-xs fg2 block mb-1">Street address</label>
        <input
          v-model.trim="newScreen.address"
          class="input"
          style="width: 100%; margin-bottom: 12px;"
          placeholder="12 Allen Avenue"
          required
        />

        <div class="flex" style="gap: 12px; margin-bottom: 12px;">
          <div style="flex: 1;">
            <label class="text-xs fg2 block mb-1">Neighborhood / LGA</label>
            <select v-model="newScreen.neighborhood" class="input" style="width: 100%;">
              <option value="" disabled>Select…</option>
              <option v-for="l in LAGOS_LGAS" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label class="text-xs fg2 block mb-1">Orientation</label>
            <select v-model="newScreen.orientation" class="input" style="width: 100%;">
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>
        </div>

        <label class="text-xs fg2 block mb-1">
          Assign to host <span class="fg2">(optional · leave blank to assign later)</span>
        </label>
        <select v-model="newScreen.hostId" class="input" style="width: 100%; margin-bottom: 16px;">
          <option value="">— No host yet —</option>
          <option v-for="h in hostOptions" :key="h.id" :value="h.id">
            {{ h.label }}
          </option>
        </select>

        <div class="flex" style="gap: 8px; justify-content: flex-end;">
          <button class="btn ghost sm" @click="cancelCreate">Cancel</button>
          <button
            class="btn primary sm"
            :disabled="!canSubmitCreate || createBusy"
            @click="submitCreate"
          >
            {{ createBusy ? 'Creating…' : 'Create screen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit-screen modal — patches venue / location / spec / pricing
         fields on an existing row. Status, host, install, and
         calibration changes have dedicated endpoints (Pause/Resume,
         Assign host, etc.) and are NOT exposed here. -->
    <ScreenEditModal
      v-if="editingScreen"
      :screen="editingScreen"
      :busy="editBusy"
      :venue-types="VENUE_TYPES"
      :lgas="LAGOS_LGAS"
      @cancel="cancelEdit"
      @submit="submitEdit"
    />

    <!-- Activate (mark as installed) confirmation modal — drives
         pending_install → active. -->
    <ScreenActivateModal
      v-if="activateTarget"
      :screen="activateTarget"
      :busy="activateBusy"
      @cancel="cancelActivate"
      @confirm="confirmActivate"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { adminScreensApi } from '../api/screens'
import { hostsApi } from '../api/hosts'
import { useCurrentAdmin } from '../composables/useCurrentAdmin'
import { useToastStore } from '../stores/toast'
import { fmt } from '../utils/format'
import { qk } from '../lib/queryKeys'
import { extractList } from '../lib/response'
import { PERM } from '../lib/permissions'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import RowSkeleton from '../components/RowSkeleton.vue'
import ScreenEditModal from '../components/ScreenEditModal.vue'
import ScreenActivateModal from '../components/ScreenActivateModal.vue'

const me = useCurrentAdmin()
const toast = useToastStore()
const qc = useQueryClient()

const view = ref('table')
const selectedPin = ref(null)

const filters = ref({
  status: undefined,
  lga: undefined,
  search: undefined,
})
const searchInput = ref('')

const queryParams = computed(() => {
  const out = {}
  if (filters.value.status) out.status = filters.value.status
  if (filters.value.lga) out.lga = filters.value.lga
  if (filters.value.search) out.search = filters.value.search
  return out
})

// Mirrors `screen_status` enum in packages/db/src/schema/screens.ts.
// Values must match the DB enum exactly — Postgres throws a 22P02 if
// the filter ever sends a value that isn't part of the enum.
const STATUS_FILTERS = [
  { value: undefined, label: 'All' },
  { value: 'active', label: 'Active', dot: 'green' },
  { value: 'pending_install', label: 'Pending install', dot: 'amber' },
  { value: 'offline', label: 'Offline', dot: 'red' },
  { value: 'suspended', label: 'Suspended', dot: 'red' },
  { value: 'decommissioned', label: 'Decommissioned' },
]

const screensQuery = useQuery({
  queryKey: computed(() => qk.screens(queryParams.value)),
  queryFn: () => adminScreensApi.list(queryParams.value),
  keepPreviousData: true,
})

// Flatten the API's nested { screen, host, user } row shape into a flat
// row the table can render directly. Keeps host/user as nested objects
// for places that prefer them (e.g. assignment detection).
const screens = computed(() => {
  const rows = extractList(screensQuery.data.value, 'screens')
  return rows.map((row) => {
    const s = row.screen || row
    return {
      ...s,
      host: row.host || null,
      user: row.user || null,
      hostName: row.host?.businessName || row.user?.name || null,
      ownerName: row.user?.name || null,
      ownerPhone: row.user?.phoneNumber || null,
    }
  })
})

// Pull the LGA list from whatever's currently in the result set so
// the dropdown adapts to real inventory rather than a hardcoded list.
const availableLgas = computed(() => {
  const seen = new Set()
  for (const s of screens.value) {
    if (s.lga) seen.add(s.lga)
  }
  return [...seen].sort()
})

const hasActiveFilters = computed(
  () => Boolean(filters.value.status || filters.value.lga || filters.value.search),
)

function toggleStatus(value) {
  // Click again to clear — single-select with toggle-off semantics.
  filters.value.status = filters.value.status === value ? undefined : value
}

function applySearch() {
  filters.value.search = searchInput.value.trim() || undefined
}

function clearSearch() {
  searchInput.value = ''
  filters.value.search = undefined
}

function resetFilters() {
  filters.value = { status: undefined, lga: undefined, search: undefined }
  searchInput.value = ''
}

const statusCounts = computed(() => {
  const counts = {
    active: 0,
    pending_install: 0,
    offline: 0,
    suspended: 0,
    decommissioned: 0,
  }
  for (const s of screens.value) {
    if (counts[s.status] !== undefined) counts[s.status]++
  }
  return counts
})

const summaryLabel = computed(() => {
  if (screensQuery.isLoading.value) return 'Loading…'
  const total = screens.value.length
  const c = statusCounts.value
  const inactive = c.offline + c.suspended
  return `${total} total · ${c.active} active · ${c.pending_install} pending · ${inactive} inactive`
})

function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}
function humanLga(lga) {
  if (!lga) return '—'
  return String(lga).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function pillClass(s) {
  if (s === 'active') return 'pill-active'
  if (s === 'pending_install') return 'pill-pending'
  if (s === 'offline' || s === 'suspended' || s === 'decommissioned') return 'pill-failed'
  return 'pill-pending'
}
function dotClass(s) {
  if (s === 'active') return 'green'
  if (s === 'pending_install') return 'amber'
  return 'red pulse'
}

const busyId = ref(null)

async function onPause(screen) {
  busyId.value = screen.id
  try {
    await adminScreensApi.pause(screen.id)
    toast.success(`${screen.id} paused.`)
    await qc.invalidateQueries({ queryKey: qk.screens() })
  } catch (err) {
    if (!err?.needsReauth) toast.error(err?.message || 'Pause failed.')
  } finally {
    busyId.value = null
  }
}

async function onResume(screen) {
  busyId.value = screen.id
  try {
    await adminScreensApi.resume(screen.id)
    toast.success(`${screen.id} resumed.`)
    await qc.invalidateQueries({ queryKey: qk.screens() })
  } catch (err) {
    if (!err?.needsReauth) toast.error(err?.message || 'Resume failed.')
  } finally {
    busyId.value = null
  }
}

// ── Activate (mark as installed) ─────────────────────────────────────
const activateTarget = ref(null)
const activateBusy = ref(false)

function onActivate(screen) {
  activateTarget.value = screen
}

function cancelActivate() {
  if (activateBusy.value) return
  activateTarget.value = null
}

async function confirmActivate() {
  if (!activateTarget.value) return
  const screen = activateTarget.value
  activateBusy.value = true
  busyId.value = screen.id
  try {
    await adminScreensApi.activate(screen.id)
    toast.success(`${screen.venueName || screen.id} activated.`)
    activateTarget.value = null
    await qc.invalidateQueries({ queryKey: qk.screens() })
  } catch (err) {
    if (!err?.needsReauth) toast.error(err?.message || 'Activate failed.')
  } finally {
    activateBusy.value = false
    busyId.value = null
  }
}

// ── Assign host ──────────────────────────────────────────────────────
// Reuses POST /admin/screens/:id/reassign-host. The endpoint is named
// for the more common case (moving a screen between hosts) but it
// accepts unassigned screens just as well — the new host_id replaces
// the existing value (NULL or otherwise). Reauth-gated.
function isAssigned(screen) {
  return Boolean(screen.hostId || screen.host?.id || screen.host?.businessName)
}

const assignTarget = ref(null)
const assignHostId = ref('')
const assignReason = ref('')

// Create-screen state must be declared before hostsForAssignmentQuery
// because the query's `enabled` closure references creatingScreen — vue-query
// evaluates `enabled` eagerly during setup, so any later declaration trips TDZ.
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

const canManageScreens = computed(() => me.can(PERM.SCREENS_REASSIGN))

const creatingScreen = ref(false)
const createBusy = ref(false)
const newScreen = ref({
  venueName: '',
  venueType: '',
  address: '',
  neighborhood: '',
  orientation: 'landscape',
  hostId: '',
})

const canSubmitCreate = computed(
  () =>
    !!newScreen.value.venueName &&
    !!newScreen.value.venueType &&
    !!newScreen.value.address &&
    !!newScreen.value.neighborhood,
)

const hostsForAssignmentQuery = useQuery({
  queryKey: ['admin', 'hosts', 'assign-picker'],
  queryFn: () => hostsApi.list({ limit: 200 }),
  // Lazy-load the host list when either modal opens. Both share the
  // same dropdown so a single query covers both flows.
  enabled: computed(() => !!assignTarget.value || creatingScreen.value),
})

const hostOptions = computed(() => {
  const raw = hostsForAssignmentQuery.data.value
  const list = Array.isArray(raw?.hosts) ? raw.hosts : []
  return list.map((row) => ({
    // host_profiles.id is what screens.host_id references
    id: row.profile?.id,
    label: row.profile?.businessName || row.user?.name || row.user?.phoneNumber || row.profile?.id,
  })).filter((h) => h.id)
})

function openAssign(screen) {
  assignTarget.value = screen
  assignHostId.value = ''
  assignReason.value = 'Initial install'
}

function cancelAssign() {
  assignTarget.value = null
  assignHostId.value = ''
}

async function confirmAssign() {
  if (!assignTarget.value || !assignHostId.value) return
  busyId.value = assignTarget.value.id
  try {
    await adminScreensApi.reassignHost(assignTarget.value.id, {
      newHostId: assignHostId.value,
      reason: assignReason.value || 'Initial install',
    })
    toast.success('Screen assigned.')
    cancelAssign()
    await qc.invalidateQueries({ queryKey: qk.screens() })
  } catch (err) {
    if (!err?.needsReauth) toast.error(err?.message || 'Assign failed.')
  } finally {
    busyId.value = null
  }
}

// ── Create new screen ───────────────────────────────────────────────
// Posts to /admin/screens; ops uses this to stage hardware ahead of
// install. host_id can be left null and the "Assign host" action
// fills it in once the host has claimed an invite.
// (state declared above hostsForAssignmentQuery to avoid TDZ in `enabled`)

function openCreate() {
  // Reuse the same hostsForAssignmentQuery-driven list as the assign
  // modal — stage a "fake" assign target so the existing query
  // enables and we get host options for the optional host pick.
  // The query is gated on `assignTarget` being truthy elsewhere, so
  // we just kick the same key here to ensure the host list loads.
  qc.prefetchQuery({
    queryKey: ['admin', 'hosts', 'assign-picker'],
    queryFn: () => hostsApi.list({ limit: 200 }),
  })
  newScreen.value = {
    venueName: '',
    venueType: '',
    address: '',
    neighborhood: '',
    orientation: 'landscape',
    hostId: '',
  }
  creatingScreen.value = true
}

function cancelCreate() {
  creatingScreen.value = false
}

async function submitCreate() {
  if (!canSubmitCreate.value) return
  createBusy.value = true
  try {
    const body = {
      venueName: newScreen.value.venueName,
      venueType: newScreen.value.venueType,
      address: newScreen.value.address,
      neighborhood: newScreen.value.neighborhood,
      orientation: newScreen.value.orientation,
    }
    if (newScreen.value.hostId) body.hostId = newScreen.value.hostId
    await adminScreensApi.create(body)
    toast.success('Screen created.')
    creatingScreen.value = false
    await qc.invalidateQueries({ queryKey: qk.screens() })
  } catch (err) {
    toast.error(err?.message || 'Could not create screen.')
  } finally {
    createBusy.value = false
  }
}

// ── Edit screen ────────────────────────────────────────────────────
// PATCH /admin/screens/:id with whatever fields changed. The modal
// returns a diff-only payload so admins editing one field don't
// accidentally overwrite values touched by another admin between
// load and save.
const editingScreen = ref(null)
const editBusy = ref(false)

function openEdit(screen) {
  editingScreen.value = screen
}

function cancelEdit() {
  if (editBusy.value) return
  editingScreen.value = null
}

async function submitEdit(patch) {
  if (!editingScreen.value) return
  if (!patch || Object.keys(patch).length === 0) {
    toast.success('No changes.')
    editingScreen.value = null
    return
  }
  const screenId = editingScreen.value.id
  editBusy.value = true
  try {
    await adminScreensApi.update(screenId, patch)
    toast.success('Screen updated.')
    editingScreen.value = null
    await qc.invalidateQueries({ queryKey: qk.screens() })
    await qc.invalidateQueries({ queryKey: qk.screenDetail(screenId) })
  } catch (err) {
    toast.error(err?.message || 'Update failed.')
  } finally {
    editBusy.value = false
  }
}

const mapPins = [
  { x: 210, y: 240, c: 'green', n: 4 },
  { x: 240, y: 270, c: 'green', n: 1 },
  { x: 180, y: 310, c: 'green', n: 2 },
  { x: 600, y: 220, c: 'green', n: 6 },
  { x: 640, y: 260, c: 'amber', n: 1 },
  { x: 580, y: 290, c: 'green', n: 3 },
  { x: 620, y: 330, c: 'green', n: 2 },
  { x: 880, y: 240, c: 'green', n: 5 },
  { x: 920, y: 280, c: 'red', n: 1 },
  { x: 860, y: 320, c: 'green', n: 2 },
  { x: 1100, y: 340, c: 'green', n: 3 },
  { x: 1180, y: 380, c: 'green', n: 4 },
  { x: 1220, y: 420, c: 'green', n: 2 },
  { x: 1160, y: 460, c: 'amber', n: 1 },
  { x: 300, y: 500, c: 'green', n: 3 },
  { x: 400, y: 540, c: 'green', n: 2 },
  { x: 500, y: 570, c: 'green', n: 4 },
  { x: 750, y: 580, c: 'green', n: 2 },
  { x: 820, y: 620, c: 'green', n: 3 },
]
</script>
