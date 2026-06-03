import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Ticket, TicketOffer, OfferType } from '@/store/useCustomerStore';
import type { ProviderStatus, ServiceProvider } from '@/store/useAdminStore';
import type { User } from '@/store/useAuthStore';

export type ServiceTicket = Ticket;

// ==========================================
// STORE INTERFACE
// ==========================================

interface ServiceStoreState {
  opportunities: Ticket[];
  myJobs: Ticket[];
  currentProviderId: string;
  currentProviderName: string;
  providerProfile: ServiceProvider | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProvider: (id: string, name: string) => void;
  resolveProviderSession: (user: User | null) => Promise<void>;
  fetchOpportunities: () => Promise<void>;
  fetchMyJobs: () => Promise<void>;
  fetchProviderProfile: () => Promise<void>;
  
  submitProposal: (
    ticketId: string,
    proposal: { type: OfferType; estimatedCost: number; eta?: string; message: string }
  ) => Promise<TicketOffer>;

  completeJob: (
    ticketId: string,
    billing: { actualCost?: number; notes: string; laborCost?: number; partsCost?: number; extraCost?: number; partsSummary?: string }
  ) => Promise<void>;
  addTicketMessage: (ticketId: string, body: string) => Promise<void>;
  resetDemoData: () => void;
  getNewOpportunities: () => Ticket[];
  getMyProposals: () => Ticket[];
  getActiveJobs: () => Ticket[];
  getTicketById: (id: string) => Ticket | undefined;
  getMyProposalForTicket: (ticketId: string) => TicketOffer | undefined;
}

