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
  type ServiceTicket,
  type ProposalType,
} from '@/store/useServiceStore';
import {
  Building2,
  MapPin,
  Tag,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Package,
  ImageIcon,
  Video,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Clock4,
  MessageSquare,
  DollarSign,
  Search,
  FileText,
} from 'lucide-react';

interface TicketDetailDrawerProps {
  ticket: ServiceTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

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
  const { submitProposal, currentProviderName, getMyProposalForTicket } = useServiceStore();
  const [activeTab, setActiveTab] = useState('details');

  // Proposal form state
  const [proposalType, setProposalType] = useState<ProposalType>('Discovery');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

  const myProposal = getMyProposalForTicket(ticket.id);
  const hasSubmitted = !!myProposal;

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    submitProposal(ticket.id, {
      type: proposalType,
      estimatedCost: proposalType === 'Fixed Price' ? parseFloat(estimatedCost) || 0 : 0,
      message,
    });

    setIsSubmitting(false);
    setActiveTab('my-proposal');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electric':
        return Zap;
      case 'Mechanic':
        return Settings;
      case 'Pneumatic':
        return Droplets;
      case 'Hydraulic':
        return Droplets;
      default:
        return Wrench;
    }
  };

  const CategoryIcon = getCategoryIcon(ticket.category);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-neutral-700 text-neutral-300 border-neutral-600';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-neutral-900 border-neutral-800 text-neutral-100 overflow-y-auto"
      >
        <SheetHeader className="space-y-4 pb-6 border-b border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-neutral-500">
                  #{ticket.id.split('-')[1].toUpperCase()}
                </span>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(ticket.priority)} text-xs`}
                >
                  {ticket.priority}
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold text-white">
                {ticket.title}
              </SheetTitle>
            </div>
            <Badge
              variant="secondary"
              className="bg-neutral-800 text-neutral-300"
            >
              {ticket.status}
            </Badge>
          </div>
          <SheetDescription className="text-neutral-400">
            {ticket.description}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-800">
            <TabsTrigger
              value="details"
              className="text-neutral-400 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
            >
              Detaylar
            </TabsTrigger>
            <TabsTrigger
              value="asset"
              className="text-neutral-400 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
            >
              Varlık
            </TabsTrigger>
            <TabsTrigger
              value={hasSubmitted ? 'my-proposal' : 'proposal'}
              className="text-neutral-400 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
            >
              {hasSubmitted ? 'Teklifim' : 'Teklif Ver'}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Müşteri Bilgileri
              </h3>
              <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-neutral-400">
                      {ticket.customerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{ticket.customerName}</p>
                    <p className="text-sm text-neutral-400">{ticket.customerCompany}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <MapPin className="w-4 h-4" />
                  {ticket.customerLocation}
                </div>
              </div>
            </div>

            {/* Issue Category */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <CategoryIcon className="w-4 h-4" />
                Arıza Kategorisi
              </h3>
              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-700 rounded-lg flex items-center justify-center">
                    <CategoryIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{ticket.category}</p>
                    <p className="text-sm text-neutral-500">
                      {getCategoryDescription(ticket.category)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Zaman Çizelgesi
              </h3>
              <div className="space-y-3">
                <TimelineItem
                  icon={Clock4}
                  time={ticket.createdAt}
                  text="Arıza kaydı oluşturuldu"
                />
                {ticket.proposals.length > 0 && (
                  <TimelineItem
                    icon={MessageSquare}
                    time={ticket.proposals[0].createdAt}
                    text={`${ticket.proposals[0].serviceProviderName} teklif verdi`}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Asset Tab */}
          <TabsContent value="asset" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4" />
                Varlık Bilgileri
              </h3>
              <div className="bg-neutral-800/50 rounded-lg p-4 space-y-4 border border-neutral-800">
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                    Varlık Adı
                  </p>
                  <p className="font-medium text-white text-lg">{ticket.assetName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                      Tag No
                    </p>
                    <p className="font-mono text-neutral-300">{ticket.assetTagNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                      Marka / Model
                    </p>
                    <p className="text-neutral-300">
                      {ticket.assetBrand} / {ticket.assetModel}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                    Seri No
                  </p>
                  <p className="font-mono text-sm text-neutral-400">{ticket.assetSerialNumber}</p>
                </div>
              </div>
            </div>

            {/* Media */}
            {ticket.mediaUrls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Ekler
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {ticket.mediaUrls.map((url, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700"
                    >
                      {url.endsWith('.mp4') ? (
                        <Video className="w-8 h-8 text-neutral-600" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-neutral-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Proposal / My Proposal Tab */}
          <TabsContent
            value={hasSubmitted ? 'my-proposal' : 'proposal'}
            className="space-y-6 mt-6"
          >
            {hasSubmitted && myProposal ? (
              <div className="space-y-6">
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Teklif Detayları</h3>
                    <Badge
                      variant="outline"
                      className={
                        myProposal.status === 'Accepted'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : myProposal.status === 'Rejected'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }
                    >
                      {myProposal.status === 'Pending' && 'Beklemede'}
                      {myProposal.status === 'Accepted' && 'Kabul Edildi'}
                      {myProposal.status === 'Rejected' && 'Reddedildi'}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        {myProposal.type === 'Discovery' ? (
                          <Search className="w-5 h-5 text-amber-500" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Teklif Tipi</p>
                        <p className="font-medium text-white">
                          {myProposal.type === 'Discovery' ? 'Keşif' : 'Net Fiyat'}
                        </p>
                      </div>
                    </div>

                    {myProposal.estimatedCost > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Tahmini Maliyet</p>
                          <p className="font-medium text-white text-lg">
                            {myProposal.estimatedCost.toLocaleString('tr-TR')} TL
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                      <p className="text-sm text-neutral-500 mb-2">Mesajınız</p>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        {myProposal.message}
                      </p>
                    </div>
                  </div>
                </div>

                {myProposal.status === 'Accepted' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Teklif Kabul Edildi!</span>
                    </div>
                    <p className="text-sm text-emerald-300/80">
                      Müşteri teklifinizi kabul etti. İşe başlayabilirsiniz.
                    </p>
                  </div>
                )}

                {myProposal.status === 'Rejected' && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-rose-400 mb-2">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Teklif Reddedildi</span>
                    </div>
                    <p className="text-sm text-rose-300/80">
                      Müşteri farklı bir servis sağlayıcı seçti.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-6">
                {/* Proposal Type Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-amber-500 uppercase tracking-wider">
                    Teklif Tipi
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProposalType('Discovery')}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        proposalType === 'Discovery'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Search
                          className={`w-5 h-5 ${
                            proposalType === 'Discovery'
                              ? 'text-amber-500'
                              : 'text-neutral-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            proposalType === 'Discovery'
                              ? 'text-white'
                              : 'text-neutral-400'
                          }`}
                        >
                          Keşif
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Yerinde inceleme sonrası net fiyat
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProposalType('Fixed Price')}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        proposalType === 'Fixed Price'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign
                          className={`w-5 h-5 ${
                            proposalType === 'Fixed Price'
                              ? 'text-amber-500'
                              : 'text-neutral-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            proposalType === 'Fixed Price'
                              ? 'text-white'
                              : 'text-neutral-400'
                          }`}
                        >
                          Net Fiyat
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Sabit fiyat garantisi
                      </p>
                    </button>
                  </div>
                </div>

                {/* Estimated Cost (only for Fixed Price) */}
                {proposalType === 'Fixed Price' && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="estimatedCost"
                      className="text-sm font-semibold text-amber-500 uppercase tracking-wider"
                    >
                      Tahmini Maliyet (TL)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="estimatedCost"
                        type="number"
                        placeholder="0.00"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                        className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                        required={proposalType === 'Fixed Price'}
                      />
                    </div>
                    <p className="text-xs text-neutral-500">
                      İşçilik ve malzeme dahil toplam tahmini maliyet
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-sm font-semibold text-amber-500 uppercase tracking-wider"
                  >
                    Teklif Mesajı
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Teklifinizi açıklayın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="bg-neutral-800 border-neutral-700 text-white resize-none"
                  />
                  <p className="text-xs text-neutral-500">
                    Müşteriye iletilecek detaylı açıklama
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4 border-t border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold"
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
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

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
        <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
          <Icon className="w-4 h-4 text-amber-500" />
        </div>
        <div className="w-px flex-1 bg-neutral-800 my-1" />
      </div>
      <div className="pb-4">
        <p className="text-sm text-neutral-300">{text}</p>
        <p className="text-xs text-neutral-500">{formattedDate}</p>
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
