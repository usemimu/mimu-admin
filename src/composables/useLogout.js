import { useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

/**
 * Single source of truth for "user signed out". Called from:
 *   - the Topbar profile dropdown
 *   - the Settings page Sign-out button
 *   - any future surface that needs an explicit logout
 *
 * What it does, in this order, and why:
 *
 *   1. `auth.logout()` — POST `/auth/logout` (best-effort; the store
 *      swallows network failures so a flaky logout still flips local
 *      state). The backend revokes the session in Redis + DB and
 *      clears the auth cookies with matching options so the browser
 *      actually drops them (Express's `clearCookie` only deletes a
 *      cookie when options match how it was set — bare calls leak the
 *      cookie and `/me` keeps succeeding, making logout look broken).
 *
 *   2. `queryClient.clear()` — wipe vue-query's cache. Without this,
 *      a different admin signing in on the same browser would briefly
 *      see the previous user's cached lists/dashboards before fresh
 *      queries replaced them. Also stops any in-flight polling that
 *      would otherwise fire 401s post-logout.
 *
 *   3. `router.replace('/auth')` — `replace` (not `push`) so the
 *      browser back button can't return to a protected page that's
 *      now serving stale cached state.
 *
 *   4. Toast — one consistent confirmation across all surfaces. The
 *      caller can pass `silent: true` for cases where the toast
 *      would be redundant (e.g. session-expired auto-logout already
 *      surfaces its own message).
 *
 * @returns `{ logout, signOut }` — alias for ergonomics; call either.
 */
export function useLogout() {
  const auth = useAuthStore()
  const toast = useToastStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  async function logout({ silent = false } = {}) {
    await auth.logout()
    queryClient.clear()
    if (!silent) toast.success('Signed out.')
    await router.replace({ name: 'auth' })
  }

  return { logout, signOut: logout }
}
