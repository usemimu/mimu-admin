<template>
  <div
    class="modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 60;"
    @click.self="onCancel"
  >
    <div class="card" style="padding: 22px; width: 480px; max-width: 92vw;">
      <h3 style="margin: 0 0 4px;">Mark screen as installed</h3>
      <p class="fg2 text-xs" style="margin: 0 0 16px;">
        Confirms the hardware is up at the venue. Status moves from
        <span class="mono">pending_install</span> →
        <span class="mono">active</span>, and the install timestamp +
        admin are recorded on the audit trail.
      </p>

      <div
        style="background: var(--bg-sunken); padding: 12px; border-radius: 6px; margin-bottom: 16px;"
      >
        <div class="text-xs fg2" style="margin-bottom: 4px;">Screen</div>
        <div class="font-medium">{{ screen?.venueName || '—' }}</div>
        <div class="fg2 text-xs" style="margin-top: 2px;">
          {{ screen?.address || '' }}
        </div>
        <div class="mono fg2 text-xs" style="margin-top: 6px;">{{ screen?.id }}</div>
      </div>

      <div
        v-if="!hasHost"
        style="padding: 10px 12px; border-radius: 6px; background: rgba(180,136,28,0.08); border: 1px solid rgba(180,136,28,0.25); margin-bottom: 16px;"
        class="text-xs"
      >
        <strong>No host assigned.</strong> The screen will activate but won't
        attribute earnings until a host is linked.
      </div>

      <div class="text-xs fg2" style="margin-bottom: 12px;">
        Ad serving will start on the next heartbeat from the player.
      </div>

      <div class="flex" style="gap: 8px; justify-content: flex-end;">
        <button class="btn ghost sm" :disabled="busy" @click="onCancel">Cancel</button>
        <button class="btn primary sm" :disabled="busy" @click="onConfirm">
          {{ busy ? 'Activating…' : 'Mark as installed' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  screen: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['cancel', 'confirm'])

const hasHost = computed(() =>
  Boolean(props.screen?.hostId || props.screen?.host?.id),
)

function onCancel() {
  if (props.busy) return
  emit('cancel')
}
function onConfirm() {
  if (props.busy) return
  emit('confirm')
}
</script>
