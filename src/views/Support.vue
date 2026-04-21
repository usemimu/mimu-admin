<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Support inbox</div>
        <span class="pill pill-pending lg">{{ MOCK.tickets.length }} open</span>
        <span class="fg2 text-xs">1 SLA breach · 2 approaching</span>
        <div class="spacer"></div>
        <div class="flex items-center gap-2 text-[11px] text-[var(--fg-3)]">
          <span class="kbd">J</span><span class="kbd">K</span> navigate ·
          <span class="kbd">A</span> assign ·
          <span class="kbd">C</span> close
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3 w-8"></th>
              <th class="p-3">Subject</th>
              <th class="p-3">Author</th>
              <th class="p-3">Category</th>
              <th class="p-3">Priority</th>
              <th class="p-3">Assigned</th>
              <th class="p-3">SLA</th>
              <th class="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in MOCK.tickets"
              :key="ticket.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <i class="ph text-sm" :class="{
                  'ph-whatsapp-logo text-moss-500': ticket.channel === 'whatsapp',
                  'ph-envelope': ticket.channel === 'email',
                  'ph-chat-circle': ticket.channel === 'in-app'
                }"></i>
              </td>
              <td class="p-3">
                <div class="font-medium">{{ ticket.subj }}</div>
                <div class="mono text-[11px] text-[var(--fg-3)]">{{ ticket.id }}</div>
              </td>
              <td class="p-3">
                <div class="text-xs">{{ ticket.author }}</div>
                <div class="fg2 text-[10px] uppercase tracking-wider">{{ ticket.authorRole }}</div>
              </td>
              <td class="p-3"><span class="pill pill-neutral sm">{{ ticket.cat }}</span></td>
              <td class="p-3">
                <span class="pill sm" :class="{
                  'pill-failed': ticket.prio === 'high',
                  'pill-pending': ticket.prio === 'med',
                  'pill-neutral': ticket.prio === 'low'
                }">{{ ticket.prio }}</span>
              </td>
              <td class="p-3 fg2 text-xs">{{ ticket.assigned || '—' }}</td>
              <td class="p-3">
                <span class="pill sm" :class="{
                  'pill-active': ticket.sla === 'within',
                  'pill-pending': ticket.sla === 'approaching',
                  'pill-failed': ticket.sla === 'breach'
                }">
                  {{ ticket.sla === 'breach' ? 'breached' : ticket.sla === 'approaching' ? fmt.time(ticket.slaLeft) + ' left' : 'within' }}
                </span>
              </td>
              <td class="p-3 mono fg2 text-[11px]">{{ fmt.rel(ticket.updated) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMockData } from '../composables/useMockData'
import { fmt } from '../utils/format'

const { MOCK } = useMockData()
</script>
