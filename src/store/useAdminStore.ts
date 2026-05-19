import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Ticket, TicketCategory } from '@/store/useCustomerStore';

export type ProviderStatus = 'Pending Verification' | 'Verified' | 'Suspended';
export type SlaStatus = 'Healthy' | 'Watch' | 'Breach';
export type AdminTicketStatus = 'Open' | 'Offered' | 'In Progress' | 'Resolved' | 'Closed' | 'Cancelled';

export interface ProviderDocument {
  id: string;
  type: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadDate: string;
  url?: string;
  originalFileName?: string;
  verifiedDate?: string;
  notes?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  status: ProviderStatus;
  trusted: boolean;
  isTrusted: boolean;
  rating: number;
  completedJobs: number;
  specialties: TicketCategory[];
  documents: ProviderDocument[];
  createdAt: string;
  updatedAt: string;
}

export type ProviderReviewState =
  | 'missing-documents'
  | 'review-required'
  | 'blocked'
  | 'ready'
  | 'approved'
  | 'suspended';

export interface GlobalTicket extends Omit<Ticket, 'status'> {
  status: AdminTicketStatus;
  responseTime: number;
  opsNote?: string;
  customerCity?: string;
}

export interface GlobalMetrics {
  totalActiveTickets: number;
  totalRegisteredProviders: number;
  verifiedProviders: number;
  averageResponseTime: number;
  ticketsResolvedToday: number;
  criticalTickets: number;
  pendingVerifications: number;
  pendingProviderDocumentReviews: number;
  readyProviderApprovals: number;
  blockedProviderApprovals: number;
  slaBreaches: number;
  unassignedOpenTickets: number;
}

export interface ProviderMatch {
  provider: ServiceProvider;
  score: number;
  etaMinutes: number;
  reasons: string[];
}

interface BackendProviderMatch {
  providerId: string;
  providerName: string;
  city: string;
  score: number;
  etaMinutes: number;
  trusted: boolean;
}

interface AdminStoreState {
  providers: ServiceProvider[];
  tickets: GlobalTicket[];
  providerMatches: Record<string, ProviderMatch[]>;
  isLoading: boolean;
  error: string | null;

  fetchProviders: () => Promise<void>;
  fetchQueue: () => Promise<void>;
  verifyProvider: (providerId: string) => Promise<void>;
  rejectProvider: (providerId: string) => Promise<void>;
  toggleTrustedStatus: (providerId: string, isTrusted?: boolean) => Promise<void>;
  assignTicket: (ticketId: string, providerId: string, providerName?: string, opsNote?: string) => Promise<void>;
  verifyDocument: (providerId: string, documentId: string, notes?: string) => Promise<void>;
  rejectDocument: (providerId: string, documentId: string, notes?: string) => Promise<void>;

  getMetrics: () => GlobalMetrics;
  getCriticalTickets: () => GlobalTicket[];
  getPendingVerifications: () => ServiceProvider[];
  getVerifiedProviders: () => ServiceProvider[];
  getProviderMatches: (ticketId: string) => ProviderMatch[];
  getSlaStatus: (ticketId: string) => SlaStatus;
  getProviderById: (id: string) => ServiceProvider | undefined;
  getTicketById: (id: string) => GlobalTicket | undefined;
}

