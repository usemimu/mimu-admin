<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Payout approvals</div>
        <span class="pill pill-pending lg">{{ MOCK.payouts.length }} pending</span>
        <span class="fg2 text-xs">Total gross: <strong class="mono text-[var(--fg)]">{{ fmt.naira(130800) }}</strong> · WHT: <strong class="mono text-[var(--fg)]">₦6,540</strong></span>
        <div class="spacer"></div>
        <div class="flex items-center gap-2 text-xs text-[var(--fg-3)]">
          Requires <strong class="text-[var(--fg-2)]">ops_lead</strong> + <strong class="text-[var(--fg-2)]">TOTP</strong>
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Host</th>
              <th class="p-3">Period</th>
              <th class="p-3 text-right">Gross</th>
              <th class="p-3 text-right">WHT</th>
              <th class="p-3 text-right">Net</th>
              <th class="p-3">Destination</th>
              <th class="p-3">Flags</th>
              <th class="p-3">Computed</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payout in MOCK.payouts"
              :key="payout.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <div class="font-semibold">{{ payout.host }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ payout.id }}</div>
              </td>
              <td class="p-3 fg2">{{ payout.period }}</td>
              <td class="p-3 text-right mono">{{ fmt.naira(payout.gross) }}</td>
              <td class="p-3 text-right mono fg2 text-xs">{{ fmt.naira(payout.wht) }}</td>
              <td class="p-3 text-right mono font-semibold">{{ fmt.naira(payout.net) }}</td>
              <td class="p-3 mono text-xs fg2">{{ payout.bank }}</td>
              <td class="p-3">
                <span v-if="payout.flags.length > 0" class="pill pill-hold sm">fraud hold</span>
                <span v-else class="text-[var(--fg-3)] text-[11px]">—</span>
              </td>
              <td class="p-3 mono fg2 text-[11px]">{{ fmt.rel(payout.computed) }}</td>
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
