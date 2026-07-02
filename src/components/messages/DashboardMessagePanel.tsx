import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketStatusLabel } from '@/components/domain/ticketMeta';
import type { Ticket, TicketConversation, TicketMessage } from '@/store/useCustomerStore';
import { ArrowRight, Bell, Clock3, MailOpen, MessageSquare, Package, X } from 'lucide-react';

type MessagePanelRole = 'customer' | 'service';
type MessagePanelTone = 'red' | 'green';

export interface DashboardMessageToastData {
  ticketId: string;
  title: string;
  senderName: string;
  body: string;
  path: string;
}

interface DashboardMessagePanelProps {
  tickets: Ticket[];
  role: MessagePanelRole;
  toBasePath: string;
  allMessagesPath?: string;
  tone?: MessagePanelTone;
}

export function DashboardMessagePanel({
  tickets,
  role,
  toBasePath,
  allMessagesPath,
  tone = 'red',
}: DashboardMessagePanelProps) {
  const styles = toneStyles[tone];
  const items = uniqueTickets(tickets).flatMap((ticket) => messageItems(ticket, role))
    .filter((item) => item.lastMessage || item.unreadCount > 0)
    .sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      return messageTime(b.lastMessage) - messageTime(a.lastMessage);
    });
  const totalUnread = items.reduce((total, item) => total + item.unreadCount, 0);
  const visibleItems = items.slice(0, 6);

  return (
    <aside className="h-fit self-start rounded-lg border border-slate-200 bg-white shadow-md xl:sticky xl:top-6">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.iconBg}`}>
              <MessageSquare className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-normal text-slate-950">Mesaj Merkezi</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">Aktif yazışmalar</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${totalUnread > 0 ? styles.badge : 'bg-slate-100 text-slate-500'}`}>
            {totalUnread} okunmamış
          </span>
        </div>
      </div>

      <div className="max-h-[520px] space-y-2 overflow-y-auto p-3 xl:max-h-[590px]">
        {visibleItems.length > 0 ? (
          visibleItems.map(({ key, ticket, conversation, unreadCount, lastMessage }) => {
            const path = `${toBasePath}?ticketId=${encodeURIComponent(ticket.id)}&tab=messages${
              conversation?.id ? `&conversationId=${encodeURIComponent(conversation.id)}` : ''
            }`;
            const senderLabel = lastMessage
              ? `${senderRoleLabel(lastMessage.senderRole)} · ${lastMessage.senderName}`
              : conversation?.providerName ?? ticket.customerCompany;

            return (
              <Link
                key={key}
                to={path}
                className={`block rounded-lg border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  unreadCount > 0
                    ? `${styles.unreadBorder} ${styles.unreadBg}`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold uppercase text-slate-400">
                        #{shortTicketId(ticket.id)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                        {conversation ? conversationStatusLabel(conversation) : ticketStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <p className={`line-clamp-2 text-sm leading-snug ${unreadCount > 0 ? 'font-black text-slate-950' : 'font-bold text-slate-800'}`}>
                      {ticket.title}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                      {conversation?.providerName ? `${conversation.providerName} · ${senderLabel}` : senderLabel}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${styles.countBadge}`}>
                      {unreadCount}
                    </span>
                  )}
                </div>

                <p className="mt-3 line-clamp-2 min-h-[38px] text-sm leading-relaxed text-slate-600">
                  {lastMessage?.body ?? 'Mesaj bekleniyor'}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400">
                  <span className="min-w-0 truncate">{ticket.customerCompany}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span className="max-w-[105px] truncate">{ticket.assetName || 'Varlık yok'}</span>
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {formatMessageTime(lastMessage?.createdAt ?? ticket.updatedAt)}
                  </span>
                  <ArrowRight className={`h-4 w-4 ${unreadCount > 0 ? styles.icon : 'text-slate-300'}`} />
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
            <MailOpen className="h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Aktif mesaj yok</p>
            <p className="mt-1 text-xs font-medium text-slate-400">Okunmamış mesaj bulunmuyor.</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <Link
          to={allMessagesPath ?? `${toBasePath}?focus=messages`}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-black ${styles.action}`}
        >
          Mesajlı İşleri Aç
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}

export function DashboardMessageToast({
  toast,
  tone = 'red',
  onClose,
}: {
  toast: DashboardMessageToastData | null;
  tone?: MessagePanelTone;
  onClose: () => void;
}) {
  const styles = toneStyles[tone];

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 5_000);
    return () => window.clearTimeout(timer);
  }, [onClose, toast]);

  if (!toast) return null;

  return (
    <div className="fixed right-4 top-24 z-[120] w-[min(360px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
          <Bell className={`h-4 w-4 ${styles.icon}`} />
        </div>
        <Link to={toast.path} className="min-w-0 flex-1" onClick={onClose}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Yeni mesaj</p>
          <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{toast.title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">{toast.senderName}: </span>
            {toast.body}
          </p>
        </Link>
        <button
          type="button"
          aria-label="Kapat"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type DashboardMessageItem = {
  key: string;
  ticket: Ticket;
  conversation?: TicketConversation;
  unreadCount: number;
  lastMessage: TicketMessage | null;
};

function messageItems(ticket: Ticket, role: MessagePanelRole): DashboardMessageItem[] {
  const generalMessages = ticket.messages ?? [];
  const items: DashboardMessageItem[] = [];

  const generalUnread = unreadMessagesForRole(generalMessages, role);
  const generalLastMessage = latestMessage(generalMessages);
  if (generalLastMessage || generalUnread > 0) {
    items.push({
      key: `${ticket.id}:general`,
      ticket,
      unreadCount: generalUnread,
      lastMessage: generalLastMessage,
    });
  }

  for (const conversation of ticket.conversations ?? []) {
    const messages = conversation.messages ?? [];
    const unreadCount = conversation.unreadMessageCount ?? unreadMessagesForRole(messages, role);
    const lastMessage = conversation.lastMessage && conversation.lastMessage.senderRole !== 'system'
      ? conversation.lastMessage
      : latestMessage(messages);
    if (!lastMessage && unreadCount <= 0) continue;
    items.push({
      key: `${ticket.id}:${conversation.id}`,
      ticket,
      conversation,
      unreadCount,
      lastMessage,
    });
  }

  if (items.length === 0 && ticket.lastMessage && ticket.lastMessage.senderRole !== 'system') {
    const conversation = (ticket.conversations ?? []).find((item) => item.id === ticket.lastMessage?.conversationId);
    items.push({
      key: `${ticket.id}:${conversation?.id ?? 'last'}`,
      ticket,
      conversation,
      unreadCount: ticket.unreadMessageCount ?? 0,
      lastMessage: ticket.lastMessage,
    });
  }

  return items;
}

function unreadMessagesForRole(messages: TicketMessage[], role: MessagePanelRole) {
  return messages.filter((message) => {
    if (role === 'customer') {
      return message.senderRole === 'service' && message.readByCustomer !== true;
    }
    return message.senderRole === 'customer' && message.readByService !== true;
  }).length;
}

function latestMessage(messages: TicketMessage[]) {
  return [...messages]
    .filter((message) => message.senderRole !== 'system')
    .sort((a, b) => messageTime(b) - messageTime(a))[0] ?? null;
}

function messageTime(message?: TicketMessage | null) {
  if (!message?.createdAt) return 0;
  const timestamp = new Date(message.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatMessageTime(value?: string) {
  if (!value) return '';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return 'Şimdi';
  if (diffMinutes < 60) return `${diffMinutes} dk`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa`;

  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
  });
}

