import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useServiceStore,
  useActiveJobs,
  useMyProposals,
  useNewOpportunities,
  useTicketStats,
} from '@/store/useServiceStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Ticket } from '@/store/useCustomerStore';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import FinalBillingDialog from './components/FinalBillingDialog';
import {
  Inbox,
  Send,
  Hammer,
  CheckCircle2,
  Clock,
  MapPin,
  ReceiptText,
  Route,
  Wrench,
  Zap,
  Droplets,
  Settings,
} from 'lucide-react';

/**
 * ServiceDashboard Component
 *
 * Kanban-style ticket board for Service Provider Portal.
 * Three columns: New Opportunities, My Proposals, Active Jobs
 */
export default function ServiceDashboard() {
  const stats = useTicketStats();
  const newOpportunities = useNewOpportunities();
  const myProposals = useMyProposals();
  const activeJobs = useActiveJobs();
  const { myJobs, fetchOpportunities, fetchMyJobs, currentProviderId, resolveProviderSession } = useServiceStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void resolveProviderSession(user);
  }, [user, resolveProviderSession]);

  useEffect(() => {
    if (currentProviderId) {
      fetchOpportunities();
      fetchMyJobs();
    }
  }, [currentProviderId, fetchOpportunities, fetchMyJobs]);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [billingTicket, setBillingTicket] = useState<Ticket | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  
  const currentFieldJob = activeJobs[0];
  const billingSubmittedJobs = myJobs.filter((ticket) => ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL');

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const handleCompleteJob = (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    setBillingTicket(ticket);
    setIsBillingOpen(true);
  };

  const handleAdvanceJob = (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    // For MVP, if it's in progress, advancing it means completing it
    if (ticket.status === 'IN_PROGRESS') {
      handleCompleteJob(ticket, e);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">İş Panosu</h1>
        <p className="text-slate-400 mt-1">
          Yeni fırsatları değerlendirin ve aktif işleri yönetin
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Yeni Fırsatlar"
          value={stats.newOpportunities}
          icon={Inbox}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Tekliflerim"
          value={stats.myProposals}
          icon={Send}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Aktif İşler"
          value={stats.activeJobs}
          icon={Hammer}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Tamamlanan"
          value={stats.completedJobs}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="lg:col-span-2 bg-white border-slate-200">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Sıradaki Saha İşi</p>
                <h2 className="text-lg font-semibold text-slate-900 mt-1">
                  {currentFieldJob ? currentFieldJob.title : 'Aktif saha işi yok'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {currentFieldJob
                    ? `${currentFieldJob.customerCompany} · ${currentFieldJob.customerLocation}`
                    : 'Yeni fırsatlardan teklif vererek iş akışını başlatabilirsiniz.'}
                </p>
              </div>
              {currentFieldJob ? (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-600 border-indigo-200/30">
                    Çalışıyor
                  </Badge>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleTicketClick(currentFieldJob)}
                  >
                    <Route className="w-4 h-4 mr-2" />
                    İş Emri
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-50 border-slate-200 text-slate-700"
                  onClick={() => newOpportunities[0] && handleTicketClick(newOpportunities[0])}
                  disabled={newOpportunities.length === 0}
                >
                  <Inbox className="w-4 h-4 mr-2" />
                  Fırsat Aç
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Hakediş Gönderilen</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{billingSubmittedJobs.length}</p>
                <p className="text-xs text-slate-500 mt-1">Müşteri onayı bekleyen kapanışlar</p>
              </div>
              <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center">
                <ReceiptText className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: New Opportunities */}
        <KanbanColumn
          title="Yeni Fırsatlar"
          subtitle="Müşteri arıza kayıtları"
          icon={Inbox}
          count={newOpportunities.length}
          color="border-t-blue-500"
        >
          {newOpportunities.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              variant="opportunity"
              onClick={() => handleTicketClick(ticket)}
            />
          ))}
          {newOpportunities.length === 0 && (
            <EmptyColumn message="Yeni fırsat bulunmuyor" />
          )}
        </KanbanColumn>

        {/* Column 2: My Proposals */}
        <KanbanColumn
          title="Tekliflerim"
          subtitle="Bekleyen ve kabul edilen"
          icon={Send}
          count={myProposals.length}
          color="border-t-amber-500"
        >
          {myProposals.map((ticket) => {
            const myProposal = ticket.offers?.find(
              (p) => p.providerId === currentProviderId
            );
            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                variant="proposal"
                proposalStatus={myProposal?.status}
                onClick={() => handleTicketClick(ticket)}
              />
            );
          })}
          {myProposals.length === 0 && (
            <EmptyColumn message="Henüz teklif vermediniz" />
          )}
        </KanbanColumn>

        {/* Column 3: Active Jobs */}
        <KanbanColumn
          title="Aktif İşler"
          subtitle="Devam eden servisler"
          icon={Hammer}
          count={activeJobs.length}
          color="border-t-indigo-500"
        >
          {activeJobs.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              variant="active"
              onClick={() => handleTicketClick(ticket)}
              onAdvance={(e) => handleAdvanceJob(ticket, e)}
              onComplete={(e) => handleCompleteJob(ticket, e)}
            />
          ))}
          {activeJobs.length === 0 && (
            <EmptyColumn message="Aktif iş bulunmuyor" />
          )}
        </KanbanColumn>
      </div>

      {/* Drawers & Modals */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <FinalBillingDialog
        ticket={billingTicket}
        isOpen={isBillingOpen}
        onClose={() => {
          setIsBillingOpen(false);
          setBillingTicket(null);
        }}
      />
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  count: number;
  color: string;
  children: React.ReactNode;
}

