<template>
  <div class="toast-region">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', toast.kind || 'info']"
    >
      <i
        :class="[
          'ph',
          toast.kind === 'success' ? 'ph-check-circle' :
          toast.kind === 'error' ? 'ph-x-circle' :
          toast.kind === 'warning' ? 'ph-warning' :
          'ph-info'
        ]"
        :style="{
          fontSize: '16px',
          color: `var(--${
            toast.kind === 'success' ? 'moss' :
            toast.kind === 'error' ? 'danger' :
            toast.kind === 'warning' ? 'gold' :
            'info'
          }-500)`
        }"
      ></i>
      <div style="flex: 1;">
        <div class="toast-title">{{ toast.title }}</div>
        <div v-if="toast.body" class="toast-body">{{ toast.body }}</div>
      </div>
      <i
        class="ph ph-x"
        @click="$emit('dismiss', toast.id)"
        style="cursor: pointer; color: var(--fg-3); font-size: 14px;"
      ></i>
    </div>
  </div>
</template>

<script setup>
defineProps({
  toasts: {
    type: Array,
    default: () => []
  }
})

defineEmits(['dismiss'])
</script>
