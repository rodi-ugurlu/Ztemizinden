import { create } from 'zustand';
import { api } from '@/lib/api';
import { latestConversationMessage, sortTicketMessages } from '@/lib/ticketMessages';
import type { Ticket, TicketConversation, TicketMessage, TicketOffer, OfferType, TicketCategory } from '@/store/useCustomerStore';
import type { ProviderStatus, ServiceProvider } from '@/store/useAdminStore';
import type { User } from '@/store/useAuthStore';

export type ServiceTicket = Ticket;

export type UpdateProviderProfileInput = {
  name: string;
  contactName: string;
  phone: string;
  city: string;
  district: string;
  logoUrl?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  specialties: TicketCategory[];
  expertiseTags: string[];
  coverageDistricts: string[];
};

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
  updateProviderProfile: (profile: UpdateProviderProfileInput) => Promise<ServiceProvider>;
  
  submitProposal: (
    ticketId: string,
    proposal: { type: OfferType; estimatedCost: number; eta?: string; message: string }
  ) => Promise<TicketOffer>;

  completeJob: (
    ticketId: string,
    billing: { actualCost?: number; notes: string; laborCost?: number; partsCost?: number; extraCost?: number; partsSummary?: string }
  ) => Promise<void>;
  addTicketMessage: (ticketId: string, body: string) => Promise<void>;
  addConversationMessage: (ticketId: string, conversationId: string, body: string) => Promise<void>;
  receiveTicketMessage: (message: TicketMessage) => void;
  receiveTicketUpdate: (ticket: Ticket) => void;
  markTicketMessagesRead: (ticketId: string) => Promise<void>;
  markConversationMessagesRead: (ticketId: string, conversationId: string) => Promise<void>;
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

  updateProviderProfile: async (profileData) => {
    const provider = await api.put<ServiceProvider>('/providers/me', profileData);
    const normalizedProvider = normalizeServiceProvider(provider);
    set({
      providerProfile: normalizedProvider,
      currentProviderId: normalizedProvider.id,
      currentProviderName: normalizedProvider.name,
    });
    return normalizedProvider;
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

  addConversationMessage: async (ticketId, conversationId, body) => {
    if (!canAccessJobs(get().providerProfile)) {
      throw new Error('Servis hesabı operasyon onayı bekliyor');
    }
    await api.post(`/tickets/${ticketId}/conversations/${conversationId}/messages`, { body });
    await get().fetchMyJobs();
    await get().fetchOpportunities();
  },

  receiveTicketMessage: (message) => {
    set((state) => ({
      opportunities: state.opportunities.map((ticket) => appendTicketMessage(ticket, message)),
      myJobs: state.myJobs.map((ticket) => appendTicketMessage(ticket, message)),
    }));
  },

  receiveTicketUpdate: (ticket) => {
    const updatedTicket = normalizeServiceTicket(ticket);
    set((state) => {
      const providerId = state.currentProviderId;
      const relatedToProvider =
        updatedTicket.assignedProviderId === providerId ||
        updatedTicket.offers.some((offer) => offer.providerId === providerId) ||
        updatedTicket.conversations.some((conversation) => conversation.providerId === providerId);
      const isOpenOpportunity = updatedTicket.status === 'OPEN' || updatedTicket.status === 'OFFERED';

      return {
        opportunities: upsertOrRemoveTicket(
          state.opportunities,
          updatedTicket,
          isOpenOpportunity && !relatedToProvider
        ),
        myJobs: upsertOrRemoveTicket(state.myJobs, updatedTicket, relatedToProvider),
      };
    });
  },

  markTicketMessagesRead: async (ticketId) => {
    const updatedTicket = normalizeServiceTicket(await api.post<Ticket>(`/tickets/${ticketId}/messages/read`));
    set((state) => ({
      opportunities: state.opportunities.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
      myJobs: state.myJobs.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
    }));
  },

  markConversationMessagesRead: async (ticketId, conversationId) => {
    const updatedTicket = normalizeServiceTicket(await api.post<Ticket>(
      `/tickets/${ticketId}/conversations/${conversationId}/messages/read`
    ));
    set((state) => ({
      opportunities: state.opportunities.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
      myJobs: state.myJobs.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
    }));
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
          (p.status === 'PENDING' || p.status === 'INVITED' || p.status === 'ACCEPTED' || p.status === 'REJECTED')
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
  const messages = sortTicketMessages((ticket.messages ?? []).filter((message) =>
    (!message.ticketId || message.ticketId === ticket.id) && !message.conversationId
  ));
  const conversations = (ticket.conversations ?? [])
    .filter((conversation) => !conversation.ticketId || conversation.ticketId === ticket.id)
    .map((conversation) => normalizeConversation(conversation));
  return {
    ...ticket,
    mediaUrls: ticket.mediaUrls ?? [],
    offers: (ticket.offers ?? []).filter((offer) => !offer.ticketId || offer.ticketId === ticket.id),
    conversations,
    messages,
    unreadMessageCount: ticket.unreadMessageCount ?? unreadMessagesForServiceTicket(messages, conversations),
    lastMessage: scopedLastMessage(ticket, messages, conversations),
  };
}

function appendTicketMessage(ticket: Ticket, message: TicketMessage): Ticket {
  if (ticket.id !== message.ticketId) return ticket;
  if (message.conversationId) {
    return appendConversationMessage(ticket, message);
  }

  const messages = ticket.messages ?? [];
  if (messages.some((item) => item.id === message.id)) return ticket;
  const nextMessages = sortTicketMessages([...messages, message]);
  const shouldIncrementUnread = message.senderRole === 'customer' && message.readByService !== true;
  const conversations = ticket.conversations ?? [];

  return {
    ...ticket,
    messages: nextMessages,
    unreadMessageCount: (ticket.unreadMessageCount ?? unreadMessagesForServiceTicket(messages, conversations)) + (shouldIncrementUnread ? 1 : 0),
    lastMessage: latestConversationMessage([...nextMessages, ...conversationMessages(conversations)]),
    updatedAt: message.createdAt ?? ticket.updatedAt,
  };
}

function appendConversationMessage(ticket: Ticket, message: TicketMessage): Ticket {
  const conversations = ticket.conversations ?? [];
  let didAppend = false;
  const nextConversations = conversations.map((conversation) => {
    if (conversation.id !== message.conversationId) return conversation;
    if (conversation.messages.some((item) => item.id === message.id)) return conversation;

    didAppend = true;
    const messages = sortTicketMessages([...conversation.messages, message]);
    const shouldIncrementUnread = message.senderRole === 'customer' && message.readByService !== true;
    return {
      ...conversation,
      messages,
      unreadMessageCount: (conversation.unreadMessageCount ?? unreadMessagesForService(conversation.messages)) + (shouldIncrementUnread ? 1 : 0),
      lastMessage: latestConversationMessage(messages),
      updatedAt: message.createdAt ?? conversation.updatedAt,
    };
  });

  if (!didAppend) return ticket;

  const shouldIncrementUnread = message.senderRole === 'customer' && message.readByService !== true;
  return {
    ...ticket,
    conversations: nextConversations,
    unreadMessageCount: (ticket.unreadMessageCount ?? unreadMessagesForServiceTicket(ticket.messages ?? [], conversations)) + (shouldIncrementUnread ? 1 : 0),
    lastMessage: latestConversationMessage([...(ticket.messages ?? []), ...conversationMessages(nextConversations)]),
    updatedAt: message.createdAt ?? ticket.updatedAt,
  };
}

function scopedLastMessage(ticket: Ticket, messages: TicketMessage[], conversations: TicketConversation[]) {
  if (ticket.lastMessage && ticket.lastMessage.ticketId === ticket.id && ticket.lastMessage.senderRole !== 'system') {
    return ticket.lastMessage;
  }
  return latestConversationMessage([...messages, ...conversationMessages(conversations)]);
}

function normalizeConversation(conversation: TicketConversation): TicketConversation {
  const messages = sortTicketMessages((conversation.messages ?? []).filter((message) =>
    (!message.ticketId || message.ticketId === conversation.ticketId) &&
    (!message.conversationId || message.conversationId === conversation.id)
  ));

  return {
    ...conversation,
    messages,
    unreadMessageCount: conversation.unreadMessageCount ?? unreadMessagesForService(messages),
    lastMessage: conversation.lastMessage && conversation.lastMessage.senderRole !== 'system'
      ? conversation.lastMessage
      : latestConversationMessage(messages),
  };
}

function unreadMessagesForService(messages: TicketMessage[]) {
  return messages.filter((message) => message.senderRole === 'customer' && message.readByService !== true).length;
}

function unreadMessagesForServiceTicket(messages: TicketMessage[], conversations: TicketConversation[]) {
  return unreadMessagesForService(messages) + conversations.reduce(
    (total, conversation) => total + unreadMessagesForService(conversation.messages),
    0
  );
}

function conversationMessages(conversations: TicketConversation[]) {
  return conversations.flatMap((conversation) => conversation.messages ?? []);
}

function upsertOrRemoveTicket(tickets: Ticket[], ticket: Ticket, shouldInclude: boolean) {
  const exists = tickets.some((item) => item.id === ticket.id);
  if (!shouldInclude) {
    return exists ? tickets.filter((item) => item.id !== ticket.id) : tickets;
  }
  return exists
    ? tickets.map((item) => (item.id === ticket.id ? ticket : item))
    : [ticket, ...tickets];
}

function normalizeServiceProvider(provider: ServiceProvider): ServiceProvider {
  return {
    ...provider,
    status: displayProviderStatus(provider.status),
    trusted: provider.trusted ?? provider.isTrusted ?? false,
    isTrusted: provider.isTrusted ?? provider.trusted ?? false,
    specialties: provider.specialties ?? [],
    expertiseTags: provider.expertiseTags ?? [],
    coverageDistricts: provider.coverageDistricts ?? [],
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
        (offer.status === 'PENDING' || offer.status === 'INVITED' || offer.status === 'ACCEPTED' || offer.status === 'REJECTED')
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
        (offer.status === 'PENDING' || offer.status === 'INVITED' || offer.status === 'ACCEPTED' || offer.status === 'REJECTED')
    )
  );
}

export function useActiveJobs() {
  const myJobs = useServiceStore((state) => state.myJobs);
  return myJobs.filter((ticket) => ticket.status === 'IN_PROGRESS');
}
