<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Settings</div>
        <span class="fg2 text-xs">Platform configuration</span>
      </div>
    </div>

    <div class="page-body">
      <div style="display: grid; grid-template-columns: 240px 1fr; gap: 16px;">
        <!-- Sidebar navigation -->
        <div class="card" style="height: fit-content;">
          <div
            v-for="section in sections"
            :key="section.id"
            class="p-3 cursor-pointer hover:bg-[var(--bg-hover)] flex items-center gap-2"
            :class="{ 'bg-[var(--bg-active)]': activeSection === section.id }"
            @click="activeSection = section.id"
          >
            <i class="ph" :class="section.icon"></i>
            <span class="font-medium text-sm">{{ section.label }}</span>
          </div>
        </div>

        <!-- Content area -->
        <div class="col" style="gap: 16px;">
          <!-- General settings -->
          <div v-if="activeSection === 'general'" class="card">
            <div class="card-head">
              <div class="card-title">General settings</div>
            </div>
            <div class="card-body" style="display: grid; gap: 16px;">
              <div class="field">
                <label>Platform name</label>
                <input class="input" value="mìmú" />
              </div>
              <div class="field">
                <label>Support email</label>
                <input class="input" type="email" value="support@mimu.ng" />
              </div>
              <div class="field">
                <label>Support WhatsApp</label>
                <input class="input" value="+234 800 123 4567" />
              </div>
              <div class="field">
                <label>Environment</label>
                <select class="select">
                  <option>Production</option>
                  <option selected>Staging</option>
                  <option>Development</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Payments settings -->
          <div v-if="activeSection === 'payments'" class="card">
            <div class="card-head">
              <div class="card-title">Payment settings</div>
            </div>
            <div class="card-body" style="display: grid; gap: 16px;">
              <div class="field">
                <label>Paystack Secret Key</label>
                <input class="input" type="password" value="sk_live_••••••••••••••••" readonly />
              </div>
              <div class="field">
                <label>WHT Rate (%)</label>
                <input class="input" type="number" value="5" />
                <span class="field-help">Withholding tax deduction rate</span>
              </div>
              <div class="field">
                <label>Payout schedule</label>
                <select class="select">
                  <option>Daily</option>
                  <option selected>Weekly (Monday)</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div class="field">
                <label>Minimum payout threshold</label>
                <input class="input" type="number" value="5000" />
                <span class="field-help">Minimum amount (₦) before triggering payout</span>
              </div>
            </div>
          </div>

          <!-- APCON settings -->
          <div v-if="activeSection === 'apcon'" class="card">
            <div class="card-head">
              <div class="card-title">APCON compliance</div>
            </div>
            <div class="card-body" style="display: grid; gap: 16px;">
              <div class="field">
                <label>Auto-approve safe categories</label>
                <div class="flex gap-2 flex-wrap">
                  <span class="pill pill-active sm">Food & Beverage</span>
                  <span class="pill pill-active sm">Fashion</span>
                  <span class="pill pill-active sm">Beauty (non-medical)</span>
                  <span class="pill pill-neutral sm">Real Estate</span>
                </div>
                <span class="field-help">Categories that skip manual review</span>
              </div>
              <div class="field">
                <label>Always require review</label>
                <div class="flex gap-2 flex-wrap">
                  <span class="pill pill-pending sm">Gambling</span>
                  <span class="pill pill-pending sm">Financial Services</span>
                  <span class="pill pill-pending sm">Health Claims</span>
                  <span class="pill pill-pending sm">Alcohol</span>
                </div>
              </div>
              <div class="field">
                <label>SLA for manual review</label>
                <input class="input" type="number" value="24" />
                <span class="field-help">Hours until review is overdue</span>
              </div>
            </div>
          </div>

          <!-- Fraud detection -->
          <div v-if="activeSection === 'fraud'" class="card">
            <div class="card-head">
              <div class="card-title">Fraud detection</div>
            </div>
            <div class="card-body" style="display: grid; gap: 16px;">
              <div class="field">
                <label>Fraud score threshold</label>
                <input class="input" type="number" step="0.01" value="0.30" />
                <span class="field-help">Minimum score to trigger alert (0.00-1.00)</span>
              </div>
              <div class="field">
                <label>Auto-hold payouts above score</label>
                <input class="input" type="number" step="0.01" value="0.60" />
                <span class="field-help">Automatically pause payouts for high-risk screens</span>
              </div>
              <div class="field">
                <label>CV confidence threshold</label>
                <input class="input" type="number" step="0.01" value="0.75" />
                <span class="field-help">Minimum computer vision confidence for attendance</span>
              </div>
            </div>
          </div>

          <!-- Notifications -->
          <div v-if="activeSection === 'notifications'" class="card">
            <div class="card-head">
              <div class="card-title">Notification preferences</div>
            </div>
            <div class="card-body" style="display: grid; gap: 12px;">
              <div class="field" style="margin: 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" checked />
                  High fraud score alerts (≥0.80)
                </label>
              </div>
              <div class="field" style="margin: 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" checked />
                  System downtime notifications
                </label>
              </div>
              <div class="field" style="margin: 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" checked />
                  SLA breach warnings
                </label>
              </div>
              <div class="field" style="margin: 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" />
                  Daily summary email
                </label>
              </div>
            </div>
          </div>

          <!-- Save button -->
          <div class="flex gap-2 justify-end">
            <button class="btn outline">Reset to defaults</button>
            <button class="btn primary"><i class="ph ph-floppy-disk"></i> Save changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeSection = ref('general')

const sections = [
  { id: 'general', label: 'General', icon: 'ph-gear-six' },
  { id: 'payments', label: 'Payments', icon: 'ph-currency-circle-dollar' },
  { id: 'apcon', label: 'APCON', icon: 'ph-shield-check' },
  { id: 'fraud', label: 'Fraud detection', icon: 'ph-shield-warning' },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bell' },
]
</script>
