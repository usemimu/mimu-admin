<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal sm" @click.stop>
      <div class="modal-head">
        <div class="flex ac g8">
          <i class="ph ph-shield-check" style="font-size: 20px; color: var(--moss-500);"></i>
          <div class="modal-title">Re-authenticate to continue</div>
        </div>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 14px;">This action moves money. Enter the 6-digit code from your authenticator to approve the payout.</div>
        <div class="flex g8" style="justify-content: center; margin: 18px 0;">
          <input
            v-for="i in 6"
            :key="i"
            class="input"
            style="width: 38px; height: 46px; text-align: center; font-size: 20px; font-family: var(--f-mono); padding: 0;"
            maxlength="1"
          />
        </div>
        <div style="font-size: 11px; color: var(--fg-3); text-align: center;">This approval will be logged in the audit trail.</div>
      </div>
      <div class="modal-foot">
        <button class="btn outline" @click="$emit('close')">Cancel</button>
        <button class="btn success" @click="$emit('confirm')"><i class="ph ph-check"></i> Approve & transfer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close', 'confirm'])
</script>