export const useAdminStore = create<AdminStoreState>()((set, get) => ({
  providers: [],
  tickets: [],
  providerMatches: {},
  isLoading: false,
  error: null,

  fetchProviders: async () => {
    set({ isLoading: true, error: null });
    try {
      const providers = await api.get<ServiceProvider[]>('/providers');
      set({ providers: providers.map(normalizeProvider), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Saglayicilar yuklenemedi', isLoading: false });
    }
  },

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = (await api.get<Ticket[]>('/admin/dispatch/queue')).map(normalizeTicket);
      const matchEntries = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const matches = await api.get<BackendProviderMatch[]>(`/admin/dispatch/tickets/${ticket.id}/matches`);
            return [ticket.id, matches.map((match) => normalizeProviderMatch(match, get().providers))] as const;
          } catch {
            return [ticket.id, []] as const;
          }
        })
      );
      set({ tickets, providerMatches: Object.fromEntries(matchEntries), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Dispatch queue yuklenemedi', isLoading: false });
    }
  },

  verifyProvider: async (providerId) => {
    await api.post(`/providers/${providerId}/approve`);
    await get().fetchProviders();
  },

  rejectProvider: async (providerId) => {
    await api.post(`/providers/${providerId}/reject`);
    await get().fetchProviders();
  },

  toggleTrustedStatus: async (providerId, isTrusted) => {
    const provider = get().providers.find((item) => item.id === providerId);
    const trusted = isTrusted ?? !provider?.isTrusted;
    await api.put(`/providers/${providerId}/trusted`, { trusted });
    await get().fetchProviders();
  },

  assignTicket: async (ticketId, providerId, providerName, opsNote) => {
    await api.post(`/admin/dispatch/tickets/${ticketId}/assign`, { providerId });
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: 'In Progress',
              assignedProviderId: providerId,
              assignedProviderName: providerName ?? get().providers.find((provider) => provider.id === providerId)?.name,
              opsNote,
            }
          : ticket
      ),
    }));
    await get().fetchQueue();
  },

  verifyDocument: async (providerId, documentId, notes) => {
    await api.post(`/providers/${providerId}/documents/${documentId}/verify`, { notes });
    await get().fetchProviders();
  },

  rejectDocument: async (providerId, documentId, notes) => {
    await api.post(`/providers/${providerId}/documents/${documentId}/reject`, { notes });
    await get().fetchProviders();
  },

  getMetrics: () => {
    const activeTickets = get().tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Offered');
    const verifiedProviders = get().providers.filter((p) => p.status === 'Verified');
    const today = new Date().toISOString().split('T')[0];
    const averageResponseTime = activeTickets.length
      ? Math.round(activeTickets.reduce((sum, ticket) => sum + ticket.responseTime, 0) / activeTickets.length)
      : 0;
    const pendingProviders = get().providers.filter((p) => p.status === 'Pending Verification');
    const pendingProviderDocumentReviews = pendingProviders.filter(
      (provider) => getProviderReviewSummary(provider).state === 'review-required'
    ).length;
    const readyProviderApprovals = pendingProviders.filter(
      (provider) => getProviderReviewSummary(provider).state === 'ready'
    ).length;
    const blockedProviderApprovals = pendingProviders.filter((provider) =>
      ['missing-documents', 'blocked'].includes(getProviderReviewSummary(provider).state)
    ).length;

    return {
      totalActiveTickets: activeTickets.length,
      totalRegisteredProviders: get().providers.length,
      verifiedProviders: verifiedProviders.length,
      averageResponseTime,
      ticketsResolvedToday: get().tickets.filter((t) => t.status === 'Resolved' && t.updatedAt.startsWith(today)).length,
      criticalTickets: get().tickets.filter((t) => t.priority === 'Critical' && (t.status === 'Open' || t.status === 'In Progress')).length,
      pendingVerifications: pendingProviderDocumentReviews + readyProviderApprovals,
      pendingProviderDocumentReviews,
      readyProviderApprovals,
      blockedProviderApprovals,
      slaBreaches: get().tickets.filter((ticket) => get().getSlaStatus(ticket.id) === 'Breach').length,
      unassignedOpenTickets: get().tickets.filter((ticket) => ticket.status === 'Open' && !ticket.assignedProviderId).length,
    };
  },

  getCriticalTickets: () => {
    return get().tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed');
  },

  getPendingVerifications: () => {
    const priority: Record<ProviderReviewState, number> = {
      ready: 0,
      'review-required': 1,
      'missing-documents': 2,
      blocked: 3,
      approved: 4,
      suspended: 5,
    };
    return get().providers
      .filter((p) => p.status === 'Pending Verification')
      .slice()
      .sort((first, second) => priority[getProviderReviewSummary(first).state] - priority[getProviderReviewSummary(second).state]);
  },

  getVerifiedProviders: () => {
    return get().providers.filter((p) => p.status === 'Verified');
  },

  getProviderMatches: (ticketId) => {
    const ticket = get().tickets.find((item) => item.id === ticketId);
    if (!ticket) return [];

    return get().providerMatches[ticketId] ?? [];
  },

  getSlaStatus: (ticketId) => {
    const ticket = get().tickets.find((item) => item.id === ticketId);
    if (!ticket) return 'Healthy';
    if (ticket.priority === 'Critical' && ticket.responseTime > 45) return 'Breach';
    if (ticket.priority === 'High' && ticket.responseTime > 90) return 'Watch';
    return 'Healthy';
  },

  getProviderById: (id) => {
    return get().providers.find((p) => p.id === id);
  },

  getTicketById: (id) => {
    return get().tickets.find((t) => t.id === id);
  },
}));

export function useAdminMetrics() {
  useAdminStore((state) => state.tickets);
  useAdminStore((state) => state.providers);
  return useAdminStore((state) => state.getMetrics)();
}

