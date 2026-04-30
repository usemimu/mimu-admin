import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '../stores/auth'
import { roleHasPermission } from '../lib/permissions'

/**
 * Single ergonomic hook for views that need the current admin's
 * identity, role, or permission checks. Wraps the auth store so views
 * don't reach into store internals; if the auth surface ever changes
 * (move off Pinia, switch to /me caching, etc.) we update one file.
 *
 * Usage:
 *   const me = useCurrentAdmin()
 *   me.user.value         // raw user object or null
 *   me.displayName.value  // full name, falls back to email, then 'Admin'
 *   me.initials.value     // 2-char avatar initials
 *   me.role.value         // 'ops_lead' | 'finance' | etc., or null
 *   me.can('creatives.approve')  // boolean
 */
export function useCurrentAdmin() {
  const auth = useAuthStore()
  const { user, status, lastVerifiedAt } = storeToRefs(auth)

  const role = computed(() => user.value?.role ?? null)

  const displayName = computed(() => {
    const u = user.value
    if (!u) return ''
    return u.name?.trim() || u.email || 'Admin'
  })

  const email = computed(() => user.value?.email ?? '')
  const avatarUrl = computed(() => user.value?.avatarUrl ?? null)

  /** First letter of each word, max 2, uppercase. Falls back to '?'. */
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return '?'
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    const letters = parts.slice(0, 2).map((w) => w[0])
    return letters.join('').toUpperCase()
  })

  /** Pretty version of the role for badges: `ops_lead` → `Ops lead`. */
  const roleLabel = computed(() => {
    if (!role.value) return ''
    return role.value.replace(/_/g, ' ')
  })

  /**
   * `can('creatives.approve')` — true if the user's role grants the
   * permission. Always false when not signed in. The backend remains
   * authoritative; this is just a UI hint to avoid showing dead-end
   * actions that would 403 on click.
   */
  const can = (permission) => roleHasPermission(role.value, permission)

  /** Convenience for "any of these permissions". */
  const canAny = (permissions) => permissions.some((p) => can(p))

  return {
    user,
    status,
    lastVerifiedAt,
    role,
    roleLabel,
    displayName,
    email,
    avatarUrl,
    initials,
    can,
    canAny,
    isAuthenticated: computed(() => status.value === 'authenticated'),
  }
}
