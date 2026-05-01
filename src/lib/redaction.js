/**
 * Audit-log payload redactor.
 *
 * Walks a JSON object, replaces values at sensitive keys with a
 * `[hidden]` sentinel, and returns a flat list of what was hidden so
 * the UI can render copy-on-demand chips beside the scrubbed JSON.
 *
 * Why client-side: the audit table itself stores the full payload —
 * that's the point of an audit log. We just don't want it staring
 * back at every operator who clicks Expand. Truly destructive
 * redaction lives elsewhere (request-time masking on incoming
 * webhooks, never-store-secrets policy on the interceptor).
 */

const HIDDEN_SENTINEL = '[hidden]'

// Case-insensitive substring matches against the key name. Order
// doesn't matter, but keep groups together so future additions land
// in the right section.
const SENSITIVE_KEY_PATTERNS = [
  // Auth + secrets — the highest priority. Anything matching here is
  // never shown inline, regardless of length.
  /password/i,
  /passwordhash/i,
  /secret/i,
  /apikey/i,
  /api_key/i,
  /accesstoken/i,
  /refreshtoken/i,
  /^token$/i,
  /authorization/i,
  /cookie/i,
  /encrypted/i,
  /backup_?codes?/i,
  /signature/i,
  /webhook_?secret/i,
  /private_?key/i,

  // Nigerian identity + financial
  /^nin$/i,
  /^bvn$/i,
  /^cvv$/i,
  /^pin$/i,
  /account_?number/i,
  /card_?number/i,
  /bank_?account/i,
  /tax_?id/i,
  /rc_?number/i,

  // PII that operators rarely need but the log captures because it
  // came back in a response body. Keep email/phone visible only if
  // it's the *acting admin's* address (handled higher up in the
  // pipeline by the audit interceptor's metadata, not here).
  /^email$/i,
  /phone_?number/i,
  /^phone$/i,
  /ip_?address/i,

  // Role / permission disclosure. Showing role transitions in plain
  // text reveals the privilege landscape of an account, which is
  // exactly the kind of breadcrumb an attacker reconstructing the
  // org from an audit-log leak would chain together. Operators who
  // need the actual role can still copy it from the chip.
  /^role$/i,
  /^roles$/i,
  /^permission$/i,
  /^permissions$/i,
  /^user_?type$/i,
]

function isSensitiveKey(key) {
  if (!key) return false
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(String(key)))
}

/**
 * Mask a string value for the chip. Preserves enough shape that an
 * operator can recognise the value at a glance without reading it
 * (`$2b$12••••••2K6w` clearly looks like a bcrypt hash) but never
 * leaks more than 2 leading + 4 trailing characters.
 */
function maskValue(raw) {
  if (raw == null) return '••••'
  const str = String(raw)
  if (str.length <= 4) return '••••'
  if (str.length <= 12) return `${str.slice(0, 2)}••••${str.slice(-2)}`
  return `${str.slice(0, 2)}••••••${str.slice(-4)}`
}

/**
 * Recursively walk a value, replacing sensitive children with the
 * sentinel and recording (path, raw, masked) for each.
 *
 * @param {unknown} value  Anything JSON-shaped.
 * @returns {{ scrubbed: unknown, hidden: Array<{path: string, raw: unknown, masked: string}> }}
 */
export function redact(value) {
  const hidden = []
  const scrubbed = walk(value, '', hidden)
  return { scrubbed, hidden }
}

function walk(value, path, hidden) {
  if (value == null) return value
  if (Array.isArray(value)) {
    return value.map((item, i) => walk(item, path ? `${path}[${i}]` : `[${i}]`, hidden))
  }
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const childPath = path ? `${path}.${k}` : k
      if (isSensitiveKey(k) && v != null && typeof v !== 'object') {
        // Scalar at a sensitive key — replace with sentinel and
        // record. Object/array values at sensitive keys keep their
        // structure so we can still see the shape (rare; mostly we
        // hit strings).
        hidden.push({ path: childPath, raw: v, masked: maskValue(v) })
        out[k] = HIDDEN_SENTINEL
      } else {
        out[k] = walk(v, childPath, hidden)
      }
    }
    return out
  }
  return value
}

export const HIDDEN = HIDDEN_SENTINEL
