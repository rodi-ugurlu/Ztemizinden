import { create } from 'zustand';
import { api } from '@/lib/api';
import { latestConversationMessage, sortTicketMessages } from '@/lib/ticketMessages';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type AssetType = 'Facility' | 'SME' | 'Home';
export type AssetStatus = 'Active' | 'Under Maintenance' | 'Inactive' | 'Retired';

export interface Asset {
  id: string;
  ownerId?: string;
  name: string;
  tagNo: string;
  type: AssetType;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyEndDate: string;
  status: AssetStatus;
  location?: string;
  department?: string;
  description?: string;
  parentId?: string | null;
  depth: number;
  leaf: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateAssetInput = {
  ownerId?: string;
  parentId?: string | null;
  name: string;
  tagNo: string;
  type: AssetType;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
  status: AssetStatus;
  location?: string;
  department?: string;
  description?: string;
};

export type UpdateAssetInput = Omit<CreateAssetInput, 'ownerId' | 'parentId'>;

export interface AssetTreeNode extends Asset {
  childCount: number;
  descendantCount: number;
  children: AssetTreeNode[];
}

export interface AssetBreadcrumbItem {
  id: string;
  name: string;
  depth: number;
}

export type CustomerStatus = 'ACTIVE' | 'SUSPENDED';

export interface CustomerProfile {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  city: string;
  district: string;
  logoUrl?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export type UpdateCustomerProfileInput = Pick<
  CustomerProfile,
  'contactName' | 'companyName' | 'phone' | 'city' | 'district'
> & {
  logoUrl?: string | null;
  address?: string | null;
  taxNumber?: string | null;
};

export type TicketCategory = 'Electric' | 'Mechanic' | 'Pneumatic' | 'Hydraulic' | 'General' | 'Software';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'OPEN' | 'OFFERED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type OfferType = 'DISCOVERY' | 'FIXED_PRICE';
export type OfferStatus = 'PENDING' | 'INVITED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ConversationStatus = 'ACTIVE' | 'ACCEPTED' | 'CLOSED';
export type ConversationClosedReason = 'REJECTED' | 'NOT_SELECTED';
export type BillingStatus = 'AWAITING_CUSTOMER_APPROVAL' | 'APPROVED' | 'DISPUTED';

export interface TicketOffer {
  id: string;
  ticketId?: string;
  providerId: string;
  providerName: string;
  type: OfferType;
  estimatedCost: number;
  eta: string;
  message: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  conversationId?: string | null;
  senderRole: 'customer' | 'service' | 'system';
  senderName: string;
  body: string;
  readByCustomer?: boolean;
  readByService?: boolean;
  createdAt: string;
}

export interface TicketConversation {
  id: string;
  ticketId: string;
  offerId: string;
  providerId: string;
  providerName: string;
  status: ConversationStatus;
  closedReason?: ConversationClosedReason | null;
  offer?: TicketOffer;
  messages: TicketMessage[];
  unreadMessageCount?: number;
  lastMessage?: TicketMessage | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinalBilling {
  providerId: string;
  providerName: string;
  estimatedCost: number;
  actualCost: number;
  notes: string;
  status: BillingStatus;
  createdAt: string;
  approvedAt?: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerLocation: string;
  customerCity?: string | null;
  customerDistrict?: string | null;
  customerAddress?: string | null;
  assetId: string;
  assetName?: string;
  assetTagNo?: string;
  assetBrand?: string;
  assetModel?: string;
  assetSerialNumber?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  mediaUrls: string[];
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  estimatedCost?: number;
  assignedProviderId?: string;
  assignedProviderName?: string;
  serviceEta?: string;
  offers: TicketOffer[];
  conversations: TicketConversation[];
  messages: TicketMessage[];
  unreadMessageCount?: number;
  lastMessage?: TicketMessage | null;
  finalEstimatedCost?: number;
  finalActualCost?: number;
  finalBillingNotes?: string;
  billingStatus?: BillingStatus;
}

type CreateTicketInput = Pick<Ticket, 'assetId' | 'title' | 'description' | 'category' | 'priority'> & {
  mediaUrls?: string[];
  customerId?: string;
  customerName?: string;
  customerCompany?: string;
  customerLocation?: string;
  customerCity?: string;
  customerDistrict?: string;
  customerAddress?: string;
};

// ==========================================
// STORE INTERFACE
// ==========================================

interface CustomerStoreState {
  assets: Asset[];
  assetTree: AssetTreeNode[];
  tickets: Ticket[];
  customerProfile: CustomerProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssets: (customerId: string) => Promise<void>;
  fetchTickets: (customerId: string) => Promise<void>;
  fetchCustomerProfile: () => Promise<CustomerProfile | null>;
  updateCustomerProfile: (profile: UpdateCustomerProfileInput) => Promise<CustomerProfile>;
  
