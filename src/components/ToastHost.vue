<template>
  <div class="toast-region">
    <div
      v-for="t in toastStore.items"
      :key="t.id"
      :class="['toast', t.kind || 'info']"
    >
      <i
        :class="[
          'ph',
          t.kind === 'success' ? 'ph-check-circle' :
          t.kind === 'error' ? 'ph-x-circle' :
          t.kind === 'warning' ? 'ph-warning' :
          'ph-info'
        ]"
        :style="{
          fontSize: '16px',
          color: `var(--${
            t.kind === 'success' ? 'moss' :
            t.kind === 'error' ? 'danger' :
            t.kind === 'warning' ? 'gold' :
            'info'
          }-500)`
        }"
      ></i>
      <div style="flex: 1;">
        <div class="toast-title">{{ t.title || t.message }}</div>
        <div v-if="t.body" class="toast-body">{{ t.body }}</div>
      </div>
      <i
        class="ph ph-x"
        @click="toastStore.dismiss(t.id)"
        style="cursor: pointer; color: var(--fg-3); font-size: 14px;"
      ></i>
    </div>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

// Reads directly from the Pinia store now — components no longer pass an
// array down. Existing call sites that did `@toast="toast"` should switch to
// `useToastStore()` and call `.success(...)`/`.error(...)` directly.
const toastStore = useToastStore()
</script>
