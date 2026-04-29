import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useServiceStore,
  useTicketStats,
  type ServiceTicket,
} from '@/store/useServiceStore';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import FinalBillingDialog from './components/FinalBillingDialog';
import {
  Inbox,
  Send,
  Hammer,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  Zap,
  Droplets,
  Settings,
  DollarSign,
  AlertCircle,
  Calendar,
  ArrowRight,
} from 'lucide-react';

/**
 * ServiceDashboard Component
 *
 * Kanban-style ticket board for Service Provider Portal.
 * Three columns: New Opportunities, My Proposals, Active Jobs
 */
export default function ServiceDashboard() {
  const stats = useTicketStats();
  const newOpportunities = useServiceStore((state) => state.getNewOpportunities());
  const myProposals = useServiceStore((state) => state.getMyProposals());
  const activeJobs = useServiceStore((state) => state.getActiveJobs());

  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [billingTicket, setBillingTicket] = useState<ServiceTicket | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  const handleTicketClick = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const handleCompleteJob = (ticket: ServiceTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    setBillingTicket(ticket);
    setIsBillingOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">İş Panosu</h1>
        <p className="text-neutral-400 mt-1">
          Yeni fırsatları değerlendirin ve aktif işleri yönetin
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Yeni Fırsatlar"
          value={stats.newOpportunities}
          icon={Inbox}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="Tekliflerim"
          value={stats.myProposals}
          icon={Send}
          color="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          title="Aktif İşler"
          value={stats.activeJobs}
          icon={Hammer}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          title="Tamamlanan"
          value={stats.completedJobs}
          icon={CheckCircle2}
          color="bg-neutral-700 text-neutral-400"
        />
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
            const myProposal = ticket.proposals.find(
              (p) => p.serviceProviderId === 'sp-001'
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
          color="border-t-emerald-500"
        >
          {activeJobs.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              variant="active"
              onClick={() => handleTicketClick(ticket)}
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
    <Card className="bg-neutral-900 border-neutral-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
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
    <div className={`flex flex-col h-full bg-neutral-900/50 rounded-lg border border-neutral-800 ${color} border-t-4`}>
      <CardHeader className="pb-3 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            {count}
          </Badge>
        </div>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </CardHeader>
      <CardContent className="flex-1 p-3 space-y-3 overflow-y-auto">
        {children}
      </CardContent>
    </div>
  );
}

interface TicketCardProps {
  ticket: ServiceTicket;
  variant: 'opportunity' | 'proposal' | 'active';
  proposalStatus?: string;
  onClick: () => void;
  onComplete?: (e: React.MouseEvent) => void;
}

function TicketCard({
  ticket,
  variant,
  proposalStatus,
  onClick,
  onComplete,
}: TicketCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electric':
        return Zap;
      case 'Mechanic':
        return Settings;
      case 'Pneumatic':
      case 'Hydraulic':
        return Droplets;
      default:
        return Wrench;
    }
  };

  const CategoryIcon = getCategoryIcon(ticket.category);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-neutral-700 text-neutral-400 border-neutral-600';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'opportunity':
        return 'hover:border-blue-500/50 hover:bg-neutral-800';
      case 'proposal':
        return 'hover:border-amber-500/50 hover:bg-neutral-800';
      case 'active':
        return 'hover:border-emerald-500/50 hover:bg-neutral-800 border-emerald-500/30';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-neutral-900 rounded-lg p-4 border border-neutral-800 cursor-pointer transition-all ${getVariantStyles()}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500">
            #{ticket.id.split('-')[1]}
          </span>
        </div>
        <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-medium text-white text-sm mb-2 line-clamp-2">
        {ticket.title}
      </h3>

      {/* Customer */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{ticket.customerCompany}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-neutral-800 rounded flex items-center justify-center">
            <CategoryIcon className="w-3 h-3 text-amber-500" />
          </div>
          <span className="text-xs text-neutral-500">{ticket.category}</span>
        </div>

        {variant === 'opportunity' && (
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Clock className="w-3 h-3" />
            {getTimeAgo(ticket.createdAt)}
          </div>
        )}

        {variant === 'proposal' && proposalStatus && (
          <ProposalStatusBadge status={proposalStatus} />
        )}

        {variant === 'active' && (
          <Button
            size="sm"
            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            onClick={onComplete}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Tamamla
          </Button>
        )}
      </div>
    </div>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  const styles = {
    Pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
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
      <Inbox className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
      <p className="text-sm text-neutral-500">{message}</p>
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

