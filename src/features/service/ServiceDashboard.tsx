import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { formatShortDate, ticketCategoryLabel, ticketPriorityLabel } from '@/components/domain/ticketMeta';
import {
  DashboardMessagePanel,
  DashboardMessageToast,
  type DashboardMessageToastData,
} from '@/components/messages/DashboardMessagePanel';
import { subscribeToProviderTicketEvents } from '@/lib/realtime';
import { useAuthStore } from '@/store/useAuthStore';
import { useServiceStore } from '@/store/useServiceStore';
import type { Ticket } from '@/store/useCustomerStore';
import { matchesServiceTicketView } from './serviceTicketViews';
import {
  Archive,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  HandCoins,
  Inbox,
  RadioTower,
  Send,
} from 'lucide-react';

type ModulePreviewItem = {
  id: string;
  title: string;
  meta: string;
  detail: string;
  tag?: string;
};

export default function ServiceDashboard() {
  const {
    opportunities,
    myJobs,
    currentProviderId,
    providerProfile,
    fetchOpportunities,
    fetchMyJobs,
    resolveProviderSession,
    receiveTicketUpdate,
    isLoading,
    error,
  } = useServiceStore();
  const user = useAuthStore((state) => state.user);
  const seenMessageIdsRef = useRef(new Set<string>());
  const ticketMetaRef = useRef(new Map<string, { title: string }>());
  const [messageToast, setMessageToast] = useState<DashboardMessageToastData | null>(null);
  const providerStatus = providerProfile?.status;
  const isPendingProvider = providerStatus === 'Pending Verification';
  const isSuspendedProvider = providerStatus === 'Suspended';

  useEffect(() => {
    void resolveProviderSession(user);
  }, [user, resolveProviderSession]);

  useEffect(() => {
    if (!currentProviderId) return;
    void fetchOpportunities();
    void fetchMyJobs();
  }, [currentProviderId, fetchOpportunities, fetchMyJobs]);

  useEffect(() => {
    myJobs.forEach((ticket) => {
      ticketMetaRef.current.set(ticket.id, { title: ticket.title });
      (ticket.messages ?? []).forEach((message) => seenMessageIdsRef.current.add(message.id));
      (ticket.conversations ?? []).forEach((conversation) => {
        (conversation.messages ?? []).forEach((message) => seenMessageIdsRef.current.add(message.id));
      });
    });
  }, [myJobs]);

  useEffect(() => {
    if (!currentProviderId) return;
    return subscribeToProviderTicketEvents(currentProviderId, (event) => {
      receiveTicketUpdate(event.ticket);

      const incomingMessage = event.ticket.lastMessage;
      if (!incomingMessage || seenMessageIdsRef.current.has(incomingMessage.id)) return;
      seenMessageIdsRef.current.add(incomingMessage.id);

      if (event.type === 'MESSAGE' && incomingMessage.senderRole === 'customer') {
        const ticketMeta = ticketMetaRef.current.get(incomingMessage.ticketId);
        const conversationId = event.conversationId ?? incomingMessage.conversationId;
        setMessageToast({
          ticketId: incomingMessage.ticketId,
          title: ticketMeta?.title ?? 'Servis talebi',
          senderName: incomingMessage.senderName,
          body: incomingMessage.body,
          path: `/service/tickets?ticketId=${encodeURIComponent(incomingMessage.ticketId)}&tab=messages${
            conversationId ? `&conversationId=${encodeURIComponent(conversationId)}` : ''
          }`,
        });
      }
    });
  }, [currentProviderId, receiveTicketUpdate]);

  const visibleTickets = uniqueTickets([...opportunities, ...myJobs]);
  const opportunityIds = new Set(opportunities.map((ticket) => ticket.id));
  const proposedTickets = visibleTickets.filter((ticket) =>
    matchesServiceTicketView(ticket, 'proposals', currentProviderId, opportunityIds)
  );
  const acceptedTickets = visibleTickets.filter((ticket) =>
    matchesServiceTicketView(ticket, 'accepted', currentProviderId, opportunityIds)
  );
  const openBillingJobs = visibleTickets.filter((ticket) =>
    matchesServiceTicketView(ticket, 'open-billing', currentProviderId, opportunityIds)
  );
  const closedBillingJobs = visibleTickets.filter((ticket) =>
    matchesServiceTicketView(ticket, 'closed-billing', currentProviderId, opportunityIds)
  );
  const activeWorkCount = acceptedTickets.length + openBillingJobs.length;
  const unreadMessageCount = myJobs.reduce((total, ticket) => total + (ticket.unreadMessageCount ?? 0), 0);
  const newPreviewItems = previewTickets(opportunities, newOpportunityPreview);
  const proposalPreviewItems = previewTickets(proposedTickets, (ticket) => proposalPreview(ticket, currentProviderId));
  const acceptedPreviewItems = previewTickets(acceptedTickets, acceptedJobPreview);
  const openBillingPreviewItems = previewTickets(openBillingJobs, openBillingPreview);
  const closedBillingPreviewItems = previewTickets(closedBillingJobs, closedBillingPreview);
  const incomingThisMonth = visibleTickets.filter((ticket) => isSameMonth(ticket.createdAt)).length;
  const offersThisMonth = visibleTickets.filter((ticket) =>
    ticket.offers.some((offer) => offer.providerId === currentProviderId && isSameMonth(offer.createdAt))
  ).length;
  const closedThisMonth = closedBillingJobs.filter((ticket) => isSameMonth(ticket.updatedAt)).length;

  if (isLoading) {
    return (
      <div className="w-full flex-1 bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-40 rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-full animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex-1 bg-slate-50 p-6 lg:p-8">
        <Card className="mx-auto max-w-3xl border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <h2 className="font-semibold text-red-950">Servis verileri yüklenemedi</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="w-full flex-1 bg-slate-50 p-6 lg:p-8">
        <Card className="mx-auto max-w-3xl border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
              <div>
                <h2 className="font-semibold text-slate-950">Servis profili hazırlanıyor</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Firma bilgileriniz backend üzerinden doğrulanınca paneliniz açılacak.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPendingProvider || isSuspendedProvider) {
    return (
      <div className="w-full flex-1 bg-slate-50 p-6 lg:p-8">
        <Card className={`mx-auto max-w-3xl border ${isSuspendedProvider ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isSuspendedProvider ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {isSuspendedProvider ? <FileText className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isSuspendedProvider ? 'text-red-700' : 'text-amber-700'}`}>
                  {isSuspendedProvider ? 'Başvuru reddedildi' : 'Operasyon onayı bekleniyor'}
                </p>
                <h2 className={`mt-2 text-xl font-black ${isSuspendedProvider ? 'text-red-950' : 'text-amber-950'}`}>
                  {providerProfile?.name ?? user?.name ?? 'Servis hesabı'}
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${isSuspendedProvider ? 'text-red-700' : 'text-amber-800'}`}>
                  {isSuspendedProvider
                    ? 'Servis sağlayıcı başvurunuz operasyon tarafından reddedildi veya askıya alındı. Profil ve belgelerinizi kontrol edip operasyon ekibiyle iletişime geçin.'
                    : 'Başvurunuz alındı. Operasyon merkezi firma ve belge kontrollerini tamamladığında yeni talepler ve iş panosu açılacak.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/service/team"
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold ${isSuspendedProvider ? 'border-red-200 bg-white text-red-700' : 'border-amber-200 bg-white text-amber-800'}`}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    Profil ve Belgeler
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full flex-1 overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.9) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <DashboardMessageToast toast={messageToast} tone="green" onClose={() => setMessageToast(null)} />

      <div className="relative mx-auto grid min-h-[calc(100vh-145px)] w-full max-w-[1500px] grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-7">
          <section className="overflow-hidden rounded-lg border border-emerald-900 bg-emerald-900 shadow-lg">
            <div className="flex flex-col gap-5 px-5 py-4 text-white lg:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 shadow-lg">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">Maintly</p>
                  <h1 className="text-2xl font-black tracking-normal">Servis Firması Paneli</h1>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:min-w-[420px] sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <p className="text-[11px] font-semibold text-emerald-100">Aktif iş</p>
                  <p className="mt-1 text-xl font-black">{activeWorkCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <p className="text-[11px] font-semibold text-emerald-100">Yeni kayıt</p>
                  <p className="mt-1 text-xl font-black">{opportunities.length}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <p className="text-[11px] font-semibold text-emerald-100">Okunmamış</p>
                  <p className="mt-1 flex items-center gap-2 text-xl font-black">
                    {unreadMessageCount}
                    <RadioTower className="h-4 w-4 text-emerald-100" />
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <ModuleCard
              tone="green"
              eyebrow={`${opportunities.length} yeni kayıt`}
              title="Yeni Gelen Talepler"
              description="Fabrikalardan yeni gelen servis talepleri"
              icon={Inbox}
              to="/service/tickets?view=new"
              actionLabel="Talepleri Aç"
              items={newPreviewItems}
              emptyText="Kapsamınıza uygun yeni talep yok"
            />

            <ModuleCard
              tone="blue"
              eyebrow={`${proposedTickets.length} teklif`}
              title="Teklif Verilen Talepler"
              description="Teklif gönderilmiş, onay bekleyen işler"
              icon={Send}
              to="/service/tickets?view=proposals"
              actionLabel="Teklifleri Gör"
              items={proposalPreviewItems}
              emptyText="Müşteri onayı bekleyen teklif yok"
            />

            <ModuleCard
              tone="red"
              eyebrow={`${acceptedTickets.length} kabul`}
              title="Kabul Edilen Talepler"
              description="Fabrika tarafından kabul edilen teklifler"
              icon={FileCheck2}
              to="/service/tickets?view=accepted"
              actionLabel="İşleri Aç"
              items={acceptedPreviewItems}
              emptyText="Hakediş öncesi aktif iş yok"
            />

          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.28fr]">
            <ModuleCard
              tone="amber"
              eyebrow={`${openBillingJobs.length} açık süreç`}
              title="Hakediş Verilen Açık İşler"
              description="Devam eden işler, hakediş gönderilen ve onay/ödeme bekleyen işler"
              icon={HandCoins}
              to="/service/tickets?view=open-billing"
              actionLabel="Açık İşleri Gör"
              items={openBillingPreviewItems}
              emptyText="Onay bekleyen hakediş süreci yok"
              large
            />

            <ModuleCard
              tone="softGreen"
              eyebrow={`${closedBillingJobs.length} arşiv kayıt`}
              title="Hakediş Verilen Kapanan İşler"
              description="Arşiv, tamamlanan işler, ödemeler ve belgeler"
              icon={Archive}
              to="/service/tickets?view=closed-billing"
              actionLabel="Arşivi Aç"
              items={closedBillingPreviewItems}
              emptyText="Kapanan hakedişli iş yok"
              large
            />
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <MetricCard
              tone="green"
              value={incomingThisMonth}
              label="Bu ay toplam gelen arıza bildirimi"
              helper="Yeni kayıt ve teklif fırsatları"
              icon={ClipboardList}
            />
            <MetricCard
              tone="blue"
              value={offersThisMonth}
              label="Bu ay toplam teklif verdiğim işler"
              helper="Müşteri onayı bekleyen veya sonuçlanan"
              icon={Send}
            />
            <MetricCard
              tone="green"
              value={closedThisMonth}
              label="Bu ay kapatılan işler"
              helper="Onaylanmış ve arşive düşmüş işler"
              icon={CheckCircle2}
            />
          </section>
        </div>

        <DashboardMessagePanel tickets={myJobs} role="service" toBasePath="/service/tickets" tone="green" />
      </div>
    </div>
  );
}

