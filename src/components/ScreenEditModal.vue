<template>
  <div
    class="modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
    @click.self="$emit('cancel')"
  >
    <div class="card" style="padding: 22px; width: 640px; max-width: 92vw; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin: 0 0 4px;">Edit screen</h3>
      <p class="fg2 text-xs" style="margin: 0 0 14px;">
        Updating <span class="font-medium">{{ screen?.venueName || screen?.id }}</span>
        <span class="mono fg2"> · {{ screen?.id }}</span>
      </p>

      <!-- Identity -->
      <div class="text-xs fg2 mb-2" style="margin-top: 4px; text-transform: uppercase; letter-spacing: 0.04em;">Identity</div>
      <div class="flex" style="gap: 12px; margin-bottom: 12px;">
        <div style="flex: 2;">
          <label class="text-xs fg2 block mb-1">Venue name</label>
          <input v-model.trim="form.venueName" class="input" style="width: 100%;" />
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Venue type</label>
          <select v-model="form.venueType" class="input" style="width: 100%;">
            <option v-for="t in venueTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <label class="text-xs fg2 block mb-1">Display name <span class="fg2">(optional internal label)</span></label>
        <input v-model.trim="form.name" class="input" style="width: 100%;" placeholder="e.g. MMU-001" />
      </div>

      <!-- Location -->
      <div class="text-xs fg2 mb-2" style="margin-top: 14px; text-transform: uppercase; letter-spacing: 0.04em;">Location</div>
      <div style="margin-bottom: 12px;">
        <label class="text-xs fg2 block mb-1">Street address</label>
        <input v-model.trim="form.address" class="input" style="width: 100%;" />
      </div>
      <div class="flex" style="gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Neighborhood</label>
          <select v-model="form.neighborhood" class="input" style="width: 100%;">
            <option v-for="l in lgas" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">LGA</label>
          <select v-model="form.lga" class="input" style="width: 100%;">
            <option :value="null">— None —</option>
            <option v-for="l in lgas" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
      </div>
      <div class="flex" style="gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">City</label>
          <input v-model.trim="form.city" class="input" style="width: 100%;" />
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">State</label>
          <input v-model.trim="form.state" class="input" style="width: 100%;" />
        </div>
        <div style="width: 90px;">
          <label class="text-xs fg2 block mb-1">Country</label>
          <input v-model.trim="form.country" class="input" style="width: 100%;" maxlength="2" />
        </div>
      </div>
      <div class="flex" style="gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Latitude</label>
          <input v-model.trim="form.latitude" class="input" style="width: 100%;" placeholder="6.5244" />
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Longitude</label>
          <input v-model.trim="form.longitude" class="input" style="width: 100%;" placeholder="3.3792" />
        </div>
      </div>

      <!-- Hardware spec -->
      <div class="text-xs fg2 mb-2" style="margin-top: 14px; text-transform: uppercase; letter-spacing: 0.04em;">Hardware</div>
      <div class="flex" style="gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Screen size (inches)</label>
          <input v-model.trim="form.screenSizeInches" class="input" style="width: 100%;" placeholder="32" />
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Resolution</label>
          <input v-model.trim="form.resolution" class="input" style="width: 100%;" placeholder="1920x1080" />
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Orientation</label>
          <select v-model="form.orientation" class="input" style="width: 100%;">
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <label class="text-xs fg2 block mb-1">Photo URL</label>
        <input v-model.trim="form.photoUrl" class="input" style="width: 100%;" placeholder="https://…" />
      </div>

      <!-- Pricing & audience -->
      <div class="text-xs fg2 mb-2" style="margin-top: 14px; text-transform: uppercase; letter-spacing: 0.04em;">Pricing & audience</div>
      <div class="flex" style="gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Base price (kobo)</label>
          <input v-model.trim="form.basePriceKobo" class="input" style="width: 100%;" placeholder="50000" />
          <div class="fg2 text-xs" style="margin-top: 4px;">
            ≈ {{ priceNairaPreview }}
          </div>
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Daily reach (est.)</label>
          <input v-model.number="form.estimatedDailyReach" class="input" style="width: 100%;" type="number" min="0" />
        </div>
        <div style="flex: 1;">
          <label class="text-xs fg2 block mb-1">Avg. attention (sec)</label>
          <input v-model.number="form.averageAttentionSeconds" class="input" style="width: 100%;" type="number" min="0" />
        </div>
      </div>

      <div class="flex" style="gap: 8px; justify-content: flex-end; margin-top: 16px;">
        <button class="btn ghost sm" :disabled="busy" @click="$emit('cancel')">Cancel</button>
        <button class="btn primary sm" :disabled="busy || !canSubmit" @click="submit">
          {{ busy ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  screen: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  venueTypes: { type: Array, default: () => [] },
  lgas: { type: Array, default: () => [] },
})
const emit = defineEmits(['cancel', 'submit'])

