import { Badge } from '@/components/ui/badge';
import type { TicketCategory, TicketPriority, TicketStatus } from '@/store/useCustomerStore';

import { ticketCategoryLabel, ticketCategoryMeta, ticketPriorityMeta, ticketStatusMeta } from './ticketMeta';

export function TicketStatusBadge({ status, className = '' }: { status: TicketStatus | string; className?: string }) {
  const meta = ticketStatusMeta[status as TicketStatus];

  return (
    <Badge variant="outline" className={`${meta?.className ?? ticketStatusMeta.OPEN.className} ${className}`}>
      {meta?.label ?? status}
    </Badge>
  );
}

export function TicketPriorityBadge({
  priority,
  className = '',
}: {
  priority: TicketPriority | string;
  className?: string;
}) {
  const meta = ticketPriorityMeta[priority as TicketPriority];

  return (
    <Badge variant="outline" className={`${meta?.className ?? ticketPriorityMeta.Low.className} ${className}`}>
      {meta?.label ?? priority}
    </Badge>
  );
}

export function TicketCategoryBadge({
  category,
  className = '',
}: {
  category: TicketCategory | string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={className}>
      {ticketCategoryLabel(category)}
    </Badge>
  );
}

export function TicketCategoryIcon({ category, className }: { category: TicketCategory | string; className?: string }) {
  const Icon = ticketCategoryMeta[category as TicketCategory]?.icon ?? ticketCategoryMeta.General.icon;
  return <Icon className={className} />;
}
