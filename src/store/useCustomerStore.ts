import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type AssetType = 'Facility' | 'SME' | 'Home';
export type AssetStatus = 'Active' | 'Under Maintenance' | 'Inactive' | 'Retired';

export interface Asset {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export type TicketCategory = 'Electric' | 'Mechanic' | 'Pneumatic' | 'Hydraulic' | 'General' | 'Software';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'Offered' | 'In Progress' | 'Resolved' | 'Closed' | 'Cancelled';

export interface Ticket {
  id: string;
  assetId: string;
  assetName?: string;
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
  assignedProvider?: string;
}

// ==========================================
// MOCK DATA - Industrial Assets
// ==========================================

const MOCK_ASSETS: Asset[] = [
  {
    id: 'asset-001',
    name: 'Industrial Air Compressor',
    tagNo: 'FAC-COMP-001',
    type: 'Facility',
    brand: 'Atlas Copco',
    model: 'GA 160 VSD+',
    serialNumber: 'APC-2023-8847562',
    purchaseDate: '2023-03-15',
    warrantyEndDate: '2026-03-15',
    status: 'Active',
    location: 'Production Hall A',
    department: 'Manufacturing',
    description: 'Variable speed drive compressor for pneumatic tools and assembly lines',
    createdAt: '2023-03-15T10:00:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
  },
  {
    id: 'asset-002',
    name: 'HVAC Unit - Main Building',
    tagNo: 'FAC-HVAC-001',
    type: 'Facility',
    brand: 'Carrier',
    model: '30XA 1202',
    serialNumber: 'CAR-2022-9912345',
    purchaseDate: '2022-06-20',
    warrantyEndDate: '2025-06-20',
    status: 'Under Maintenance',
    location: 'Roof Level',
    department: 'Facilities',
    description: 'Air-cooled liquid chiller for climate control',
    createdAt: '2022-06-20T08:00:00Z',
    updatedAt: '2024-04-28T09:15:00Z',
  },
  {
    id: 'asset-003',
    name: 'Industrial Oven - Powder Coating',
    tagNo: 'FAC-OVEN-002',
    type: 'Facility',
    brand: 'Gema Switzerland',
    model: 'OptiFlex Pro B',
    serialNumber: 'GEM-2023-4456123',
    purchaseDate: '2023-08-10',
    warrantyEndDate: '2026-08-10',
    status: 'Active',
    location: 'Finishing Department',
    department: 'Production',
    description: 'Curing oven for powder coating applications',
    createdAt: '2023-08-10T11:00:00Z',
    updatedAt: '2024-02-15T16:45:00Z',
  },
  {
    id: 'asset-004',
    name: 'CNC Milling Machine',
    tagNo: 'SME-CNC-001',
    type: 'SME',
    brand: 'DMG Mori',
    model: 'DMC 650 V',
    serialNumber: 'DMG-2021-7723456',
    purchaseDate: '2021-11-05',
    warrantyEndDate: '2024-11-05',
    status: 'Active',
    location: 'Machining Center',
    department: 'Precision Manufacturing',
    description: '5-axis vertical machining center for precision parts',
    createdAt: '2021-11-05T09:30:00Z',
    updatedAt: '2024-03-20T11:20:00Z',
  },
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'ticket-001',
    assetId: 'asset-002',
    assetName: 'HVAC Unit - Main Building',
    title: 'Irregular cooling performance - Temperature fluctuation',
    description: 'The HVAC unit in the main building is experiencing irregular cooling cycles. Temperature readings show fluctuations between 22°C and 28°C when set to 24°C. The unit makes unusual humming sounds during compressor startup. This has been ongoing for 3 days.',
    category: 'Mechanic',
    priority: 'High',
    mediaUrls: ['/mock/hvac-photo-1.jpg', '/mock/hvac-video-1.mp4'],
    status: 'Open',
    createdAt: '2024-04-28T09:15:00Z',
    updatedAt: '2024-04-28T09:15:00Z',
  },
  {
    id: 'ticket-002',
    assetId: 'asset-001',
    assetName: 'Industrial Air Compressor',
    title: 'Preventive Maintenance - Quarterly Service',
    description: 'Scheduled quarterly preventive maintenance for the Atlas Copco compressor. Includes filter replacement, oil change, belt inspection, and VSD diagnostics.',
    category: 'General',
    priority: 'Medium',
    mediaUrls: [],
    status: 'Offered',
    createdAt: '2024-04-25T14:00:00Z',
    updatedAt: '2024-04-26T10:30:00Z',
    estimatedCost: 2850.00,
    assignedProvider: 'Atlas Copco Authorized Service',
  },
  {
    id: 'ticket-003',
    assetId: 'asset-004',
    assetName: 'CNC Milling Machine',
    title: 'Spindle motor overheating alarm',
    description: 'Spindle motor temperature exceeding safe limits during high-speed operations. Alarm code E-452 displayed on control panel. Production halted for safety.',
    category: 'Electric',
    priority: 'Critical',
    mediaUrls: ['/mock/cnc-alarm.jpg'],
    status: 'In Progress',
    createdAt: '2024-04-27T16:45:00Z',
    updatedAt: '2024-04-28T08:00:00Z',
    assignedProvider: 'DMG Mori Technical Support',
  },
];

