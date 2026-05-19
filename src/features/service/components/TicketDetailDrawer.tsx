import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useServiceStore,
} from '@/store/useServiceStore';
import type { Ticket, OfferType } from '@/store/useCustomerStore';
import FinalBillingDialog from './FinalBillingDialog';
import {
  Building2,
  MapPin,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Package,
  ImageIcon,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  Clock4,
  MessageSquare,
  DollarSign,
  Search,
  Send,
} from 'lucide-react';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

const API_MEDIA_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

/**
 * TicketDetailDrawer Component
 *
 * Slide-out drawer for viewing ticket details and submitting proposals.
 * Dark theme with amber accents for Service Provider Portal.
 */
export default function TicketDetailDrawer({
  ticket,
  isOpen,
  onClose,
}: TicketDetailDrawerProps) {
  const { submitProposal, getMyProposalForTicket, addTicketMessage, currentProviderId } = useServiceStore();
  const liveTicket = useServiceStore((state) => (ticket ? state.getTicketById(ticket.id) : undefined));
  const [activeTab, setActiveTab] = useState('details');

  // Proposal form state
  const [proposalType, setProposalType] = useState<OfferType>('DISCOVERY');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);

  if (!ticket) return null;

  const activeTicket = liveTicket ?? ticket;
  const mediaUrls = activeTicket.mediaUrls ?? [];
  const messages = activeTicket.messages ?? [];
  const canMessage =
    !!activeTicket.assignedProviderId &&
    (!currentProviderId || activeTicket.assignedProviderId === currentProviderId) &&
    activeTicket.status !== 'CLOSED' &&
    activeTicket.status !== 'CANCELLED';
  const ticketCode = (activeTicket.id.split('-')[1] ?? activeTicket.id).toUpperCase();
  const myProposal = getMyProposalForTicket(activeTicket.id);
  const hasSubmitted = !!myProposal;

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      await submitProposal(ticket.id, {
        type: proposalType,
        estimatedCost: proposalType === 'FIXED_PRICE' ? parseFloat(estimatedCost) || 0 : 0,
        eta: 'Bugün içinde',
        message,
      });
      setActiveTab('my-proposal');
    } catch (e) {
      console.error('Failed to submit proposal:', e);
      alert('Teklif gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = chatMessage.trim();
    if (!body || !canMessage) return;

    setIsMessageSending(true);
    setChatError(null);
    try {
      await addTicketMessage(activeTicket.id, body);
      setChatMessage('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Mesaj gönderilemedi');
    } finally {
      setIsMessageSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-600 border-red-200/30';
      case 'High':
        return 'bg-orange-50 text-orange-600 border-orange-200/30';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 border-amber-200/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const priorityLabel = (priority: string) => {
    const labels: Record<string, string> = { Critical: 'Kritik', High: 'Yüksek', Medium: 'Orta', Low: 'Düşük' };
    return labels[priority] || priority;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = { OPEN: 'Açık', OFFERED: 'Teklif Verildi', IN_PROGRESS: 'Devam Ediyor', RESOLVED: 'Çözüldü', CLOSED: 'Kapandı', CANCELLED: 'İptal' };
    return labels[status] || status;
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-white border-slate-200 text-slate-900 overflow-y-auto"
      >
        <SheetHeader className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-500">
                  #{ticketCode}
                </span>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(activeTicket.priority)} text-xs`}
                >
                  {priorityLabel(activeTicket.priority)}
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold text-slate-900">
                {activeTicket.title}
              </SheetTitle>
            </div>
            <Badge
              variant="secondary"
              className="bg-slate-50 text-slate-700"
            >
              {statusLabel(activeTicket.status)}
            </Badge>
          </div>
          <SheetDescription className="text-slate-400">
            {activeTicket.description}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-50">
            <TabsTrigger
              value="details"
              className="text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              Detaylar
            </TabsTrigger>
            <TabsTrigger
              value="work-order"
              className="text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              İş Emri
            </TabsTrigger>
            <TabsTrigger
              value="asset"
              className="text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              Varlık
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              Mesajlar
            </TabsTrigger>
            <TabsTrigger
              value={hasSubmitted ? 'my-proposal' : 'proposal'}
              className="text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              {hasSubmitted ? 'Teklifim' : 'Teklif Ver'}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            {mediaUrls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Arıza Ekleri
                </h3>
                <MediaPreviewGrid mediaUrls={mediaUrls} />
              </div>
            )}

            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Müşteri Bilgileri
              </h3>
              <div className="bg-slate-50/50 rounded-lg p-4 space-y-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-400">
                      {activeTicket.customerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{activeTicket.customerName}</p>
                    <p className="text-sm text-slate-400">{activeTicket.customerCompany}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {activeTicket.customerLocation}
                </div>
              </div>
            </div>

            {/* Issue Category */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <ServiceCategoryIcon category={activeTicket.category} className="w-4 h-4" />
                Arıza Kategorisi
              </h3>
              <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ServiceCategoryIcon category={activeTicket.category} className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{activeTicket.category}</p>
                    <p className="text-sm text-slate-500">
                      {getCategoryDescription(activeTicket.category)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Zaman Çizelgesi
              </h3>
              <div className="space-y-3">
                <TimelineItem
                  icon={Clock4}
                  time={activeTicket.createdAt}
                  text="Arıza kaydı oluşturuldu"
                />
                {activeTicket.offers.length > 0 && (
                  <TimelineItem
                    icon={MessageSquare}
                    time={activeTicket.offers[0].createdAt}
                    text={`${activeTicket.offers[0].providerName} teklif verdi`}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="work-order" className="space-y-6 mt-6">
            <WorkOrderPanel ticket={activeTicket} onOpenBilling={() => setIsBillingDialogOpen(true)} />
          </TabsContent>

          {/* Asset Tab */}
          <TabsContent value="asset" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4" />
                Varlık Bilgileri
              </h3>
              <div className="bg-slate-50/50 rounded-lg p-4 space-y-4 border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Varlık Adı
                  </p>
                  <p className="font-medium text-slate-900 text-lg">{activeTicket.assetName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Tag No
                    </p>
                    <p className="font-mono text-slate-700">{activeTicket.assetTagNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Marka / Model
                    </p>
                    <p className="text-slate-700">
                      {activeTicket.assetBrand} / {activeTicket.assetModel}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Seri No
                  </p>
                  <p className="font-mono text-sm text-slate-400">{activeTicket.assetSerialNumber}</p>
                </div>
              </div>
            </div>

            {/* Media */}
            {ticket.mediaUrls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Ekler
                </h3>
                <MediaPreviewGrid mediaUrls={ticket.mediaUrls} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-6">
            <div className="space-y-3">
              {messages.length > 0 ? (
                messages.map((item) => {
                  const isMine = item.senderRole === 'service';
                  const isSystem = item.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
                        {item.body}
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[82%] rounded-lg border px-3 py-2 ${
                          isMine
                            ? 'border-red-200 bg-red-50 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                          <span className="font-medium">{item.senderName}</span>
                          <span>{formatMessageTime(item.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                  Henüz mesaj yok.
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3 border-t border-slate-200 pt-4">
              <Textarea
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                rows={4}
                disabled={!canMessage || isMessageSending}
                placeholder={canMessage ? 'Müşteriye mesaj yaz...' : 'Mesajlaşma iş atandıktan sonra açılır'}
                className="resize-none bg-slate-50 border-slate-200 text-slate-900"
              />
              {chatError && <p className="text-sm text-red-600">{chatError}</p>}
              <Button
                type="submit"
                disabled={!canMessage || isMessageSending || !chatMessage.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <Send className="mr-2 h-4 w-4" />
                {isMessageSending ? 'Gönderiliyor...' : 'Mesaj Gönder'}
              </Button>
            </form>
          </TabsContent>

          {/* Proposal / My Proposal Tab */}
          <TabsContent
            value={hasSubmitted ? 'my-proposal' : 'proposal'}
            className="space-y-6 mt-6"
          >
            {hasSubmitted && myProposal ? (
              <div className="space-y-6">
                <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Teklif Detayları</h3>
                    <Badge
                      variant="outline"
                      className={
                        myProposal.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200/30'
                          : myProposal.status === 'REJECTED'
                          ? 'bg-red-50 text-red-600 border-red-200/30'
                          : 'bg-amber-50 text-amber-600 border-amber-200/30'
                      }
                    >
                      {myProposal.status === 'PENDING' && 'Beklemede'}
                      {myProposal.status === 'ACCEPTED' && 'Kabul Edildi'}
                      {myProposal.status === 'REJECTED' && 'Reddedildi'}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        {myProposal.type === 'DISCOVERY' ? (
                          <Search className="w-5 h-5 text-red-600" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Teklif Tipi</p>
                        <p className="font-medium text-slate-900">
                          {myProposal.type === 'DISCOVERY' ? 'Keşif' : 'Net Fiyat'}
                        </p>
                      </div>
                    </div>

                    {myProposal.estimatedCost > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Tahmini Maliyet</p>
                          <p className="font-medium text-slate-900 text-lg">
                            {myProposal.estimatedCost.toLocaleString('tr-TR')} TL
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-slate-500 mb-2">Mesajınız</p>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {myProposal.message}
                      </p>
                    </div>
                  </div>
                </div>

                {myProposal.status === 'ACCEPTED' && (
                  <div className="bg-emerald-50 border border-emerald-200/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Teklif Kabul Edildi!</span>
                    </div>
                    <p className="text-sm text-emerald-700/70">
                      Müşteri teklifinizi kabul etti. İşe başlayabilirsiniz.
                    </p>
                  </div>
                )}

                {myProposal.status === 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Teklif Reddedildi</span>
                    </div>
                    <p className="text-sm text-red-700/70">
                      Müşteri farklı bir servis sağlayıcı seçti.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-6">
                {/* Proposal Type Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                    Teklif Tipi
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProposalType('DISCOVERY')}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        proposalType === 'DISCOVERY'
                          ? 'border-red-200 bg-red-50'
                          : 'border-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Search
                          className={`w-5 h-5 ${
                            proposalType === 'DISCOVERY'
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            proposalType === 'DISCOVERY'
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          Keşif
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Yerinde inceleme sonrası net fiyat
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProposalType('FIXED_PRICE')}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        proposalType === 'FIXED_PRICE'
                          ? 'border-red-200 bg-red-50'
                          : 'border-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign
                          className={`w-5 h-5 ${
                            proposalType === 'FIXED_PRICE'
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            proposalType === 'FIXED_PRICE'
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          Net Fiyat
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Sabit fiyat garantisi
                      </p>
                    </button>
                  </div>
                </div>

                {/* Estimated Cost (only for Fixed Price) */}
                {proposalType === 'FIXED_PRICE' && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="estimatedCost"
                      className="text-sm font-semibold text-red-600 uppercase tracking-wider"
                    >
                      Tahmini Maliyet (TL)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="estimatedCost"
                        type="number"
                        placeholder="0.00"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
                        required={proposalType === 'FIXED_PRICE'}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      İşçilik ve malzeme dahil toplam tahmini maliyet
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-sm font-semibold text-red-600 uppercase tracking-wider"
                  >
                    Teklif Mesajı
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Teklifinizi açıklayın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="bg-slate-50 border-slate-200 text-slate-900 resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Müşteriye iletilecek detaylı açıklama
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-transparent border-slate-200 text-slate-700 hover:bg-red-50"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Teklif Gönder'}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
    <FinalBillingDialog
      ticket={activeTicket}
      isOpen={isBillingDialogOpen}
      onClose={() => setIsBillingDialogOpen(false)}
    />
    </>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function MediaPreviewGrid({ mediaUrls }: { mediaUrls: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {mediaUrls.map((url, index) => {
        const source = resolveMediaUrl(url);

        return (
          <div
            key={`${url}-${index}`}
            className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
          >
            {isVideoMedia(url) ? (
              <video
                src={source}
                controls
                preload="metadata"
                className="h-full w-full bg-black object-contain"
              >
                <Video className="h-8 w-8 text-slate-600" />
              </video>
            ) : (
              <img
                src={source}
                alt={`Arıza eki ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return url.startsWith('/') ? `${API_MEDIA_ORIGIN}${url}` : `${API_MEDIA_ORIGIN}/${url}`;
}

function isVideoMedia(url: string): boolean {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some((extension) => cleanUrl.endsWith(extension));
}

function formatMessageTime(value: string): string {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ServiceCategoryIcon({ category, className }: { category: string; className: string }) {
  switch (category) {
    case 'Electric':
      return <Zap className={className} />;
    case 'Mechanic':
      return <Settings className={className} />;
    case 'Pneumatic':
    case 'Hydraulic':
      return <Droplets className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

function WorkOrderPanel({ ticket, onOpenBilling }: { ticket: Ticket; onOpenBilling: () => void }) {
  const acceptedProposal = ticket.offers.find((proposal) => proposal.status === 'ACCEPTED');
  const estimatedCost = acceptedProposal?.estimatedCost ?? 0;
  const canComplete = ticket.status === 'IN_PROGRESS';
  const billingPending = ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL';

  return (
    <div className="space-y-6">
      <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200 space-y-4">
        <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider">İş Özeti</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoCell label="Müşteri" value={ticket.customerCompany} />
          <InfoCell label="Konum" value={ticket.customerLocation} />
          <InfoCell label="Varlık" value={ticket.assetName || ''} />
          <InfoCell label="Tahmini Tutar" value={`${estimatedCost.toLocaleString('tr-TR')} TL`} />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">İş Tamamlama</h3>
            <p className="mt-1 text-sm text-slate-500">
              {billingPending
                ? 'Hakediş müşterinin onayını bekliyor.'
                : canComplete
                ? 'Saha işi tamamlandıysa hakedişi müşteriye onaya gönderin.'
                : 'İş tamamlama yalnızca devam eden talepler için kullanılabilir.'}
            </p>
          </div>
          <Button
            type="button"
            disabled={!canComplete || billingPending}
            onClick={onOpenBilling}
            className="bg-red-600 hover:bg-red-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Hakediş Oluştur
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  time,
  text,
}: {
  icon: React.ElementType;
  time: string;
  text: string;
}) {
  const date = new Date(time);
  const formattedDate = date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
          <Icon className="w-4 h-4 text-red-600" />
        </div>
        <div className="w-px flex-1 bg-slate-50 my-1" />
      </div>
      <div className="pb-4">
        <p className="text-sm text-slate-700">{text}</p>
        <p className="text-xs text-slate-500">{formattedDate}</p>
      </div>
    </div>
  );
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    Electric: 'Elektrik, güç ve kontrol sistemleri',
    Mechanic: 'Mekanik parçalar ve hareket sistemleri',
    Pneumatic: 'Pnomatik ve havalı sistemler',
    Hydraulic: 'Hidrolik sistemler ve pompalar',
    Software: 'Yazılım, HMI ve PLC kontrolü',
    General: 'Genel bakım ve diğer arızalar',
  };
  return descriptions[category] || category;
}