function KanbanColumn({
  title,
  subtitle,
  icon: Icon,
  count,
  color,
  children,
}: KanbanColumnProps) {
  return (
    <div className={`flex flex-col h-full bg-white/50 rounded-lg border border-slate-200 ${color} border-t-4`}>
      <CardHeader className="pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-red-600" />
            <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-slate-50 text-slate-700 hover:bg-red-50"
          >
            {count}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </CardHeader>
      <CardContent className="flex-1 p-3 space-y-3 overflow-y-auto">
        {children}
      </CardContent>
    </div>
  );
}

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

interface TicketCardProps {
  ticket: Ticket;
  variant: 'opportunity' | 'proposal' | 'active';
  proposalStatus?: string;
  onClick: () => void;
  onAdvance?: (e: React.MouseEvent) => void;
  onComplete?: (e: React.MouseEvent) => void;
}

function TicketCard({
  ticket,
  variant,
  proposalStatus,
  onClick,
  onAdvance,
  onComplete,
}: TicketCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-600 border-red-200/30';
      case 'High':
        return 'bg-orange-50 text-orange-600 border-orange-200/30';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 border-amber-200/30';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'opportunity':
        return 'hover:border-red-200/50 hover:bg-red-50';
      case 'proposal':
        return 'hover:border-red-200/50 hover:bg-red-50';
      case 'active':
        return 'hover:border-red-200/50 hover:bg-red-50 border-red-200/30';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 border border-slate-200 cursor-pointer transition-all ${getVariantStyles()}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">
            #{ticket.id.split('-')[1]}
          </span>
        </div>
        <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
          {priorityLabel(ticket.priority)}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-medium text-slate-900 text-sm mb-2 line-clamp-2">
        {ticket.title}
      </h3>

      {/* Customer */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{ticket.customerCompany}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center">
            <ServiceCategoryIcon category={ticket.category} className="w-3 h-3 text-red-600" />
          </div>
          <span className="text-xs text-slate-500">{categoryLabel(ticket.category)}</span>
        </div>

        {variant === 'opportunity' && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {getTimeAgo(ticket.createdAt)}
          </div>
        )}

        {variant === 'proposal' && proposalStatus && (
          <ProposalStatusBadge status={proposalStatus} />
        )}

        {variant === 'active' && (
          <JobActionButton ticket={ticket} onAdvance={onAdvance} onComplete={onComplete} />
        )}
      </div>

      {variant === 'active' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded bg-slate-50/70 border border-slate-200 p-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">Durum</p>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-600 border-indigo-200/30">
                Aktif
              </Badge>
            </div>
          </div>
          <div className="rounded bg-slate-50/70 border border-slate-200 p-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">Süre</p>
            <p className="text-xs text-slate-700 mt-1">{getWorkDuration(ticket)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function JobActionButton({
  ticket,
  onAdvance,
  onComplete,
}: {
  ticket: Ticket;
  onAdvance?: (e: React.MouseEvent) => void;
  onComplete?: (e: React.MouseEvent) => void;
}) {
  if (ticket.status === 'IN_PROGRESS') {
    return (
      <Button
        size="sm"
        className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs"
        onClick={onComplete}
      >
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Hakediş
      </Button>
    );
  }

  if (ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL' || ticket.status === 'CLOSED') {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200/30">
        Hakediş Gönderildi
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs"
      onClick={onAdvance}
    >
      İşlem
    </Button>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-600 border-amber-200/30',
    Accepted: 'bg-emerald-50 text-emerald-600 border-emerald-200/30',
    Rejected: 'bg-red-50 text-red-600 border-red-200/30',
  };

  const labels = {
    Pending: 'Beklemede',
    Accepted: 'Kabul',
    Rejected: 'Red',
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs ${styles[status as keyof typeof styles] || styles.Pending}`}
    >
      {labels[status as keyof typeof labels] || status}
    </Badge>
  );
}

function EmptyColumn({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <Inbox className="w-8 h-8 text-slate-700 mx-auto mb-2" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Şimdi';
  } else if (diffInHours < 24) {
    return `${diffInHours}s`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}g`;
  }
}

function getWorkDuration(ticket: Ticket) {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(ticket.updatedAt).getTime()) / 60000)
  );
  return `${minutes} dk`;
}

function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    Critical: 'Kritik',
    High: 'Yüksek',
    Medium: 'Orta',
    Low: 'Düşük',
  };
  return labels[priority] || priority;
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
