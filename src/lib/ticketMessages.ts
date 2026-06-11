import type { TicketMessage } from '@/store/useCustomerStore';

const roleOrder: Record<TicketMessage['senderRole'], number> = {
  system: 0,
  customer: 1,
  service: 2,
};

export function sortTicketMessages(messages: TicketMessage[]) {
  return [...messages].sort((a, b) => {
    const timeDiff = messageTimestamp(a) - messageTimestamp(b);
    if (timeDiff !== 0) return timeDiff;

    const roleDiff = roleOrder[a.senderRole] - roleOrder[b.senderRole];
    if (roleDiff !== 0) return roleDiff;

    const senderDiff = a.senderName.localeCompare(b.senderName, 'tr');
    if (senderDiff !== 0) return senderDiff;

    return a.id.localeCompare(b.id);
  });
}

export function latestConversationMessage(messages: TicketMessage[]) {
  return sortTicketMessages(messages).filter((message) => message.senderRole !== 'system').at(-1) ?? null;
}

export function messageTimestamp(message?: TicketMessage | null) {
  if (!message?.createdAt) return 0;
  const timestamp = new Date(message.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
