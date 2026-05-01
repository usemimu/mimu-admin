<template>
  <div class="not-found">
    <div class="card" style="padding: 48px 32px; max-width: 520px; width: 100%; text-align: center;">
      <div class="code">404</div>
      <div class="title">Page not found</div>
      <div class="message">
        We couldn't find <span class="mono">{{ attemptedPath }}</span>.
        You'll be taken to the dashboard in {{ countdown }}…
      </div>
      <div class="flex" style="gap: 8px; justify-content: center; margin-top: 20px;">
        <button class="btn primary sm" @click="goHome">
          <i class="ph ph-house"></i> Go to dashboard now
        </button>
        <button class="btn ghost sm" @click="$router.back()">
          <i class="ph ph-arrow-left"></i> Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const attemptedPath = ref(route.fullPath)
const countdown = ref(4)
let intervalId = null

function goHome() {
  router.replace('/')
}

onMounted(() => {
  intervalId = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(intervalId)
      intervalId = null
      goHome()
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.not-found {
  min-height: calc(100vh - 44px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.code {
  font-family: var(--f-mono);
  font-size: 72px;
  font-weight: 700;
  color: var(--fg-3);
  line-height: 1;
  margin-bottom: 8px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 8px;
}
.message {
  font-size: 13px;
  color: var(--fg-2);
  line-height: 1.5;
}
</style>