  // Asset Actions (flat)
  addAsset: (asset: CreateAssetInput) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  getAssetById: (id: string) => Asset | undefined;

  // Asset Tree Actions
  fetchAssetTree: (customerId: string) => Promise<void>;
  createAssetInTree: (asset: CreateAssetInput) => Promise<Asset>;
  updateAssetInTree: (assetId: string, asset: UpdateAssetInput) => Promise<Asset>;
  moveAsset: (assetId: string, newParentId: string | null) => Promise<void>;
  deleteAssetFromTree: (assetId: string) => Promise<void>;
  reorderAssets: (parentId: string, orderedIds: string[]) => Promise<void>;
  getAncestors: (assetId: string) => Promise<AssetBreadcrumbItem[]>;

  // Ticket Actions
  createTicket: (ticket: CreateTicketInput) => Promise<Ticket>;
  cancelTicket: (id: string) => Promise<void>;
  inviteOffer: (ticketId: string, offerId: string) => Promise<Ticket>;
  acceptOffer: (ticketId: string, offerId: string) => Promise<Ticket>;
  rejectOffer: (ticketId: string, offerId: string) => Promise<Ticket>;
  addTicketMessage: (ticketId: string, body: string) => Promise<void>;
  addConversationMessage: (ticketId: string, conversationId: string, body: string) => Promise<void>;
  receiveTicketMessage: (message: TicketMessage) => void;
  receiveTicketUpdate: (ticket: Ticket) => void;
  markTicketMessagesRead: (ticketId: string) => Promise<void>;
  markConversationMessagesRead: (ticketId: string, conversationId: string) => Promise<void>;
  approveFinalBilling: (ticketId: string) => Promise<void>;
  disputeFinalBilling: (ticketId: string, reason: string) => Promise<void>;
  getTicketsByAsset: (assetId: string) => Ticket[];
  getTicketById: (id: string) => Ticket | undefined;

  // Computed Helpers
  getActiveTicketsCount: () => number;
  getPendingOffersCount: () => number;
  getAssetsByStatus: (status: AssetStatus) => Asset[];
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
}

export const useCustomerStore = create<CustomerStoreState>()((set, get) => ({
  assets: [],
  assetTree: [],
  tickets: [],
  customerProfile: null,
  isLoading: false,
  error: null,

  fetchAssets: async (customerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const assets = await api.get<Asset[]>('/assets', { params: { ownerId: customerId } });
      set({ assets, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Varliklar yuklenemedi', isLoading: false });
    }
  },

  fetchTickets: async (customerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await api.get<Ticket[]>('/tickets', { params: { customerId } });
      set({ tickets: tickets.map(normalizeTicket), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Talepler yuklenemedi', isLoading: false });
    }
  },

  fetchCustomerProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const customerProfile = await api.get<CustomerProfile>('/customers/me');
      set({ customerProfile, isLoading: false });
      return customerProfile;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Müşteri profili yüklenemedi', isLoading: false });
      return null;
    }
  },

  updateCustomerProfile: async (profileData) => {
    const customerProfile = await api.put<CustomerProfile>('/customers/me', profileData);
    set({ customerProfile });
    return customerProfile;
  },

  addAsset: async (assetData) => {
    const newAsset = await api.post<Asset>('/assets', {
      ...assetData,
      ownerId: assetData.ownerId,
    });
    set((state) => ({ assets: [...state.assets, newAsset] }));
    return newAsset;
  },

  deleteAsset: async (id) => {
    await api.delete(`/assets/${id}`);
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== id),
    }));
  },

  // ── Asset Tree Actions ──────────────────────────────────────────