const form = reactive({
  name: '',
  venueName: '',
  venueType: '',
  address: '',
  neighborhood: '',
  lga: null,
  city: '',
  state: '',
  country: '',
  latitude: '',
  longitude: '',
  screenSizeInches: '',
  resolution: '',
  orientation: 'landscape',
  basePriceKobo: '',
  estimatedDailyReach: null,
  averageAttentionSeconds: null,
  photoUrl: '',
})

// Hydrate form from the source screen any time the modal mounts
// for a different row.
watch(
  () => props.screen,
  (s) => {
    if (!s) return
    form.name = s.name ?? ''
    form.venueName = s.venueName ?? ''
    form.venueType = s.venueType ?? ''
    form.address = s.address ?? ''
    form.neighborhood = s.neighborhood ?? ''
    form.lga = s.lga ?? null
    form.city = s.city ?? ''
    form.state = s.state ?? ''
    form.country = s.country ?? ''
    form.latitude = s.latitude ?? ''
    form.longitude = s.longitude ?? ''
    form.screenSizeInches = s.screenSizeInches ?? ''
    form.resolution = s.resolution ?? ''
    form.orientation = s.orientation ?? 'landscape'
    form.basePriceKobo = s.basePriceKobo ?? ''
    form.estimatedDailyReach = s.estimatedDailyReach ?? null
    form.averageAttentionSeconds = s.averageAttentionSeconds ?? null
    form.photoUrl = s.photoUrl ?? ''
  },
  { immediate: true },
)

const canSubmit = computed(
  () =>
    !!form.venueName &&
    !!form.venueType &&
    !!form.address &&
    !!form.neighborhood,
)

const priceNairaPreview = computed(() => {
  const k = Number(form.basePriceKobo)
  if (!Number.isFinite(k) || k <= 0) return '—'
  return `₦${(k / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
})

// Build a diff-only patch so the API only receives fields the admin
// actually changed. Empty strings normalize to null for nullable
// columns; required text columns stay as strings.
function buildPatch() {
  const s = props.screen || {}
  const out = {}
  const setIfChanged = (key, normalized) => {
    const before = s[key] ?? null
    const after = normalized
    // primitive equality is enough — these are all scalar columns
    if (before !== after) out[key] = after
  }

  const trimOrNull = (v) => {
    if (v == null) return null
    const t = String(v).trim()
    return t === '' ? null : t
  }
  const trimOrSelf = (v) => (v == null ? '' : String(v).trim())

  setIfChanged('name', trimOrNull(form.name))
  setIfChanged('venueName', trimOrSelf(form.venueName))
  setIfChanged('venueType', trimOrSelf(form.venueType))
  setIfChanged('address', trimOrSelf(form.address))
  setIfChanged('neighborhood', trimOrSelf(form.neighborhood))
  setIfChanged('lga', trimOrNull(form.lga))
  setIfChanged('city', trimOrSelf(form.city) || 'Lagos')
  setIfChanged('state', trimOrSelf(form.state) || 'Lagos')
  setIfChanged('country', (trimOrSelf(form.country) || 'NG').toUpperCase().slice(0, 2))
  setIfChanged('latitude', trimOrNull(form.latitude))
  setIfChanged('longitude', trimOrNull(form.longitude))
  setIfChanged('screenSizeInches', trimOrNull(form.screenSizeInches))
  setIfChanged('resolution', trimOrNull(form.resolution))
  setIfChanged('orientation', trimOrSelf(form.orientation) || 'landscape')
  setIfChanged('basePriceKobo', trimOrNull(form.basePriceKobo))
  setIfChanged('photoUrl', trimOrNull(form.photoUrl))

  const reachNum = form.estimatedDailyReach
  setIfChanged('estimatedDailyReach', reachNum === '' || reachNum == null ? null : Number(reachNum))

  const attnNum = form.averageAttentionSeconds
  setIfChanged('averageAttentionSeconds', attnNum === '' || attnNum == null ? null : Number(attnNum))

  return out
}

function submit() {
  if (!canSubmit.value) return
  const patch = buildPatch()
  emit('submit', patch)
}
</script>
