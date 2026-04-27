import { http } from '../lib/http'

/**
 * Admin auth flow:
 *   1. Click "Sign in with Google" → browser redirects to /auth/google.
 *   2. Backend bounces through Google and lands on /auth/google/callback,
 *      which sets a *partial* session cookie and 302s to either:
 *        - /admin/auth/totp/enroll (first-time admins)  → enroll + verify-enrollment
 *        - /admin/auth/totp/verify (returning admins)   → verify
 *   3. After TOTP verify, the server promotes the cookie to a full session.
 *   4. For sensitive ops (suspend host, refund, etc.), the backend will 403
 *      with code=REAUTH_REQUIRED. The UI prompts TOTP and POSTs /auth/reauth,
 *      which sets a 5-min reauth cookie. The original action can then retry.
 */
export const authApi = {
  /** Returns the absolute URL to send the browser to for Google OAuth. */
  googleSignInUrl() {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const prefix = import.meta.env.VITE_API_AUDIENCE_PREFIX || '/v1/admin'
    return `${base}${prefix}/auth/google`
  },

  async me() {
    const { data } = await http.get('/auth/me')
    return data
  },

  async enrollTotp() {
    const { data } = await http.post('/auth/totp/enroll')
    return data
  },

  async verifyTotpEnrollment(code) {
    const { data } = await http.post('/auth/totp/verify-enrollment', { code })
    return data
  },

  async verifyTotp(code) {
    const { data } = await http.post('/auth/totp/verify', { code })
    return data
  },

  /** Step-up auth for sensitive operations. Sets a 5-min reauth cookie. */
  async reauth(code) {
    const { data } = await http.post('/auth/reauth', { code })
    return data
  },

  async logout() {
    await http.post('/auth/logout')
  },
}
