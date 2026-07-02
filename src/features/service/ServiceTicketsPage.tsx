import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TicketCategoryIcon, TicketPriorityBadge, TicketStatusBadge } from '@/components/domain/ticketBadges';
import { formatShortDate, formatShortDateTime, ticketCategoryLabel } from '@/components/domain/ticketMeta';
import { subscribeToProviderTicketEvents } from '@/lib/realtime';
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
import type { TicketDetailDrawerTab } from './components/TicketDetailDrawer';
import {
  hasProviderOffer,
  matchesServiceTicketView,
  serviceTicketSortTimestamp,
  serviceTicketViewOrder,
  serviceTicketViewFromParam,
  serviceTicketViewMeta,
  type ServiceTicketView,
} from './serviceTicketViews';
import {
  Archive,
  ArrowRight,
  Search,
  Clock,
  CircleDollarSign,
  FileCheck2,
  Inbox,
  MapPin,
  MessageSquare,
  Wrench,
  Package,
  Filter,
  Send,
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
    receiveTicketUpdate,
    markTicketMessagesRead,
    markConversationMessagesRead,
    isLoading,
    error,
  } = useServiceStore();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicketId = searchParams.get('ticketId') ?? '';
  const requestedDrawerTab = normalizeDrawerTab(searchParams.get('tab'));
  const isMessageFocus = searchParams.get('focus') === 'messages';
  const activeView = serviceTicketViewFromParam(searchParams.get('view'));
  const activeViewMeta = isMessageFocus ? messageFocusMeta : serviceTicketViewMeta[activeView];
  const searchQuery = searchParams.get('q') ?? '';
  const filterStatus = normalizeStatusFilter(searchParams.get('status'));
  const filterCategory = normalizeCategoryFilter(searchParams.get('category'));
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
  const opportunityIds = new Set(opportunities.map((ticket) => ticket.id));
  const baseViewTickets = allTickets.filter((ticket) =>
    matchesServiceTicketView(ticket, activeView, currentProviderId, opportunityIds)
  );
  const viewTickets = isMessageFocus ? baseViewTickets.filter(hasMessageActivity) : baseViewTickets;
  const viewCounts = Object.fromEntries(
    serviceTicketViewOrder.map((view) => [
      view,
      allTickets.filter((ticket) => matchesServiceTicketView(ticket, view, currentProviderId, opportunityIds)).length,
    ])
  ) as Record<ServiceTicketView, number>;

  useEffect(() => {
    if (!currentProviderId) return;
    return subscribeToProviderTicketEvents(currentProviderId, (event) => {
      receiveTicketUpdate(event.ticket);
    });
  }, [currentProviderId, receiveTicketUpdate]);

  const liveSelectedTicket =
    (requestedTicketId ? allTickets.find((ticket) => ticket.id === requestedTicketId) : null) ??
    (selectedTicketId ? allTickets.find((ticket) => ticket.id === selectedTicketId) : null) ??
    null;
  const isDrawerOpen = isDetailOpen || Boolean(requestedTicketId && liveSelectedTicket);

  useEffect(() => {
    if (!isDrawerOpen || !liveSelectedTicket?.id || !liveSelectedTicket.unreadMessageCount) return;
    const conversation = (liveSelectedTicket.conversations ?? []).find((item) => item.providerId === currentProviderId);
    if (conversation?.id && conversation.unreadMessageCount) {
      void markConversationMessagesRead(liveSelectedTicket.id, conversation.id);
      return;
    }
    void markTicketMessagesRead(liveSelectedTicket.id);
  }, [
    currentProviderId,
    isDrawerOpen,
    liveSelectedTicket,
    markConversationMessagesRead,
    markTicketMessagesRead,
  ]);

  // Filter
  const filteredTickets = viewTickets.filter((ticket) => {
    const searchableText = [
      ticket.title,
      ticket.customerName,
      ticket.customerCompany,
      ticket.customerLocation,
      ticket.assetName,
      ticket.assetTagNo,
      ticket.id,
      ticket.category,
      ticket.priority,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch =
      !searchQuery.trim() || searchableText.includes(searchQuery.trim().toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const timestampA = isMessageFocus ? messageActivityTimestamp(a) : serviceTicketSortTimestamp(a, activeView);
    const timestampB = isMessageFocus ? messageActivityTimestamp(b) : serviceTicketSortTimestamp(b, activeView);
    return timestampB - timestampA;
  });

  const handleShowAllTickets = () => {
    updateActiveView('all');
  };

  const clearMessageFocus = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('focus');
      next.delete('tab');
      next.delete('ticketId');
      return next;
    });
  };

  const updateActiveView = (view: ServiceTicketView) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('ticketId');
      next.delete('tab');
      next.delete('q');
      next.delete('status');
      next.delete('category');
      next.delete('focus');
      if (view === 'all') {
        next.delete('view');
      } else {
        next.set('view', view);
      }
      return next;
    });
  };

  const updateListFilter = (key: 'q' | 'status' | 'category', value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setIsDetailOpen(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('ticketId', ticket.id);
      if (isMessageFocus) {
        next.set('tab', 'messages');
      }
      return next;
    });
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTicketId('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('ticketId');
      next.delete('tab');
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
    <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Servis Operasyonu</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
              {activeViewMeta.title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
              {activeViewMeta.description}
            </p>
            {isMessageFocus && (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Mesaj odağı açık: liste son müşteri yazışmasına göre sıralanıyor</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <HeaderStat label={isMessageFocus ? 'Mesajlı' : 'Bu görünüm'} value={viewTickets.length} />
            <HeaderStat label="Filtreli" value={sortedTickets.length} />
            <HeaderStat label="Toplam" value={allTickets.length} />
          </div>
        </div>

        <ServiceTicketViewTabs
          activeView={activeView}
          counts={viewCounts}
          onViewChange={updateActiveView}
        />

        {isMessageFocus && <MessageFocusNotice count={viewTickets.length} onClear={clearMessageFocus} />}
      </section>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Talep ara (başlık, müşteri, ID)..."
                value={searchQuery}
                onChange={(e) => updateListFilter('q', e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={(value) => updateListFilter('status', value)}>
              <SelectTrigger className="w-full lg:w-[180px]">
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

            <Select value={filterCategory} onValueChange={(value) => updateListFilter('category', value)}>
              <SelectTrigger className="w-full lg:w-[180px]">
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

      <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {sortedTickets.length} talep gösteriliyor
          {viewTickets.length !== sortedTickets.length && ` (${activeViewMeta.title.toLowerCase()} içinde ${viewTickets.length})`}
        </span>
        {(activeView !== 'all' || isMessageFocus) && (
          <button
            type="button"
            onClick={handleShowAllTickets}
            className="inline-flex items-center gap-1 font-semibold text-slate-600 transition-colors hover:text-slate-950"
          >
            Tüm Taleplere Dön
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Ticket Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-16">
              <TicketCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700">{activeViewMeta.emptyTitle}</p>
              <p className="text-sm text-slate-400 mt-1">{activeViewMeta.emptyDescription}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedTickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  activeView={activeView}
                  isMessageFocus={isMessageFocus}
                  providerId={currentProviderId}
                  onClick={() => handleTicketClick(ticket)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <TicketDetailDrawer
        key={`${liveSelectedTicket?.id ?? 'empty'}-${requestedDrawerTab ?? activeView}`}
        ticket={liveSelectedTicket}
        isOpen={isDrawerOpen}
        sourceView={activeView}
        initialTab={requestedDrawerTab ?? undefined}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black leading-none text-slate-950">{value}</p>
    </div>
  );
}

function ServiceTicketViewTabs({
  activeView,
  counts,
  onViewChange,
}: {
  activeView: ServiceTicketView;
  counts: Record<ServiceTicketView, number>;
  onViewChange: (view: ServiceTicketView) => void;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {serviceTicketViewOrder.map((view) => {
        const tab = serviceTicketTabs[view];
        const Icon = tab.icon;
        const isActive = activeView === view;

        return (
          <button
            key={view}
            type="button"
            onClick={() => onViewChange(view)}
            className={`flex min-h-[68px] items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
              isActive
                ? `${tab.activeClassName} shadow-sm`
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? tab.iconActiveClassName : 'bg-slate-100 text-slate-500'}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-black leading-tight sm:text-sm">{tab.label}</span>
              <span className="mt-1 block text-xs font-semibold opacity-75">{counts[view]} kayıt</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TicketRow({
  ticket,
  activeView,
  isMessageFocus = false,
  providerId,
  onClick,
}: {
  ticket: Ticket;
  activeView: ServiceTicketView;
  isMessageFocus?: boolean;
  providerId: string;
  onClick: () => void;
}) {
  const context = isMessageFocus ? ticketMessageContext(ticket) : ticketRowContext(ticket, activeView, providerId);

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-1 gap-4 p-4 text-left transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50">
          <TicketCategoryIcon category={ticket.category} className="h-5 w-5 text-red-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">#{shortTicketId(ticket.id)}</span>
            <TicketStatusBadge status={ticket.status} className="text-[10px]" />
            <TicketPriorityBadge priority={ticket.priority} className="text-[10px]" />
            {(ticket.unreadMessageCount ?? 0) > 0 && (
              <Badge className="gap-1 bg-red-600 text-[10px] text-white hover:bg-red-600">
                <MessageSquare className="h-3 w-3" />
                {ticket.unreadMessageCount}
              </Badge>
            )}
          </div>

          <h3 className="mt-2 line-clamp-2 text-sm font-black text-slate-950">{ticket.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{ticket.customerCompany}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <Package className="h-3 w-3 shrink-0" />
              <span className="truncate">{ticket.assetName || 'Varlık belirtilmedi'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatShortDateTime(context.date)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 lg:bg-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">{context.primary}</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{context.secondary}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black ${context.actionClassName}`}>
          {context.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function MessageFocusNotice({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black">Mesaj merkezi görünümü</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800">
            {count} işte müşteri yazışması var. Bir satıra tıklayınca detay doğrudan Mesajlar sekmesinde açılır.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition-colors hover:bg-emerald-100"
      >
        Odağı Kapat
      </button>
    </div>
  );
}

const serviceTicketTabs = {
  new: {
    label: 'Yeni',
    icon: Inbox,
    activeClassName: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    iconActiveClassName: 'bg-white text-emerald-700',
  },
  proposals: {
    label: 'Tekliflerim',
    icon: Send,
    activeClassName: 'border-blue-500 bg-blue-50 text-blue-900',
    iconActiveClassName: 'bg-white text-blue-700',
  },
  accepted: {
    label: 'Kabul Edilen',
    icon: FileCheck2,
    activeClassName: 'border-rose-500 bg-rose-50 text-rose-900',
    iconActiveClassName: 'bg-white text-rose-700',
  },
  'open-billing': {
    label: 'Açık Hakediş',
    icon: CircleDollarSign,
    activeClassName: 'border-amber-500 bg-amber-50 text-amber-950',
    iconActiveClassName: 'bg-white text-amber-700',
  },
  'closed-billing': {
    label: 'Arşiv',
    icon: Archive,
    activeClassName: 'border-teal-500 bg-teal-50 text-teal-900',
    iconActiveClassName: 'bg-white text-teal-700',
  },
  all: {
    label: 'Tümü',
    icon: TicketCheck,
    activeClassName: 'border-slate-500 bg-slate-100 text-slate-950',
    iconActiveClassName: 'bg-white text-slate-700',
  },
} satisfies Record<ServiceTicketView, {
  label: string;
  icon: typeof Inbox;
  activeClassName: string;
  iconActiveClassName: string;
}>;

function ticketRowContext(ticket: Ticket, activeView: ServiceTicketView, providerId: string) {
  const offer = ticket.offers.find((item) => item.providerId === providerId);
  const activeOffer = ticket.offers.find((item) =>
    item.providerId === providerId && (item.status === 'PENDING' || item.status === 'INVITED')
  );
  const acceptedByThisProvider = hasProviderOffer(ticket, providerId, 'ACCEPTED');

  if (activeView === 'new') {
    return {
      primary: ticketCategoryLabel(ticket.category),
      secondary: `${ticket.customerLocation || 'Konum yok'} · ${formatShortDate(ticket.createdAt)}`,
      actionLabel: 'Teklif Ver',
      actionClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      date: ticket.createdAt,
    };
  }

  if (activeView === 'proposals') {
    const isInvited = activeOffer?.status === 'INVITED';
    return {
      primary: formatCurrency(activeOffer?.estimatedCost ?? offer?.estimatedCost),
      secondary: `${activeOffer?.eta || offer?.eta || 'ETA yok'} · ${formatShortDate(activeOffer?.createdAt ?? offer?.createdAt ?? ticket.updatedAt)}`,
      actionLabel: isInvited ? 'Mesaj Yaz' : 'Teklifi Aç',
      actionClassName: isInvited ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-blue-200 bg-blue-50 text-blue-800',
      date: activeOffer?.updatedAt ?? offer?.updatedAt ?? ticket.updatedAt,
    };
  }

  if (activeView === 'accepted') {
    return {
      primary: acceptedByThisProvider ? 'Sahada aktif iş' : 'Aktif iş',
      secondary: `${ticket.serviceEta || 'ETA yok'} · Hakediş bekliyor`,
      actionLabel: 'İşi Yönet',
      actionClassName: 'border-rose-200 bg-rose-50 text-rose-800',
      date: ticket.updatedAt || ticket.createdAt,
    };
  }

  if (activeView === 'open-billing') {
    return {
      primary: formatCurrency(ticket.finalActualCost ?? ticket.finalEstimatedCost),
      secondary: billingStatusLabel(ticket.billingStatus),
      actionLabel: 'Hakedişi Aç',
      actionClassName: 'border-amber-200 bg-amber-50 text-amber-800',
      date: ticket.updatedAt || ticket.createdAt,
    };
  }

  if (activeView === 'closed-billing') {
    return {
      primary: formatCurrency(ticket.finalActualCost ?? ticket.finalEstimatedCost),
      secondary: `Kapandı · ${formatShortDate(ticket.updatedAt || ticket.createdAt)}`,
      actionLabel: 'Arşiv Detayı',
      actionClassName: 'border-teal-200 bg-teal-50 text-teal-800',
      date: ticket.updatedAt || ticket.createdAt,
    };
  }

  return {
    primary: ticketCategoryLabel(ticket.category),
    secondary: `${ticket.customerLocation || 'Konum yok'} · ${formatShortDate(ticket.updatedAt || ticket.createdAt)}`,
    actionLabel: 'Detay',
    actionClassName: 'border-slate-200 bg-white text-slate-700',
    date: ticket.updatedAt || ticket.createdAt,
  };
}

function ticketMessageContext(ticket: Ticket) {
  const message = latestTicketMessage(ticket);
  const date = message?.createdAt ?? ticket.updatedAt ?? ticket.createdAt;
  const unreadCount = ticket.unreadMessageCount ?? 0;

  return {
    primary: message ? `${messageSenderLabel(message.senderRole)} · ${formatShortDateTime(message.createdAt)}` : 'Mesaj geçmişi',
    secondary: message?.body ?? 'Okunmamış mesaj var',
    actionLabel: 'Mesajı Aç',
    actionClassName:
      unreadCount > 0
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-white text-slate-700',
    date,
  };
}

const messageFocusMeta = {
  title: 'Mesajlı İşler',
  description: 'Son mesajı olan veya okunmamış konuşması bulunan servis taleplerini takip edin',
  emptyTitle: 'Mesajlı iş yok',
  emptyDescription: 'Müşteri yazışması bulunan işler burada görünecek.',
};

const drawerTabs: TicketDetailDrawerTab[] = ['details', 'work-order', 'asset', 'messages', 'proposal', 'my-proposal'];

function normalizeDrawerTab(value: string | null): TicketDetailDrawerTab | null {
  return drawerTabs.includes(value as TicketDetailDrawerTab) ? (value as TicketDetailDrawerTab) : null;
}

function hasMessageActivity(ticket: Ticket) {
  const messages = [...(ticket.messages ?? []), ...ticketConversationMessages(ticket)];
  return (
    (ticket.unreadMessageCount ?? 0) > 0 ||
    Boolean(ticket.lastMessage && ticket.lastMessage.senderRole !== 'system') ||
    messages.some((message) => message.senderRole !== 'system')
  );
}

function messageActivityTimestamp(ticket: Ticket) {
  const latestMessage = latestTicketMessage(ticket);
  const value = latestMessage?.createdAt ?? ticket.updatedAt ?? ticket.createdAt;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function latestTicketMessage(ticket: Ticket) {
  if (ticket.lastMessage && ticket.lastMessage.senderRole !== 'system') {
    return ticket.lastMessage;
  }

  return [...(ticket.messages ?? []), ...ticketConversationMessages(ticket)]
    .filter((message) => message.senderRole !== 'system')
    .sort((a, b) => {
      const timestampA = new Date(a.createdAt).getTime();
      const timestampB = new Date(b.createdAt).getTime();
      return (Number.isNaN(timestampB) ? 0 : timestampB) - (Number.isNaN(timestampA) ? 0 : timestampA);
    })[0] ?? null;
}

function ticketConversationMessages(ticket: Ticket) {
  return (ticket.conversations ?? []).flatMap((conversation) => conversation.messages ?? []);
}

function messageSenderLabel(role: string) {
  if (role === 'customer') return 'Müşteri';
  if (role === 'service') return 'Servis';
  if (role === 'admin') return 'Operasyon';
  return 'Sistem';
}

function shortTicketId(id: string) {
  return id.split('-')[1] ?? id.slice(0, 8);
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Tutar yok';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function billingStatusLabel(status?: string) {
  if (status === 'DISPUTED') return 'Müşteri itirazı var';
  if (status === 'APPROVED') return 'Müşteri onayladı';
  return 'Müşteri onayı bekliyor';
}

const statusFilters = ['all', 'OPEN', 'OFFERED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const categoryFilters = ['all', 'Electric', 'Mechanic', 'Pneumatic', 'Hydraulic', 'Software', 'General'];

function normalizeStatusFilter(value: string | null) {
  return statusFilters.includes(value ?? '') ? value ?? 'all' : 'all';
}

function normalizeCategoryFilter(value: string | null) {
  return categoryFilters.includes(value ?? '') ? value ?? 'all' : 'all';
}
