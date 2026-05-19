import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useCustomerStore, type Ticket } from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Bell,
  CalendarClock,
  Clock3,
  FileText,
  Layers3,
  Package,
  Plus,
  RadioTower,
  Sparkles,
  Wrench,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { assets, tickets, isLoading, error, fetchAssets, fetchTickets } = useCustomerStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;
    fetchAssets(user.id);
    fetchTickets(user.id);
  }, [fetchAssets, fetchTickets, user?.id]);

  const pendingOfferTickets = tickets.filter((ticket) =>
    ticket.offers.some((offer) => offer.status === 'PENDING')
  );
  const billingApprovalTickets = tickets.filter(
    (ticket) => ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL'
  );
  const activeServiceTickets = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS');
  const pendingActionCount = uniqueTickets([
    ...pendingOfferTickets,
    ...billingApprovalTickets,
    ...activeServiceTickets,
  ]).length;
  const openedThisMonth = tickets.filter((ticket) => isSameMonth(ticket.createdAt)).length;
  const closedThisMonth = tickets.filter(
    (ticket) => (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && isSameMonth(ticket.updatedAt)
  ).length;

  if (isLoading) {
    return (
      <div className="w-full flex-1 bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((item) => (
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
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <h2 className="font-semibold text-red-950">Veriler yüklenemedi</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
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
        <section className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950 shadow-xl">
          <div className="flex flex-col gap-5 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between lg:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 shadow-lg shadow-red-950/30">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-200">Temizinden</p>
                <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Müşteri Paneli</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <RadioTower className="h-4 w-4 text-red-300" />
              <div className="text-right">
                <p className="text-xs text-slate-300">Maintenance 6.0</p>
                <p className="text-sm font-semibold text-white">Canlı servis merkezi</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ModuleCard
            tone="blue"
            eyebrow="Varlık/Ekipman Bazlı"
            title={`${assets.length}`}
            description="Toplam varlıklarımız"
            icon={Package}
            to="/customer/assets"
            actionLabel="Yeni Varlık Ekle"
            actionIcon={Plus}
          />

          <ModuleCard
            tone="red"
            eyebrow="Hizli Aksiyon"
            title="Arıza İhbarı Aç"
            description="Yeni arıza bildir, servis firmasına gönder"
            icon={Wrench}
            to="/customer/tickets/create"
            actionLabel="Kayıt Oluştur"
            actionIcon={ArrowRight}
            featured
          />

          <ModuleCard
            tone={pendingActionCount > 0 ? 'green' : 'amber'}
            eyebrow={pendingActionCount > 0 ? `${pendingActionCount} aktif işlem` : 'Aksiyon yok'}
            title="Bekleyen Talepler / İşler / İşlemler"
            description="Onay, mesaj ve hakediş bekleyen süreçleri takip et"
            icon={Bell}
            to="/customer/requests"
            actionLabel="Süreçleri Aç"
            actionIcon={ArrowRight}
          />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.45fr_1.05fr]">
          <MetricTile
            value={openedThisMonth}
            title="Bu Ay Açılan Arızalar"
            description="Bildirilen arızalar"
            icon={FileText}
            to="/customer/requests"
          />

          <MetricTile
            value={closedThisMonth}
            title="Bu Ay Kapanan Arızalar"
            description="Çözülen arızalar, hakedişler ve arşiv"
            icon={Archive}
            to="/customer/requests"
            wide
          />

          <ComingSoonTile />
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
  actionIcon: ActionIcon,
  featured = false,
}: {
  tone: 'blue' | 'red' | 'amber' | 'green';
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  actionLabel: string;
  actionIcon: React.ElementType;
  featured?: boolean;
}) {
  const styles = moduleStyles[tone];

  return (
    <Link to={to} className="group block h-full">
      <Card
        className={`h-full overflow-hidden border-2 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.border} ${styles.hover}`}
      >
        <CardContent className="relative flex min-h-[190px] flex-col justify-between p-6">
          <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
          <div className="flex items-start justify-between gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${styles.iconBg}`}>
              <Icon className={`h-6 w-6 ${styles.icon}`} />
            </div>
            {featured && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-700">
                Öncelikli
              </span>
            )}
          </div>

          <div className="mt-7 space-y-2">
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${styles.eyebrow}`}>{eyebrow}</p>
            <h2 className={`text-3xl font-black leading-tight tracking-normal ${styles.title}`}>{title}</h2>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-500">{description}</p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${styles.action}`}>
              <ActionIcon className="h-4 w-4" />
              {actionLabel}
            </span>
            <ArrowRight className={`h-5 w-5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 ${styles.icon}`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MetricTile({
  value,
  title,
  description,
  icon: Icon,
  to,
  wide = false,
}: {
  value: number;
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  wide?: boolean;
}) {
  return (
    <Link to={to} className="group block h-full">
      <Card className="h-full border-2 border-slate-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-xl">
        <CardContent className={`flex min-h-[190px] flex-col justify-between p-6 ${wide ? 'lg:px-8' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Icon className="h-6 w-6" />
            </div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
              Bu ay
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-end gap-4">
              <p className="text-5xl font-black leading-none text-red-700">{value}</p>
              <Clock3 className="mb-1 h-5 w-5 text-slate-300" />
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal text-slate-950">{title}</h2>
            <p className="mt-3 text-sm font-medium text-slate-500">{description}</p>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-red-700">
            Detayları Gör
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ComingSoonTile() {
  return (
    <Card className="relative h-full overflow-hidden border-2 border-amber-300 bg-amber-50 shadow-md">
      <CardContent className="flex min-h-[190px] flex-col justify-between p-6">
        <div className="absolute right-5 top-5 rotate-6 rounded-lg bg-slate-950 px-4 py-3 text-center text-white shadow-lg">
          <Sparkles className="mx-auto mb-1 h-4 w-4 text-amber-300" />
          <p className="text-xl font-black leading-none">New</p>
          <p className="text-lg font-black leading-none">soon</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <CalendarClock className="h-6 w-6" />
        </div>

        <div className="mt-10 max-w-[72%] space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Yeni modül</p>
          <h2 className="text-2xl font-black leading-tight tracking-normal text-amber-950">
            Periyodik & Otonom Arıza Bakım
          </h2>
          <p className="text-sm font-medium text-amber-800">Sonra eklenecek. Şimdilik pasif durumda.</p>
        </div>
      </CardContent>
    </Card>
  );
}

const moduleStyles = {
  blue: {
    border: 'border-blue-700',
    hover: 'hover:border-blue-800',
    bar: 'bg-blue-700',
    iconBg: 'bg-blue-50',
    icon: 'text-blue-700',
    eyebrow: 'text-blue-700',
    title: 'text-blue-800',
    action: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  red: {
    border: 'border-red-500',
    hover: 'hover:border-red-600',
    bar: 'bg-red-600',
    iconBg: 'bg-red-50',
    icon: 'text-red-600',
    eyebrow: 'text-red-600',
    title: 'text-red-700',
    action: 'border-red-200 bg-red-50 text-red-700',
  },
  amber: {
    border: 'border-amber-400',
    hover: 'hover:border-amber-500',
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-50',
    icon: 'text-amber-700',
    eyebrow: 'text-amber-700',
    title: 'text-amber-900',
    action: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  green: {
    border: 'border-emerald-500',
    hover: 'hover:border-emerald-600',
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    eyebrow: 'text-emerald-700',
    title: 'text-emerald-900',
    action: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

function uniqueTickets(tickets: Ticket[]) {
  return tickets.filter((ticket, index, list) => list.findIndex((item) => item.id === ticket.id) === index);
}

function isSameMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
