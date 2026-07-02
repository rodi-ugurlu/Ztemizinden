import { useEffect, useMemo, useState, type ElementType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TicketCategoryBadge, TicketPriorityBadge, TicketStatusBadge } from '@/components/domain/ticketBadges';
import { formatShortDateTime } from '@/components/domain/ticketMeta';
import { TicketMessageThread } from '@/components/messages/TicketMessageThread';
import { useTicketMessageSubscriptions } from '@/hooks/useTicketMessageSubscriptions';
import { subscribeToCustomerTicketEvents } from '@/lib/realtime';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useCustomerStore,
  type BillingStatus,
  type OfferStatus,
  type Ticket,
  type TicketConversation,
  type TicketOffer,
} from '@/store/useCustomerStore';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Inbox,
  MapPin,
  MessageSquare,
  Package,
  Receipt,
  Send,
  ShieldCheck,
  Tag,
  Timer,
  Wrench,
  XCircle,
} from 'lucide-react';

type CustomerRequestTab = 'overview' | 'offers' | 'messages';

const customerRequestTabs: CustomerRequestTab[] = ['overview', 'offers', 'messages'];

export default function RequestsPage() {
  const {
    tickets,
    inviteOffer,
    acceptOffer,
    rejectOffer,
    addConversationMessage,
    receiveTicketMessage,
    receiveTicketUpdate,
    markTicketMessagesRead,
    markConversationMessagesRead,
    approveFinalBilling,
    disputeFinalBilling,
    fetchTickets,
    error: storeError,
  } = useCustomerStore();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicketId = searchParams.get('ticketId') ?? '';
  const requestedConversationId = searchParams.get('conversationId') ?? '';
  const activeTab = normalizeCustomerRequestTab(searchParams.get('tab')) ?? 'overview';
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (user?.id) {
      void fetchTickets(user.id);
    }
  }, [fetchTickets, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToCustomerTicketEvents(user.id, (event) => {
      receiveTicketUpdate(event.ticket);
    });
  }, [receiveTicketUpdate, user?.id]);

  const effectiveSelectedTicketId = useMemo(() => {
    if (requestedTicketId && tickets.some((ticket) => ticket.id === requestedTicketId)) {
      return requestedTicketId;
    }
    if (selectedTicketId && tickets.some((ticket) => ticket.id === selectedTicketId)) {
      return selectedTicketId;
    }
    return tickets[0]?.id ?? '';
  }, [requestedTicketId, selectedTicketId, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === effectiveSelectedTicketId) ?? null,
    [effectiveSelectedTicketId, tickets]
  );

  const selectedTicketOffers = useMemo(() => {
    if (!selectedTicket) return [];
    return (selectedTicket.offers ?? [])
      .filter((offer) => !offer.ticketId || offer.ticketId === selectedTicket.id)
      .sort((a, b) => offerSortTime(b) - offerSortTime(a));
  }, [selectedTicket]);

  const activeConversation = useMemo(() => {
    if (!selectedTicket) return null;
    const conversations = selectedTicket.conversations ?? [];
    return conversations.find((conversation) => conversation.id === requestedConversationId) ?? conversations[0] ?? null;
  }, [requestedConversationId, selectedTicket]);

  useTicketMessageSubscriptions(
    tickets,
    receiveTicketMessage,
    activeTab === 'messages' && selectedTicket?.id
      ? { ticketId: selectedTicket.id, conversationId: activeConversation?.id }
      : null
  );

  useEffect(() => {
    if (!selectedTicket?.id || activeTab !== 'messages') return;
    if (activeConversation?.id && activeConversation.unreadMessageCount) {
      void markConversationMessagesRead(selectedTicket.id, activeConversation.id);
      return;
    }
    if (!activeConversation && selectedTicket.unreadMessageCount) {
      void markTicketMessagesRead(selectedTicket.id);
    }
  }, [
    activeConversation,
    activeTab,
    markConversationMessagesRead,
    markTicketMessagesRead,
    selectedTicket?.id,
    selectedTicket?.unreadMessageCount,
  ]);

  const stats = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      offered: tickets.filter((ticket) => ticket.status === 'OFFERED').length,
      active: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
      billing: tickets.filter((ticket) => ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL').length,
    }),
    [tickets]
  );

  const handleSendMessage = async () => {
    if (!selectedTicket || !activeConversation || !message.trim()) return;
    try {
      await addConversationMessage(selectedTicket.id, activeConversation.id, message.trim());
      setMessage('');
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Mesaj gönderilemedi',
      });
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      const normalizedTab = normalizeCustomerRequestTab(next.get('tab'));
      next.set('ticketId', ticketId);
      if (normalizedTab && normalizedTab !== 'overview') {
        next.set('tab', normalizedTab);
      } else {
        next.delete('tab');
      }
      next.delete('conversationId');
      return next;
    });
    setMessage('');
  };

  const handleTabChange = (value: string) => {
    const nextTab = normalizeCustomerRequestTab(value) ?? 'overview';
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (selectedTicket?.id) {
        next.set('ticketId', selectedTicket.id);
      }
      if (nextTab === 'overview') {
        next.delete('tab');
        next.delete('conversationId');
      } else {
        next.set('tab', nextTab);
      }
      if (nextTab === 'messages' && activeConversation?.id) {
        next.set('conversationId', activeConversation.id);
      }
      return next;
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    if (!selectedTicket) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('ticketId', selectedTicket.id);
      next.set('tab', 'messages');
      next.set('conversationId', conversationId);
      return next;
    });
    setMessage('');
  };

  const handleInviteOffer = async (offerId: string) => {
    if (!selectedTicket) return;
    try {
      const updatedTicket = await inviteOffer(selectedTicket.id, offerId);
      const conversation = updatedTicket.conversations.find((item) => item.offerId === offerId);
      if (conversation) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.set('ticketId', updatedTicket.id);
          next.set('tab', 'messages');
          next.set('conversationId', conversation.id);
          return next;
        });
      }
      setToast({ type: 'success', message: 'Servis görüşmeye davet edildi' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Servis davet edilemedi',
      });
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!selectedTicket) return;
    const confirmed = window.confirm('Bu teklif kabul edilince diğer teklifler reddedilecek ve iş başlatılacak.');
    if (!confirmed) return;
    try {
      await acceptOffer(selectedTicket.id, offerId);
      setToast({ type: 'success', message: 'Teklif kabul edildi ve iş başlatıldı' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Teklif kabul edilemedi',
      });
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!selectedTicket) return;
    try {
      await rejectOffer(selectedTicket.id, offerId);
      setToast({ type: 'success', message: 'Teklif reddedildi' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Teklif reddedilemedi',
      });
    }
  };

  const handleApproveBilling = async () => {
    if (!selectedTicket) return;
    try {
      await approveFinalBilling(selectedTicket.id);
      setToast({ type: 'success', message: 'Hakediş başarıyla onaylandı' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Hakediş onaylanamadı',
      });
    }
  };

  const handleDisputeBilling = async (reason: string) => {
    if (!selectedTicket) return;
    try {
      await disputeFinalBilling(selectedTicket.id, reason);
      setToast({ type: 'success', message: 'Detay talebi başarıyla iletildi' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Detay talebi iletilemedi',
      });
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[1720px] space-y-5 p-4 sm:p-6 lg:p-8">
      {toast && <ToastNotice toast={toast} />}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Müşteri Operasyonu</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
              Servis Taleplerim
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
              Arıza kayıtlarını, servis tekliflerini, davet durumunu ve hakediş onaylarını tek yerden yönetin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
            <Metric title="Açık Arıza" value={stats.open} icon={Wrench} tone="text-red-600 bg-red-50" />
            <Metric title="Teklif Bekliyor" value={stats.offered} icon={FileText} tone="text-amber-600 bg-amber-50" />
            <Metric title="Serviste" value={stats.active} icon={Timer} tone="text-indigo-600 bg-indigo-50" />
            <Metric title="Hakediş Onayı" value={stats.billing} icon={Receipt} tone="text-emerald-600 bg-emerald-50" />
          </div>
        </div>
      </section>

      {storeError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span className="text-sm font-semibold">{storeError}</span>
        </div>
      )}

      {tickets.length === 0 ? (
        <EmptyRequestsPanel />
      ) : selectedTicket ? (
        <>
          <div className="hidden gap-5 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_380px] 2xl:grid-cols-[360px_minmax(0,1fr)_420px]">
            <TicketStreamPanel
              tickets={tickets}
              selectedTicketId={selectedTicket.id}
              onSelectTicket={handleSelectTicket}
            />

            <section className="min-w-0">
              <div className="hidden space-y-5 xl:block">
                <ActiveServicePanel ticket={selectedTicket} />
                <RequestOverviewPanel ticket={selectedTicket} offerCount={selectedTicketOffers.length} />
                {selectedTicket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL' && (
                  <BillingPanel
                    ticket={selectedTicket}
                    onApprove={handleApproveBilling}
                    onDispute={() => handleDisputeBilling('Maliyet kalemleri için detay istiyoruz.')}
                  />
                )}
                <OfferComparisonPanel
                  ticket={selectedTicket}
                  offers={selectedTicketOffers}
                  onInvite={handleInviteOffer}
                  onAccept={handleAcceptOffer}
                  onReject={handleRejectOffer}
                  onMessage={handleSelectConversation}
                />
              </div>

              <div className="xl:hidden">
                <RequestWorkspaceTabs
                  activeTab={activeTab}
                  ticket={selectedTicket}
                  offers={selectedTicketOffers}
                  activeConversation={activeConversation}
                  message={message}
                  onTabChange={handleTabChange}
                  onInviteOffer={handleInviteOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onRejectOffer={handleRejectOffer}
                  onSelectConversation={handleSelectConversation}
                  onApproveBilling={handleApproveBilling}
                  onDisputeBilling={() => handleDisputeBilling('Maliyet kalemleri için detay istiyoruz.')}
                  onMessageChange={setMessage}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </section>

            <MessagePanel
              ticket={selectedTicket}
              activeConversation={activeConversation}
              message={message}
              onSelectConversation={handleSelectConversation}
              onMessageChange={setMessage}
              onSendMessage={handleSendMessage}
              className="hidden xl:block xl:sticky xl:top-6"
              threadHeightClassName="min-h-[320px] max-h-[calc(100vh-360px)]"
            />
          </div>

          <div className="space-y-4 lg:hidden">
            <TicketStreamPanel
              tickets={tickets}
              selectedTicketId={selectedTicket.id}
              onSelectTicket={handleSelectTicket}
              compact
            />
            <RequestWorkspaceTabs
              activeTab={activeTab}
              ticket={selectedTicket}
              offers={selectedTicketOffers}
              activeConversation={activeConversation}
              message={message}
              onTabChange={handleTabChange}
              onInviteOffer={handleInviteOffer}
              onAcceptOffer={handleAcceptOffer}
              onRejectOffer={handleRejectOffer}
              onSelectConversation={handleSelectConversation}
              onApproveBilling={handleApproveBilling}
              onDisputeBilling={() => handleDisputeBilling('Maliyet kalemleri için detay istiyoruz.')}
              onMessageChange={setMessage}
              onSendMessage={handleSendMessage}
            />
          </div>
        </>
      ) : (
        <EmptyRequestsPanel />
      )}
    </div>
  );
}

