import { defineStore } from 'pinia'
import { authApi } from '../api/auth'

/**
 * Admin sessions live entirely in cookies set by the backend. The store's
 * job is to translate "did /me succeed?" into a status the UI and router
 * can read.
 *
 * Statuses:
 *   'unknown'         — pre-bootstrap
 *   'unauthenticated' — no session, must Google-OAuth in
 *   'partial'         — Google OAuth done, TOTP step pending (we *infer* this
 *                       from the 401 response code; if the backend doesn't
 *                       expose it, we always send users through TOTP after
 *                       returning from /auth/google/callback)
 *   'authenticated'   — fully authed, can use the dashboard
 *
 * Reauth cookies (for sensitive ops) are server-side; we don't track them
 * here. The 403/REAUTH_REQUIRED interceptor opens a step-up modal that calls
 * `reauth()` then retries the original mutation.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    status: 'unknown',
    user: null,
    /**
     * Pending action waiting on a successful reauth. The interceptor sets
     * this; the reauth modal calls `completeReauth` to retry.
     */
    pendingReauthRequest: null,
  }),

  getters: {
    isAuthenticated: (s) => s.status === 'authenticated',
    needsTotp: (s) => s.status === 'partial',
  },

  actions: {
    /**
     * Resolve current state by calling `/me`. A 401 means no session OR a
     * partial session — the backend signals partial via response body
     * (convention TBD; we treat any 401 as "not yet authenticated" for now).
     */
    async bootstrap() {
      try {
        const me = await authApi.me()
        this.user = me
        this.status = 'authenticated'
      } catch (err) {
        if (err.status === 401 && err.code === 'PARTIAL_AUTH') {
          this.status = 'partial'
        } else {
          this.status = 'unauthenticated'
        }
        this.user = null
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

    queueReauth(originalRequest) {
      this.pendingReauthRequest = originalRequest
    },

    clearReauthQueue() {
      this.pendingReauthRequest = null
    },

    async logout() {
      try {
        await authApi.logout()
      } catch {
        /* best-effort */
      }
      this.status = 'unauthenticated'
      this.user = null
    },

    forceSignOut() {
      this.status = 'unauthenticated'
      this.user = null
    },
  },
})
