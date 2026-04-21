<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Advertisers</div>
        <span class="fg2 text-xs">340 total · 12 pending KYC · 5 flagged</span>
        <div class="spacer"></div>
        <button class="btn outline sm"><i class="ph ph-download-simple"></i> Export</button>
        <button class="btn outline sm"><i class="ph ph-megaphone"></i> Send announcement</button>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Business</th>
              <th class="p-3">LGA</th>
              <th class="p-3">Category</th>
              <th class="p-3 text-right">Wallet</th>
              <th class="p-3 text-right">Lifetime spend</th>
              <th class="p-3 text-right">Campaigns</th>
              <th class="p-3">KYC</th>
              <th class="p-3">Flags</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="adv in MOCK.advertisers"
              :key="adv.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <div class="font-semibold">{{ adv.name }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ adv.id }}</div>
              </td>
              <td class="p-3 fg2">{{ adv.lga }}</td>
              <td class="p-3 fg2">{{ adv.cat }}</td>
              <td class="p-3 text-right mono">{{ fmt.naira(adv.wallet) }}</td>
              <td class="p-3 text-right mono font-semibold">{{ fmt.naira(adv.spend) }}</td>
              <td class="p-3 text-right mono">{{ adv.camps }}</td>
              <td class="p-3">
                <span class="pill" :class="{
                  'pill-active': adv.kyc === 'verified',
                  'pill-pending': adv.kyc === 'pending'
                }">{{ adv.kyc }}</span>
              </td>
              <td class="p-3">
                <span v-if="adv.flags" class="pill pill-failed sm">{{ adv.flags }} flag{{ adv.flags > 1 ? 's' : '' }}</span>
                <span v-else class="text-[var(--fg-3)] text-[11px]">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMockData } from '../composables/useMockData'
import { fmt } from '../utils/format'

const { MOCK } = useMockData()
</script>