function ToastNotice({ toast }: { toast: { type: 'success' | 'error'; message: string } }) {
  return (
    <div
      className={`fixed right-4 top-20 z-[100] flex w-[min(420px,calc(100vw-2rem))] items-center gap-3 rounded-lg border px-4 py-3 shadow-2xl transition-all duration-500 animate-in slide-in-from-right-5 fade-in ${
        toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
      )}
      <span className="text-sm font-semibold">{toast.message}</span>
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: ElementType;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-black leading-none text-slate-950">{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function TicketStreamPanel({
  tickets,
  selectedTicketId,
  onSelectTicket,
  compact = false,
}: {
  tickets: Ticket[];
  selectedTicketId: string;
  onSelectTicket: (ticketId: string) => void;
  compact?: boolean;
}) {
  const sortedTickets = [...tickets].sort((a, b) => ticketActivityTime(b) - ticketActivityTime(a));

  return (
    <Card className={`h-fit border-slate-200 shadow-sm ${compact ? '' : 'lg:sticky lg:top-6'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Talep Akışı</CardTitle>
            <CardDescription>Son arıza ve bakım kayıtları</CardDescription>
          </div>
          <Badge variant="outline" className="bg-slate-50 text-slate-600">
            {tickets.length} kayıt
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={`space-y-2 overflow-y-auto ${compact ? 'max-h-[360px]' : 'lg:max-h-[calc(100vh-240px)]'}`}>
        {sortedTickets.map((ticket) => {
          const isSelected = selectedTicketId === ticket.id;
          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket.id)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? 'border-red-300 bg-red-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-black leading-snug text-slate-950">{ticket.title}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    #{shortTicketId(ticket.id)} · {ticket.assetName || 'Varlık yok'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <TicketStatusBadge status={ticket.status} className="text-[10px]" />
                  {(ticket.unreadMessageCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.unreadMessageCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <TicketPriorityBadge priority={ticket.priority} className="text-[10px]" />
                <span className="shrink-0 text-xs font-medium text-slate-500">
                  {formatShortDateTime(ticket.updatedAt || ticket.createdAt)}
                </span>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RequestWorkspaceTabs({
  activeTab,
  ticket,
  offers,
  activeConversation,
  message,
  onTabChange,
  onInviteOffer,
  onAcceptOffer,
  onRejectOffer,
  onSelectConversation,
  onApproveBilling,
  onDisputeBilling,
  onMessageChange,
  onSendMessage,
}: {
  activeTab: CustomerRequestTab;
  ticket: Ticket;
  offers: TicketOffer[];
  activeConversation: TicketConversation | null;
  message: string;
  onTabChange: (value: string) => void;
  onInviteOffer: (offerId: string) => void;
  onAcceptOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onApproveBilling: () => void;
  onDisputeBilling: () => void;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid h-11 w-full grid-cols-3 bg-slate-100">
        <TabsTrigger value="overview" className="text-xs font-black sm:text-sm">
          Özet
        </TabsTrigger>
        <TabsTrigger value="offers" className="text-xs font-black sm:text-sm">
          Teklifler
        </TabsTrigger>
        <TabsTrigger value="messages" className="text-xs font-black sm:text-sm">
          Mesajlar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0 space-y-4">
        <ActiveServicePanel ticket={ticket} />
        <RequestOverviewPanel ticket={ticket} offerCount={offers.length} />
        {ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL' && (
          <BillingPanel ticket={ticket} onApprove={onApproveBilling} onDispute={onDisputeBilling} />
        )}
      </TabsContent>

      <TabsContent value="offers" className="mt-0">
        <OfferComparisonPanel
          ticket={ticket}
          offers={offers}
          onInvite={onInviteOffer}
          onAccept={onAcceptOffer}
          onReject={onRejectOffer}
          onMessage={onSelectConversation}
        />
      </TabsContent>

      <TabsContent value="messages" className="mt-0">
        <MessagePanel
          ticket={ticket}
          activeConversation={activeConversation}
          message={message}
          onSelectConversation={onSelectConversation}
          onMessageChange={onMessageChange}
          onSendMessage={onSendMessage}
          threadHeightClassName="min-h-[260px] max-h-[420px]"
        />
      </TabsContent>
    </Tabs>
  );
}

function RequestOverviewPanel({ ticket, offerCount }: { ticket: Ticket; offerCount: number }) {
  const infoItems = [
    { label: 'Varlık', value: ticket.assetName || 'Varlık yok', detail: ticket.assetTagNo || ticket.assetId, icon: Package },
    { label: 'Konum', value: ticket.customerLocation || ticket.customerCity || 'Konum yok', detail: ticket.customerCompany, icon: MapPin },
    { label: 'Oluşturma', value: formatShortDateTime(ticket.createdAt), detail: 'Arıza kaydı', icon: CalendarDays },
    { label: 'Güncelleme', value: formatShortDateTime(ticket.updatedAt || ticket.createdAt), detail: 'Son aktivite', icon: Clock },
    { label: 'Teklif', value: `${offerCount} teklif`, detail: ticket.status === 'OFFERED' ? 'Karar bekliyor' : 'Süreç durumu', icon: FileText },
    {
      label: 'Mesaj',
      value: `${ticket.unreadMessageCount ?? 0} okunmamış`,
      detail: `${(ticket.messages ?? []).length} toplam mesaj`,
      icon: MessageSquare,
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-slate-400">#{shortTicketId(ticket.id)}</span>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <TicketCategoryBadge category={ticket.category} className="text-slate-600" />
            </div>
            <CardTitle className="line-clamp-2 text-2xl font-black tracking-normal text-slate-950">
              {ticket.title}
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-relaxed">
              {ticket.description}
            </CardDescription>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 xl:min-w-[230px]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <Tag className="h-4 w-4" />
              Varlık Kartı
            </div>
            <p className="mt-2 truncate font-black text-slate-950">{ticket.assetName || 'Varlık belirtilmedi'}</p>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">{ticket.assetId}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-400">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-black text-slate-900">{item.value}</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{item.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveServicePanel({ ticket }: { ticket: Ticket }) {
  if (!ticket.assignedProviderName) return null;

  return (
    <Card className="border-red-200 bg-red-50/80 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-red-950">{ticket.assignedProviderName} davet edildi</p>
            <p className="mt-1 text-sm font-medium text-red-700">
              Servis geliş bilgisi: {ticket.serviceEta || 'ETA bekleniyor'}
            </p>
          </div>
        </div>
        <Badge className="w-fit bg-red-600 text-white hover:bg-red-600">Servis Süreci Aktif</Badge>
      </CardContent>
    </Card>
  );
}

function OfferComparisonPanel({
  ticket,
  offers,
  onInvite,
  onAccept,
  onReject,
  onMessage,
}: {
  ticket: Ticket;
  offers: TicketOffer[];
  onInvite: (offerId: string) => void;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onMessage: (conversationId: string) => void;
}) {
  const groups = groupOffers(offers);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Teklif Karşılaştırması</CardTitle>
            <CardDescription>Servis sağlayıcılarından gelen keşif ve net fiyat teklifleri</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700">
              {groups.pending.length} bekleyen
            </Badge>
            <Badge variant="outline" className="bg-sky-50 text-sky-700">
              {groups.invited.length} görüşmede
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              {groups.accepted.length} kabul
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 xl:max-h-[560px] xl:overflow-y-auto">
        {offers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-bold text-slate-700">Henüz teklif yok</p>
            <p className="mt-1 text-sm text-slate-500">Bu arıza için servis sağlayıcılarından teklif bekleniyor.</p>
          </div>
        ) : (
          <>
            {groups.accepted.length > 0 && (
              <OfferGroup
                title="Kabul edilen servis"
                description="Aktif servis sürecini yürüten teklif"
                tone="accepted"
                offers={groups.accepted}
                ticket={ticket}
                onInvite={onInvite}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
              />
            )}
            {groups.invited.length > 0 && (
              <OfferGroup
                title="Görüşmede olduğunuz servisler"
                description="Özel mesajlaşma açık, nihai karar bekliyor"
                tone="invited"
                offers={groups.invited}
                ticket={ticket}
                onInvite={onInvite}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
              />
            )}
            {groups.pending.length > 0 && (
              <OfferGroup
                title="Bekleyen teklifler"
                description="Karar verilebilir teklifler"
                tone="pending"
                offers={groups.pending}
                ticket={ticket}
                onInvite={onInvite}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
              />
            )}
            {groups.other.length > 0 && (
              <OfferGroup
                title="Diğer teklifler"
                description="Reddedilen veya geri çekilen teklifler"
                tone="other"
                offers={groups.other}
                ticket={ticket}
                onInvite={onInvite}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OfferGroup({
  title,
  description,
  tone,
  offers,
  ticket,
  onInvite,
  onAccept,
  onReject,
  onMessage,
}: {
  title: string;
  description: string;
  tone: 'accepted' | 'invited' | 'pending' | 'other';
  offers: TicketOffer[];
  ticket: Ticket;
  onInvite: (offerId: string) => void;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onMessage: (conversationId: string) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="text-xs font-medium text-slate-500">{description}</p>
        </div>
        <Badge variant="outline" className="bg-white text-slate-600">
          {offers.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            ticket={ticket}
            tone={tone}
            onInvite={onInvite}
            onAccept={onAccept}
            onReject={onReject}
            onMessage={onMessage}
          />
        ))}
      </div>
    </section>
  );
}

function OfferCard({
  offer,
  ticket,
  tone,
  onInvite,
  onAccept,
  onReject,
  onMessage,
}: {
  offer: TicketOffer;
  ticket: Ticket;
  tone: 'accepted' | 'invited' | 'pending' | 'other';
  onInvite: (offerId: string) => void;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onMessage: (conversationId: string) => void;
}) {
  const conversation = (ticket.conversations ?? []).find((item) => item.offerId === offer.id || item.providerId === offer.providerId);
  const isSelectable = (offer.status === 'PENDING' || offer.status === 'INVITED') && ticket.status === 'OFFERED';
  const canInvite = offer.status === 'PENDING' && ticket.status === 'OFFERED';
  const canMessage = offer.status === 'INVITED' && Boolean(conversation);
  const toneClassName =
    tone === 'accepted'
      ? 'border-emerald-200 bg-emerald-50/60'
      : tone === 'invited'
        ? 'border-sky-200 bg-sky-50/60'
      : tone === 'pending'
        ? 'border-amber-200 bg-white'
        : 'border-slate-200 bg-slate-50/60';

  return (
    <div className={`rounded-lg border p-4 ${toneClassName}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-slate-950">{offer.providerName}</p>
            <OfferStatusBadge status={offer.status} />
            <Badge variant="outline" className="bg-white">
              {offer.type === 'DISCOVERY' ? 'Keşif' : 'Net Fiyat'}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{offer.message}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 font-bold text-slate-900">
              <CircleDollarSign className="h-4 w-4 text-slate-400" />
              {formatMoney(offer.estimatedCost)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 font-semibold text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              {offer.eta || 'ETA yok'}
            </span>
          </div>
        </div>
        {(isSelectable || canMessage) && (
          <div className="flex shrink-0 flex-wrap gap-2 xl:flex-col">
            {canInvite && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 bg-white xl:flex-none"
                onClick={() => onInvite(offer.id)}
              >
                <Send className="h-4 w-4" />
                Davet Et
              </Button>
            )}
            {canMessage && conversation && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 border-sky-200 bg-white text-sky-700 hover:bg-sky-50 xl:flex-none"
                onClick={() => onMessage(conversation.id)}
              >
                <MessageSquare className="h-4 w-4" />
                Mesajlaş
              </Button>
            )}
            {isSelectable && (
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 xl:flex-none"
                onClick={() => onAccept(offer.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Teklifi Kabul Et
              </Button>
            )}
            {isSelectable && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 bg-white xl:flex-none"
                onClick={() => onReject(offer.id)}
              >
                <XCircle className="h-4 w-4" />
                Reddet
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessagePanel({
  ticket,
  activeConversation,
  message,
  onSelectConversation,
  onMessageChange,
  onSendMessage,
  className = '',
  threadHeightClassName = 'min-h-[260px] max-h-[420px]',
}: {
  ticket: Ticket;
  activeConversation: TicketConversation | null;
  message: string;
  onSelectConversation: (conversationId: string) => void;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  className?: string;
  threadHeightClassName?: string;
}) {
  const conversations = ticket.conversations ?? [];
  const visibleMessages = activeConversation ? activeConversation.messages : ticket.messages;
  const isReadonly = !activeConversation || activeConversation.status === 'CLOSED';
  const unreadCount = activeConversation?.unreadMessageCount ?? ticket.unreadMessageCount ?? 0;

  return (
    <Card className={`h-fit border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg">Mesajlaşma</CardTitle>
            <CardDescription className="truncate">
              #{shortTicketId(ticket.id)} · {activeConversation?.providerName || 'Servis görüşmeleri'}
            </CardDescription>
          </div>
          <Badge variant="outline" className={unreadCount > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}>
            {unreadCount} yeni
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversations.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {conversations.map((conversation) => {
              const isActive = activeConversation?.id === conversation.id;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-sky-300 bg-sky-50 text-sky-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs font-black">{conversation.providerName}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                    {conversationStatusLabel(conversation)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <TicketMessageThread
          messages={visibleMessages}
          viewerRole="customer"
          maxHeightClassName={threadHeightClassName}
          emptyState={
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <MessageSquare className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="font-medium text-slate-700">
                {activeConversation ? 'Bu servisle henüz yazışma yok' : 'Henüz servis görüşmesi yok'}
              </p>
            </div>
          }
        />

        {activeConversation && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSendMessage();
            }}
            className="space-y-3 border-t border-slate-100 pt-3"
          >
            <Textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder={isReadonly ? 'Görüşme kapalı' : 'Servis sağlayıcıya mesaj yazın...'}
              className="min-h-[92px] resize-none bg-slate-50"
              disabled={isReadonly}
            />
            <Button
              type="submit"
              className="w-full bg-red-600 font-semibold hover:bg-red-700"
              disabled={isReadonly || !message.trim()}
            >
              <Send className="h-4 w-4" />
              Gönder
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function BillingPanel({
  ticket,
  onApprove,
  onDispute,
}: {
  ticket: Ticket;
  onApprove: () => void;
  onDispute: () => void;
}) {
  if (ticket.finalActualCost == null) return null;
  const billing = {
    estimatedCost: ticket.finalEstimatedCost ?? 0,
    actualCost: ticket.finalActualCost,
    providerName: ticket.assignedProviderName,
    status: ticket.billingStatus ?? 'AWAITING_CUSTOMER_APPROVAL',
    notes: ticket.finalBillingNotes,
  };
  const diff = billing.actualCost - billing.estimatedCost;

  return (
    <Card className="border-red-200 bg-red-50/70 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-red-950">
              <Receipt className="h-5 w-5 text-red-700" />
              Hakediş Onayı
            </CardTitle>
            <CardDescription>{billing.providerName} işi tamamladı ve nihai maliyeti iletti.</CardDescription>
          </div>
          <BillingStatusBadge status={billing.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CostBox label="Tahmini" value={billing.estimatedCost} />
          <CostBox label="Gerçekleşen" value={billing.actualCost} />
          <CostBox label="Fark" value={diff} signed />
        </div>
        <p className="rounded-lg border border-red-100 bg-white/80 p-3 text-sm text-red-900">
          {billing.notes}
        </p>
        {billing.status === 'AWAITING_CUSTOMER_APPROVAL' && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="bg-red-700 hover:bg-red-600" onClick={onApprove}>
              <CheckCircle2 className="h-4 w-4" />
              Hakedişi Onayla
            </Button>
            <Button type="button" variant="outline" className="bg-white" onClick={onDispute}>
              <MessageSquare className="h-4 w-4" />
              Detay İste
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CostBox({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  return (
    <div className="rounded-lg border border-red-100 bg-white/80 p-3">
      <p className="text-xs font-bold text-red-700">{label}</p>
      <p className="mt-1 text-lg font-black text-red-950">
        {signed && value > 0 ? '+' : ''}
        {formatMoney(value)}
      </p>
    </div>
  );
}

function EmptyRequestsPanel() {
  return (
    <Card className="border-dashed border-slate-300 bg-white">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <Inbox className="h-10 w-10 text-slate-300" />
        <p className="mt-4 text-lg font-black text-slate-800">Henüz servis talebi yok</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Arıza kaydı oluşturduğunuzda talepleriniz, teklifleriniz ve mesajlaşmalarınız burada görünecek.
        </p>
      </CardContent>
    </Card>
  );
}

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const variants: Record<OfferStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    INVITED: 'bg-sky-50 text-sky-700 border-sky-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    WITHDRAWN: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const labels: Record<OfferStatus, string> = {
    PENDING: 'Bekliyor',
    INVITED: 'Görüşmede',
    ACCEPTED: 'Kabul',
    REJECTED: 'Red',
    WITHDRAWN: 'Geri Çekildi',
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function conversationStatusLabel(conversation: TicketConversation) {
  if (conversation.status === 'ACCEPTED') return 'Kabul edildi';
  if (conversation.status === 'CLOSED') {
    return conversation.closedReason === 'NOT_SELECTED' ? 'Seçilmedi' : 'Kapatıldı';
  }
  return 'Aktif görüşme';
}

function BillingStatusBadge({ status }: { status: BillingStatus }) {
  const variants: Record<BillingStatus, string> = {
    AWAITING_CUSTOMER_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DISPUTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels: Record<BillingStatus, string> = {
    AWAITING_CUSTOMER_APPROVAL: 'Onay Bekliyor',
    APPROVED: 'Onaylandı',
    DISPUTED: 'Detay İstendi',
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function normalizeCustomerRequestTab(value: string | null): CustomerRequestTab | null {
  return customerRequestTabs.includes(value as CustomerRequestTab) ? (value as CustomerRequestTab) : null;
}

function groupOffers(offers: TicketOffer[]) {
  return {
    accepted: offers.filter((offer) => offer.status === 'ACCEPTED'),
    invited: offers.filter((offer) => offer.status === 'INVITED'),
    pending: offers.filter((offer) => offer.status === 'PENDING'),
    other: offers.filter((offer) => !['ACCEPTED', 'INVITED', 'PENDING'].includes(offer.status)),
  };
}

function offerSortTime(offer: TicketOffer) {
  const timestamp = new Date(offer.updatedAt || offer.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function ticketActivityTime(ticket: Ticket) {
  const timestamp = new Date(ticket.updatedAt || ticket.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function shortTicketId(id: string) {
  return id.split('-')[1] ?? id.slice(0, 8);
}

function formatMoney(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Tutar yok';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}
