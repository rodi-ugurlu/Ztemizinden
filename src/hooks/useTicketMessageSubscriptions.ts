import { useEffect, useMemo } from 'react';
import { subscribeToConversationMessages, subscribeToTicketMessages } from '@/lib/realtime';
import type { Ticket, TicketMessage } from '@/store/useCustomerStore';

type ActiveMessageTarget = {
  ticketId: string;
  conversationId?: string | null;
} | null;

export function useTicketMessageSubscriptions(
  tickets: Ticket[],
  onMessage: (message: TicketMessage) => void,
  activeTarget: ActiveMessageTarget = null
) {
  const subscriptionKey = useMemo(
    () => {
      if (!activeTarget?.ticketId) return '';

      const ticket = tickets.find((item) => item.id === activeTarget.ticketId);
      if (!ticket || ticket.status === 'CANCELLED') return '';

      const subscriptions = [`ticket:${ticket.id}`];
      const conversationId = activeTarget.conversationId ?? '';
      if (
        conversationId &&
        (ticket.conversations ?? []).some((conversation) =>
          conversation.id === conversationId && conversation.status !== 'CLOSED'
        )
      ) {
        subscriptions.push(`conversation:${ticket.id}:${conversationId}`);
      }

      return subscriptions.join('|');
    },
    [activeTarget, tickets]
  );

  useEffect(() => {
    if (!subscriptionKey) return;

    const subscriptions = subscriptionKey
      .split('|')
      .map((subscription) => {
        const [type, ticketId, conversationId] = subscription.split(':');
        if (type === 'conversation' && conversationId) {
          return subscribeToConversationMessages(ticketId, conversationId, onMessage);
        }
        return subscribeToTicketMessages(ticketId, onMessage);
      });

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [onMessage, subscriptionKey]);
}
