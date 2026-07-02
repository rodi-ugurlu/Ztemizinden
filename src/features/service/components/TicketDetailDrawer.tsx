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
import { TicketCategoryIcon, TicketPriorityBadge, TicketStatusBadge } from '@/components/domain/ticketBadges';
import { TicketMessageThread } from '@/components/messages/TicketMessageThread';
import { useTicketMessageSubscriptions } from '@/hooks/useTicketMessageSubscriptions';
import { ticketCategoryDescription } from '@/components/domain/ticketMeta';
import {
  useServiceStore,
} from '@/store/useServiceStore';
import { getApiRootUrl } from '@/lib/backendUrl';
import type { Ticket, OfferType, TicketConversation, TicketOffer } from '@/store/useCustomerStore';
import FinalBillingDialog from './FinalBillingDialog';
import type { ServiceTicketView } from '../serviceTicketViews';
import {
  Archive,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Package,
  ImageIcon,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  Clock4,
  MessageSquare,
  DollarSign,
  FileCheck2,
  HandCoins,
  Inbox,
  Search,
  Send,
} from 'lucide-react';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  sourceView?: ServiceTicketView;
  initialTab?: TicketDetailDrawerTab;
  onClose: () => void;
}

const API_MEDIA_ORIGIN = getApiRootUrl();
const ticketDetailDrawerTabs: TicketDetailDrawerTab[] = [
  'details',
  'work-order',
  'asset',
  'messages',
  'proposal',
  'my-proposal',
];

/**
 * TicketDetailDrawer Component
 *
 * Slide-out drawer for viewing ticket details and submitting proposals.
 * Dark theme with amber accents for Service Provider Portal.
 */
