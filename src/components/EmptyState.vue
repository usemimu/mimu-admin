<template>
  <!-- Used by every queue/list view when the API returns 0 rows. The
       icon + title combo is what tells the user "this is intentional,
       there's just nothing here right now" — distinct from a loading
       skeleton (which says "we're still asking") and an error (which
       says "we asked and it broke"). -->
  <div class="empty-state">
    <i v-if="icon" class="ph empty-icon" :class="icon"></i>
    <div class="empty-title">{{ title }}</div>
    <div v-if="message" class="empty-message">{{ message }}</div>
    <button
      v-if="ctaLabel"
      class="btn outline sm"
      style="margin-top: 12px"
      @click="$emit('cta')"
    >
      {{ ctaLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'ph-tray' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  ctaLabel: { type: String, default: '' },
})

defineEmits(['cta'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--fg-2);
}
.empty-icon {
  font-size: 36px;
  color: var(--fg-3);
  margin-bottom: 12px;
}
.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 4px;
}
.empty-message {
  font-size: 13px;
  color: var(--fg-2);
  max-width: 360px;
  line-height: 1.5;
}
</style>
