<template>
  <!-- Small label + value pair used inside KycPayloadCard's grids. The
       slot variant is for cases where the value is a pill / link / etc.
       rather than plain text. Empty values render as an em dash so the
       grid stays aligned even when fields are missing from the payload. -->
  <div class="kyc-field">
    <div class="kyc-field-label">{{ label }}</div>
    <div class="kyc-field-value" :class="{ mono: mono }">
      <slot>{{ display }}</slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number, null], default: null },
  mono: { type: Boolean, default: false },
})

const display = computed(() => {
  if (props.value == null) return '—'
  const s = String(props.value).trim()
  return s.length > 0 ? s : '—'
})
</script>

<style scoped>
.kyc-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.kyc-field-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-3);
}
.kyc-field-value {
  font-size: 13px;
  color: var(--fg);
  overflow-wrap: anywhere;
}
.kyc-field-value.mono {
  font-family: var(--f-mono);
  font-size: 12px;
}
</style>
