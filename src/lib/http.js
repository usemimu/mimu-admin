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
let onForbidden = null
let onReauthRequired = null

export function setUnauthenticatedHandler(fn) {
  onUnauthenticated = fn
}

/**
 * 403 handlers cover two distinct cases the backend signals via response
 * body: insufficient role (just deny + toast) and missing reauth cookie
 * (open the TOTP step-up modal). The discriminator is `error.code` from the
 * response payload — convention TBD with backend, default to plain forbidden.
 */
export function setForbiddenHandler(fn) {
  onForbidden = fn
}
export function setReauthRequiredHandler(fn) {
  onReauthRequired = fn
}

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401) {
      onUnauthenticated?.()
    } else if (status === 403) {
      if (code === 'REAUTH_REQUIRED') {
        onReauthRequired?.(error.config)
      } else {
        onForbidden?.()
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
