<template>
  <div style="width: 400px">
    <!-- Login flow -->
    <div v-if="flow === 'login'">
      <div style="text-align: center; margin-bottom: 32px">
        <div style="display: inline-flex; align-items: center; gap: 12px">
          <Logo :size="80" />
        </div>
        <div
          style="
            font-size: 13px;
            color: var(--fg-3);
            margin-top: 8px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-family: var(--f-mono);
          "
        >
          Admin Console
        </div>
      </div>
      <div class="card raised" style="padding: 28px">
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px">
          Sign in
        </div>
        <div class="fg2" style="font-size: 12px; margin-bottom: 20px">
          Restricted to staff with @mimu accounts.
        </div>
        <button
          class="btn outline"
          style="width: 100%; padding: 10px; justify-content: center; gap: 10px"
          @click="flow = 'totp'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC04"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
        <div
          style="
            text-align: center;
            font-size: 11px;
            color: var(--fg-3);
            margin-top: 16px;
          "
        >
          <!-- Need access? Contact <a href="#" style="color: var(--clay-500);">it@mi</a> -->
        </div>
      </div>
      <div
        style="
          text-align: center;
          font-size: 11px;
          color: var(--fg-3);
          margin-top: 24px;
        "
      >
        Mìmú Admi <a href="#" style="color: var(--fg-2)">Status</a> ·
        <a href="#" style="color: var(--fg-2)">Help</a>
      </div>
    </div>

    <!-- TOTP flow -->
    <div v-if="flow === 'totp'">
      <div style="text-align: center; margin-bottom: 24px">
        <Logo :size="32" />
        <div
          style="
            font-size: 11px;
            color: var(--fg-3);
            margin-top: 8px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-family: var(--f-mono);
          "
        >
          Admin Console
        </div>
      </div>
      <div class="card raised" style="padding: 28px">
        <div class="flex ac g8" style="margin-bottom: 4px">
          <i
            class="ph ph-shield-check"
            style="font-size: 18px; color: var(--moss-500)"
          ></i>
          <div style="font-size: 16px; font-weight: 700">
            Two-factor verification
          </div>
        </div>
        <div class="fg2" style="font-size: 12px; margin-bottom: 20px">
          Enter the 6-digit code from your authenticator app for
          <strong style="color: var(--fg)">t.adesina@mimu.ng</strong>
        </div>
        <div
          class="flex"
          style="justify-content: center; gap: 8px; margin-bottom: 16px"
        >
          <input
            v-for="i in 6"
            :key="i"
            class="input"
            style="
              width: 42px;
              height: 52px;
              text-align: center;
              font-size: 22px;
              font-family: var(--f-mono);
              font-weight: 600;
              padding: 0;
            "
            :value="[2, 5, 8, 3, 6, 1][i - 1]"
          />
        </div>
        <button
          class="btn primary"
          style="width: 100%; padding: 10px"
          @click="$emit('auth-complete')"
        >
          Verify & continue
        </button>
        <div
          style="
            text-align: center;
            font-size: 11px;
            color: var(--fg-3);
            margin-top: 14px;
          "
        >
          <a href="#" style="color: var(--fg-2)">Use a backup code</a> ·
          <a href="#" style="color: var(--fg-2)">Help</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Logo from "../components/Logo.vue";

defineProps({
  flow: {
    type: String,
    default: "login",
  },
});

defineEmits(["auth-complete"]);

const flow = ref("login");
</script>
