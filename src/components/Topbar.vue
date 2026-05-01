<template>
  <div class="topbar">
    <button class="tb-btn" @click="$emit('toggle-sidebar')" title="Toggle sidebar">
      <i class="ph ph-sidebar-simple"></i>
    </button>

    <div class="tb-search" @click="$emit('open-cmdk')">
      <i class="ph ph-magnifying-glass"></i>
      <span class="tb-search-flex">Search hosts, screens, advertisers, actions…</span>
      <span class="flex items-center gap-0.5">
        <span class="kbd">⌘</span>
        <span class="kbd">K</span>
      </span>
    </div>

    <div class="tb-right">
      <button class="tb-btn" @click="$emit('toggle-theme')" title="Toggle theme">
        <i class="ph" :class="theme === 'dark' ? 'ph-sun' : 'ph-moon'"></i>
      </button>

      <button class="tb-btn" title="Notifications">
        <i class="ph ph-bell"></i>
        <span class="dot"></span>
      </button>

      <div class="w-px h-5 bg-[var(--border)] mx-1"></div>

      <button class="tb-btn" title="Keyboard shortcuts (⌘/)">
        <i class="ph ph-keyboard"></i>
      </button>

      <div class="relative">
        <div
          ref="trigger"
          class="flex items-center gap-2 px-1.5 cursor-pointer hover:bg-[var(--bg-hover)] rounded"
          @click="toggleMenu"
        >
          <img
            v-if="me.avatarUrl.value"
            :src="me.avatarUrl.value"
            :alt="me.displayName.value"
            class="avatar-img"
            referrerpolicy="no-referrer"
          />
          <div
            v-else
            class="avatar"
            :style="{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }"
          >
            {{ me.initials.value }}
          </div>
          <i class="ph ph-caret-down text-xs text-[var(--fg-3)]"></i>
        </div>
      </div>
    </div>
  </div>

  <!--
    Profile dropdown is teleported to <body> so it shares the root
    stacking context with the click-catcher overlay below. Without
    this, the topbar's own `z-[5]` stacking context kept the dropdown
    *below* the overlay (which sits at z-40), and clicks on Settings/
    Logout hit the overlay first and never reached the buttons.

    `position: fixed` + dynamic top/right snaps the menu to the
    trigger's bounding box; `triggerRect` recomputes on every open.
  -->
  <Teleport to="body">
    <div
      v-if="showProfileMenu"
      @click="closeMenu"
      class="fixed inset-0"
      style="z-index: 998;"
    ></div>
    <div
      v-if="showProfileMenu"
      class="fixed w-56 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg shadow-lg"
      :style="{
        zIndex: 999,
        top: `${triggerRect.bottom + 4}px`,
        right: `${triggerRect.rightFromViewport}px`,
      }"
      @click.stop
    >
      <div class="p-3 border-b border-[var(--border)]">
        <div class="font-semibold text-sm">{{ me.displayName.value }}</div>
        <div class="text-xs text-[var(--fg-3)]">{{ me.email.value }}</div>
        <div v-if="me.roleLabel.value" class="pill pill-neutral sm mt-1">
          {{ me.roleLabel.value }}
        </div>
      </div>
      <div class="p-1">
        <button
          class="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] rounded flex items-center gap-2 text-sm"
          @click="navigateToSettings"
        >
          <i class="ph ph-gear-six"></i> Settings
        </button>
      </div>
      <div class="p-1 border-t border-[var(--border)]">
        <button
          class="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] rounded flex items-center gap-2 text-sm text-danger-500"
          @click="handleLogout"
        >
          <i class="ph ph-sign-out"></i> Logout
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCurrentAdmin } from '../composables/useCurrentAdmin'

const router = useRouter()

defineProps({
  theme: String,
})

const emit = defineEmits(['toggle-theme', 'toggle-sidebar', 'open-cmdk', 'logout'])

// Live identity. The composable wraps the auth Pinia store so this
// stays reactive when /me refreshes (heartbeat, post-login, etc.).
const me = useCurrentAdmin()

const showProfileMenu = ref(false)
const trigger = ref(null)
// Position of the avatar trigger in viewport coordinates. The menu is
// teleported to <body> and rendered with `position: fixed`, so we
// have to compute these ourselves rather than rely on the trigger's
// stacking context.
const triggerRect = reactive({ bottom: 0, rightFromViewport: 0 })

function captureTriggerPosition() {
  const el = trigger.value
  if (!el) return
  const r = el.getBoundingClientRect()
  triggerRect.bottom = r.bottom
  // CSS `right` is measured from the viewport's right edge, so we
  // subtract the trigger's right edge from window.innerWidth.
  triggerRect.rightFromViewport = window.innerWidth - r.right
}

function toggleMenu() {
  if (showProfileMenu.value) {
    showProfileMenu.value = false
    return
  }
  captureTriggerPosition()
  showProfileMenu.value = true
}

function closeMenu() {
  showProfileMenu.value = false
}

const navigateToSettings = () => {
  closeMenu()
  router.push('/settings')
}

const handleLogout = () => {
  closeMenu()
  emit('logout')
}
</script>

<style scoped>
.avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
}
</style>
