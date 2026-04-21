<template>
  <div v-if="creative">
    <div class="drawer-overlay" @click="$emit('close')"></div>
    <div class="drawer wide">
      <div class="drawer-head">
        <div>
          <div class="flex ac g8">
            <span class="pill pill-pending">In review</span>
            <span class="mono" style="font-size: 11px; color: var(--fg-3);">{{ creative.id }}</span>
          </div>
          <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">{{ creative.adv }} — {{ creative.camp }}</div>
        </div>
        <div class="flex ac g8">
          <button class="btn sm ghost" title="Previous (←)"><i class="ph ph-caret-left"></i></button>
          <button class="btn sm ghost" title="Next (→)"><i class="ph ph-caret-right"></i></button>
          <button class="btn sm ghost" @click="$emit('close')"><i class="ph ph-x"></i></button>
        </div>
      </div>
      <div class="drawer-body" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; padding: 0;">
        <!-- Left: video + advertiser -->
        <div style="padding: 18px; border-right: 1px solid var(--border);">
          <div style="aspect-ratio: 16/9; background: var(--neutral-900); border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
            <div style="font-size: 72px; opacity: 0.6;">{{ creative.thumb }}</div>
            <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; align-items: center; gap: 10px; color: #fff;">
              <button style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: #fff; cursor: pointer;">
                <i class="ph ph-play-fill"></i>
              </button>
              <div style="flex: 1; height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
                <div style="width: 38%; height: 100%; background: #fff;"></div>
              </div>
              <span class="mono" style="font-size: 11px; color: rgba(255,255,255,0.8);">0:05 / 0:{{ String(creative.dur).padStart(2, '0') }}</span>
              <i class="ph ph-speaker-slash" style="font-size: 16px;"></i>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-top: 20px; margin-bottom: 10px;">Advertiser</div>
          <div class="flex ac g12">
            <div class="avatar" :style="{ width: '36px', height: '36px', fontSize: '14px', borderRadius: '8px' }">
              {{ getInitials(creative.adv) }}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600;">{{ creative.adv }}</div>
              <div class="fg2" style="font-size: 12px;">ADV-0801 · Yaba · Eatery · Verified KYC</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 14px;">
            <div>
              <div class="fg2" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Approval rate</div>
              <div style="font-size: 20px; font-family: var(--f-display); color: var(--moss-500);">94%</div>
              <div class="fg2" style="font-size: 11px;">18 of 19 creatives</div>
            </div>
            <div>
              <div class="fg2" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Lifetime spend</div>
              <div style="font-size: 20px; font-family: var(--f-display);">₦184,200</div>
              <div class="fg2" style="font-size: 11px;">3 active campaigns</div>
            </div>
          </div>
          <div class="hr"></div>
          <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 8px;">Targeting summary</div>
          <div style="font-size: 13px; color: var(--fg-2); line-height: 1.6;">
            <strong style="color: var(--fg);">Screens:</strong> 12 pharmacies in Surulere + Yaba<br/>
            <strong style="color: var(--fg);">Daypart:</strong> Friday–Sunday, 11am–9pm<br/>
            <strong style="color: var(--fg);">Budget:</strong> ₦25,000 / week
          </div>
        </div>

        <!-- Right: auto-prescreen + decision -->
        <div style="padding: 18px;">
          <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 10px;">Auto-prescreen</div>
          <div class="card" style="padding: 14px; margin-bottom: 14px; background: var(--bg-sunken);">
            <div class="flex ac g8" style="margin-bottom: 10px;">
              <i class="ph ph-check-circle" style="color: var(--moss-500); font-size: 18px;"></i>
              <strong>Category:</strong> Food & Beverage (0.96 conf)
            </div>
            <div class="flex ac g8" style="margin-bottom: 10px;">
              <i class="ph ph-check-circle" style="color: var(--moss-500); font-size: 18px;"></i>
              <strong>Claims:</strong> None detected
            </div>
            <div class="flex ac g8" style="margin-bottom: 10px;">
              <i class="ph ph-check-circle" style="color: var(--moss-500); font-size: 18px;"></i>
              <strong>APCON codes:</strong> 3.1, 5.2 clear
            </div>
            <div class="flex ac g8">
              <i class="ph ph-info" style="color: var(--info-500); font-size: 18px;"></i>
              <strong>Audio:</strong> Pidgin voiceover (acceptable)
            </div>
          </div>

          <div style="padding: 12px; border-radius: 8px; background: rgba(43,114,68,0.08); border: 1px solid rgba(43,114,68,0.2); margin-bottom: 18px;">
            <div class="flex ac g8" style="margin-bottom: 4px;">
              <i class="ph ph-sparkle" style="color: var(--moss-500);"></i>
              <strong style="color: var(--moss-500); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Suggested action</strong>
            </div>
            <div style="font-size: 13px; color: var(--fg-2);">Approve. All auto-checks clear. Advertiser has 94% approval history.</div>
          </div>

          <div class="field">
            <label>Decision notes (audit log)</label>
            <textarea class="textarea" placeholder="Optional — add context for approval decision…" v-model="notes"></textarea>
          </div>

          <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 8px; margin-top: 8px;">Send back — common reasons</div>
          <div class="flex g4" style="flex-wrap: wrap; margin-bottom: 18px;">
            <button v-for="reason in commonReasons" :key="reason" class="btn outline sm">{{ reason }}</button>
          </div>
        </div>
      </div>
      <div class="drawer-foot" style="justify-content: space-between;">
        <div class="flex ac g8" style="font-size: 11px; color: var(--fg-3);">
          <span class="kbd">A</span> Approve · <span class="kbd">S</span> Send back · <span class="kbd">R</span> Reject
        </div>
        <div class="flex g8">
          <button class="btn outline" @click="$emit('close')">Cancel</button>
          <button class="btn danger" @click="handleReject">Reject</button>
          <button class="btn outline" @click="handleSendBack">Send back</button>
          <button class="btn success" @click="handleApprove">Approve <span class="kbd">enter</span></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  creative: Object
})

const emit = defineEmits(['close', 'toast'])

const notes = ref('')
const commonReasons = [
  'Needs APCON certificate',
  'Audio too loud',
  'Misleading claim',
  'Logo too small',
  'Resolution too low'
]

const getInitials = (name) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const handleApprove = () => {
  emit('toast', {
    kind: 'success',
    title: 'Approved',
    body: `${props.creative.id} — queued to CDN`
  })
  emit('close')
}

const handleSendBack = () => {
  emit('toast', {
    kind: 'warning',
    title: 'Sent back',
    body: props.creative.id
  })
  emit('close')
}

const handleReject = () => {
  emit('toast', {
    kind: 'error',
    title: 'Creative rejected',
    body: props.creative.id
  })
  emit('close')
}
</script>