  fetchAssetTree: async (customerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tree = await api.get<AssetTreeNode[]>('/assets/tree', { params: { ownerId: customerId } });
      set({ assetTree: tree, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Varlık ağacı yüklenemedi', isLoading: false });
    }
  },

  createAssetInTree: async (assetData) => {
    const newAsset = await api.post<Asset>('/assets', {
      ...assetData,
      ownerId: assetData.ownerId,
    });
    return newAsset;
  },

  updateAssetInTree: async (assetId, assetData) => {
    const updatedAsset = await api.put<Asset>(`/assets/${assetId}`, assetData);
    set((state) => ({
      assets: state.assets.map((asset) => (asset.id === assetId ? updatedAsset : asset)),
    }));
    return updatedAsset;
  },

  moveAsset: async (assetId, newParentId) => {
    await api.put(`/assets/${assetId}/move`, { newParentId });
  },

  deleteAssetFromTree: async (assetId) => {
    await api.delete(`/assets/${assetId}`);
  },

  reorderAssets: async (parentId, orderedIds) => {
    await api.put(`/assets/${parentId}/reorder`, { orderedChildIds: orderedIds });
  },

  getAncestors: async (assetId) => {
    return api.get<AssetBreadcrumbItem[]>(`/assets/${assetId}/ancestors`);
  },

  getAssetById: (id) => {
    return get().assets.find((asset) => asset.id === id);
  },

  createTicket: async (ticketData) => {
    const newTicket = normalizeTicket(await api.post<Ticket>('/tickets', {
      customerId: ticketData.customerId,
      customerName: ticketData.customerName,
      customerCompany: ticketData.customerCompany ?? ticketData.customerName ?? 'Müşteri',
      customerLocation: ticketData.customerLocation ?? 'Belirtilmedi',
      customerCity: ticketData.customerCity,
      customerDistrict: ticketData.customerDistrict,
      customerAddress: ticketData.customerAddress,
      assetId: ticketData.assetId,
      title: ticketData.title,
      description: ticketData.description,
      category: ticketData.category,
      priority: ticketData.priority,
      mediaUrls: ticketData.mediaUrls ?? [],
    }));
    set((state) => ({ tickets: [newTicket, ...state.tickets] }));
    return newTicket;
  },

  cancelTicket: async (id) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${id}/cancel`));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? updatedTicket : t)),
    }));
  },

  acceptOffer: async (ticketId, offerId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/offers/${offerId}/accept`));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
    return updatedTicket;
  },

  inviteOffer: async (ticketId, offerId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/offers/${offerId}/invite`));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
    return updatedTicket;
  },

  rejectOffer: async (ticketId, offerId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/offers/${offerId}/reject`));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
    return updatedTicket;
  },

  addTicketMessage: async (ticketId, body) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/messages`, { body }));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
  },

  addConversationMessage: async (ticketId, conversationId, body) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(
      `/tickets/${ticketId}/conversations/${conversationId}/messages`,
      { body }
    ));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
  },

  receiveTicketMessage: (message) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => appendTicketMessage(ticket, message, 'customer')),
    }));
  },

  receiveTicketUpdate: (ticket) => {
    const updatedTicket = normalizeTicket(ticket);
    set((state) => {
      const exists = state.tickets.some((item) => item.id === updatedTicket.id);
      return {
        tickets: exists
          ? state.tickets.map((item) => (item.id === updatedTicket.id ? updatedTicket : item))
          : [updatedTicket, ...state.tickets],
      };
    });
  },

  markTicketMessagesRead: async (ticketId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/messages/read`));
    set((state) => ({
      tickets: state.tickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
    }));
  },

  markConversationMessagesRead: async (ticketId, conversationId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(
      `/tickets/${ticketId}/conversations/${conversationId}/messages/read`
    ));
    set((state) => ({
      tickets: state.tickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
    }));
  },

  approveFinalBilling: async (ticketId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/billing/approve`));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
  },

  disputeFinalBilling: async (ticketId, reason) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/billing/dispute`, { reason }));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
  },

  getTicketsByAsset: (assetId) => {
    return get().tickets.filter((ticket) => ticket.assetId === assetId);
  },

  getTicketById: (id) => {
    return get().tickets.find((ticket) => ticket.id === id);
  },

  getActiveTicketsCount: () => {
    return get().tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'OFFERED'
    ).length;
  },

  getPendingOffersCount: () => {
    return get().tickets.filter((t) => t.status === 'OFFERED').length;
  },

  getAssetsByStatus: (status) => {
    return get().assets.filter((asset) => asset.status === status);
  },

  getTicketsByStatus: (status) => {
    return get().tickets.filter((ticket) => ticket.status === status);
  },
}));

function normalizeTicket(ticket: Ticket): Ticket {
  const messages = sortTicketMessages(scopedMessages(ticket));
  const conversations = scopedConversations(ticket).map((conversation) => normalizeConversation(conversation, 'customer'));
  return {
    ...ticket,
    mediaUrls: ticket.mediaUrls ?? [],
    offers: scopedOffers(ticket),
    conversations,
    messages,
    unreadMessageCount: ticket.unreadMessageCount ?? unreadMessagesForTicket(messages, conversations, 'customer'),
    lastMessage: scopedLastMessage(ticket, messages, conversations),
  };
}

function scopedOffers(ticket: Ticket): TicketOffer[] {
  return (ticket.offers ?? []).filter((offer) => !offer.ticketId || offer.ticketId === ticket.id);
}

function scopedMessages(ticket: Ticket): TicketMessage[] {
  return (ticket.messages ?? []).filter((message) =>
    (!message.ticketId || message.ticketId === ticket.id) && !message.conversationId
  );
}

function scopedConversations(ticket: Ticket): TicketConversation[] {
  return (ticket.conversations ?? []).filter((conversation) => !conversation.ticketId || conversation.ticketId === ticket.id);
}

