import type { ReactNode } from 'react';
import { formatShortDateTime } from '@/components/domain/ticketMeta';
import { sortTicketMessages } from '@/lib/ticketMessages';
import type { TicketMessage } from '@/store/useCustomerStore';

type MessageViewerRole = 'customer' | 'service';

interface TicketMessageThreadProps {
  messages: TicketMessage[];
  viewerRole: MessageViewerRole;
  emptyState: ReactNode;
  maxHeightClassName?: string;
}

export function TicketMessageThread({
  messages,
  viewerRole,
  emptyState,
  maxHeightClassName = 'max-h-[320px]',
}: TicketMessageThreadProps) {
  const orderedMessages = sortTicketMessages(messages);

  if (orderedMessages.length === 0) {
    return <div className={`${maxHeightClassName} overflow-y-auto pr-1`}>{emptyState}</div>;
  }

  return (
    <div className={`${maxHeightClassName} space-y-2 overflow-y-auto pr-1`}>
      {orderedMessages.map((message, index) => {
        const previousMessage = orderedMessages[index - 1] ?? null;
        const previousDateKey = previousMessage ? messageDateKey(previousMessage.createdAt) : '';
        const dateKey = messageDateKey(message.createdAt);
        const shouldShowDate = dateKey !== previousDateKey;
        const isMine = message.senderRole === viewerRole;
        const isSystem = message.senderRole === 'system';
        const isSameSenderGroup =
          previousMessage &&
          previousMessage.senderRole === message.senderRole &&
          previousMessage.senderName === message.senderName &&
          previousDateKey === dateKey;

        return (
          <div key={message.id} className="space-y-2">
            {shouldShowDate && (
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {formatMessageDate(message.createdAt)}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}

            {isSystem ? (
              <div className="mx-auto max-w-[86%] rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
                {message.body}
              </div>
            ) : (
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isSameSenderGroup ? 'mt-1' : 'mt-3'}`}>
                <div
                  className={`max-w-[82%] rounded-lg border px-3 py-2 ${
                    isMine
                      ? 'border-red-200 bg-red-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {!isSameSenderGroup && (
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                      <span className="font-semibold">{message.senderName}</span>
                      <span>{formatShortDateTime(message.createdAt)}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                  {isSameSenderGroup && (
                    <p className="mt-1 text-right text-[10px] font-medium text-slate-400">
                      {formatShortDateTime(message.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function messageDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
