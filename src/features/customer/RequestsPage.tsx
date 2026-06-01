import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  useCustomerStore,
  type BillingStatus,
  type OfferStatus,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
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
    approveFinalBilling,
    disputeFinalBilling,
    fetchTickets,
    error: storeError,
  } = useCustomerStore();
  const user = useAuthStore((state) => state.user);
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id ?? '');
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

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0],
    [selectedTicketId, tickets]
  );

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
                onClick={() => setSelectedTicketId(ticket.id)}
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
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs text-slate-500">{formatDate(ticket.updatedAt)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {selectedTicket && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={selectedTicket.status} />
                      <PriorityBadge priority={selectedTicket.priority} />
                      <Badge variant="outline" className="text-slate-600">
                        {selectedTicket.category}
                      </Badge>
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
                {(selectedTicket.offers ?? []).length > 0 ? (
                  (selectedTicket.offers ?? []).map((offer) => (
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
                    <p className="text-sm text-slate-500 mt-1">Talep ilgili servis sağlayıcılarına yönlendirildi.</p>
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
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {(selectedTicket.messages ?? []).map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg p-3 border ${
                        item.senderRole === 'customer'
                          ? 'bg-red-50 border-red-100 ml-8'
                          : 'bg-slate-50 border-slate-200 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{item.senderName}</p>
                        <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{item.body}</p>
                    </div>
                  ))}
                </div>
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

function StatusBadge({ status }: { status: TicketStatus }) {
  const variants: Record<TicketStatus, string> = {
    OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
    OFFERED: 'bg-amber-100 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  };

  const labels: Record<TicketStatus, string> = {
    OPEN: 'Açık',
    OFFERED: 'Teklifli',
    IN_PROGRESS: 'Serviste',
    RESOLVED: 'Çözüldü',
    CLOSED: 'Kapalı',
    CANCELLED: 'İptal',
  };

  return <Badge variant="outline" className={variants[status]}>{labels[status]}</Badge>;
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const variants: Record<TicketPriority, string> = {
    Low: 'bg-slate-50 text-slate-600 border-slate-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels: Record<TicketPriority, string> = {
    Low: 'Düşük',
    Medium: 'Orta',
    High: 'Yüksek',
    Critical: 'Kritik',
  };

  return <Badge variant="outline" className={variants[priority]}>{labels[priority]}</Badge>;
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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