function ModuleCard({
  tone,
  eyebrow,
  title,
  description,
  icon: Icon,
  to,
  actionLabel,
  items,
  emptyText,
  large = false,
}: {
  tone: 'green' | 'softGreen' | 'blue' | 'red' | 'amber';
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  actionLabel: string;
  items: ModulePreviewItem[];
  emptyText: string;
  large?: boolean;
}) {
  const styles = moduleStyles[tone];

  return (
    <Link to={to} className="group block h-full">
      <Card
        className={`h-full overflow-hidden border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${styles.border} ${styles.hover}`}
      >
        <CardContent className={`relative flex flex-col p-5 ${large ? 'min-h-[282px]' : 'min-h-[292px]'}`}>
          <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
          <div className="flex items-start justify-between gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.iconBg}`}>
              <Icon className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${styles.badge}`}>
              {eyebrow}
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <h2 className={`text-xl font-black leading-tight tracking-normal ${styles.title}`}>{title}</h2>
            <p className="text-sm font-medium leading-relaxed text-slate-500">{description}</p>
          </div>

          <div className="mt-5 flex-1 space-y-2">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{item.title}</p>
                    {item.tag && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${styles.badge}`}>
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.meta}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="flex h-full min-h-[112px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500">
                {emptyText}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className={`inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${styles.action}`}>
              {actionLabel}
            </span>
            <ArrowRight className={`h-5 w-5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 ${styles.icon}`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MetricCard({
  tone,
  value,
  label,
  helper,
  icon: Icon,
}: {
  tone: 'green' | 'blue';
  value: number;
  label: string;
  helper: string;
  icon: React.ElementType;
}) {
  const styles = metricStyles[tone];

  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${styles.wrap}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-700">{label}</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
      </div>
      <div className={`mt-4 flex items-end gap-2 text-3xl font-black leading-none ${styles.value}`}>
        {value}
        <Clock3 className="mb-1 h-4 w-4 opacity-40" />
      </div>
    </div>
  );
}

