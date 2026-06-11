import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TicketCategoryBadge, TicketPriorityBadge, TicketStatusBadge } from '@/components/domain/ticketBadges';
import { TicketMessageThread } from '@/components/messages/TicketMessageThread';
import { formatShortDateTime } from '@/components/domain/ticketMeta';
import {
  useCustomerStore,
  type BillingStatus,
  type OfferStatus,
  type Ticket,
} from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTicketMessageSubscriptions } from '@/hooks/useTicketMessageSubscriptions';
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Receipt,
  Send,
  ShieldCheck,
  Tag,
  Timer,
  Wrench,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function RequestsPage() {
  const {
    tickets,
    acceptOffer,
    rejectOffer,
    addTicketMessage,
    receiveTicketMessage,
    markTicketMessagesRead,
    approveFinalBilling,
    disputeFinalBilling,
    fetchTickets,
    error: storeError,
  } = useCustomerStore();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicketId = searchParams.get('ticketId') ?? '';
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.id) {
      fetchTickets(user.id);
    }
  }, [fetchTickets, user?.id]);

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
    return (selectedTicket.offers ?? []).filter((offer) => !offer.ticketId || offer.ticketId === selectedTicket.id);
  }, [selectedTicket]);

  const selectedTicketMessages = useMemo(() => {
    if (!selectedTicket) return [];
    return (selectedTicket.messages ?? []).filter((item) => !item.ticketId || item.ticketId === selectedTicket.id);
  }, [selectedTicket]);

  useTicketMessageSubscriptions(tickets, receiveTicketMessage);

  useEffect(() => {
    if (!selectedTicket?.id || !selectedTicket.unreadMessageCount) return;
    void markTicketMessagesRead(selectedTicket.id);
  }, [markTicketMessagesRead, selectedTicket?.id, selectedTicket?.unreadMessageCount]);

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
    if (!selectedTicket || !message.trim()) return;
    try {
      await addTicketMessage(selectedTicket.id, message.trim());
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
      next.set('ticketId', ticketId);
      return next;
    });
    setMessage('');
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!selectedTicket) return;
    try {
      await acceptOffer(selectedTicket.id, offerId);
      setToast({ type: 'success', message: 'Servis başarıyla davet edildi' });
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl
                      border backdrop-blur-md transition-all duration-500 animate-in slide-in-from-right-5 fade-in
                      ${toast.type === 'success'
                        ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800 shadow-emerald-100/50'
                        : 'bg-red-50/95 border-red-200 text-red-800 shadow-red-100/50'
                      }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Servis Taleplerim</h1>
        <p className="text-slate-500">
          Arıza kayıtlarını, servis tekliflerini, davet durumunu ve hakediş onaylarını tek yerden yönetin.
        </p>
      </div>

      {storeError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm font-semibold">{storeError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric title="Açık Arıza" value={stats.open} icon={Wrench} tone="text-red-600 bg-red-50" />
        <Metric title="Teklif Bekliyor" value={stats.offered} icon={FileText} tone="text-red-600 bg-red-50" />
        <Metric title="Serviste" value={stats.active} icon={Timer} tone="text-red-600 bg-red-50" />
        <Metric title="Hakediş Onayı" value={stats.billing} icon={Receipt} tone="text-red-600 bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Talep Akışı</CardTitle>
            <CardDescription>Son arıza ve bakım kayıtları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => handleSelectTicket(ticket.id)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  selectedTicket?.id === ticket.id
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 line-clamp-2">{ticket.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      #{ticket.id.split('-')[1]} - {ticket.assetName}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <TicketStatusBadge status={ticket.status} />
                    {(ticket.unreadMessageCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                        <MessageSquare className="h-3 w-3" />
                        {ticket.unreadMessageCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <TicketPriorityBadge priority={ticket.priority} />
                  <span className="text-xs text-slate-500">{formatShortDateTime(ticket.updatedAt)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {selectedTicket && (
          <div key={selectedTicket.id} className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <TicketStatusBadge status={selectedTicket.status} />
                      <TicketPriorityBadge priority={selectedTicket.priority} />
                      <TicketCategoryBadge category={selectedTicket.category} className="text-slate-600" />
                    </div>
                    <CardTitle className="text-2xl text-slate-900">{selectedTicket.title}</CardTitle>
                    <CardDescription className="mt-2">{selectedTicket.description}</CardDescription>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 min-w-[220px]">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Tag className="w-4 h-4" />
                      Varlık
                    </div>
                    <p className="font-semibold text-slate-900 mt-1">{selectedTicket.assetName}</p>
                    <p className="text-xs text-slate-500">{selectedTicket.assetId}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {selectedTicket.assignedProviderName && (
              <Card className="border-red-200 bg-red-50/60">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-950">{selectedTicket.assignedProviderName} davet edildi</p>
                      <p className="text-sm text-red-700">Servis geliş bilgisi: {selectedTicket.serviceEta}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-600 hover:bg-red-600">Servis Süreci Aktif</Badge>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teklifler</CardTitle>
                <CardDescription>Servis sağlayıcılarından gelen keşif ve net fiyat teklifleri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTicketOffers.length > 0 ? (
                  selectedTicketOffers.map((offer) => (
                    <div key={offer.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{offer.providerName}</p>
                            <OfferStatusBadge status={offer.status} />
                            <Badge variant="outline">{offer.type === 'DISCOVERY' ? 'Keşif' : 'Net Fiyat'}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-2">{offer.message}</p>
                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                            <span>{offer.estimatedCost.toLocaleString('tr-TR')} TL</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {offer.eta}
                            </span>
                          </div>
                        </div>
                        {offer.status === 'PENDING' && selectedTicket.status === 'OFFERED' && (
                          <div className="flex gap-2 sm:flex-col">
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleAcceptOffer(offer.id)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Davet Et
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectOffer(offer.id)}
                            >
                              <XCircle className="w-4 h-4" />
                              Reddet
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">Henüz teklif yok</p>
                    <p className="text-sm text-slate-500 mt-1">Bu arıza için servis sağlayıcılarından teklif bekleniyor.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedTicket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL' && (
              <BillingPanel
                ticket={selectedTicket}
                onApprove={handleApproveBilling}
                onDispute={() => handleDisputeBilling('Maliyet kalemleri için detay istiyoruz.')}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mesajlaşma</CardTitle>
                <CardDescription>Servis sağlayıcı ve operasyon notları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TicketMessageThread
                  messages={selectedTicketMessages}
                  viewerRole="customer"
                  emptyState={
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                      <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="font-medium text-slate-700">Bu arıza için henüz yazışma yok</p>
                    </div>
                  }
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Servis sağlayıcıya mesaj yazın..."
                    className="min-h-[88px]"
                  />
                  <Button
                    type="button"
                    className="bg-red-600 hover:bg-red-700 sm:self-end"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <Send className="w-4 h-4" />
                    Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
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
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
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
    <Card className="border-red-200 bg-red-50/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-red-950">
              <Receipt className="w-5 h-5 text-red-700" />
              Hakediş Onayı
            </CardTitle>
            <CardDescription>{billing.providerName} işi tamamladı ve nihai maliyeti iletti.</CardDescription>
          </div>
          <BillingStatusBadge status={billing.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CostBox label="Tahmini" value={billing.estimatedCost} />
          <CostBox label="Gerçekleşen" value={billing.actualCost} />
          <CostBox label="Fark" value={diff} signed />
        </div>
        <p className="text-sm text-red-900 bg-white/70 border border-red-100 rounded-lg p-3">
          {billing.notes}
        </p>
        {billing.status === 'AWAITING_CUSTOMER_APPROVAL' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-red-700 hover:bg-red-600" onClick={onApprove}>
              <CheckCircle2 className="w-4 h-4" />
              Hakedişi Onayla
            </Button>
            <Button variant="outline" className="bg-white" onClick={onDispute}>
              <MessageSquare className="w-4 h-4" />
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
    <div className="rounded-lg bg-white/80 border border-red-100 p-3">
      <p className="text-xs text-red-700">{label}</p>
      <p className="text-lg font-semibold text-red-950">
        {signed && value > 0 ? '+' : ''}
        {value.toLocaleString('tr-TR')} TL
      </p>
    </div>
  );
}

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const variants: Record<OfferStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    WITHDRAWN: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const labels: Record<OfferStatus, string> = {
    PENDING: 'Bekliyor',
    ACCEPTED: 'Kabul',
    REJECTED: 'Red',
    WITHDRAWN: 'Geri Çekildi',
  };

  return <Badge variant="outline" className={variants[status]}>{labels[status]}</Badge>;
}

function BillingStatusBadge({ status }: { status: BillingStatus }) {
  const variants: Record<BillingStatus, string> = {
    'AWAITING_CUSTOMER_APPROVAL': 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DISPUTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels: Record<BillingStatus, string> = {
    'AWAITING_CUSTOMER_APPROVAL': 'Onay Bekliyor',
    APPROVED: 'Onaylandı',
    DISPUTED: 'Detay İstendi',
  };

  return <Badge variant="outline" className={variants[status]}>{labels[status]}</Badge>;
}
