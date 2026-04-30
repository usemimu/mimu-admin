import { defineStore } from 'pinia'
import { authApi } from '../api/auth'

/**
 * Admin sessions live entirely in cookies set by the backend. This
 * store turns "did /me succeed, and which way did it fail?" into a
 * status the UI + router can read.
 *
 * Statuses:
 *   'unknown'         — pre-bootstrap (initial state, only seen on cold start)
 *   'unauthenticated' — definitively no session (backend signalled
 *                       NO_SESSION | SESSION_EXPIRED | SESSION_REVOKED |
 *                       ACCOUNT_INACTIVE)
 *   'partial'         — Google OAuth done, TOTP step pending (PARTIAL_AUTH)
 *   'authenticated'   — fully authed, can use the dashboard
 *
 * "Unknown 401s" — 401 with no `code` we recognize, or transient
 * failures like a momentary network blip — do NOT flip the status. We
 * keep the last-known-good state and let the next call re-verify. That
 * is the bug Phase 1 of the refactor fixed: any random 401 from a
 * permission-checked endpoint or a stale resource used to kick valid
 * sessions out, even though the cookie was still healthy.
 */

/** Codes the backend uses to say "session is genuinely dead". */
const TERMINAL_SESSION_CODES = new Set([
  'NO_SESSION',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
  'ACCOUNT_INACTIVE',
])

export const useAuthStore = defineStore('auth', {
  state: () => ({
    status: 'unknown',
    user: null,
    /** UTC ISO timestamp of the last successful /me call. The heartbeat
     *  uses this to skip redundant pings; views can read it to surface
     *  "session checked X ago" if needed. */
    lastVerifiedAt: null,
    /** Pending request waiting on a successful reauth. The HTTP
     *  interceptor sets this; the reauth modal calls `completeReauth`
     *  to retry once the user has TOTP'd. */
    pendingReauthRequest: null,
  }),

  getters: {
    isAuthenticated: (s) => s.status === 'authenticated',
    needsTotp: (s) => s.status === 'partial',
  },

  actions: {
    /**
     * Resolve current state by calling `/me`. The response shape is
     * `{ user: { adminUserId, email, name, avatarUrl, role } }` — we
     * unwrap once here so the rest of the app reads `auth.user.email`,
     * not `auth.user.user.email`.
     *
     * Failure handling:
     *   - PARTIAL_AUTH       → status = 'partial' (route to TOTP)
     *   - terminal session   → status = 'unauthenticated' (route to /auth)
     *   - unknown 401 / net  → DO NOT change status; keep last known
     *                          good. The next API call (or heartbeat)
     *                          will re-verify.
     */
    async bootstrap() {
      try {
        const res = await authApi.me()
        // `/me` returns `{ user: {...} }`. Some defensive unwrapping
        // here so an older backend that returned the user directly
        // doesn't break the SPA.
        this.user = res?.user ?? res ?? null
        this.status = 'authenticated'
        this.lastVerifiedAt = new Date().toISOString()
        return true
      } catch (err) {
        const code = err?.code
        if (err?.status === 401 && code === 'PARTIAL_AUTH') {
          this.status = 'partial'
          this.user = null
          return false
        }
        if (
          (err?.status === 401 || err?.status === 403) &&
          TERMINAL_SESSION_CODES.has(code)
        ) {
          this.status = 'unauthenticated'
          this.user = null
          return false
        }
        // Unknown 401, 5xx, or network error. Don't flip status —
        // we'd rather show stale data for one beat than sign a valid
        // session out because of a transient hiccup.
        return false
      }
    },

    /** Kick the browser out to Google OAuth — control returns via callback. */
    signInWithGoogle() {
      window.location.href = authApi.googleSignInUrl()
    },

    async enrollTotp() {
      return authApi.enrollTotp()
    },

    async verifyTotpEnrollment(code) {
      const res = await authApi.verifyTotpEnrollment(code)
      // Server promoted the partial cookie to a full session — refresh /me.
      await this.bootstrap()
      return res
    },

    async verifyTotp(code) {
      const res = await authApi.verifyTotp(code)
      await this.bootstrap()
      return res
    },

    async reauth(code) {
      return authApi.reauth(code)
    },

    /**
     * Queue a request that 403'd with REAUTH_REQUIRED. The HTTP
     * interceptor builds a deferred Promise (resolve/reject pair) and
     * returns it from the original axios call, so the calling view's
     * `await` doesn't reject yet. The reauth modal calls
     * `resolveReauth(response)` on success or `rejectReauth(err)` on
     * cancel/failure to close the loop.
     */
    queueReauth({ config, resolve, reject }) {
      this.pendingReauthRequest = { config, resolve, reject }
    },

    /** Modal calls this with the replay's response. The deferred
     *  promise from the interceptor resolves with this value, so the
     *  calling view's `await` returns as if nothing happened. */
    resolveReauth(response) {
      const pending = this.pendingReauthRequest
      this.pendingReauthRequest = null
      pending?.resolve?.(response)
    },

    /** Modal cancel / TOTP failure path. The deferred promise
     *  rejects, which means the calling view's `await` throws as
     *  if the original 403 had bubbled through normally. */
    rejectReauth(err) {
      const pending = this.pendingReauthRequest
      this.pendingReauthRequest = null
      pending?.reject?.(err)
    },

    /** Back-compat: a few existing call sites use this. Rejecting
     *  the queued request is the safe equivalent of "drop it on the
     *  floor" — the view sees a normal cancellation. */
    clearReauthQueue() {
      this.rejectReauth(new Error('Re-authentication cancelled'))
    },

    async logout() {
      try {
        await authApi.logout()
      } catch {
        /* best-effort — local state flips below regardless */
      }
      this.status = 'unauthenticated'
      this.user = null
      this.lastVerifiedAt = null
    },

    /** Called by the HTTP interceptor when the backend signals a
     *  terminal session failure. Idempotent — safe for parallel 401s
     *  to all hit this without piling on. */
    forceSignOut() {
      if (this.status === 'unauthenticated') return
      this.status = 'unauthenticated'
      this.user = null
      this.lastVerifiedAt = null
    },
  },
})