const moduleStyles = {
  green: {
    border: 'border-emerald-200',
    hover: 'hover:border-emerald-500',
    bar: 'bg-emerald-600',
    iconBg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    title: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800',
    action: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  softGreen: {
    border: 'border-teal-200',
    hover: 'hover:border-teal-500',
    bar: 'bg-teal-500',
    iconBg: 'bg-teal-50',
    icon: 'text-teal-700',
    title: 'text-teal-900',
    badge: 'bg-teal-50 text-teal-800',
    action: 'border-teal-200 bg-teal-50 text-teal-800',
  },
  blue: {
    border: 'border-blue-200',
    hover: 'hover:border-blue-500',
    bar: 'bg-blue-700',
    iconBg: 'bg-blue-50',
    icon: 'text-blue-700',
    title: 'text-blue-900',
    badge: 'bg-blue-50 text-blue-800',
    action: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  red: {
    border: 'border-rose-200',
    hover: 'hover:border-rose-500',
    bar: 'bg-rose-500',
    iconBg: 'bg-rose-50',
    icon: 'text-rose-600',
    title: 'text-rose-800',
    badge: 'bg-rose-50 text-rose-700',
    action: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  amber: {
    border: 'border-amber-200',
    hover: 'hover:border-amber-500',
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-50',
    icon: 'text-amber-700',
    title: 'text-amber-950',
    badge: 'bg-amber-50 text-amber-800',
    action: 'border-amber-200 bg-amber-50 text-amber-800',
  },
};

const metricStyles = {
  green: {
    wrap: 'border-emerald-200',
    iconBg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    value: 'text-emerald-800',
  },
  blue: {
    wrap: 'border-blue-200',
    iconBg: 'bg-blue-50',
    icon: 'text-blue-700',
    value: 'text-blue-800',
  },
};

function previewTickets(tickets: Ticket[], mapTicket: (ticket: Ticket) => ModulePreviewItem) {
  return [...tickets]
    .sort((a, b) => ticketActivityTimestamp(b) - ticketActivityTimestamp(a))
    .slice(0, 2)
    .map(mapTicket);
}

function newOpportunityPreview(ticket: Ticket): ModulePreviewItem {
  return {
    id: ticket.id,
    title: ticket.title,
    meta: ticket.customerCompany,
    detail: `${ticketCategoryLabel(ticket.category)} · ${ticketPriorityLabel(ticket.priority)} · ${formatShortDate(ticket.createdAt)}`,
    tag: ticketPriorityLabel(ticket.priority),
  };
}

function proposalPreview(ticket: Ticket, providerId: string): ModulePreviewItem {
  const offer = ticket.offers.find((item) =>
    item.providerId === providerId && (item.status === 'PENDING' || item.status === 'INVITED')
  );

  return {
    id: ticket.id,
    title: ticket.title,
    meta: ticket.customerCompany,
    detail: `${formatCurrency(offer?.estimatedCost)} · ${offer?.eta || 'ETA bekleniyor'}`,
    tag: offer?.status === 'INVITED' ? 'Görüşmede' : 'Onayda',
  };
}

function acceptedJobPreview(ticket: Ticket): ModulePreviewItem {
  return {
    id: ticket.id,
    title: ticket.title,
    meta: ticket.customerCompany,
    detail: `${ticket.assetName ?? 'Varlık yok'} · ${formatShortDate(ticket.updatedAt || ticket.createdAt)}`,
    tag: 'Aktif',
  };
}

function openBillingPreview(ticket: Ticket): ModulePreviewItem {
  return {
    id: ticket.id,
    title: ticket.title,
    meta: ticket.customerCompany,
    detail: `${formatCurrency(ticket.finalActualCost ?? ticket.finalEstimatedCost)} · ${billingStatusLabel(ticket.billingStatus)}`,
    tag: ticket.billingStatus === 'DISPUTED' ? 'İtiraz' : 'Onayda',
  };
}

function closedBillingPreview(ticket: Ticket): ModulePreviewItem {
  return {
    id: ticket.id,
    title: ticket.title,
    meta: ticket.customerCompany,
    detail: `${formatCurrency(ticket.finalActualCost ?? ticket.finalEstimatedCost)} · ${formatShortDate(ticket.updatedAt || ticket.createdAt)}`,
    tag: 'Kapandı',
  };
}

function ticketActivityTimestamp(ticket: Ticket) {
  const timestamp = new Date(ticket.updatedAt || ticket.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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
  if (status === 'DISPUTED') return 'İtirazlı';
  if (status === 'APPROVED') return 'Onaylandı';
  return 'Müşteri onayı bekliyor';
}

function uniqueTickets(tickets: Ticket[]) {
  return tickets.filter((ticket, index, list) => list.findIndex((item) => item.id === ticket.id) === index);
}

function isSameMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
