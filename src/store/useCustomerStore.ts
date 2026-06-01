import { create } from 'zustand';
import { api } from '@/lib/api';

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

export type TicketCategory = 'Electric' | 'Mechanic' | 'Pneumatic' | 'Hydraulic' | 'General' | 'Software';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'OPEN' | 'OFFERED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type OfferType = 'DISCOVERY' | 'FIXED_PRICE';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type BillingStatus = 'AWAITING_CUSTOMER_APPROVAL' | 'APPROVED' | 'DISPUTED';

export interface TicketOffer {
  id: string;
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
  senderRole: 'customer' | 'service' | 'system';
  senderName: string;
  body: string;
  createdAt: string;
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
  messages: TicketMessage[];
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
};

// ==========================================
// STORE INTERFACE
// ==========================================

interface CustomerStoreState {
  assets: Asset[];
  assetTree: AssetTreeNode[];
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssets: (customerId: string) => Promise<void>;
  fetchTickets: (customerId: string) => Promise<void>;
  
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
  acceptOffer: (ticketId: string, offerId: string) => Promise<void>;
  rejectOffer: (ticketId: string, offerId: string) => Promise<void>;
  addTicketMessage: (ticketId: string, body: string) => Promise<void>;
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
  },

  rejectOffer: async (ticketId, offerId) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/offers/${offerId}/reject`));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    }));
  },

  addTicketMessage: async (ticketId, body) => {
    const updatedTicket = normalizeTicket(await api.post<Ticket>(`/tickets/${ticketId}/messages`, { body }));
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
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
