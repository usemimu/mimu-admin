<template>
  <!-- Distinct from EmptyState: this is "we tried and it failed" —
       always offer a retry. The HTTP layer normalizes errors into an
       `ApiError` with a `.message`, so the caller usually just passes
       `error.message` straight through. -->
  <div class="error-state">
    <i class="ph ph-warning-circle error-icon"></i>
    <div class="error-title">{{ title }}</div>
    <div v-if="message" class="error-message">{{ message }}</div>
    <button
      v-if="onRetry"
      class="btn outline sm"
      style="margin-top: 12px"
      @click="onRetry"
    >
      <i class="ph ph-arrow-clockwise"></i>
      Retry
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Could not load' },
  message: { type: String, default: '' },
  onRetry: { type: Function, default: null },
})
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}
.error-icon {
  font-size: 36px;
  color: var(--danger-500);
  margin-bottom: 12px;
}
.error-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 4px;
}
.error-message {
  font-size: 13px;
  color: var(--fg-2);
  max-width: 480px;
  line-height: 1.5;
}
</style>
