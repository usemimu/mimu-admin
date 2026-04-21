<template>
  <div>
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title">Admin users</div>
        <span class="fg2 text-xs">8 total · 7 active · 1 inactive</span>
        <div class="spacer"></div>
        <button class="btn primary sm"><i class="ph ph-plus"></i> Invite admin</button>
      </div>
    </div>

    <div class="page-body">
      <div class="filterbar" style="margin-bottom: 12px;">
        <span class="chip"><strong>Status</strong> Active</span>
        <span class="chip"><strong>Role</strong> All</span>
        <button class="btn ghost sm"><i class="ph ph-plus"></i> Add filter</button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-[var(--border)]">
            <tr class="text-left text-xs">
              <th class="p-3">Name</th>
              <th class="p-3">Email</th>
              <th class="p-3">Role</th>
              <th class="p-3">Status</th>
              <th class="p-3">Last seen</th>
              <th class="p-3">Joined</th>
              <th class="p-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in MOCK.adminUsers"
              :key="user.id"
              class="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <div
                    class="avatar"
                    :style="{ width: '32px', height: '32px', fontSize: '12px', borderRadius: '6px' }"
                  >
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <div class="font-semibold">{{ user.name }}</div>
                    <div class="mono text-[11px] text-[var(--fg-3)]">{{ user.id }}</div>
                  </div>
                </div>
              </td>
              <td class="p-3 mono fg2 text-xs">{{ user.email }}</td>
              <td class="p-3">
                <span class="pill pill-neutral sm">{{ user.role.replace('_', ' ') }}</span>
              </td>
              <td class="p-3">
                <span class="pill" :class="{
                  'pill-active': user.status === 'active',
                  'pill-neutral': user.status === 'inactive'
                }">
                  {{ user.status }}
                </span>
              </td>
              <td class="p-3 mono fg2 text-xs">{{ fmt.rel(user.lastSeen) }}</td>
              <td class="p-3 fg2 text-xs">{{ formatDate(user.joined) }}</td>
              <td class="p-3">
                <button class="btn ghost sm"><i class="ph ph-dots-three-vertical"></i></button>
              </td>
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

const getInitials = (name) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const month = d.toLocaleString('en', { month: 'short' })
  const day = d.getDate()
  const year = d.getFullYear()
  return `${month} ${day}, ${year}`
}
</script>