function shortTicketId(id: string) {
  return id.split('-')[1] ?? id.slice(0, 8);
}

function senderRoleLabel(role: TicketMessage['senderRole']) {
  if (role === 'customer') return 'Fabrika/İşletme';
  if (role === 'service') return 'Servis';
  return 'Sistem';
}

function conversationStatusLabel(conversation: TicketConversation) {
  if (conversation.status === 'ACCEPTED') return 'Kabul';
  if (conversation.status === 'CLOSED') return conversation.closedReason === 'NOT_SELECTED' ? 'Seçilmedi' : 'Kapalı';
  return 'Görüşme';
}

function uniqueTickets(tickets: Ticket[]) {
  return tickets.filter((ticket, index, list) => list.findIndex((item) => item.id === ticket.id) === index);
}

const toneStyles = {
  red: {
    iconBg: 'bg-red-50',
    icon: 'text-red-600',
    badge: 'bg-red-600 text-white',
    countBadge: 'bg-red-600 text-white',
    unreadBorder: 'border-red-200',
    unreadBg: 'bg-red-50/80',
    action: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  },
  green: {
    iconBg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    badge: 'bg-emerald-700 text-white',
    countBadge: 'bg-emerald-700 text-white',
    unreadBorder: 'border-emerald-200',
    unreadBg: 'bg-emerald-50/80',
    action: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  },
};
