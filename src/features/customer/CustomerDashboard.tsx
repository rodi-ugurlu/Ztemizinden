import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCustomerStore, useTicketStats, type Ticket } from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Banknote,
  ClipboardList,
  Package,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  Wrench,
  MessageSquare,
  Timer,
} from 'lucide-react';

/**
 * CustomerDashboard Component
 *
 * Comprehensive overview dashboard for the Customer Portal.
 * Displays metrics, recent tickets, and quick actions.
 */
export default function CustomerDashboard() {
  const { assets, tickets, isLoading, error, fetchAssets, fetchTickets } = useCustomerStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;
    fetchAssets(user.id);
    fetchTickets(user.id);
  }, [fetchAssets, fetchTickets, user?.id]);

  const stats = useTicketStats();
  const pendingOfferTickets = tickets.filter((ticket) =>
    (ticket.offers ?? []).some((offer) => offer.status === 'PENDING')
  );
  const billingApprovalTickets = tickets.filter(
    (ticket) => ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL'
  );
  const invitedTickets = tickets.filter(
    (ticket) => ticket.status === 'IN_PROGRESS' && ticket.assignedProviderName
  );
  const actionQueue = [...billingApprovalTickets, ...pendingOfferTickets]
    .filter((ticket, index, list) => list.findIndex((item) => item.id === ticket.id) === index)
    .slice(0, 3);

  // Get recent tickets (last 5)
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get assets nearing warranty expiration (within 90 days)
  const nearingWarranty = assets.filter((asset) => {
    const warrantyEnd = new Date(asset.warrantyEndDate);
    const today = new Date();
    const diffDays = Math.ceil((warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 rounded-lg bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="font-semibold text-red-900">Veriler yüklenemedi</h2>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Müşteri Paneli</h1>
          <p className="text-slate-500 mt-1">
            Varlıklarınız, açık servis talepleriniz ve onay bekleyen işlemleriniz.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/customer/tickets/create">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Arıza Kaydı Aç
            </Button>
          </Link>
        </div>
      </div>

      {/* MVP1 Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActionCard
          title="Onay Bekleyen Teklif"
          value={pendingOfferTickets.length}
          description="Servis seçimi yapmanız gereken talepler"
          icon={FileText}
          cta="Teklifleri İncele"
          link="/customer/requests"
          tone="text-red-600"
        />
        <ActionCard
          title="Hakediş Onayı"
          value={billingApprovalTickets.length}
          description="Servis tamamlandıktan sonra kapanış onayı"
          icon={Banknote}
          cta="Hakedişi Aç"
          link="/customer/requests"
          tone="text-red-600"
        />
        <ActionCard
          title="Sahada Servis"
          value={invitedTickets.length}
          description="Davet edilen veya yolda olan servisler"
          icon={Timer}
          cta="Durumu Gör"
          link="/customer/requests"
          tone="text-red-600"
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Toplam Varlık"
          value={stats.totalAssets}
          icon={Package}
          trend="Varlık pasaportu hazır"
          trendType="positive"
        />
        <MetricCard
          title="Aktif Talep"
          value={stats.activeTickets}
          icon={ClipboardList}
          description="Açık, teklifli veya sahada"
          alert={stats.activeTickets > 0}
        />
        <MetricCard
          title="Bekleyen Teklif"
          value={stats.pendingOffers}
          icon={FileText}
          description="Karar bekliyor"
        />
        <MetricCard
          title="Bu Ay Çözülen"
          value={stats.resolvedThisMonth}
          icon={CheckCircle2}
          trend="Geçmişe işlenir"
          trendType="positive"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">Son Servis Talepleri</CardTitle>
                <CardDescription>Son bakım ve arıza kayıtları</CardDescription>
              </div>
              <Link to="/customer/requests">
                <Button variant="ghost" size="sm" className="text-red-600">
                  Tümü <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talep ID</TableHead>
                    <TableHead>Varlık</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Öncelik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {ticket.id.split('-')[1]}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {ticket.assetName}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-600">
                        {ticket.title}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        Henüz talep yok. İlk arıza kaydınızı oluşturabilirsiniz.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/customer/assets">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2 text-red-600" />
                  Varlık Ağacı
                </Button>
              </Link>
              <Link to="/customer/tickets/create">
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="w-4 h-4 mr-2 text-red-600" />
                  Arıza Bildir
                </Button>
              </Link>
              <Link to="/customer/requests">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="w-4 h-4 mr-2 text-slate-600" />
                  Talepler ve Geçmiş
                </Button>
              </Link>
            </CardContent>
          </Card>

          {actionQueue.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800">
                  <MessageSquare className="w-4 h-4" />
                  Sizin Aksiyonunuz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {actionQueue.map((ticket) => (
                  <Link key={ticket.id} to="/customer/requests" className="block">
                    <div className="rounded-md border border-red-100 bg-white/70 p-3 hover:border-red-200">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{ticket.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL'
                          ? 'Hakediş onayı bekliyor'
                          : `${(ticket.offers ?? []).filter((offer) => offer.status === 'PENDING').length} teklif bekliyor`}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Warranty Alerts */}
          {nearingWarranty.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  Garanti Yakında Bitiyor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {nearingWarranty.slice(0, 3).map((asset) => (
                    <li key={asset.id} className="text-sm text-red-700">
                      <span className="font-medium">{asset.name}</span>
                      <span className="text-red-600">
                        {' '}— {formatDate(asset.warrantyEndDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Asset Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Varlık Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AssetTypeRow
                  type="Tesis"
                  count={assets.filter((a) => a.type === 'Facility').length}
                  total={assets.length}
                  color="bg-red-500"
                />
                <AssetTypeRow
                  type="KOBİ"
                  count={assets.filter((a) => a.type === 'SME').length}
                  total={assets.length}
                  color="bg-red-500"
                />
                <AssetTypeRow
                  type="Ev"
                  count={assets.filter((a) => a.type === 'Home').length}
                  total={assets.length}
                  color="bg-slate-400"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  alert?: boolean;
}

function ActionCard({
  title,
  value,
  description,
  icon: Icon,
  cta,
  link,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  cta: string;
  link: string;
  tone: string;
}) {
  return (
    <Card className={value > 0 ? 'border-red-200 bg-white' : 'bg-white'}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${value > 0 ? tone : 'text-slate-900'}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${tone}`} />
          </div>
        </div>
        <Link to={link}>
          <Button variant="ghost" size="sm" className="mt-4 p-0 h-auto text-red-600">
            {cta} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, icon: Icon, description, trend, trendType, alert }: MetricCardProps) {
  return (
    <Card className={alert && value > 0 ? 'border-red-300' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${alert && value > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
            {trend && (
              <p className={`text-xs mt-1 ${
                trendType === 'positive' ? 'text-emerald-600' :
                trendType === 'negative' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${alert && value > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
            <Icon className={`w-6 h-6 ${alert && value > 0 ? 'text-red-600' : 'text-slate-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const variants: Record<Ticket['status'], { bg: string; text: string; label: string }> = {
    'OPEN': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Açık' },
    'OFFERED': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Teklifli' },
    'IN_PROGRESS': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Serviste' },
    'RESOLVED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Çözüldü' },
    'CLOSED': { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Kapalı' },
    'CANCELLED': { bg: 'bg-red-100', text: 'text-red-700', label: 'İptal' },
  };

  const variant = variants[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Ticket['priority'] }) {
  const variants: Record<Ticket['priority'], { border: string; text: string; label: string }> = {
    'Low': { border: 'border-slate-200', text: 'text-slate-600', label: 'Düşük' },
    'Medium': { border: 'border-amber-300', text: 'text-amber-700', label: 'Orta' },
    'High': { border: 'border-orange-300', text: 'text-orange-700', label: 'Yüksek' },
    'Critical': { border: 'border-red-300', text: 'text-red-700', label: 'Kritik' },
  };

  const variant = variants[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variant.border} ${variant.text}`}>
      {variant.label}
    </span>
  );
}

function AssetTypeRow({ type, count, total, color }: { type: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{type}</span>
        <span className="font-medium text-slate-900">{count}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
