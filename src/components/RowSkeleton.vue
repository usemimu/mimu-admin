<template>
  <!-- Renders `count` faux rows during the first load of a list view.
       Use it instead of a centered spinner so the page layout doesn't
       jump when real data arrives. Width of each placeholder bar
       varies slightly so it doesn't read as a single grey block. -->
  <div class="skeleton-list" aria-hidden="true">
    <div v-for="i in count" :key="i" class="skeleton-row">
      <div class="skeleton-bar" :style="{ width: barWidth(i) }"></div>
      <div class="skeleton-bar small" :style="{ width: smallBarWidth(i) }"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 6 },
})

// Vary widths so the skeleton doesn't read as a single grey rectangle.
function barWidth(i) {
  const sizes = ['62%', '78%', '54%', '85%', '70%', '58%']
  return sizes[i % sizes.length]
}
function smallBarWidth(i) {
  const sizes = ['28%', '36%', '22%', '40%', '30%', '34%']
  return sizes[i % sizes.length]
}
</script>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}
.skeleton-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
}
.skeleton-bar {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 0%,
    var(--border) 50%,
    var(--bg-hover) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}
.skeleton-bar.small {
  height: 8px;
  opacity: 0.7;
}
@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
