import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { monitoringApi } from '../api/monitoring'
import { qk } from '../lib/queryKeys'

/**
 * Shared `/monitoring/queue-depths` query. Sidebar uses it for badge
 * counts; Dashboard uses the same key so the two stay in sync without
 * a second request.
 *
 * Response shape (from `monitoring.service.ts:getQueueDepths`):
 *   {
 *     vettingQueue: number,
 *     fraudQueue: number,
 *     supportTickets: number,
 *     payoutApprovalQueue: number,
 *     alerts: { vettingQueueHigh, fraudQueueHigh, supportTicketsHigh }
 *   }
 *
 * Refetches every 30s while the page is visible. We keep `enabled`
 * tied to authentication so the unauth /auth screen doesn't ping.
 */
export function useQueueDepths({ enabled = computed(() => true) } = {}) {
  const query = useQuery({
    queryKey: qk.queueDepths(),
    queryFn: () => monitoringApi.queueDepths(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  })

  /** Per-queue counts, with safe defaults so the UI never renders
   *  `undefined` while the request is in flight. */
  const counts = computed(() => {
    const d = query.data.value ?? {}
    return {
      vetting: Number(d.vettingQueue ?? 0),
      fraud: Number(d.fraudQueue ?? 0),
      support: Number(d.supportTickets ?? 0),
      payouts: Number(d.payoutApprovalQueue ?? 0),
    }
  })

  return {
    counts,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
