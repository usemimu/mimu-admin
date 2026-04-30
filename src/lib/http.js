import axios from 'axios'

const baseURL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') +
  (import.meta.env.VITE_API_AUDIENCE_PREFIX || '/v1/admin')

/**
 * Admin sessions are server-managed: the backend sets `connect.sid` on
 * successful Google OAuth + TOTP, and a separate short-lived re-auth cookie
 * for sensitive ops. Client-side we just need the browser to send cookies on
 * every request — `withCredentials: true` does that. CORS on the API must
 * allow `Access-Control-Allow-Credentials: true` and the exact origin.
 */
export const http = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
})

let onUnauthenticated = null
let onPartialAuth = null
let onForbidden = null
let onReauthRequired = null

/**
 * Called only when the backend signals a *terminal* session failure —
 * `NO_SESSION`, `SESSION_EXPIRED`, `SESSION_REVOKED`, `ACCOUNT_INACTIVE`.
 * Every other 401/403 stays in-flight as a normal `ApiError` so the
 * caller can show a focused error and the session stays intact.
 *
 * Without this discrimination, any random 401 (e.g. a stale resource,
 * a permissioned endpoint mid-rollout) would bounce a logged-in admin
 * to the sign-in screen even though their cookie is still valid — see
 * the audit notes for the bug this replaces.
 */
export function setUnauthenticatedHandler(fn) {
  onUnauthenticated = fn
}

/**
 * `PARTIAL_AUTH` = OAuth done, TOTP step pending. Routing to /auth?totp=…
 * lets the user finish enrollment / verification without having to
 * Google-sign-in again from scratch.
 */
export function setPartialAuthHandler(fn) {
  onPartialAuth = fn
}

/**
 * 403 handlers cover two distinct cases the backend signals via the
 * `code` field: insufficient role (`PERMISSION_DENIED` → just deny +
 * toast) and missing reauth cookie (`REAUTH_REQUIRED` → open the TOTP
 * step-up modal and retry the original request after success).
 */
export function setForbiddenHandler(fn) {
  onForbidden = fn
}
export function setReauthRequiredHandler(fn) {
  onReauthRequired = fn
}

/**
 * Codes that indicate the cookie can't be salvaged — caller should be
 * signed out locally and routed to /auth.
 */
const TERMINAL_SESSION_CODES = new Set([
  'NO_SESSION',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
  'ACCOUNT_INACTIVE',
])

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401) {
      if (code === 'PARTIAL_AUTH') {
        onPartialAuth?.()
      } else if (TERMINAL_SESSION_CODES.has(code)) {
        onUnauthenticated?.(code)
      }
      // Any other 401 (or a 401 with no code, e.g. from an upstream
      // proxy) falls through as a normal ApiError — the calling view
      // can decide whether to retry, surface the error, or ignore.
    } else if (status === 403) {
      if (code === 'REAUTH_REQUIRED') {
        // Deferred-promise dance. Without this, the original axios
        // call rejects RIGHT NOW, the view's `await` throws, and even
        // when the modal succeeds and replays the request, the
        // calling component has already errored out (toast shown,
        // mutation marked failed, etc.). Instead we return a fresh
        // pending promise; the modal calls `resolveReauth` /
        // `rejectReauth` on the auth store to settle it.
        return new Promise((resolve, reject) => {
          if (!onReauthRequired) {
            // No handler wired — fail fast rather than hang the view.
            reject(normalizeError(error))
            return
          }
          onReauthRequired({
            config: error.config,
            resolve,
            reject: (err) => reject(err ?? normalizeError(error)),
          })
        })
      }
      if (code === 'ACCOUNT_INACTIVE') {
        // Server-side disabled the account; treat the same as a
        // terminal session — the user must contact ops to be re-enabled.
        onUnauthenticated?.(code)
      } else if (code !== 'REAUTH_REQUIRED') {
        onForbidden?.(error.response?.data)
      }
    }

    return Promise.reject(normalizeError(error))
  },
)

export class ApiError extends Error {
  constructor({ message, status, code, fieldErrors, cause }) {
    super(message)
    this.name = 'ApiError'
    this.status = status ?? 0
    this.code = code ?? null
    this.fieldErrors = fieldErrors ?? {}
    this.cause = cause
  }

  get isNetworkError() {
    return this.status === 0
  }
  get isUnauthenticated() {
    return this.status === 401
  }
  get needsReauth() {
    return this.status === 403 && this.code === 'REAUTH_REQUIRED'
  }
}

/**
 * Backend has two validation-envelope flavours:
 *   1. NestJS + Zod pipe → `errors: [{ code, path: [...], message }]`
 *   2. NestJS class-validator → `errors: { field: [messages] }`
 * Squash both into `{ field: firstMessage }`.
 */
function parseFieldErrors(raw) {
  const out = {}
  if (!raw) return out
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue
      const message = entry.message ? String(entry.message) : ''
      if (!message) continue
      const path = entry.path
      const field = Array.isArray(path) && path.length > 0
        ? path.join('.')
        : entry.field
          ? String(entry.field)
          : '_'
      if (!(field in out)) out[field] = message
    }
    return out
  }
  if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      out[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v)
    }
  }
  return out
}

function normalizeError(error) {
  if (axios.isCancel(error)) {
    return new ApiError({ message: 'Request cancelled', status: 0, cause: error })
  }
  if (!error.response) {
    return new ApiError({
      message: 'Network error — please check your connection.',
      status: 0,
      cause: error,
    })
  }
  const { status, data } = error.response
  const fieldErrors = parseFieldErrors(data?.errors)
  const message =
    (data && (data.message || data.error)) ||
    (status >= 500 ? 'Server error — please try again.' : 'Request failed')
  return new ApiError({
    message: Array.isArray(message) ? message[0] : message,
    status,
    code: data?.code ?? null,
    fieldErrors,
    cause: error,
  })
}