export const useServiceStore = create<ServiceStoreState>()((set, get) => ({
  opportunities: [],
  myJobs: [],
  currentProviderId: '',
  currentProviderName: '',
  providerProfile: null,
  isLoading: false,
  error: null,

  setProvider: (id, name) => {
    set({ currentProviderId: id, currentProviderName: name });
  },

  resolveProviderSession: async (user) => {
    if (!user) {
      set({ currentProviderId: '', currentProviderName: '', providerProfile: null, error: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const provider = await api.get<ServiceProvider>('/providers/me');
      const normalizedProvider = normalizeServiceProvider(provider);
      set({
        currentProviderId: normalizedProvider.id,
        currentProviderName: normalizedProvider.name,
        providerProfile: normalizedProvider,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        currentProviderId: user.id,
        currentProviderName: user.name,
        providerProfile: null,
        opportunities: [],
        myJobs: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Servis profili yuklenemedi',
      });
    }
  },

  fetchOpportunities: async () => {
    const providerProfile = get().providerProfile;
    if (!providerProfile) {
      set({
        opportunities: [],
        isLoading: false,
        error: get().error ?? 'Servis profili yuklenemedi',
      });
      return;
    }
    if (!canAccessJobs(providerProfile)) {
      set({ opportunities: [], isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const tickets = await api.get<Ticket[]>('/tickets/opportunities', { params: { providerId: get().currentProviderId } });
      set({ opportunities: tickets.map(normalizeServiceTicket), isLoading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Firsatlar yuklenemedi', isLoading: false });
    }
  },

  fetchMyJobs: async () => {
    const providerProfile = get().providerProfile;
    if (!providerProfile) {
      set({
        myJobs: [],
        isLoading: false,
        error: get().error ?? 'Servis profili yuklenemedi',
      });
      return;
    }
    if (!canAccessJobs(providerProfile)) {
      set({ myJobs: [], isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const tickets = await api.get<Ticket[]>('/tickets/provider', { params: { providerId: get().currentProviderId } });
      set({ myJobs: tickets.map(normalizeServiceTicket), isLoading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Isler yuklenemedi', isLoading: false });
    }
  },

  fetchProviderProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const provider = await api.get<ServiceProvider>('/providers/me');
      const normalizedProvider = normalizeServiceProvider(provider);
      set({
        providerProfile: normalizedProvider,
        currentProviderId: normalizedProvider.id,
        currentProviderName: normalizedProvider.name,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        providerProfile: null,
        opportunities: [],
        myJobs: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Servis profili yuklenemedi',
      });
    }
  },

  submitProposal: async (ticketId, proposalData) => {
    if (!canAccessJobs(get().providerProfile)) {
      throw new Error('Servis hesabı operasyon onayı bekliyor');
    }
    const newOffer = await api.post<TicketOffer>(`/tickets/${ticketId}/offers`, {
      providerId: get().currentProviderId,
      providerName: get().currentProviderName,
      ...proposalData,
      eta: proposalData.eta ?? 'Bugün içinde',
    });
    // Refresh opportunities to reflect the new state (e.g. ticket moved out of opportunities if offered by us)
    await get().fetchOpportunities();
    await get().fetchMyJobs();
    return newOffer;
  },

  completeJob: async (ticketId, billing) => {
    if (!canAccessJobs(get().providerProfile)) {
      throw new Error('Servis hesabı operasyon onayı bekliyor');
    }
    const actualCost =
      billing.actualCost ??
      (billing.laborCost ?? 0) + (billing.partsCost ?? 0) + (billing.extraCost ?? 0);
    const notes = billing.partsSummary ? `${billing.notes}\nParça/Malzeme: ${billing.partsSummary}` : billing.notes;
    await api.post<Ticket>(`/tickets/${ticketId}/billing`, { actualCost, notes });
    await get().fetchMyJobs();
  },

  addTicketMessage: async (ticketId, body) => {
    if (!canAccessJobs(get().providerProfile)) {
      throw new Error('Servis hesabı operasyon onayı bekliyor');
    }
    // We can assume the API is the same for customer and provider.
    // The backend TicketService will handle adding the message.
    await api.post(`/tickets/${ticketId}/messages`, { body });
    // Refresh jobs to get new message
    await get().fetchMyJobs();
    await get().fetchOpportunities();
  },

  resetDemoData: () => {
    void get().fetchOpportunities();
    void get().fetchMyJobs();
  },

  getNewOpportunities: () => {
    return get().opportunities;
  },

  getMyProposals: () => {
    // Combine opportunities (where we might have an offer) and myJobs
    const allTickets = [...get().opportunities, ...get().myJobs];
    return allTickets.filter((ticket) =>
      ticket.offers?.some(
        (p) =>
          p.providerId === get().currentProviderId &&
          (p.status === 'PENDING' || p.status === 'ACCEPTED' || p.status === 'REJECTED')
      )
    );
  },

  getActiveJobs: () => {
    return get().myJobs.filter(
      (ticket) =>
        ticket.status === 'IN_PROGRESS'
    );
  },

  getTicketById: (id) => {
    return get().opportunities.find((t) => t.id === id) || get().myJobs.find((t) => t.id === id);
  },

  getMyProposalForTicket: (ticketId) => {
    const ticket = get().getTicketById(ticketId);
    return ticket?.offers?.find((p) => p.providerId === get().currentProviderId);
  },
}));

function normalizeServiceTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,
    mediaUrls: ticket.mediaUrls ?? [],
    offers: ticket.offers ?? [],
    messages: ticket.messages ?? [],
  };
}

function normalizeServiceProvider(provider: ServiceProvider): ServiceProvider {
  return {
    ...provider,
    status: displayProviderStatus(provider.status),
    trusted: provider.trusted ?? provider.isTrusted ?? false,
    isTrusted: provider.isTrusted ?? provider.trusted ?? false,
    specialties: provider.specialties ?? [],
    expertiseTags: provider.expertiseTags ?? [],
    documents: provider.documents ?? [],
  };
}

function canAccessJobs(provider: ServiceProvider | null) {
  return provider?.status === 'Verified';
}

function displayProviderStatus(status: ProviderStatus | string): ProviderStatus {
  const statuses: Record<string, ProviderStatus> = {
    PENDING_VERIFICATION: 'Pending Verification',
    VERIFIED: 'Verified',
    SUSPENDED: 'Suspended',
  };
  return statuses[status] ?? (status as ProviderStatus);
}

// ==========================================
// HELPER HOOKS
// ==========================================

export function useTicketStats() {
  const newOpportunities = useServiceStore((state) => state.opportunities);
  const myJobs = useServiceStore((state) => state.myJobs);
  const currentProviderId = useServiceStore((state) => state.currentProviderId);
  const allTickets = [...newOpportunities, ...myJobs];
  const myProposals = allTickets.filter((ticket) =>
    ticket.offers?.some(
      (offer) =>
        offer.providerId === currentProviderId &&
        (offer.status === 'PENDING' || offer.status === 'ACCEPTED' || offer.status === 'REJECTED')
    )
  );
  const activeJobs = myJobs.filter((ticket) => ticket.status === 'IN_PROGRESS');

  return {
    newOpportunities: newOpportunities.length,
    myProposals: myProposals.length,
    activeJobs: activeJobs.length,
    completedJobs: useServiceStore((state) => state.myJobs).filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
  };
}

export function useNewOpportunities() {
  return useServiceStore((state) => state.opportunities);
}

export function useMyProposals() {
  const opportunities = useServiceStore((state) => state.opportunities);
  const myJobs = useServiceStore((state) => state.myJobs);
  const currentProviderId = useServiceStore((state) => state.currentProviderId);

  return [...opportunities, ...myJobs].filter((ticket) =>
    ticket.offers?.some(
      (offer) =>
        offer.providerId === currentProviderId &&
        (offer.status === 'PENDING' || offer.status === 'ACCEPTED' || offer.status === 'REJECTED')
    )
  );
}

export function useActiveJobs() {
  const myJobs = useServiceStore((state) => state.myJobs);
  return myJobs.filter((ticket) => ticket.status === 'IN_PROGRESS');
}
