import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Ticket, TicketOffer, OfferType } from '@/store/useCustomerStore';
import type { ServiceProvider } from '@/store/useAdminStore';
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
      set({ currentProviderId: '', currentProviderName: '', providerProfile: null });
      return;
    }

    try {
      const provider = await api.get<ServiceProvider>('/providers/me');
      set({
        currentProviderId: provider.id,
        currentProviderName: provider.name,
        providerProfile: provider,
      });
    } catch {
      set({
        currentProviderId: user.id,
        currentProviderName: user.name,
        providerProfile: null,
      });
    }
  },

  fetchOpportunities: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await api.get<Ticket[]>('/tickets/opportunities', { params: { providerId: get().currentProviderId } });
      set({ opportunities: tickets.map(normalizeServiceTicket), isLoading: false });
    } catch (error: any) {
      set({ error: error instanceof Error ? error.message : 'Firsatlar yuklenemedi', isLoading: false });
    }
  },

  fetchMyJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await api.get<Ticket[]>('/tickets/provider', { params: { providerId: get().currentProviderId } });
      set({ myJobs: tickets.map(normalizeServiceTicket), isLoading: false });
    } catch (error: any) {
      set({ error: error instanceof Error ? error.message : 'Isler yuklenemedi', isLoading: false });
    }
  },

  fetchProviderProfile: async () => {
    try {
      const provider = await api.get<ServiceProvider>('/providers/me');
      set({
        providerProfile: provider,
        currentProviderId: provider.id,
        currentProviderName: provider.name,
      });
    } catch {
      if (!get().currentProviderId) return;
      try {
        const providers = await api.get<ServiceProvider[]>('/providers');
        const provider = providers.find((item) => item.id === get().currentProviderId) ?? null;
        set({ providerProfile: provider });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Servis profili yuklenemedi' });
      }
    }
  },

  submitProposal: async (ticketId, proposalData) => {
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
    const actualCost =
      billing.actualCost ??
      (billing.laborCost ?? 0) + (billing.partsCost ?? 0) + (billing.extraCost ?? 0);
    const notes = billing.partsSummary ? `${billing.notes}\nParça/Malzeme: ${billing.partsSummary}` : billing.notes;
    await api.post<Ticket>(`/tickets/${ticketId}/billing`, { actualCost, notes });
    await get().fetchMyJobs();
  },

  addTicketMessage: async (ticketId, body) => {
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