export default function TicketDetailDrawer({
  ticket,
  isOpen,
  sourceView = 'all',
  initialTab = 'details',
  onClose,
}: TicketDetailDrawerProps) {
  const {
    submitProposal,
    getMyProposalForTicket,
    addConversationMessage,
    receiveTicketMessage,
    currentProviderId,
  } = useServiceStore();
  const liveTicket = useServiceStore((state) => (ticket ? state.getTicketById(ticket.id) : undefined));
  const [activeTab, setActiveTab] = useState(initialTab);
  const setDrawerTab = (value: string) => {
    if (ticketDetailDrawerTabs.includes(value as TicketDetailDrawerTab)) {
      setActiveTab(value as TicketDetailDrawerTab);
    }
  };

  // Proposal form state
  const [proposalType, setProposalType] = useState<OfferType>('DISCOVERY');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);

  const activeTicket = ticket ? (liveTicket ?? ticket) : null;
  const myProposal = activeTicket ? getMyProposalForTicket(activeTicket.id) : undefined;
  const myConversation = activeTicket ? findProviderConversation(activeTicket, currentProviderId, myProposal) : undefined;

  useTicketMessageSubscriptions(
    activeTicket && isOpen && activeTab === 'messages' ? [activeTicket] : [],
    receiveTicketMessage,
    activeTicket && isOpen && activeTab === 'messages'
      ? { ticketId: activeTicket.id, conversationId: myConversation?.id }
      : null
  );

  if (!activeTicket) return null;

  const mediaUrls = activeTicket.mediaUrls ?? [];
  const messages = myConversation?.messages ?? activeTicket.messages ?? [];
  const canMessage =
    !!myConversation &&
    myConversation.status !== 'CLOSED' &&
    activeTicket.status !== 'CLOSED' &&
    activeTicket.status !== 'CANCELLED';
  const ticketCode = (activeTicket.id.split('-')[1] ?? activeTicket.id).toUpperCase();
  const hasSubmitted = !!myProposal;

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setProposalError(null);

    try {
      await submitProposal(activeTicket.id, {
        type: proposalType,
        estimatedCost: proposalType === 'FIXED_PRICE' ? parseFloat(estimatedCost) || 0 : 0,
        eta: 'Bugün içinde',
        message,
      });
      setActiveTab('my-proposal');
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : 'Teklif gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = chatMessage.trim();
    if (!body || !canMessage || !myConversation) return;

    setIsMessageSending(true);
    setChatError(null);
    try {
      await addConversationMessage(activeTicket.id, myConversation.id, body);
      setChatMessage('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Mesaj gönderilemedi');
    } finally {
      setIsMessageSending(false);
    }
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-slate-200 bg-white text-slate-900 sm:max-w-2xl"
      >
        <SheetHeader className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-500">
                  #{ticketCode}
                </span>
                <TicketPriorityBadge priority={activeTicket.priority} className="text-xs" />
              </div>
              <SheetTitle className="line-clamp-2 text-xl font-bold text-slate-900">
                {activeTicket.title}
              </SheetTitle>
            </div>
            <TicketStatusBadge status={activeTicket.status} className="shrink-0" />
          </div>
          <SheetDescription className="text-slate-400">
            {activeTicket.description}
          </SheetDescription>
          <ServiceDrawerContextPanel
            ticket={activeTicket}
            sourceView={sourceView}
            myProposal={myProposal}
            canMessage={canMessage}
            onSelectTab={setActiveTab}
            onOpenBilling={() => setIsBillingDialogOpen(true)}
          />
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setDrawerTab} className="mt-6">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="grid min-w-[560px] grid-cols-5 bg-slate-50 sm:min-w-0">
              <TabsTrigger
                value="details"
                className="text-[12px] text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 sm:text-sm"
              >
                Detaylar
              </TabsTrigger>
              <TabsTrigger
                value="work-order"
                className="text-[12px] text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 sm:text-sm"
              >
                İş Emri
              </TabsTrigger>
              <TabsTrigger
                value="asset"
                className="text-[12px] text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 sm:text-sm"
              >
                Varlık
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="text-[12px] text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 sm:text-sm"
              >
                Mesajlar
              </TabsTrigger>
              <TabsTrigger
                value={hasSubmitted ? 'my-proposal' : 'proposal'}
                className="text-[12px] text-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 sm:text-sm"
              >
                {hasSubmitted ? 'Teklifim' : 'Teklif Ver'}
              </TabsTrigger>
            </TabsList>
          </div>

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
                Fabrika/İşletme Bilgileri
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
                <TicketCategoryIcon category={activeTicket.category} className="w-4 h-4" />
                Arıza Kategorisi
              </h3>
              <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <TicketCategoryIcon category={activeTicket.category} className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{activeTicket.category}</p>
                    <p className="text-sm text-slate-500">
                      {ticketCategoryDescription(activeTicket.category)}
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
            {mediaUrls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Ekler
                </h3>
                <MediaPreviewGrid mediaUrls={mediaUrls} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-6">
            {myConversation && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{myConversation.providerName}</p>
                    <p className="text-xs font-medium text-slate-500">{conversationStatusLabel(myConversation)}</p>
                  </div>
                  {(myConversation.unreadMessageCount ?? 0) > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {myConversation.unreadMessageCount} yeni
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <TicketMessageThread
              messages={messages}
              viewerRole="service"
              maxHeightClassName="min-h-[260px] max-h-[calc(100vh-430px)]"
              emptyState={
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                  {myConversation ? 'Henüz mesaj yok.' : 'Fabrika/İşletme görüşmeye davet ettiğinde mesajlaşma açılır.'}
                </div>
              }
            />

            <form onSubmit={handleSendMessage} className="space-y-3 border-t border-slate-200 pt-4">
              <Textarea
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                rows={4}
                disabled={!canMessage || isMessageSending}
                placeholder={
                  canMessage
                    ? 'Fabrika/İşletmeye mesaj yaz...'
                    : myConversation?.status === 'CLOSED'
                      ? 'Görüşme kapalı'
                      : 'Fabrika/İşletme görüşmeye davet ettiğinde açılır'
                }
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
                          : myProposal.status === 'INVITED'
                          ? 'bg-sky-50 text-sky-600 border-sky-200/30'
                          : myProposal.status === 'REJECTED'
                          ? 'bg-red-50 text-red-600 border-red-200/30'
                          : 'bg-amber-50 text-amber-600 border-amber-200/30'
                      }
                    >
                      {myProposal.status === 'PENDING' && 'Beklemede'}
                      {myProposal.status === 'INVITED' && 'Görüşmeye Davet Edildi'}
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
                      Fabrika/İşletme teklifinizi kabul etti. İşe başlayabilirsiniz.
                    </p>
                  </div>
                )}

                {myProposal.status === 'INVITED' && (
                  <div className="bg-sky-50 border border-sky-200/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sky-700 mb-2">
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium">Fabrika/İşletme görüşmeye davet etti</span>
                    </div>
                    <p className="text-sm text-sky-700/70">
                      Mesajlar sekmesinden fabrika/işletme ile özel görüşmeye devam edebilirsiniz.
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
                      Fabrika/İşletme farklı bir servis sağlayıcı seçti.
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
                    Fabrika/İşletmeye iletilecek detaylı açıklama
                  </p>
                </div>

                {/* Submit Button */}
                {proposalError && <p className="text-sm font-medium text-red-600">{proposalError}</p>}
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

export type TicketDetailDrawerTab = 'details' | 'work-order' | 'asset' | 'messages' | 'proposal' | 'my-proposal';
type DrawerContextAction = {
  label: string;
  tab?: TicketDetailDrawerTab;
  run?: 'billing';
};
type DrawerContextConfig = {
  title: string;
  description: string;
  icon: typeof Inbox;
  className: string;
  iconClassName: string;
  primaryButtonClassName: string;
  primaryAction: DrawerContextAction;
  secondaryAction: DrawerContextAction;
  metrics: Array<{ label: string; value: string }>;
};

function ServiceDrawerContextPanel({
  ticket,
  sourceView,
  myProposal,
  canMessage,
  onSelectTab,
  onOpenBilling,
}: {
  ticket: Ticket;
  sourceView: ServiceTicketView;
  myProposal?: TicketOffer;
  canMessage: boolean;
  onSelectTab: (tab: TicketDetailDrawerTab) => void;
  onOpenBilling: () => void;
}) {
  const context = drawerContext(ticket, sourceView, myProposal, canMessage);
  const Icon = context.icon;
  const runAction = (action: DrawerContextAction) => {
    if (action.run === 'billing') {
      onOpenBilling();
      return;
    }
    if (action.tab) {
      onSelectTab(action.tab);
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${context.className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${context.iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">{context.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{context.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {context.metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/60 bg-white/70 px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-slate-400">{metric.label}</p>
            <p className="mt-1 truncate text-sm font-black text-slate-800">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={() => runAction(context.primaryAction)}
          className={`flex-1 font-semibold ${context.primaryButtonClassName}`}
        >
          {context.primaryAction.label}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => runAction(context.secondaryAction)}
          className="flex-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          {context.secondaryAction.label}
        </Button>
      </div>
    </div>
  );
}

function drawerContext(
  ticket: Ticket,
  sourceView: ServiceTicketView,
  myProposal: TicketOffer | undefined,
  canMessage: boolean
): DrawerContextConfig {
  const finalAmount = formatMoney(ticket.finalActualCost ?? ticket.finalEstimatedCost ?? myProposal?.estimatedCost);
  const offerAmount = formatMoney(myProposal?.estimatedCost);
  const messageAction: DrawerContextAction = canMessage
    ? { label: 'Mesaj Yaz', tab: 'messages' }
    : { label: 'Mesajları Gör', tab: 'messages' };

  if (sourceView === 'new') {
    return {
      title: 'Yeni talep fırsatı',
      description: 'Teklif vermeden önce ekleri, varlığı ve fabrika/işletme konumunu hızlıca kontrol edin.',
      icon: Inbox,
      className: 'border-emerald-200 bg-emerald-50',
      iconClassName: 'bg-white text-emerald-700',
      primaryButtonClassName: 'bg-emerald-700 text-white hover:bg-emerald-800',
      primaryAction: { label: 'Teklif Ver', tab: 'proposal' },
      secondaryAction: { label: 'Detayları İncele', tab: 'details' },
      metrics: [
        { label: 'Kategori', value: ticket.category },
        { label: 'Öncelik', value: ticket.priority },
      ],
    };
  }

  if (sourceView === 'proposals') {
    const invited = myProposal?.status === 'INVITED';
    return {
      title: invited ? 'Fabrika/İşletme görüşmeye davet etti' : 'Teklifiniz fabrika/işletme onayında',
      description: invited
        ? 'Fabrika/İşletme ile özel görüşme açık. Mesajlar sekmesinden birebir yazışabilirsiniz.'
        : 'Teklif içeriğini, tutarı ve son fabrika/işletme mesajlarını aynı yerden takip edin.',
      icon: Send,
      className: 'border-blue-200 bg-blue-50',
      iconClassName: 'bg-white text-blue-700',
      primaryButtonClassName: 'bg-blue-700 text-white hover:bg-blue-800',
      primaryAction: invited && canMessage ? { label: 'Mesaj Yaz', tab: 'messages' } : { label: 'Teklifimi Aç', tab: 'my-proposal' },
      secondaryAction: invited ? { label: 'Teklifimi Aç', tab: 'my-proposal' } : { label: 'Detayları İncele', tab: 'details' },
      metrics: [
        { label: 'Teklif', value: offerAmount },
        { label: 'Durum', value: proposalStatusLabel(myProposal?.status) },
      ],
    };
  }

  if (sourceView === 'accepted') {
    return {
      title: 'Kabul edilen aktif iş',
      description: 'Fabrika/İşletme teklifi kabul etti. Saha sürecini yönetin, fabrika/işletme ile yazışın veya hakedişi başlatın.',
      icon: FileCheck2,
      className: 'border-rose-200 bg-rose-50',
      iconClassName: 'bg-white text-rose-700',
      primaryButtonClassName: 'bg-rose-700 text-white hover:bg-rose-800',
      primaryAction: { label: 'Hakediş Oluştur', run: 'billing' },
      secondaryAction: messageAction,
      metrics: [
        { label: 'ETA', value: ticket.serviceEta || myProposal?.eta || 'Belirsiz' },
        { label: 'Varlık', value: ticket.assetName || 'Varlık yok' },
      ],
    };
  }

  if (sourceView === 'open-billing') {
    return {
      title: 'Hakediş süreci açık',
      description: 'Fabrika/İşletme onayı, itiraz veya ödeme süreci devam eden işi takip edin.',
      icon: HandCoins,
      className: 'border-amber-200 bg-amber-50',
      iconClassName: 'bg-white text-amber-700',
      primaryButtonClassName: 'bg-amber-600 text-white hover:bg-amber-700',
      primaryAction: { label: 'İş Emrini Aç', tab: 'work-order' },
      secondaryAction: messageAction,
      metrics: [
        { label: 'Hakediş', value: finalAmount },
        { label: 'Durum', value: billingStatusLabel(ticket.billingStatus) },
      ],
    };
  }

  if (sourceView === 'closed-billing') {
    return {
      title: 'Kapanmış iş arşivi',
      description: 'Onaylanmış hakediş, kapanış tarihi ve servis geçmişi arşivde tutulur.',
      icon: Archive,
      className: 'border-teal-200 bg-teal-50',
      iconClassName: 'bg-white text-teal-700',
      primaryButtonClassName: 'bg-teal-700 text-white hover:bg-teal-800',
      primaryAction: { label: 'İş Emrini Aç', tab: 'work-order' },
      secondaryAction: { label: myProposal ? 'Teklifimi Aç' : 'Detaylar', tab: myProposal ? 'my-proposal' : 'details' },
      metrics: [
        { label: 'Final', value: finalAmount },
        { label: 'Kapanış', value: formatDrawerDate(ticket.updatedAt || ticket.createdAt) },
      ],
    };
  }

  return {
    title: 'Talep özeti',
    description: 'Talep detayları, iş emri, varlık, mesajlar ve teklif bilgileri bu panelde.',
    icon: BriefcaseBusiness,
    className: 'border-slate-200 bg-slate-50',
    iconClassName: 'bg-white text-slate-700',
    primaryButtonClassName: 'bg-slate-900 text-white hover:bg-slate-800',
    primaryAction: { label: 'Detayları Aç', tab: 'details' },
    secondaryAction: messageAction,
    metrics: [
      { label: 'Fabrika/İşletme', value: ticket.customerCompany },
      { label: 'Durum', value: ticket.status },
    ],
  };
}

function formatMoney(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Tutar yok';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDrawerDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function proposalStatusLabel(status?: string) {
  if (status === 'ACCEPTED') return 'Kabul edildi';
  if (status === 'INVITED') return 'Görüşmede';
  if (status === 'REJECTED') return 'Reddedildi';
  if (status === 'WITHDRAWN') return 'Geri çekildi';
  return 'Beklemede';
}

function findProviderConversation(
  ticket: Ticket,
  providerId: string,
  myProposal?: TicketOffer
): TicketConversation | null {
  return (ticket.conversations ?? []).find((conversation) =>
    (providerId && conversation.providerId === providerId) ||
    (myProposal?.id && conversation.offerId === myProposal.id)
  ) ?? null;
}

function conversationStatusLabel(conversation: TicketConversation) {
  if (conversation.status === 'ACCEPTED') return 'Kabul edildi';
  if (conversation.status === 'CLOSED') {
    return conversation.closedReason === 'NOT_SELECTED' ? 'Seçilmedi' : 'Kapatıldı';
  }
  return 'Aktif görüşme';
}

function billingStatusLabel(status?: string) {
  if (status === 'DISPUTED') return 'Fabrika/İşletme itirazı var';
  if (status === 'APPROVED') return 'Fabrika/İşletme onayladı';
  return 'Fabrika/İşletme onayı bekliyor';
}

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
          <InfoCell label="Fabrika/İşletme" value={ticket.customerCompany} />
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
                ? 'Hakediş fabrika/işletme onayını bekliyor.'
                : canComplete
                ? 'Saha işi tamamlandıysa hakedişi fabrika/işletme onayına gönderin.'
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
