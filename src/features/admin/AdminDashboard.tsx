import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStore, useAdminMetrics, useCriticalTickets } from '@/store/useAdminStore';
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
  Users,
  Wrench,
  ArrowRight,
} from 'lucide-react';

/**
 * AdminDashboard Component
 *
 * Data-heavy analytics dashboard for Operations Center.
 * Displays global metrics, visualizations, and critical tickets.
 */
export default function AdminDashboard() {
  const metrics = useAdminMetrics();
  const criticalTickets = useCriticalTickets();
  const pendingVerifications = useAdminStore((state) => state.getPendingVerifications());

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Operasyon Merkezi</h1>
          <p className="text-slate-400 mt-1">
            Sistem geneli metrikler ve kritik operasyonlar
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/dispatch">
            <Button className="bg-indigo-600 hover:bg-indigo-500">
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
          color="bg-blue-500/20 text-blue-400 border-blue-500/30"
          alert={metrics.totalActiveTickets > 10}
        />
        <MetricCard
          title="Ortalama Yanıt Süresi"
          value={`${metrics.averageResponseTime} dk`}
          icon={Clock}
          color="bg-amber-500/20 text-amber-400 border-amber-500/30"
          trend={metrics.averageResponseTime < 60 ? 'İyi' : 'Yüksek'}
          trendType={metrics.averageResponseTime < 60 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Onaylı Servis Sağlayıcı"
          value={metrics.verifiedProviders}
          icon={Users}
          color="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          description={`Toplam: ${metrics.totalRegisteredProviders}`}
        />
        <MetricCard
          title="Kritik Talepler"
          value={metrics.criticalTickets}
          icon={AlertTriangle}
          color="bg-rose-500/20 text-rose-400 border-rose-500/30"
          alert={metrics.criticalTickets > 0}
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Bugün Çözülen"
          value={metrics.ticketsResolvedToday}
          icon={CheckCircle2}
          trend="+12% dün'e göre"
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
          valueColor="text-emerald-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Critical Tickets Table */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Kritik Talepler
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Yanıt süresi aşılan veya kritik öncelikli talepler
                </CardDescription>
              </div>
              <Link to="/admin/dispatch">
                <Button variant="ghost" size="sm" className="text-indigo-400">
                  Tümü <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Talep ID</TableHead>
                    <TableHead className="text-slate-400">Müşteri</TableHead>
                    <TableHead className="text-slate-400">Konu</TableHead>
                    <TableHead className="text-slate-400">Durum</TableHead>
                    <TableHead className="text-slate-400">Yanıt Süresi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-800">
                      <TableCell className="font-mono text-xs text-slate-500">
                        #{ticket.id.split('-')[1]}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div>{ticket.customerCompany}</div>
                        <div className="text-xs text-slate-500">{ticket.customerName}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-300">
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
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                  <FileCheck className="w-4 h-4" />
                  Onay Bekleyen Başvurular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {pendingVerifications.slice(0, 3).map((provider) => (
                    <li key={provider.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300 font-medium">{provider.name}</p>
                        <p className="text-xs text-slate-500">{provider.city}</p>
                      </div>
                      <Link to="/admin/providers">
                        <Button variant="ghost" size="sm" className="text-indigo-400 h-7">
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
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-200">
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/providers">
                <Button variant="outline" className="w-full justify-start bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Building2 className="w-4 h-4 mr-2 text-indigo-400" />
                  Servis Sağlayıcıları
                </Button>
              </Link>
              <Link to="/admin/dispatch">
                <Button variant="outline" className="w-full justify-start bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Activity className="w-4 h-4 mr-2 text-emerald-400" />
                  Sevk Merkezi
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-400">
                Sistem Sağlığı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthBar label="API Gateway" value={98} color="bg-emerald-500" />
              <HealthBar label="Database" value={99} color="bg-emerald-500" />
              <HealthBar label="File Storage" value={100} color="bg-emerald-500" />
              <HealthBar label="Push Notifications" value={94} color="bg-amber-500" />
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
    <Card className={`bg-slate-900/50 border-slate-800 ${alert ? 'border-rose-500/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${alert ? 'text-rose-400' : 'text-white'}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
            {trend && (
              <p className={`text-xs mt-1 ${
                trendType === 'positive' ? 'text-emerald-400' :
                trendType === 'negative' ? 'text-rose-400' : 'text-slate-500'
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

function StatCard({ title, value, icon: Icon, valueColor = 'text-white', trend, cta, ctaLink }: StatCardProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-400">{title}</p>
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        {trend && (
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
        {cta && ctaLink && (
          <Link to={ctaLink}>
            <Button variant="ghost" size="sm" className="text-indigo-400 p-0 h-auto mt-2">
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
        <span className="text-slate-300">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GlobalTicket['status'] }) {
  const variants: Record<GlobalTicket['status'], { bg: string; text: string; label: string }> = {
    'Open': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Açık' },
    'Offered': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Teklif' },
    'In Progress': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'Devam' },
    'Resolved': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Çözüldü' },
    'Closed': { bg: 'bg-slate-700', text: 'text-slate-400', label: 'Kapalı' },
    'Cancelled': { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'İptal' },
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
    <span className={`text-xs font-mono ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
      {responseTime} dk
    </span>
  );
}
