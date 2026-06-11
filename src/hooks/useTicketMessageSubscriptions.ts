import { useEffect, useMemo } from 'react';
import { subscribeToTicketMessages } from '@/lib/realtime';
import type { Ticket, TicketMessage } from '@/store/useCustomerStore';

export function useTicketMessageSubscriptions(
  tickets: Ticket[],
  onMessage: (message: TicketMessage) => void
) {
  const subscriptionKey = useMemo(
    () =>
      tickets
        .filter((ticket) => ticket.status !== 'CANCELLED')
        .map((ticket) => ticket.id)
        .filter((ticketId, index, list) => list.indexOf(ticketId) === index)
        .sort()
        .join('|'),
    [tickets]
  );

  useEffect(() => {
    if (!subscriptionKey) return;

    const subscriptions = subscriptionKey
      .split('|')
      .map((ticketId) => subscribeToTicketMessages(ticketId, onMessage));

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [onMessage, subscriptionKey]);
}
