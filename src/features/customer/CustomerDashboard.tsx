import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCustomerStore, useTicketStats, type Ticket } from '@/store/useCustomerStore';
import {
  ClipboardList,
  Package,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
  Wrench
} from 'lucide-react';

/**
 * CustomerDashboard Component
 *
 * Comprehensive overview dashboard for the Customer Portal.
 * Displays metrics, recent tickets, and quick actions.
 */
export default function CustomerDashboard() {
  const { assets, tickets } = useCustomerStore();
  const stats = useTicketStats();

  // Get recent tickets (last 5)
  const recentTickets = tickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get assets nearing warranty expiration (within 90 days)
  const nearingWarranty = assets.filter((asset) => {
    const warrantyEnd = new Date(asset.warrantyEndDate);
    const today = new Date();
    const diffDays = Math.ceil((warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back. Here is an overview of your assets and service requests.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/customer/tickets/create">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assets"
          value={stats.totalAssets}
          icon={Package}
          trend="+1 this month"
          trendType="positive"
        />
        <MetricCard
          title="Active Tickets"
          value={stats.activeTickets}
          icon={ClipboardList}
          description="Requires attention"
          alert={stats.activeTickets > 0}
        />
        <MetricCard
          title="Pending Offers"
          value={stats.pendingOffers}
          icon={FileText}
          description="Awaiting approval"
        />
        <MetricCard
          title="Resolved This Month"
          value={stats.resolvedThisMonth}
          icon={CheckCircle2}
          trend="On track"
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
                <CardTitle className="text-lg font-semibold">Recent Service Tickets</CardTitle>
                <CardDescription>Latest maintenance and repair requests</CardDescription>
              </div>
              <Link to="/customer/requests">
                <Button variant="ghost" size="sm" className="text-red-600">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
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
                        No tickets found. Create your first service request.
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
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/customer/assets">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2 text-red-600" />
                  View Asset Registry
                </Button>
              </Link>
              <Link to="/customer/tickets/create">
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="w-4 h-4 mr-2 text-amber-600" />
                  Report an Issue
                </Button>
              </Link>
              <Link to="/customer/requests">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="w-4 h-4 mr-2 text-slate-600" />
                  Service History
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Warranty Alerts */}
          {nearingWarranty.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  Warranty Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {nearingWarranty.slice(0, 3).map((asset) => (
                    <li key={asset.id} className="text-sm text-amber-700">
                      <span className="font-medium">{asset.name}</span>
                      <span className="text-amber-600">
                        {' '}— Expires {formatDate(asset.warrantyEndDate)}
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
              <CardTitle className="text-lg font-semibold">Asset Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AssetTypeRow
                  type="Facility"
                  count={assets.filter((a) => a.type === 'Facility').length}
                  color="bg-red-500"
                />
                <AssetTypeRow
                  type="SME"
                  count={assets.filter((a) => a.type === 'SME').length}
                  color="bg-emerald-500"
                />
                <AssetTypeRow
                  type="Home"
                  count={assets.filter((a) => a.type === 'Home').length}
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

function MetricCard({ title, value, icon: Icon, description, trend, trendType, alert }: MetricCardProps) {
  return (
    <Card className={alert && value > 0 ? 'border-amber-300' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${alert && value > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
            {trend && (
              <p className={`text-xs mt-1 ${
                trendType === 'positive' ? 'text-emerald-600' :
                trendType === 'negative' ? 'text-rose-600' : 'text-slate-500'
              }`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${alert && value > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
            <Icon className={`w-6 h-6 ${alert && value > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const variants: Record<Ticket['status'], { bg: string; text: string; label: string }> = {
    'Open': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Open' },
    'Offered': { bg: 'bg-red-100', text: 'text-red-700', label: 'Offered' },
    'In Progress': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' },
    'Resolved': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Resolved' },
    'Closed': { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Closed' },
    'Cancelled': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Cancelled' },
  };

  const variant = variants[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Ticket['priority'] }) {
  const variants: Record<Ticket['priority'], { border: string; text: string }> = {
    'Low': { border: 'border-slate-200', text: 'text-slate-600' },
    'Medium': { border: 'border-red-200', text: 'text-red-600' },
    'High': { border: 'border-amber-200', text: 'text-amber-600' },
    'Critical': { border: 'border-rose-200', text: 'text-rose-600' },
  };

  const variant = variants[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variant.border} ${variant.text}`}>
      {priority}
    </span>
  );
}

function AssetTypeRow({ type, count, color }: { type: string; count: number; color: string }) {
  const total = 4; // Total assets from mock
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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
