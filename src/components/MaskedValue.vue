<template>
  <div class="masked-row" :title="path">
    <span class="masked-path mono">{{ path }}</span>
    <span class="masked-value mono">{{ masked }}</span>
    <button
      class="masked-copy"
      :title="copied ? 'Copied' : 'Copy raw value'"
      @click="copy"
    >
      <i class="ph" :class="copied ? 'ph-check' : 'ph-copy'"></i>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToastStore } from '../stores/toast'

const props = defineProps({
  path: { type: String, required: true },
  raw: { type: null, required: true },
  masked: { type: String, required: true },
})

const toast = useToastStore()
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(String(props.raw))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // Older browsers / non-secure contexts don't expose the clipboard
    // API. Fallback would be a hidden textarea + execCommand, but
    // surfacing the error is honest — the operator can still read
    // the raw value off devtools if they really need it.
    toast.error('Clipboard unavailable in this browser.')
  }
}
</script>

<style scoped>
.masked-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
}
.masked-path {
  color: var(--fg-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.masked-value {
  color: var(--fg-3);
  letter-spacing: 0.04em;
}
.masked-copy {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 3px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.masked-copy:hover {
  background: var(--bg-hover);
  color: var(--fg);
}
</style>
