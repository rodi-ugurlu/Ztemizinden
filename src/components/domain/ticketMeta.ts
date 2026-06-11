import type { TicketCategory, TicketPriority, TicketStatus } from '@/store/useCustomerStore';
import { Droplets, Settings, Wrench, Zap } from 'lucide-react';

export const ticketStatusMeta: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: 'Açık', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  OFFERED: { label: 'Teklifli', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_PROGRESS: { label: 'Serviste', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RESOLVED: { label: 'Çözüldü', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'Kapalı', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  CANCELLED: { label: 'İptal', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const ticketPriorityMeta: Record<TicketPriority, { label: string; className: string }> = {
  Low: { label: 'Düşük', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  Medium: { label: 'Orta', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  High: { label: 'Yüksek', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Critical: { label: 'Kritik', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const ticketCategoryMeta: Record<
  TicketCategory,
  { label: string; description: string; icon: typeof Wrench }
> = {
  Electric: {
    label: 'Elektrik',
    description: 'Elektrik, güç ve kontrol sistemleri',
    icon: Zap,
  },
  Mechanic: {
    label: 'Mekanik',
    description: 'Mekanik parçalar ve hareket sistemleri',
    icon: Settings,
  },
  Pneumatic: {
    label: 'Pnömatik',
    description: 'Pnömatik ve havalı sistemler',
    icon: Droplets,
  },
  Hydraulic: {
    label: 'Hidrolik',
    description: 'Hidrolik sistemler ve pompalar',
    icon: Droplets,
  },
  Software: {
    label: 'Yazılım',
    description: 'Yazılım, HMI ve PLC kontrolü',
    icon: Settings,
  },
  General: {
    label: 'Genel',
    description: 'Genel bakım ve diğer arızalar',
    icon: Wrench,
  },
};

export function ticketStatusLabel(status: TicketStatus | string) {
  return ticketStatusMeta[status as TicketStatus]?.label ?? status;
}

export function ticketPriorityLabel(priority: TicketPriority | string) {
  return ticketPriorityMeta[priority as TicketPriority]?.label ?? priority;
}

export function ticketCategoryLabel(category: TicketCategory | string) {
  return ticketCategoryMeta[category as TicketCategory]?.label ?? category;
}

export function ticketCategoryDescription(category: TicketCategory | string) {
  return ticketCategoryMeta[category as TicketCategory]?.description ?? category;
}

export function ticketCategoryIcon(category: TicketCategory | string) {
  return ticketCategoryMeta[category as TicketCategory]?.icon ?? Wrench;
}

export function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
