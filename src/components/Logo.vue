<template>
  <svg
    class="logo-mark"
    :width="size"
    :height="size"
    viewBox="0 0 200 150"
    fill="none"
    :style="{ color: mono ? 'currentColor' : '#B55430' }"
  >
    <!-- Bouncing ball M logo from M Logo Explorations -->
    <path
      :d="markPath"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <circle
      :cx="dotCx"
      :cy="dotCy"
      :r="dotR"
      :fill="color"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: Number,
    default: 22
  },
  mono: {
    type: Boolean,
    default: true
  }
})

const color = computed(() => props.mono ? 'currentColor' : '#B55430')

// Bouncing ball mark parameters (from M Logo Explorations.html defaults)
const humps = 2
const humpHeight = 80
const humpWidth = 38
const decay = 0
const stroke = 22
const gap = 20
const dot = 11
const flatBottom = true

const baseline = 120
const pad = 20

// Build the mark path
const buildMark = () => {
  const widths = []
  const heights = []

  for (let i = 0; i < humps; i++) {
    const k = Math.pow(1 - decay, i)
    widths.push(humpWidth * (0.7 + 0.3 * k))
    heights.push(humpHeight * k)
  }

  let d = ''
  let x = pad

  for (let i = 0; i < humps; i++) {
    const w = widths[i]
    const h = heights[i]
    const xMid = x + w / 2
    const xEnd = x + w

    if (i === 0) d += `M${x.toFixed(1)},${baseline} `

    // Up arc
    const c1x = x + w * 0.08, c1y = baseline - h * 1.05
    const c2x = xMid - w * 0.18, c2y = baseline - h
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${xMid.toFixed(1)},${(baseline - h).toFixed(1)} `

    // Down arc
    const c3x = xMid + w * 0.18, c3y = baseline - h
    const c4x = xEnd - w * 0.08, c4y = baseline - h * 1.05
    d += `C${c3x.toFixed(1)},${c3y.toFixed(1)} ${c4x.toFixed(1)},${c4y.toFixed(1)} ${xEnd.toFixed(1)},${baseline.toFixed(1)} `

    x = xEnd

    if (!flatBottom && i < humps - 1) {
      const dipW = 6
      const dipY = baseline + 4
      d += `C${(x + 1).toFixed(1)},${dipY.toFixed(1)} ${(x + dipW - 1).toFixed(1)},${dipY.toFixed(1)} ${(x + dipW).toFixed(1)},${baseline.toFixed(1)} `
      x += dipW
    }
  }

  const dotCx = x + gap + dot
  const dotCy = baseline

  return { d, dotCx, dotCy, strokeW: stroke, dotR: dot }
}

const mark = buildMark()
const markPath = mark.d
const dotCx = mark.dotCx
const dotCy = mark.dotCy
const strokeWidth = mark.strokeW
const dotR = mark.dotR
</script>

<style scoped>
.logo-mark {
  flex-shrink: 0;
}
</style>