export function useCriticalTickets() {
  useAdminStore((state) => state.tickets);
  return useAdminStore((state) => state.getCriticalTickets)();
}

export function usePendingVerifications() {
  useAdminStore((state) => state.providers);
  return useAdminStore((state) => state.getPendingVerifications)();
}

export function useVerifiedProviders() {
  useAdminStore((state) => state.providers);
  return useAdminStore((state) => state.getVerifiedProviders)();
}

function normalizeTicket(ticket: Ticket): GlobalTicket {
  return {
    ...ticket,
    status: displayTicketStatus(ticket.status),
    mediaUrls: ticket.mediaUrls ?? [],
    offers: ticket.offers ?? [],
    messages: ticket.messages ?? [],
    responseTime: minutesSince(ticket.createdAt),
    customerCity: cityOf(ticket.customerLocation),
  };
}

function normalizeProvider(provider: ServiceProvider): ServiceProvider {
  return {
    ...provider,
    status: displayProviderStatus(provider.status),
    trusted: provider.trusted ?? provider.isTrusted ?? false,
    isTrusted: provider.isTrusted ?? provider.trusted ?? false,
    documents: provider.documents ?? [],
  };
}

function displayTicketStatus(status: Ticket['status'] | AdminTicketStatus): AdminTicketStatus {
  const statuses: Record<string, AdminTicketStatus> = {
    OPEN: 'Open',
    OFFERED: 'Offered',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled',
  };
  return statuses[status] ?? (status as AdminTicketStatus);
}

function displayProviderStatus(status: ProviderStatus | string): ProviderStatus {
  const statuses: Record<string, ProviderStatus> = {
    PENDING_VERIFICATION: 'Pending Verification',
    VERIFIED: 'Verified',
    SUSPENDED: 'Suspended',
  };
  return statuses[status] ?? (status as ProviderStatus);
}

function minutesSince(value: string) {
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.round((Date.now() - created) / 60_000));
}

function cityOf(location?: string) {
  return location?.split(',')[0]?.trim() ?? '';
}

function normalizeProviderMatch(match: BackendProviderMatch, providers: ServiceProvider[]): ProviderMatch {
  const provider =
    providers.find((item) => item.id === match.providerId) ??
    ({
      id: match.providerId,
      name: match.providerName,
      contactName: '-',
      email: '',
      phone: '',
      city: match.city,
      status: 'Verified',
      trusted: match.trusted,
      isTrusted: match.trusted,
      rating: 0,
      completedJobs: 0,
      specialties: [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies ServiceProvider);

  const reasons = [
    `${match.score}/100 uygunluk`,
    `ETA ${match.etaMinutes} dk`,
    ...(match.trusted ? ['Guvenilir servis'] : []),
  ];

  return { provider, score: match.score, etaMinutes: match.etaMinutes, reasons };
}

export function getProviderReviewSummary(provider: Pick<ServiceProvider, 'status' | 'documents'>): {
  state: ProviderReviewState;
  label: string;
  description: string;
} {
  if (provider.status === 'Verified') {
    return {
      state: 'approved',
      label: 'Onaylı',
      description: 'Servis operasyon tarafından onaylandı.',
    };
  }

  if (provider.status === 'Suspended') {
    return {
      state: 'suspended',
      label: 'Askıda',
      description: 'Servis hesabı askıya alındı.',
    };
  }

  if (provider.documents.length === 0) {
    return {
      state: 'missing-documents',
      label: 'Belge Eksik',
      description: 'Onay için en az bir sağlayıcı belgesi yüklenmeli.',
    };
  }

  if (provider.documents.some((document) => document.status === 'Rejected')) {
    return {
      state: 'blocked',
      label: 'Belge Reddedildi',
      description: 'Reddedilen belgeler yenilenmeden sağlayıcı onaylanamaz.',
    };
  }

  if (provider.documents.some((document) => document.status === 'Pending')) {
    return {
      state: 'review-required',
      label: 'Belge İncelemesi',
      description: 'Bekleyen belgeler operasyon tarafından incelenmeli.',
    };
  }

  return {
    state: 'ready',
    label: 'Onaya Hazır',
    description: 'Tüm belgeler onaylandı; sağlayıcı onaylanabilir.',
  };
}

export function getProviderApprovalBlocker(provider: Pick<ServiceProvider, 'status' | 'documents'>) {
  const summary = getProviderReviewSummary(provider);
  return summary.state === 'ready' ? null : summary.description;
}
