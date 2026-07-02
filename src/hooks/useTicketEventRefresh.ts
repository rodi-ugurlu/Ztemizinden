import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToCustomerTicketEvents,
  subscribeToProviderTicketEvents,
  type TicketEventPayload,
} from '@/lib/realtime';

type TicketEventScope = 'customer' | 'provider';

interface UseTicketEventRefreshOptions {
  scope: TicketEventScope;
  id: string;
  onEvent: (event: TicketEventPayload) => void;
  refresh: () => Promise<void> | void;
  enabled?: boolean;
  intervalMs?: number;
}

const FALLBACK_REFRESH_INTERVAL_MS = 12_000;
const RECENT_EVENT_GRACE_MS = 20_000;
const FORCED_REFRESH_COOLDOWN_MS = 4_000;

export function useTicketEventRefresh({
  scope,
  id,
  onEvent,
  refresh,
  enabled = true,
  intervalMs = FALLBACK_REFRESH_INTERVAL_MS,
}: UseTicketEventRefreshOptions) {
  const onEventRef = useRef(onEvent);
  const refreshRef = useRef(refresh);
  const lastEventAtRef = useRef(0);
  const lastRefreshAtRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const runRefresh = useCallback(
    async (force = false) => {
      if (!enabled || !id || refreshInFlightRef.current) return;
      if (!force && document.visibilityState === 'hidden') return;

      const now = Date.now();
      if (!force && now - lastEventAtRef.current < RECENT_EVENT_GRACE_MS) return;
      if (force && now - lastRefreshAtRef.current < FORCED_REFRESH_COOLDOWN_MS) return;

      refreshInFlightRef.current = true;
      lastRefreshAtRef.current = now;
      try {
        await refreshRef.current();
      } catch {
        // Realtime is the primary path; fallback refresh failures should not interrupt the page.
      } finally {
        refreshInFlightRef.current = false;
      }
    },
    [enabled, id]
  );

  useEffect(() => {
    if (!enabled || !id) return undefined;

    const unsubscribe =
      scope === 'customer'
        ? subscribeToCustomerTicketEvents(id, handleEvent)
        : subscribeToProviderTicketEvents(id, handleEvent);

    const interval = window.setInterval(() => {
      void runRefresh(false);
    }, intervalMs);

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void runRefresh(true);
      }
    };
    const refreshWhenOnline = () => {
      void runRefresh(true);
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenOnline);
    window.addEventListener('online', refreshWhenOnline);

    function handleEvent(event: TicketEventPayload) {
      lastEventAtRef.current = Date.now();
      onEventRef.current(event);
    }

    return () => {
      unsubscribe();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenOnline);
      window.removeEventListener('online', refreshWhenOnline);
    };
  }, [enabled, id, intervalMs, runRefresh, scope]);
}
