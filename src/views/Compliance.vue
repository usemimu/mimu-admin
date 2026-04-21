<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Tax & Compliance</div>
        <span class="fg2 text-xs">12 pending WHT reports · 3 TIN updates required</span>
        <div class="spacer"></div>
        <button class="btn outline sm"><i class="ph ph-download-simple"></i> Export tax report</button>
        <button class="btn primary sm"><i class="ph ph-file-text"></i> Generate WHT certificates</button>
      </div>
    </div>

    <div class="page-body">
      <div class="grid-3" style="margin-bottom: 16px;">
        <div class="metric">
          <div class="metric-label">Total WHT (YTD)</div>
          <div class="metric-value">{{ fmt.naira(4280000) }}</div>
          <div class="fg2" style="font-size: 11px;">5% of ₦85.6M gross</div>
        </div>
        <div class="metric">
          <div class="metric-label">Hosts w/ verified TIN</div>
          <div class="metric-value">412</div>
          <div class="fg2" style="font-size: 11px;">97% of 427 active</div>
        </div>
        <div class="metric">
          <div class="metric-label">Pending remittance</div>
          <div class="metric-value">{{ fmt.naira(142000) }}</div>
          <div class="fg2" style="font-size: 11px;">Due by 28 Apr</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <div class="card-head">
          <div class="card-title">Withholding Tax (WHT) Deductions</div>
          <div class="spacer"></div>
          <div class="flex gap-2">
            <button class="btn outline sm">This month</button>
            <button class="btn ghost sm">Last 3 months</button>
            <button class="btn ghost sm">YTD</button>
          </div>
        </div>
        <div class="card-body">
          <table class="w-full">
            <thead class="border-b border-[var(--border)]">
              <tr class="text-left text-xs">
                <th class="p-3">Host</th>
                <th class="p-3">TIN</th>
                <th class="p-3">Period</th>
                <th class="p-3 text-right">Gross</th>
                <th class="p-3 text-right">WHT (5%)</th>
                <th class="p-3 text-right">Net</th>
                <th class="p-3">Certificate</th>
                <th class="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="wht in whtRecords"
                :key="wht.id"
                class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <td class="p-3">
                  <div class="font-semibold">{{ wht.host }}</div>
                  <div class="mono text-[11px] text-[var(--fg-3)]">{{ wht.id }}</div>
                </td>
                <td class="p-3 mono fg2 text-xs">{{ wht.tin }}</td>
                <td class="p-3 fg2">{{ wht.period }}</td>
                <td class="p-3 text-right mono">{{ fmt.naira(wht.gross) }}</td>
                <td class="p-3 text-right mono fg2">{{ fmt.naira(wht.wht) }}</td>
                <td class="p-3 text-right mono font-semibold">{{ fmt.naira(wht.net) }}</td>
                <td class="p-3">
                  <button v-if="wht.cert" class="btn ghost sm"><i class="ph ph-file-pdf"></i> View</button>
                  <span v-else class="fg3 text-xs">—</span>
                </td>
                <td class="p-3">
                  <span class="pill" :class="{
                    'pill-active': wht.status === 'remitted',
                    'pill-pending': wht.status === 'pending',
                    'pill-hold': wht.status === 'processing'
                  }">
                    {{ wht.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">TIN Verification Status</div>
          <div class="spacer"></div>
          <button class="btn outline sm"><i class="ph ph-download-simple"></i> Export list</button>
        </div>
        <div class="card-body">
          <table class="w-full">
            <thead class="border-b border-[var(--border)]">
              <tr class="text-left text-xs">
                <th class="p-3">Host</th>
                <th class="p-3">TIN</th>
                <th class="p-3">Verification</th>
                <th class="p-3">Lifetime earnings</th>
                <th class="p-3">Last update</th>
                <th class="p-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tin in tinRecords"
                :key="tin.id"
                class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <td class="p-3">
                  <div class="font-semibold">{{ tin.host }}</div>
                  <div class="mono text-[11px] text-[var(--fg-3)]">{{ tin.id }}</div>
                </td>
                <td class="p-3 mono fg2">{{ tin.tin || '—' }}</td>
                <td class="p-3">
                  <span class="pill" :class="{
                    'pill-active': tin.verified === 'verified',
                    'pill-pending': tin.verified === 'pending',
                    'pill-failed': tin.verified === 'missing'
                  }">
                    {{ tin.verified }}
                  </span>
                </td>
                <td class="p-3 mono">{{ fmt.naira(tin.earn) }}</td>
                <td class="p-3 mono fg2 text-xs">{{ tin.updated ? fmt.rel(tin.updated) : '—' }}</td>
                <td class="p-3">
                  <button class="btn ghost sm"><i class="ph ph-pencil-simple"></i> Update</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fmt } from '../utils/format'

const whtRecords = ref([
  { id: 'H-0412', host: 'Apex Pharmacy', tin: '12345678-0001', period: 'Mar 2026', gross: 48200, wht: 2410, net: 45790, cert: true, status: 'remitted' },
  { id: 'H-0038', host: 'Jide Electronics', tin: '87654321-0001', period: 'Mar 2026', gross: 38400, wht: 1920, net: 36480, cert: true, status: 'remitted' },
  { id: 'H-0124', host: 'Fresh & Green Groceries', tin: '45678912-0001', period: 'Mar 2026', gross: 28900, wht: 1445, net: 27455, cert: false, status: 'pending' },
  { id: 'H-0089', host: 'Lagos Cafe', tin: '98765432-0001', period: 'Mar 2026', gross: 22100, wht: 1105, net: 20995, cert: false, status: 'pending' },
  { id: 'H-0203', host: 'TopUp Hub', tin: '11223344-0001', period: 'Mar 2026', gross: 31200, wht: 1560, net: 29640, cert: true, status: 'processing' },
  { id: 'H-0156', host: 'Pearl Salon', tin: '55667788-0001', period: 'Mar 2026', gross: 19800, wht: 990, net: 18810, cert: true, status: 'remitted' },
])

const tinRecords = ref([
  { id: 'H-0412', host: 'Apex Pharmacy', tin: '12345678-0001', verified: 'verified', earn: 284200, updated: 42 },
  { id: 'H-0038', host: 'Jide Electronics', tin: '87654321-0001', verified: 'verified', earn: 412800, updated: 38 },
  { id: 'H-0124', host: 'Fresh & Green Groceries', tin: '45678912-0001', verified: 'verified', earn: 198400, updated: 52 },
  { id: 'H-0089', host: 'Lagos Cafe', tin: null, verified: 'missing', earn: 142000, updated: null },
  { id: 'H-0203', host: 'TopUp Hub', tin: '11223344-0001', verified: 'pending', earn: 234100, updated: 12 },
  { id: 'H-0156', host: 'Pearl Salon', tin: '55667788-0001', verified: 'verified', earn: 168900, updated: 28 },
  { id: 'H-0241', host: 'City Barbers', tin: null, verified: 'missing', earn: 98200, updated: null },
  { id: 'H-0177', host: 'QuickMart', tin: '99887766-0001', verified: 'pending', earn: 312400, updated: 8 },
])
</script>