function normalizeConversation(conversation: TicketConversation, role: 'customer' | 'service'): TicketConversation {
  const messages = sortTicketMessages((conversation.messages ?? []).filter((message) =>
    (!message.ticketId || message.ticketId === conversation.ticketId) &&
    (!message.conversationId || message.conversationId === conversation.id)
  ));

  return {
    ...conversation,
    messages,
    unreadMessageCount: conversation.unreadMessageCount ?? unreadMessagesForRole(messages, role),
    lastMessage: conversation.lastMessage && conversation.lastMessage.senderRole !== 'system'
      ? conversation.lastMessage
      : latestConversationMessage(messages),
  };
}

function appendTicketMessage(ticket: Ticket, message: TicketMessage, role: 'customer' | 'service'): Ticket {
  if (ticket.id !== message.ticketId) return ticket;
  if (message.conversationId) {
    return appendConversationMessage(ticket, message, role);
  }

  const messages = ticket.messages ?? [];
  if (messages.some((item) => item.id === message.id)) return ticket;
  const nextMessages = sortTicketMessages([...messages, message]);
  const conversations = ticket.conversations ?? [];
  const shouldIncrementUnread =
    role === 'customer'
      ? message.senderRole === 'service' && message.readByCustomer !== true
      : message.senderRole === 'customer' && message.readByService !== true;

  return {
    ...ticket,
    messages: nextMessages,
    unreadMessageCount: (ticket.unreadMessageCount ?? unreadMessagesForTicket(messages, conversations, role)) + (shouldIncrementUnread ? 1 : 0),
    lastMessage: latestConversationMessage([...nextMessages, ...conversationMessages(conversations)]),
    updatedAt: message.createdAt ?? ticket.updatedAt,
  };
}

function appendConversationMessage(ticket: Ticket, message: TicketMessage, role: 'customer' | 'service'): Ticket {
  const conversations = ticket.conversations ?? [];
  let didAppend = false;
  const nextConversations = conversations.map((conversation) => {
    if (conversation.id !== message.conversationId) return conversation;
    if (conversation.messages.some((item) => item.id === message.id)) return conversation;

    didAppend = true;
    const messages = sortTicketMessages([...conversation.messages, message]);
    const shouldIncrementUnread =
      role === 'customer'
        ? message.senderRole === 'service' && message.readByCustomer !== true
        : message.senderRole === 'customer' && message.readByService !== true;

    return {
      ...conversation,
      messages,
      unreadMessageCount: (conversation.unreadMessageCount ?? unreadMessagesForRole(conversation.messages, role)) + (shouldIncrementUnread ? 1 : 0),
      lastMessage: latestConversationMessage(messages),
      updatedAt: message.createdAt ?? conversation.updatedAt,
    };
  });

  if (!didAppend) return ticket;

  const shouldIncrementUnread =
    role === 'customer'
      ? message.senderRole === 'service' && message.readByCustomer !== true
      : message.senderRole === 'customer' && message.readByService !== true;

  return {
    ...ticket,
    conversations: nextConversations,
    unreadMessageCount: (ticket.unreadMessageCount ?? unreadMessagesForTicket(ticket.messages ?? [], conversations, role)) + (shouldIncrementUnread ? 1 : 0),
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

function unreadMessagesForRole(messages: TicketMessage[], role: 'customer' | 'service') {
  return messages.filter((message) => {
    if (role === 'customer') {
      return message.senderRole === 'service' && message.readByCustomer !== true;
    }
    return message.senderRole === 'customer' && message.readByService !== true;
  }).length;
}

function unreadMessagesForTicket(
  messages: TicketMessage[],
  conversations: TicketConversation[],
  role: 'customer' | 'service'
) {
  return unreadMessagesForRole(messages, role) + conversations.reduce(
    (total, conversation) => total + unreadMessagesForRole(conversation.messages, role),
    0
  );
}

function conversationMessages(conversations: TicketConversation[]) {
  return conversations.flatMap((conversation) => conversation.messages ?? []);
}

// ==========================================
// HELPER HOOKS
// ==========================================

export function useAsset(assetId: string) {
  return useCustomerStore((state) => state.getAssetById(assetId));
}

export function useTicketsByAsset(assetId: string) {
  const tickets = useCustomerStore((state) => state.tickets);
  return tickets.filter((ticket) => ticket.assetId === assetId);
}

export function useTicketStats() {
  const assets = useCustomerStore((state) => state.assets);
  const tickets = useCustomerStore((state) => state.tickets);

  return {
    totalAssets: assets.length,
    activeTickets: tickets.filter(
      (ticket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS' || ticket.status === 'OFFERED'
    ).length,
    pendingOffers: tickets.filter((ticket) => ticket.status === 'OFFERED').length,
    resolvedThisMonth: tickets.filter(
      (ticket) => ticket.status === 'RESOLVED' && new Date(ticket.updatedAt).getMonth() === new Date().getMonth()
    ).length,
  };
}
