<template>
  <!--
    Structured projection of a Dojah verification payload. The shape
    isn't formally documented and varies by verification method
    (NG-NIN-SLIP / BVN / international ID / etc.) — every section here
    `v-if`'s on a presence check so this component is safe to render
    against partial payloads. The raw JSON stays available behind the
    last collapsible block for ops who need fields the SPA doesn't
    project yet.
  -->
  <div v-if="payload" class="kyc-payload" style="display: grid; gap: 16px;">
    <!-- Verification meta — top-line outcome + Dojah deep links -->
    <section class="kyc-section">
      <div class="kyc-section-title">Verification</div>
      <div class="kyc-grid">
        <KycField label="Outcome">
          <span class="pill sm" :class="outcomePill">
            {{ outcomeLabel }}
          </span>
        </KycField>
        <KycField label="Type" :value="payload.verification_type" />
        <KycField label="Mode" :value="payload.verification_mode" />
        <KycField label="ID type" :value="payload.id_type" />
        <KycField label="Reference" :value="payload.reference_id" mono />
        <KycField label="AML">
          <span class="pill sm" :class="amlPill">{{ amlLabel }}</span>
        </KycField>
      </div>
      <div v-if="payload.verification_url" style="margin-top: 8px;">
        <a
          :href="payload.verification_url"
          target="_blank"
          rel="noopener noreferrer"
          class="kyc-link"
        >
          <i class="ph ph-arrow-square-out"></i>
          Open in Dojah dashboard
        </a>
      </div>
      <div v-if="payload.message" class="kyc-message">{{ payload.message }}</div>
    </section>

    <!-- Identity from the document scan (id_data) -->
    <section v-if="idData" class="kyc-section">
      <div class="kyc-section-title">Identity (from ID document)</div>
      <div class="kyc-id-layout">
        <div class="kyc-grid">
          <KycField label="First name" :value="idData.first_name" />
          <KycField label="Middle name" :value="idData.middle_name" />
          <KycField label="Last name" :value="idData.last_name" />
          <KycField label="Date of birth" :value="formatDate(idData.date_of_birth)" />
          <KycField label="Nationality" :value="idData.nationality" />
          <KycField label="Document type" :value="idData.document_type" />
          <KycField label="Document #" :value="idData.document_number" mono />
          <KycField label="Issued" :value="formatDate(idData.date_issued)" />
          <KycField label="Expires" :value="formatDate(idData.expiry_date)" />
          <KycField v-if="idData.mrz_status" label="MRZ" :value="idData.mrz_status" />
        </div>
        <div v-if="idImageUrl" class="kyc-image">
          <a :href="idImageUrl" target="_blank" rel="noopener noreferrer">
            <img :src="idImageUrl" alt="ID document" />
          </a>
          <div class="fg2 text-[11px]" style="margin-top: 4px; text-align: center;">
            ID document · click to open
          </div>
        </div>
      </div>
    </section>

    <!-- BVN entity (Nigerian government data) -->
    <section v-if="bvnEntity" class="kyc-section">
      <div class="kyc-section-title">BVN (NIBSS)</div>
      <div class="kyc-grid">
        <KycField label="BVN" :value="bvnEntity.bvn" mono />
        <KycField label="NIN" :value="bvnEntity.nin || '—'" mono />
        <KycField label="First name" :value="bvnEntity.first_name" />
        <KycField label="Middle name" :value="bvnEntity.middle_name" />
        <KycField label="Last name" :value="bvnEntity.last_name" />
        <KycField label="Gender" :value="bvnEntity.gender" />
        <KycField label="Date of birth" :value="formatDojahDate(bvnEntity.date_of_birth)" />
        <KycField label="Marital status" :value="bvnEntity.marital_status || '—'" />
        <KycField label="Phone (1)" :value="bvnEntity.phone_number1" mono />
        <KycField v-if="bvnEntity.phone_number2" label="Phone (2)" :value="bvnEntity.phone_number2" mono />
        <KycField label="Email" :value="bvnEntity.email || '—'" />
        <KycField label="Account level" :value="bvnEntity.level_of_account || bvnEntity.type || '—'" />
        <KycField label="Enrollment bank" :value="bvnEntity.enrollment_bank || '—'" />
        <KycField label="State of origin" :value="bvnEntity.state_of_origin || '—'" />
        <KycField label="State of residence" :value="bvnEntity.state_of_residence || '—'" />
      </div>
      <div v-if="bvnEntity.watch_listed" class="kyc-warn">
        <i class="ph ph-warning-circle"></i> NIBSS watchlist flag: {{ bvnEntity.watch_listed }}
      </div>
    </section>

    <!-- Selfie (if any) -->
    <section v-if="payload.selfie_url" class="kyc-section">
      <div class="kyc-section-title">Selfie capture</div>
      <a :href="payload.selfie_url" target="_blank" rel="noopener noreferrer">
        <img :src="payload.selfie_url" alt="Selfie" class="kyc-selfie" />
      </a>
    </section>

    <!-- Step-by-step verification results -->
    <section v-if="stepResults.length" class="kyc-section">
      <div class="kyc-section-title">Verification steps</div>
      <table class="w-full text-xs">
        <tbody>
          <tr
            v-for="step in stepResults"
            :key="step.key"
            style="border-top: 1px solid var(--border);"
          >
            <td class="py-2 pr-2">
              <span class="pill sm" :class="step.status ? 'pill-active' : 'pill-failed'">
                {{ step.status ? 'pass' : 'fail' }}
              </span>
            </td>
            <td class="py-2 pr-2 font-medium">{{ step.label }}</td>
            <td class="py-2 fg2">{{ step.message || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- IP / device context -->
    <section v-if="ipinfo" class="kyc-section">
      <div class="kyc-section-title">Device & location</div>
      <div class="kyc-grid">
        <KycField label="IP" :value="ipinfo.query" mono />
        <KycField label="City" :value="ipinfo.city" />
        <KycField label="Region" :value="ipinfo.region_name" />
        <KycField label="Country" :value="ipinfo.country" />
        <KycField label="ISP" :value="ipinfo.isp" />
        <KycField v-if="ipinfo.org" label="Org" :value="ipinfo.org" />
      </div>
      <!-- Risk-relevant flags as pills so they read at a glance -->
      <div class="kyc-flags">
        <span class="pill sm" :class="ipinfo.proxy ? 'pill-failed' : 'pill-active'">
          {{ ipinfo.proxy ? 'Proxy detected' : 'No proxy' }}
        </span>
        <span class="pill sm" :class="ipinfo.hosting ? 'pill-failed' : 'pill-active'">
          {{ ipinfo.hosting ? 'Datacenter IP' : 'Residential' }}
        </span>
        <span class="pill sm pill-neutral">
          {{ ipinfo.mobile ? 'Mobile' : 'Wi-Fi / desktop' }}
        </span>
      </div>
    </section>

    <!-- Escape hatch — full raw payload, collapsed by default -->
    <details class="kyc-raw">
      <summary class="fg2 text-xs cursor-pointer">View full raw payload</summary>
      <pre>{{ JSON.stringify(payload, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import KycField from './KycField.vue'

const props = defineProps({
  payload: { type: Object, default: null },
})

// Top-line outcome derives from `verification_status` (string the
// widget produces) and falls back to the boolean `status` flag for
// older deployments that only emit one or the other.
const outcomeLabel = computed(() => {
  const v = props.payload?.verification_status
  if (typeof v === 'string' && v.length > 0) return v
  if (props.payload?.status === true) return 'Completed'
  if (props.payload?.status === false) return 'Failed'
  return 'Unknown'
})

const outcomePill = computed(() => {
  const v = String(props.payload?.verification_status || '').toLowerCase()
  if (v === 'completed' || props.payload?.status === true) return 'pill-active'
  if (v === 'failed' || props.payload?.status === false) return 'pill-failed'
  return 'pill-pending'
})

// AML field is `{ status: boolean }` in the payloads we've seen. False
// (no hit) is the safe outcome; true is a watchlist hit and we
// surface it red.
const amlPill = computed(() => {
  const status = props.payload?.aml?.status
  if (status === true) return 'pill-failed'
  if (status === false) return 'pill-active'
  return 'pill-neutral'
})
const amlLabel = computed(() => {
  const status = props.payload?.aml?.status
  if (status === true) return 'Hit'
  if (status === false) return 'Clear'
  return 'Unknown'
})

// `data.id.data.id_data` for `NG-NIN-SLIP`-style flows. Other flows
// can omit it; render conditionally.
const idData = computed(() => props.payload?.data?.id?.data?.id_data ?? null)
const idImageUrl = computed(
  () => props.payload?.data?.id?.data?.id_url ?? props.payload?.id_url ?? '',
)

const bvnEntity = computed(
  () => props.payload?.data?.government_data?.data?.bvn?.entity ?? null,
)

const ipinfo = computed(() => props.payload?.metadata?.ipinfo ?? null)

// Each verification step exposes `{ status, message }` under
// `data.<step>`. We project them into a uniform table so ops can scan
// for failures without diffing the raw JSON.
const stepResults = computed(() => {
  const data = props.payload?.data ?? {}
  const labels = {
    index: 'Pre-flight',
    countries: 'Country gate',
    government_data: 'Government data',
    id: 'ID document',
    aml: 'AML screening',
    selfie: 'Selfie / liveness',
  }
  const out = []
  for (const [key, value] of Object.entries(data)) {
    if (!value || typeof value !== 'object') continue
    if (typeof value.status !== 'boolean') continue
    out.push({
      key,
      label: labels[key] ?? key,
      status: value.status,
      message: value.message,
    })
  }
  return out
})

function formatDate(value) {
  if (!value) return '—'
  // Some Dojah fields are already `YYYY-MM-DD`; others are ISO. Try
  // ISO first; fall back to the raw string so we never display
  // 'Invalid Date' to ops.
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDojahDate(value) {
  // BVN payload formats DOB as "01-Jun-1982". Pass through unchanged
  // — `new Date(...)` can't parse it consistently, and the original
  // is more meaningful than a misparse.
  return value || '—'
}
</script>

<style scoped>
.kyc-section {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}
.kyc-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--fg-2);
  margin-bottom: 12px;
}
.kyc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 16px;
}
.kyc-id-layout {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 16px;
  align-items: start;
}
@media (max-width: 720px) {
  .kyc-id-layout {
    grid-template-columns: 1fr;
  }
}
.kyc-image img {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  display: block;
  background: var(--bg-sunken);
}
.kyc-selfie {
  max-width: 200px;
  border: 1px solid var(--border);
  border-radius: 6px;
  display: block;
}
.kyc-flags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.kyc-message {
  font-size: 12px;
  color: var(--fg-2);
  margin-top: 8px;
}
.kyc-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--danger-500);
}
.kyc-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--clay-500);
  text-decoration: none;
}
.kyc-link:hover {
  text-decoration: underline;
}
.kyc-raw pre {
  background: var(--bg-sunken);
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
  overflow: auto;
  max-height: 320px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--fg-2);
}
</style>
