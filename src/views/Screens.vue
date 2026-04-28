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
          <button class="btn ghost sm">Reset</button>
        </div>
        <div style="padding: 14px;">
          <div class="field" style="margin-bottom: 10px;">
            <label>Status</label>
            <div class="flex g4" style="flex-wrap: wrap;">
              <button class="btn outline sm"><span class="sdot green"></span> Active {{ statusCounts.active }}</button>
              <button class="btn outline sm"><span class="sdot amber"></span> Degraded {{ statusCounts.degraded }}</button>
              <button class="btn outline sm"><span class="sdot red"></span> Offline {{ statusCounts.offline }}</button>
            </div>
          </div>
          <div class="field" style="margin-bottom: 10px;">
            <label>LGA</label>
            <select class="select">
              <option>All LGAs</option>
              <option>Surulere</option>
              <option>Yaba</option>
              <option>Ikeja</option>
              <option>Lekki</option>
            </select>
          </div>
          <div class="field" style="margin-bottom: 10px;">
            <label>Category</label>
            <select class="select"><option>All categories</option></select>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div style="position: absolute; top: 16px; left: 50%; transform: translateX(-50%); width: 360px;">
        <div class="card raised" style="display: flex; align-items: center; padding: 6px 10px; gap: 8px;">
          <i class="ph ph-magnifying-glass" style="color: var(--fg-3);"></i>
          <input class="input" style="border: none; padding: 0;" placeholder="Find screen by ID, host, or address…"/>
        </div>
      </div>

      <!-- Legend -->
      <div style="position: absolute; bottom: 16px; right: 16px;" class="card raised">
        <div style="padding: 10px; font-size: 11px;">
          <div class="flex ac g8" style="margin-bottom: 4px;"><span class="sdot green"></span> Active ({{ statusCounts.active }})</div>
          <div class="flex ac g8" style="margin-bottom: 4px;"><span class="sdot amber"></span> Degraded ({{ statusCounts.degraded }})</div>
          <div class="flex ac g8"><span class="sdot red"></span> Offline ({{ statusCounts.offline }})</div>
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
            <span class="fg2" style="font-size: 12px;">Last seen 2m ago</span>
          </div>
          <div class="fg2" style="font-size: 12px; margin-bottom: 4px;">Host: <strong style="color: var(--fg);">Apex Pharmacy</strong></div>
          <div class="fg2" style="font-size: 12px; margin-bottom: 4px;">LGA: Surulere · Pharmacy</div>
          <div class="fg2" style="font-size: 12px; margin-bottom: 14px;">Uptime (30d): 99.6%</div>
          <button class="btn primary" style="width: 100%;">Open screen detail <i class="ph ph-arrow-right"></i></button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="page-body">
      <div class="card overflow-hidden">
        <div v-if="screensQuery.isLoading.value" class="p-6 fg2 text-sm">Loading screens…</div>
        <div
          v-else-if="screensQuery.error.value"
          class="p-6 text-sm"
          style="color: var(--danger-500)"
        >
          {{ screensQuery.error.value?.message || 'Could not load screens.' }}
        </div>
        <table v-else class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Screen ID</th>
              <th class="p-3">Host</th>
              <th class="p-3">LGA</th>
              <th class="p-3">Status</th>
              <th class="p-3">Last seen</th>
              <th class="p-3 text-right">Uptime</th>
              <th class="p-3">Model</th>
              <th class="p-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!screens.length">
              <td colspan="8" class="p-6 fg2 text-center text-sm">No screens deployed yet.</td>
            </tr>
            <tr
              v-for="screen in screens"
              :key="screen.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)]"
            >
              <td class="p-3">
                <div class="mono font-semibold">{{ screen.id }}</div>
              </td>
              <td class="p-3 font-medium">{{ screen.hostName || screen.host?.businessName || '—' }}</td>
              <td class="p-3 fg2">{{ humanLga(screen.lga) }}</td>
              <td class="p-3">
                <span class="pill" :class="pillClass(screen.status)">
                  <span class="sdot" :class="dotClass(screen.status)"></span>
                  {{ screen.status }}
                </span>
              </td>
              <td class="p-3 mono text-xs">
                {{ relTime(screen.lastSeenAt) }}
              </td>
              <td class="p-3 text-right mono">{{ screen.uptimePercent != null ? `${screen.uptimePercent}%` : '—' }}</td>
              <td class="p-3 fg2 text-xs">{{ screen.model || screen.deviceModel || '—' }}</td>
              <td class="p-3 text-right">
                <button
                  v-if="screen.status === 'active'"
                  class="btn outline xs"
                  :disabled="busyId === screen.id"
                  @click="onPause(screen)"
                >
                  Pause
                </button>
                <button
                  v-else-if="screen.status === 'paused' || screen.status === 'inactive'"
                  class="btn outline xs"
                  :disabled="busyId === screen.id"
                  @click="onResume(screen)"
                >
                  Resume
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { adminScreensApi } from '../api/screens'
import { useToastStore } from '../stores/toast'
import { fmt } from '../utils/format'

const toast = useToastStore()
const qc = useQueryClient()

const view = ref('table')
const selectedPin = ref(null)

const screensQuery = useQuery({
  queryKey: ['admin', 'screens'],
  queryFn: () => adminScreensApi.list(),
})

const screens = computed(() => {
  const raw = screensQuery.data.value
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return raw.data || raw.items || raw.screens || []
})

const statusCounts = computed(() => {
  const counts = { active: 0, degraded: 0, offline: 0 }
  for (const s of screens.value) {
    if (s.status === 'active' || s.status === 'online') counts.active++
    else if (s.status === 'degraded') counts.degraded++
    else if (s.status === 'offline' || s.status === 'paused' || s.status === 'retired') counts.offline++
  }
  return counts
})

const summaryLabel = computed(() => {
  if (screensQuery.isLoading.value) return 'Loading…'
  const total = screens.value.length
  const { active, degraded, offline } = statusCounts.value
  return `${total} total · ${active} active · ${degraded} degraded · ${offline} offline`
})

function relTime(ts) {
  return ts ? fmt.rel(ts) : '—'
}
function humanLga(lga) {
  if (!lga) return '—'
  return String(lga).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function pillClass(s) {
  if (s === 'active' || s === 'online') return 'pill-active'
  if (s === 'degraded') return 'pill-pending'
  if (s === 'offline' || s === 'paused' || s === 'retired') return 'pill-failed'
  return 'pill-pending'
}
function dotClass(s) {
  if (s === 'active' || s === 'online') return 'green'
  if (s === 'degraded') return 'amber'
  return 'red pulse'
}

const busyId = ref(null)

async function onPause(screen) {
  busyId.value = screen.id
  try {
    await adminScreensApi.pause(screen.id)
    toast.success(`${screen.id} paused.`)
    await qc.invalidateQueries({ queryKey: ['admin', 'screens'] })
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
    await qc.invalidateQueries({ queryKey: ['admin', 'screens'] })
  } catch (err) {
    if (!err?.needsReauth) toast.error(err?.message || 'Resume failed.')
  } finally {
    busyId.value = null
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
