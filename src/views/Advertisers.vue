<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Advertisers</div>
        <span class="fg2 text-xs">{{ summaryLabel }}</span>
        <div class="spacer"></div>
        <button class="btn outline sm" disabled><i class="ph ph-download-simple"></i> Export</button>
        <button class="btn outline sm" disabled><i class="ph ph-megaphone"></i> Send announcement</button>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 16px;">
        <button
          v-for="opt in kycOptions"
          :key="opt.value"
          class="btn sm outline"
          :class="{ active: filters.kycStatus === opt.value }"
          @click="setKyc(opt.value)"
        >
          {{ opt.label }}
        </button>
        <button
          class="btn sm outline"
          :class="{ active: filters.hasFraudFlags === 'true' }"
          @click="toggleFraud"
        >
          Has fraud flags
        </button>
        <button class="btn ghost sm" @click="clearFilters"><i class="ph ph-x"></i> Clear</button>
      </div>

      <div v-if="isLoading" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">Loading advertisers…</span>
      </div>

      <div v-else-if="error" class="card" style="padding: 24px;">
        <div style="color: var(--danger-500);">Failed to load advertisers: {{ error.message }}</div>
        <button class="btn sm outline" style="margin-top: 8px;" @click="refetch()">Retry</button>
      </div>

      <div v-else-if="advertisers.length === 0" class="card" style="padding: 24px; text-align: center;">
        <span class="fg2">No advertisers match the current filters.</span>
      </div>

      <div v-else class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Business</th>
              <th class="p-3">LGA</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Wallet</th>
              <th class="p-3 text-right">30-day spend</th>
              <th class="p-3">KYC</th>
              <th class="p-3">Status</th>
              <th class="p-3">Flags</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="adv in advertisers"
              :key="adv.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
              @click="openDetail(adv.id)"
            >
              <td class="p-3">
                <div class="font-semibold">{{ adv.businessName }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ shortId(adv.id) }}</div>
              </td>
              <td class="p-3 fg2">{{ adv.lga }}</td>
              <td class="p-3 fg2">{{ adv.businessCategory }}</td>
              <td class="p-3 text-right mono">{{ formatNaira(adv.walletBalanceKobo) }}</td>
              <td class="p-3 text-right mono font-semibold">
                {{ formatNaira(adv.totalSpendLast30DaysKobo) }}
              </td>
              <td class="p-3">
                <span class="pill" :class="kycPill(adv.kycStatus)">{{ adv.kycStatus }}</span>
              </td>
              <td class="p-3">
                <span class="pill sm" :class="statusPill(adv.status)">{{ adv.status }}</span>
              </td>
              <td class="p-3">
                <span v-if="adv.fraudFlagCount > 0" class="pill pill-failed sm">
                  {{ adv.fraudFlagCount }} flag{{ adv.fraudFlagCount > 1 ? 's' : '' }}
                </span>
                <span v-else class="text-[var(--fg-3)] text-[11px]">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!isLoading && advertisers.length > 0" class="flex ac" style="margin-top: 12px; gap: 8px; justify-content: flex-end;">
        <button class="btn sm outline" :disabled="filters.offset === 0" @click="prevPage">Previous</button>
        <button class="btn sm outline" :disabled="advertisers.length < filters.limit" @click="nextPage">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { advertisersApi } from '../api/advertisers'

const router = useRouter()

const kycOptions = [
  { value: undefined, label: 'All' },
  { value: 'pending', label: 'Pending KYC' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const filters = ref({
  kycStatus: undefined,
  status: undefined,
  hasFraudFlags: undefined,
  offset: 0,
  limit: 50,
})

const queryKey = computed(() => ['advertisers', filters.value])
const { data, isLoading, error, refetch } = useQuery({
  queryKey,
  queryFn: () => advertisersApi.list(filters.value),
  keepPreviousData: true,
})

const advertisers = computed(() => {
  const rows = data.value?.advertisers ?? []
  return rows.map((row) => ({
    id: row.advertiser?.id ?? row.id,
    businessName: row.advertiser?.businessName,
    businessCategory: row.advertiser?.businessCategory,
    lga: row.advertiser?.lga,
    kycStatus: row.advertiser?.kycStatus,
    status: row.advertiser?.status,
    walletBalanceKobo: row.walletBalanceKobo,
    fraudFlagCount: row.fraudFlagCount ?? 0,
    totalSpendLast30DaysKobo: row.totalSpendLast30DaysKobo,
    user: row.user,
  }))
})

const summaryLabel = computed(() => {
  if (isLoading.value) return 'Loading…'
  const count = advertisers.value.length
  const start = filters.value.offset + 1
  return `${start}–${filters.value.offset + count} shown`
})

function shortId(id) {
  return id ? id.split('-')[0] : ''
}

function formatNaira(kobo) {
  if (kobo == null) return '—'
  const naira = Number(kobo) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
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

function setKyc(value) {
  filters.value = { ...filters.value, kycStatus: value, offset: 0 }
}

function toggleFraud() {
  filters.value = {
    ...filters.value,
    hasFraudFlags: filters.value.hasFraudFlags === 'true' ? undefined : 'true',
    offset: 0,
  }
}

function clearFilters() {
  filters.value = { kycStatus: undefined, status: undefined, hasFraudFlags: undefined, offset: 0, limit: 50 }
}

function nextPage() {
  filters.value = { ...filters.value, offset: filters.value.offset + filters.value.limit }
}
function prevPage() {
  filters.value = { ...filters.value, offset: Math.max(0, filters.value.offset - filters.value.limit) }
}

function openDetail(id) {
  router.push({ path: '/advertiser-detail', query: { id } })
}
</script>
