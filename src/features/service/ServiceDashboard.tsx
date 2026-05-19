import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useServiceStore } from '@/store/useServiceStore';
import type { Ticket } from '@/store/useCustomerStore';
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
  Sparkles,
  UsersRound,
} from 'lucide-react';

export default function ServiceDashboard() {
  const {
    opportunities,
    myJobs,
    currentProviderId,
    providerProfile,
    fetchOpportunities,
    fetchMyJobs,
    resolveProviderSession,
    isLoading,
    error,
  } = useServiceStore();
  const user = useAuthStore((state) => state.user);
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

  const visibleTickets = uniqueTickets([...opportunities, ...myJobs]);
  const proposedTickets = visibleTickets.filter((ticket) => hasProviderOffer(ticket, currentProviderId));
  const acceptedTickets = myJobs.filter((ticket) =>
    ticket.offers.some((offer) => offer.providerId === currentProviderId && offer.status === 'ACCEPTED')
  );
  const openBillingJobs = myJobs.filter(
    (ticket) => ticket.status === 'IN_PROGRESS' || ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL'
  );
  const closedBillingJobs = myJobs.filter(
    (ticket) => ticket.status === 'CLOSED' || ticket.billingStatus === 'APPROVED'
  );
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

      <div className="relative mx-auto flex min-h-[calc(100vh-145px)] w-full max-w-7xl flex-col gap-7 p-4 sm:p-6 lg:p-8">
        <section className="overflow-hidden rounded-lg border border-emerald-900 bg-emerald-900 shadow-xl">
          <div className="flex flex-col gap-5 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between lg:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 shadow-lg">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">Temizinden</p>
                <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Servis Firması Paneli</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 py-3">
              <RadioTower className="h-4 w-4 text-emerald-100" />
              <div className="text-right">
                <p className="text-xs text-emerald-100">Maintenance 6.0</p>
                <p className="text-sm font-semibold text-white">Canlı servis akışı</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr_1fr_1.05fr]">
          <ModuleCard
            tone="green"
            eyebrow={`${opportunities.length} yeni kayıt`}
            title="Yeni Gelen Talepler"
            description="Fabrikalardan yeni gelen servis talepleri"
            icon={Inbox}
            to="/service/tickets"
            actionLabel="Talepleri Aç"
          />

          <ModuleCard
            tone="blue"
            eyebrow={`${proposedTickets.length} teklif`}
            title="Teklif Verilen Talepler"
            description="Teklif gönderilmiş, onay bekleyen işler"
            icon={Send}
            to="/service/tickets"
            actionLabel="Teklifleri Gör"
          />

          <ModuleCard
            tone="red"
            eyebrow={`${acceptedTickets.length} kabul`}
            title="Kabul Edilen Talepler"
            description="Fabrika tarafından kabul edilen teklifler"
            icon={FileCheck2}
            to="/service/tickets"
            actionLabel="İşleri Aç"
          />

          <ComingSoonTile />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.28fr]">
          <ModuleCard
            tone="amber"
            eyebrow={`${openBillingJobs.length} açık süreç`}
            title="Hakediş Verilen Açık İşler"
            description="Devam eden işler, hakediş gönderilen ve onay/ödeme bekleyen işler"
            icon={HandCoins}
            to="/service/tickets"
            actionLabel="Açık İşleri Gör"
            large
          />

          <ModuleCard
            tone="softGreen"
            eyebrow={`${closedBillingJobs.length} arşiv kayıt`}
            title="Hakediş Verilen Kapanan İşler"
            description="Arşiv, tamamlanan işler, ödemeler ve belgeler"
            icon={Archive}
            to="/service/tickets"
            actionLabel="Arşivi Aç"
            large
          />
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MetricPill
            tone="green"
            value={incomingThisMonth}
            label="Bu ay toplam gelen arıza bildirimi"
            icon={ClipboardList}
          />
          <MetricPill
            tone="blue"
            value={offersThisMonth}
            label="Bu ay toplam teklif verdiğim işler"
            icon={Send}
          />
          <MetricPill
            tone="green"
            value={closedThisMonth}
            label="Bu ay kapatılan işler"
            icon={CheckCircle2}
          />
        </section>
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
  large = false,
}: {
  tone: 'green' | 'softGreen' | 'blue' | 'red' | 'amber';
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  actionLabel: string;
  large?: boolean;
}) {
  const styles = moduleStyles[tone];

  return (
    <Link to={to} className="group block h-full">
      <Card
        className={`h-full overflow-hidden border-2 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.border} ${styles.hover}`}
      >
        <CardContent className={`relative flex flex-col justify-between p-6 ${large ? 'min-h-[190px]' : 'min-h-[180px]'}`}>
          <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
          <div className="flex items-start justify-between gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${styles.iconBg}`}>
              <Icon className={`h-6 w-6 ${styles.icon}`} />
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${styles.badge}`}>
              {eyebrow}
            </span>
          </div>

          <div className="mt-7 space-y-3">
            <h2 className={`text-2xl font-black leading-tight tracking-normal ${styles.title}`}>{title}</h2>
            <p className="max-w-lg text-sm font-medium leading-relaxed text-slate-500">{description}</p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${styles.action}`}>
              {actionLabel}
            </span>
            <ArrowRight className={`h-5 w-5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 ${styles.icon}`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ComingSoonTile() {
  return (
    <Card className="relative h-full overflow-hidden border-2 border-amber-300 bg-amber-50 shadow-md">
      <CardContent className="flex min-h-[180px] flex-col justify-between p-6">
        <div className="absolute right-5 top-5 rotate-6 rounded-lg bg-slate-950 px-4 py-3 text-center text-white shadow-lg">
          <Sparkles className="mx-auto mb-1 h-4 w-4 text-amber-300" />
          <p className="text-xl font-black leading-none">New</p>
          <p className="text-lg font-black leading-none">soon</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <UsersRound className="h-6 w-6" />
        </div>

        <div className="mt-10 max-w-[72%] space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Yeni modül</p>
          <h2 className="text-2xl font-black leading-tight tracking-normal text-amber-950">
            İş / Görev / Personel Yönet
          </h2>
          <p className="text-sm font-medium text-amber-800">Saha ekibi, görev ve kaynak planlaması sonra eklenecek.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricPill({
  tone,
  value,
  label,
  icon: Icon,
}: {
  tone: 'green' | 'blue';
  value: number;
  label: string;
  icon: React.ElementType;
}) {
  const styles = metricStyles[tone];

  return (
    <div className={`relative min-h-[150px] overflow-hidden rounded-[999px] border-4 px-8 py-8 shadow-md ${styles.wrap}`}>
      <div className="absolute inset-x-12 top-0 h-px bg-white/80" />
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.iconBg}`}>
          <Icon className={`h-4 w-4 ${styles.icon}`} />
        </div>
        <div className={`flex items-center gap-3 text-4xl font-black leading-none ${styles.value}`}>
          {value}
          <Clock3 className="h-5 w-5 opacity-40" />
        </div>
        <p className="max-w-[220px] text-sm font-semibold leading-snug text-slate-600">{label}</p>
      </div>
    </div>
  );
}

const moduleStyles = {
  green: {
    border: 'border-emerald-600',
    hover: 'hover:border-emerald-700',
    bar: 'bg-emerald-600',
    iconBg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    title: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800',
    action: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  softGreen: {
    border: 'border-emerald-500',
    hover: 'hover:border-emerald-600',
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    title: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800',
    action: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  blue: {
    border: 'border-blue-700',
    hover: 'hover:border-blue-800',
    bar: 'bg-blue-700',
    iconBg: 'bg-blue-50',
    icon: 'text-blue-700',
    title: 'text-blue-900',
    badge: 'bg-blue-50 text-blue-800',
    action: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  red: {
    border: 'border-red-500',
    hover: 'hover:border-red-600',
    bar: 'bg-red-600',
    iconBg: 'bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-800',
    badge: 'bg-red-50 text-red-700',
    action: 'border-red-200 bg-red-50 text-red-700',
  },
  amber: {
    border: 'border-amber-400',
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
    wrap: 'border-emerald-600 bg-emerald-50',
    iconBg: 'bg-white',
    icon: 'text-emerald-700',
    value: 'text-emerald-800',
  },
  blue: {
    wrap: 'border-blue-700 bg-blue-50',
    iconBg: 'bg-white',
    icon: 'text-blue-700',
    value: 'text-blue-800',
  },
};

function hasProviderOffer(ticket: Ticket, providerId: string) {
  return ticket.offers.some((offer) => offer.providerId === providerId);
}

function uniqueTickets(tickets: Ticket[]) {
  return tickets.filter((ticket, index, list) => list.findIndex((item) => item.id === ticket.id) === index);
}

function isSameMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
