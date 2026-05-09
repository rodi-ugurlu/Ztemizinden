import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStore, useAdminMetrics, useCriticalTickets, usePendingVerifications } from '@/store/useAdminStore';
import type { GlobalTicket } from '@/store/useAdminStore';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  Shield,
  TicketCheck,
  TrendingUp,
  Truck,
  Users,
  ArrowRight,
} from 'lucide-react';

/**
 * AdminDashboard Component
 *
 * Data-heavy analytics dashboard for Operations Center.
 * Displays global metrics, visualizations, and critical tickets.
 */
export default function AdminDashboard() {
  const { fetchProviders, fetchQueue } = useAdminStore();

  useEffect(() => {
    void (async () => {
      await fetchProviders();
      await fetchQueue();
    })();
  }, [fetchProviders, fetchQueue]);

  const metrics = useAdminMetrics();
  const criticalTickets = useCriticalTickets();
  const pendingVerifications = usePendingVerifications();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operasyon Merkezi</h1>
          <p className="text-slate-400 mt-1">
            Sistem geneli metrikler ve kritik operasyonlar
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/dispatch">
            <Button className="bg-red-600 hover:bg-red-700">
              <TicketCheck className="w-4 h-4 mr-2" />
              Tüm Talepler
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Aktif Talepler"
          value={metrics.totalActiveTickets}
          icon={TicketCheck}
          color="bg-blue-50 text-blue-600 border-blue-200/30"
          alert={metrics.totalActiveTickets > 10}
        />
        <MetricCard
          title="Ortalama Yanıt Süresi"
          value={`${metrics.averageResponseTime} dk`}
          icon={Clock}
          color="bg-amber-50 text-amber-600 border-amber-200/30"
          trend={metrics.averageResponseTime < 60 ? 'İyi' : 'Yüksek'}
          trendType={metrics.averageResponseTime < 60 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Onaylı Servis Sağlayıcı"
          value={metrics.verifiedProviders}
          icon={Users}
          color="bg-indigo-50 text-indigo-600 border-indigo-200/30"
          description={`Toplam: ${metrics.totalRegisteredProviders}`}
        />
        <MetricCard
          title="Kritik Talepler"
          value={metrics.criticalTickets}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600 border-red-200/30"
          alert={metrics.criticalTickets > 0}
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Bugün Çözülen"
          value={metrics.ticketsResolvedToday}
          icon={CheckCircle2}
          trend="+12% dün'e göre"
        />
        <StatCard
          title="SLA İhlali"
          value={metrics.slaBreaches}
          icon={AlertTriangle}
          valueColor={metrics.slaBreaches > 0 ? 'text-red-600' : 'text-emerald-600'}
          cta="Sevk Et"
          ctaLink="/admin/dispatch"
        />
        <StatCard
          title="Atama Bekleyen"
          value={metrics.unassignedOpenTickets}
          icon={Truck}
          valueColor={metrics.unassignedOpenTickets > 0 ? 'text-amber-600' : 'text-emerald-600'}
          cta="Ata"
          ctaLink="/admin/dispatch"
        />
        <StatCard
          title="Bekleyen Onaylar"
          value={metrics.pendingVerifications}
          icon={FileCheck}
          cta="İncele"
          ctaLink="/admin/providers"
        />
        <StatCard
          title="Sistem Durumu"
          value="Aktif"
          icon={Shield}
          valueColor="text-emerald-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Critical Tickets Table */}
        <div className="lg:col-span-2">
          <Card className="bg-white/50 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Kritik Talepler
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Yanıt süresi aşılan veya kritik öncelikli talepler
                </CardDescription>
              </div>
              <Link to="/admin/dispatch">
                <Button variant="ghost" size="sm" className="text-red-600">
                  Tümü <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-400">Talep ID</TableHead>
                    <TableHead className="text-slate-400">Müşteri</TableHead>
                    <TableHead className="text-slate-400">Konu</TableHead>
                    <TableHead className="text-slate-400">Durum</TableHead>
                    <TableHead className="text-slate-400">Yanıt Süresi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-200">
                      <TableCell className="font-mono text-xs text-slate-500">
                        #{ticket.id.split('-')[1]}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <div>{ticket.customerCompany}</div>
                        <div className="text-xs text-slate-500">{ticket.customerName}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-700">
                        {ticket.title}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <ResponseTimeBadge responseTime={ticket.responseTime} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {criticalTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Kritik talep bulunmuyor
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
          {/* Pending Verifications */}
          {pendingVerifications.length > 0 && (
            <Card className="bg-white/50 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
                  <FileCheck className="w-4 h-4" />
                  Onay Bekleyen Başvurular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {pendingVerifications.slice(0, 3).map((provider) => (
                    <li key={provider.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-700 font-medium">{provider.name}</p>
                        <p className="text-xs text-slate-500">{provider.city}</p>
                      </div>
                      <Link to="/admin/providers">
                        <Button variant="ghost" size="sm" className="text-red-600 h-7">
                          İncele
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
                {pendingVerifications.length > 3 && (
                  <Link to="/admin/providers">
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-400">
                      +{pendingVerifications.length - 3} daha
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-white/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/providers">
                <Button variant="outline" className="w-full justify-start bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-red-50">
                  <Building2 className="w-4 h-4 mr-2 text-red-600" />
                  Servis Sağlayıcıları
                </Button>
              </Link>
              <Link to="/admin/dispatch">
                <Button variant="outline" className="w-full justify-start bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-red-50">
                  <Activity className="w-4 h-4 mr-2 text-red-600" />
                  Sevk Merkezi
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Product Readiness */}
          <Card className="bg-white/50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-400">
                MVP1 Hazırlık Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthBar label="Frontend Akışları" value={100} color="bg-emerald-500" />
              <HealthBar label="Backend Entegrasyon" value={95} color="bg-blue-500" />
              <HealthBar label="API Kontratı" value={90} color="bg-indigo-500" />
              <HealthBar label="Dosya/Medya Akışı" value={54} color="bg-amber-500" />
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
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  alert?: boolean;
}

function MetricCard({ title, value, icon: Icon, color, description, trend, trendType, alert }: MetricCardProps) {
  return (
    <Card className={`bg-white/50 border-slate-200 ${alert ? 'border-red-200/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${alert ? 'text-red-600' : 'text-slate-900'}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
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
          <div className={`p-3 rounded-lg border ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  valueColor?: string;
  trend?: string;
  cta?: string;
  ctaLink?: string;
}

function StatCard({ title, value, icon: Icon, valueColor = 'text-slate-900', trend, cta, ctaLink }: StatCardProps) {
  return (
    <Card className="bg-white/50 border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-400">{title}</p>
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        {trend && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
        {cta && ctaLink && (
          <Link to={ctaLink}>
            <Button variant="ghost" size="sm" className="text-red-600 p-0 h-auto mt-2">
              {cta} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-700">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GlobalTicket['status'] }) {
  const variants: Record<GlobalTicket['status'], { bg: string; text: string; label: string }> = {
    Open: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Açık' },
    Offered: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Teklif' },
    'In Progress': { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Devam' },
    Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Çözüldü' },
    Closed: { bg: 'bg-slate-100', text: 'text-slate-400', label: 'Kapalı' },
    Cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'İptal' },
  };

  const variant = variants[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}

function ResponseTimeBadge({ responseTime }: { responseTime?: number | null }) {
  if (responseTime === null || responseTime === undefined) {
    return <span className="text-slate-500 text-xs">-</span>;
  }

  const isCritical = responseTime > 120;

  return (
    <span className={`text-xs font-mono ${isCritical ? 'text-red-600' : 'text-slate-500'}`}>
      {responseTime} dk
    </span>
  );
}