// ==========================================
// STORE INTERFACE
// ==========================================

interface CustomerStoreState {
  assets: Asset[];
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;

  // Asset Actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAssetById: (id: string) => Asset | undefined;

  // Ticket Actions
  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'assetName'>) => Ticket;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  cancelTicket: (id: string) => void;
  getTicketsByAsset: (assetId: string) => Ticket[];
  getTicketById: (id: string) => Ticket | undefined;

  // Computed Helpers
  getActiveTicketsCount: () => number;
  getPendingOffersCount: () => number;
  getAssetsByStatus: (status: AssetStatus) => Asset[];
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
}

/**
 * Customer Store - Zustand
 *
 * Manages customer portal data:
 * - Assets (Varlık Ağacı / Asset Passport)
 * - Tickets (Arıza Kayıtları / Service Requests)
 *
 * Pre-populated with realistic industrial equipment mock data.
 */
export const useCustomerStore = create<CustomerStoreState>()(
  persist(
    (set, get) => ({
      assets: MOCK_ASSETS,
      tickets: MOCK_TICKETS,
      isLoading: false,
      error: null,

      // Asset Actions
      addAsset: (assetData) => {
        const now = new Date().toISOString();
        const newAsset: Asset = {
          ...assetData,
          id: `asset-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          assets: [...state.assets, newAsset],
        }));
        return newAsset;
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id
              ? { ...asset, ...updates, updatedAt: new Date().toISOString() }
              : asset
          ),
        }));
      },

      deleteAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        }));
      },

      getAssetById: (id) => {
        return get().assets.find((asset) => asset.id === id);
      },

      // Ticket Actions
      createTicket: (ticketData) => {
        const now = new Date().toISOString();
        const asset = get().assets.find((a) => a.id === ticketData.assetId);
        const newTicket: Ticket = {
          ...ticketData,
          id: `ticket-${Date.now()}`,
          assetName: asset?.name,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          tickets: [newTicket, ...state.tickets],
        }));
        return newTicket;
      },

      updateTicket: (id, updates) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? { ...ticket, ...updates, updatedAt: new Date().toISOString() }
              : ticket
          ),
        }));
      },

      cancelTicket: (id) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? { ...ticket, status: 'Cancelled', updatedAt: new Date().toISOString() }
              : ticket
          ),
        }));
      },

      getTicketsByAsset: (assetId) => {
        return get().tickets.filter((ticket) => ticket.assetId === assetId);
      },

      getTicketById: (id) => {
        return get().tickets.find((ticket) => ticket.id === id);
      },

      // Computed Helpers
      getActiveTicketsCount: () => {
        return get().tickets.filter(
          (t) => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Offered'
        ).length;
      },

      getPendingOffersCount: () => {
        return get().tickets.filter((t) => t.status === 'Offered').length;
      },

      getAssetsByStatus: (status) => {
        return get().assets.filter((asset) => asset.status === status);
      },

      getTicketsByStatus: (status) => {
        return get().tickets.filter((ticket) => ticket.status === status);
      },
    }),
    {
      name: 'emaintenance-customer-storage',
      partialize: (state) => ({
        assets: state.assets,
        tickets: state.tickets,
      }),
    }
  )
);

// ==========================================
// HELPER HOOKS
// ==========================================

export function useAsset(assetId: string) {
  return useCustomerStore((state) => state.getAssetById(assetId));
}

export function useTicketsByAsset(assetId: string) {
  return useCustomerStore((state) => state.getTicketsByAsset(assetId));
}

export function useTicketStats() {
  return useCustomerStore((state) => ({
    totalAssets: state.assets.length,
    activeTickets: state.getActiveTicketsCount(),
    pendingOffers: state.getPendingOffersCount(),
    resolvedThisMonth: state.tickets.filter(
      (t) => t.status === 'Resolved' && new Date(t.updatedAt).getMonth() === new Date().getMonth()
    ).length,
  }));
}
