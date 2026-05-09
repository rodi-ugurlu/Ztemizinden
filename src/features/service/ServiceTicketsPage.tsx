import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Wrench,
  Zap,
  Droplets,
  Settings,
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
  const { opportunities, myJobs, fetchOpportunities, fetchMyJobs, currentProviderId, resolveProviderSession } = useServiceStore();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
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
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

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
                    <ServiceCategoryIcon category={ticket.category} className="w-5 h-5 text-red-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">
                        #{ticket.id.split('-')[1]}
                      </span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
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
                      {formatDate(ticket.createdAt)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {categoryLabel(ticket.category)}
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
        ticket={selectedTicket}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function ServiceCategoryIcon({ category, className }: { category: string; className: string }) {
  switch (category) {
    case 'Electric':
      return <Zap className={className} />;
    case 'Mechanic':
      return <Settings className={className} />;
    case 'Pneumatic':
    case 'Hydraulic':
      return <Droplets className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    OFFERED: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-50 text-slate-600 border-slate-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels: Record<string, string> = {
    OPEN: 'Açık',
    OFFERED: 'Teklif Verildi',
    IN_PROGRESS: 'Devam Ediyor',
    RESOLVED: 'Çözüldü',
    CLOSED: 'Kapandı',
    CANCELLED: 'İptal',
  };

  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status] || styles.OPEN}`}>
      {labels[status] || status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-red-50 text-red-600 border-red-200',
    High: 'bg-orange-50 text-orange-600 border-orange-200',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200',
    Low: 'bg-slate-50 text-slate-500 border-slate-200',
  };

  const labels: Record<string, string> = {
    Critical: 'Kritik',
    High: 'Yüksek',
    Medium: 'Orta',
    Low: 'Düşük',
  };

  return (
    <Badge variant="outline" className={`text-[10px] ${styles[priority] || styles.Low}`}>
      {labels[priority] || priority}
    </Badge>
  );
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    Electric: 'Elektrik',
    Mechanic: 'Mekanik',
    Pneumatic: 'Pnömatik',
    Hydraulic: 'Hidrolik',
    Software: 'Yazılım',
    General: 'Genel',
  };
  return labels[category] || category;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
