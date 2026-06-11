import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TicketCategoryIcon, TicketPriorityBadge, TicketStatusBadge } from '@/components/domain/ticketBadges';
import { formatShortDate, ticketCategoryLabel } from '@/components/domain/ticketMeta';
import { useTicketMessageSubscriptions } from '@/hooks/useTicketMessageSubscriptions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useServiceStore,
} from '@/store/useServiceStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Ticket } from '@/store/useCustomerStore';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import {
  Search,
  Clock,
  MapPin,
  MessageSquare,
  Wrench,
  Package,
  Filter,
  TicketCheck,
} from 'lucide-react';

/**
 * ServiceTicketsPage Component
 *
 * Full ticket history for Service Provider Portal.
 * Shows all tickets the provider has interacted with or can see.
 */
export default function ServiceTicketsPage() {
  const {
    opportunities,
    myJobs,
    fetchOpportunities,
    fetchMyJobs,
    currentProviderId,
    providerProfile,
    resolveProviderSession,
    receiveTicketMessage,
    markTicketMessagesRead,
    isLoading,
    error,
  } = useServiceStore();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicketId = searchParams.get('ticketId') ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    void resolveProviderSession(user);
  }, [user, resolveProviderSession]);

  useEffect(() => {
    if (currentProviderId) {
      fetchOpportunities();
      fetchMyJobs();
    }
  }, [currentProviderId, fetchOpportunities, fetchMyJobs]);

  // Combine and deduplicate tickets
  const allTickets = [...opportunities, ...myJobs].reduce((acc, ticket) => {
    if (!acc.find((t) => t.id === ticket.id)) acc.push(ticket);
    return acc;
  }, [] as Ticket[]);

  useTicketMessageSubscriptions(allTickets, receiveTicketMessage);

  const liveSelectedTicket =
    (requestedTicketId ? allTickets.find((ticket) => ticket.id === requestedTicketId) : null) ??
    (selectedTicketId ? allTickets.find((ticket) => ticket.id === selectedTicketId) : null) ??
    null;
  const isDrawerOpen = isDetailOpen || Boolean(requestedTicketId && liveSelectedTicket);

  useEffect(() => {
    if (!isDrawerOpen || !liveSelectedTicket?.id || !liveSelectedTicket.unreadMessageCount) return;
    void markTicketMessagesRead(liveSelectedTicket.id);
  }, [isDrawerOpen, liveSelectedTicket?.id, liveSelectedTicket?.unreadMessageCount, markTicketMessagesRead]);

  // Filter
  const filteredTickets = allTickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort by date descending
  const sortedTickets = [...filteredTickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setIsDetailOpen(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('ticketId', ticket.id);
      return next;
    });
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTicketId('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('ticketId');
      return next;
    });
  };

  if (isLoading && !providerProfile) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="border-slate-200 bg-white">
          <CardContent className="flex items-center gap-3 p-6 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
            <span className="text-sm font-semibold">Servis profili yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <TicketCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-red-950">Servis profili yüklenemedi</h1>
                <p className="mt-2 text-sm leading-relaxed text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950">Servis profili hazırlanıyor</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Firma bilgileriniz backend üzerinden doğrulanınca talep listesi açılacak.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (providerProfile?.status === 'Pending Verification' || providerProfile?.status === 'Suspended') {
    const isSuspended = providerProfile.status === 'Suspended';
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className={isSuspended ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {isSuspended ? <TicketCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isSuspended ? 'text-red-950' : 'text-amber-950'}`}>
                  {isSuspended ? 'Başvuru reddedildi' : 'Operasyon onayı bekleniyor'}
                </h1>
                <p className={`mt-2 text-sm leading-relaxed ${isSuspended ? 'text-red-700' : 'text-amber-800'}`}>
                  {isSuspended
                    ? 'Servis hesabınız askıda olduğu için talep listesine erişemezsiniz.'
                    : `${providerProfile.name || user?.name || 'Servis hesabınız'} onaylandığında yeni talepler ve iş geçmişi burada görünecek.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tüm Talepler</h1>
        <p className="text-slate-500 mt-1">
          Etkileşimde bulunduğunuz tüm servis taleplerini görüntüleyin
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Talep ara (başlık, müşteri, ID)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="OPEN">Açık</SelectItem>
                <SelectItem value="OFFERED">Teklif Verildi</SelectItem>
                <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                <SelectItem value="CLOSED">Kapandı</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Wrench className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="Electric">Elektrik</SelectItem>
                <SelectItem value="Mechanic">Mekanik</SelectItem>
                <SelectItem value="Pneumatic">Pnömatik</SelectItem>
                <SelectItem value="Hydraulic">Hidrolik</SelectItem>
                <SelectItem value="Software">Yazılım</SelectItem>
                <SelectItem value="General">Genel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="text-sm text-slate-500">
        {sortedTickets.length} talep gösteriliyor
        {allTickets.length !== sortedTickets.length && ` (toplam ${allTickets.length})`}
      </div>

      {/* Ticket Table */}
      <Card>
        <CardContent className="p-0">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-16">
              <TicketCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700">Talep bulunamadı</p>
              <p className="text-sm text-slate-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {/* Category Icon */}
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TicketCategoryIcon category={ticket.category} className="w-5 h-5 text-red-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">
                        #{ticket.id.split('-')[1]}
                      </span>
                      <TicketStatusBadge status={ticket.status} className="text-[10px]" />
                      <TicketPriorityBadge priority={ticket.priority} className="text-[10px]" />
                      {(ticket.unreadMessageCount ?? 0) > 0 && (
                        <Badge className="gap-1 bg-red-600 text-[10px] text-white hover:bg-red-600">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.unreadMessageCount}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm truncate">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ticket.customerCompany}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {ticket.assetName}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatShortDate(ticket.createdAt)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {ticketCategoryLabel(ticket.category)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <TicketDetailDrawer
        ticket={liveSelectedTicket}
        isOpen={isDrawerOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
