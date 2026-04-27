import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToastStore } from '../stores/toast'

/**
 * Strip a single id from whatever envelope a queue cache happens to hold.
 * Tolerant of bare arrays and `{ data | items | <named-key>: [...] }`.
 */
function withoutId(snapshot, id) {
  if (!snapshot) return snapshot
  if (Array.isArray(snapshot)) return snapshot.filter((x) => x.id !== id)
  for (const key of ['data', 'items', 'campaigns', 'flags', 'payouts', 'requests', 'promotions']) {
    if (Array.isArray(snapshot[key])) {
      return { ...snapshot, [key]: snapshot[key].filter((x) => x.id !== id) }
    }
  }
  return snapshot
}

/**
 * Patch a single row by id inside a queue cache, regardless of envelope.
 */
function patchById(snapshot, id, patch) {
  if (!snapshot) return snapshot
  if (Array.isArray(snapshot)) {
    return snapshot.map((x) => (x.id === id ? { ...x, ...patch } : x))
  }
  for (const key of ['data', 'items', 'campaigns', 'flags', 'payouts', 'requests', 'promotions']) {
    if (Array.isArray(snapshot[key])) {
      return {
        ...snapshot,
        [key]: snapshot[key].map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }
    }
  }
  return snapshot
}

/**
 * Optimistic mutation for queue-row actions where success means "row leaves
 * the queue" (approve, reject, clear, hold, confirm, deny).
 *
 *   useOptimisticRowMutation({
 *     queryKey: ['admin', 'fraud', 'queue'],
 *     mutationFn: ({ id }) => fraudApi.clear(id),
 *     successLabel: (vars) => `Flag ${vars.id} cleared.`,
 *     errorLabel: 'Could not clear flag.',
 *   })
 *
 * Caller invokes `mutation.mutate({ id, ...extra })`. The cache is updated
 * before the network round-trip, rolled back on error, and refetched on
 * settle so server truth always wins. Reauth-required errors (the global
 * interceptor handles those) are not double-toasted.
 */
export function useOptimisticRowMutation({
  queryKey,
  mutationFn,
  successLabel,
  errorLabel = 'Action failed.',
}) {
  const qc = useQueryClient()
  const toast = useToastStore()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData(queryKey)
      qc.setQueryData(queryKey, (old) => withoutId(old, variables.id))
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(queryKey, ctx.previous)
      // The global 403/REAUTH_REQUIRED handler opens the TOTP modal — don't
      // double-toast in that case (the modal is the user-visible feedback).
      if (!err?.needsReauth) toast.error(err?.message || errorLabel)
    },
    onSuccess: (_data, variables) => {
      const label =
        typeof successLabel === 'function' ? successLabel(variables) : successLabel
      if (label) toast.success(label)
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  })
}

/**
 * Variant for actions that *toggle* a row's state in place (activate /
 * deactivate, pause / resume) without removing it from the list. Caller
 * supplies an optimistic patch keyed off the variables.
 */
export function useOptimisticPatchMutation({
  queryKey,
  mutationFn,
  buildPatch,
  successLabel,
  errorLabel = 'Action failed.',
}) {
  const qc = useQueryClient()
  const toast = useToastStore()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData(queryKey)
      qc.setQueryData(queryKey, (old) => patchById(old, variables.id, buildPatch(variables)))
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(queryKey, ctx.previous)
      if (!err?.needsReauth) toast.error(err?.message || errorLabel)
    },
    onSuccess: (_data, variables) => {
      const label =
        typeof successLabel === 'function' ? successLabel(variables) : successLabel
      if (label) toast.success(label)
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  })
}
