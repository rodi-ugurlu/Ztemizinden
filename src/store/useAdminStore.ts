import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketCategory, TicketPriority, TicketStatus } from '@/store/useCustomerStore';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type ProviderStatus = 'Pending Verification' | 'Verified' | 'Suspended';
export type DocumentType = 'Insurance' | 'SME Certificate' | 'Tax Certificate' | 'Technical License' | 'ISO Certificate';

export interface ProviderDocument {
  id: string;
  type: DocumentType;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadDate: string;
  verifiedDate?: string;
  notes?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: ProviderStatus;
  documents: ProviderDocument[];
  isTrusted: boolean;
  registrationDate: string;
  lastActivityDate: string;
  completedJobs: number;
  rating: number;
  specialties: string[];
}

export interface GlobalTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  assetId: string;
  assetName: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  responseTime?: number; // in minutes
  assignedProvider?: string;
  assignedProviderName?: string;
}

export interface GlobalMetrics {
  totalActiveTickets: number;
  totalRegisteredProviders: number;
  verifiedProviders: number;
  averageResponseTime: number; // in minutes
  ticketsResolvedToday: number;
  criticalTickets: number;
  pendingVerifications: number;
}

// ==========================================
// MOCK DATA
// ==========================================

const MOCK_PROVIDERS: ServiceProvider[] = [
  {
    id: 'sp-001',
    name: 'Kaya Hidrolik Servis',
    contactName: 'Ahmet Kaya',
    email: 'ahmet@kayahidrolik.com.tr',
    phone: '+90 532 123 4567',
    address: 'Ostim OSB 1234. Sokak No:56',
    city: 'Ankara',
    status: 'Verified',
    documents: [
      { id: 'doc-001', type: 'Insurance', status: 'Verified', uploadDate: '2024-01-15', verifiedDate: '2024-01-16' },
      { id: 'doc-002', type: 'SME Certificate', status: 'Verified', uploadDate: '2024-01-15', verifiedDate: '2024-01-16' },
      { id: 'doc-003', type: 'Technical License', status: 'Verified', uploadDate: '2024-01-15', verifiedDate: '2024-01-18' },
    ],
    isTrusted: true,
    registrationDate: '2024-01-15',
    lastActivityDate: '2024-04-28',
    completedJobs: 147,
    rating: 4.8,
    specialties: ['Hydraulic', 'Pneumatic'],
  },
  {
    id: 'sp-002',
    name: 'Aksu Klima ve Soğutma',
    contactName: 'Murat Aksu',
    email: 'info@aksuklima.com.tr',
    phone: '+90 533 987 6543',
    address: 'Bornova Merkez 789. Sokak No:12',
    city: 'İzmir',
    status: 'Verified',
    documents: [
      { id: 'doc-004', type: 'Insurance', status: 'Verified', uploadDate: '2024-02-01', verifiedDate: '2024-02-02' },
      { id: 'doc-005', type: 'Tax Certificate', status: 'Verified', uploadDate: '2024-02-01', verifiedDate: '2024-02-02' },
    ],
    isTrusted: true,
    registrationDate: '2024-02-01',
    lastActivityDate: '2024-04-27',
    completedJobs: 89,
    rating: 4.6,
    specialties: ['Mechanic', 'General'],
  },
  {
    id: 'sp-003',
    name: 'Çınar Oto Kurtarma',
    contactName: 'Hasan Çınar',
    email: 'hasan@cinaroto.com.tr',
    phone: '+90 535 456 7890',
    address: 'Ostim Sanayi 456. Sokak No:78',
    city: 'Ankara',
    status: 'Pending Verification',
    documents: [
      { id: 'doc-006', type: 'Insurance', status: 'Verified', uploadDate: '2024-04-20', verifiedDate: '2024-04-21' },
      { id: 'doc-007', type: 'SME Certificate', status: 'Pending', uploadDate: '2024-04-20' },
      { id: 'doc-008', type: 'Technical License', status: 'Pending', uploadDate: '2024-04-22' },
    ],
    isTrusted: false,
    registrationDate: '2024-04-20',
    lastActivityDate: '2024-04-20',
    completedJobs: 0,
    rating: 0,
    specialties: ['Electric', 'Mechanic'],
  },
  {
    id: 'sp-004',
    name: 'Demir Elektrik Servis',
    contactName: 'Zeynep Demir',
    email: 'zeynep@demirelektrik.com.tr',
    phone: '+90 536 234 5678',
    address: 'Nilüfer Sanayi 234. Sokak No:45',
    city: 'Bursa',
    status: 'Verified',
    documents: [
      { id: 'doc-009', type: 'Insurance', status: 'Verified', uploadDate: '2023-11-10', verifiedDate: '2023-11-11' },
      { id: 'doc-010', type: 'ISO Certificate', status: 'Verified', uploadDate: '2023-11-10', verifiedDate: '2023-11-12' },
      { id: 'doc-011', type: 'Technical License', status: 'Verified', uploadDate: '2023-11-10', verifiedDate: '2023-11-11' },
    ],
    isTrusted: false,
    registrationDate: '2023-11-10',
    lastActivityDate: '2024-04-25',
    completedJobs: 234,
    rating: 4.3,
    specialties: ['Electric', 'Software'],
  },
  {
    id: 'sp-005',
    name: 'Yıldız Pnomatik Sistemler',
    contactName: 'Ayşe Yıldız',
    email: 'ayse@yildizpnomatik.com.tr',
    phone: '+90 537 876 5432',
    address: 'Kartal OSB 567. Sokak No:89',
    city: 'İstanbul',
    status: 'Pending Verification',
    documents: [
      { id: 'doc-012', type: 'Insurance', status: 'Pending', uploadDate: '2024-04-25' },
      { id: 'doc-013', type: 'Tax Certificate', status: 'Pending', uploadDate: '2024-04-25' },
    ],
    isTrusted: false,
    registrationDate: '2024-04-25',
    lastActivityDate: '2024-04-25',
    completedJobs: 0,
    rating: 0,
    specialties: ['Pneumatic', 'Hydraulic'],
  },
];

const MOCK_GLOBAL_TICKETS: GlobalTicket[] = [
  {
    id: 'gt-001',
    customerId: 'cust-001',
    customerName: 'Mehmet Akman',
    customerCompany: 'Akman Kimya Sanayi',
    assetId: 'asset-ak-001',
    assetName: 'Endüstriyel Soğutma Ünitesi',
    title: 'Soğutma performansında düşüş',
    category: 'Mechanic',
    priority: 'High',
    status: 'Open',
    createdAt: '2024-04-28T08:30:00Z',
    updatedAt: '2024-04-28T08:30:00Z',
    responseTime: 45,
  },
  {
    id: 'gt-002',
    customerId: 'cust-002',
    customerName: 'Ayşe Yıldız',
    customerCompany: 'Star Rezidans Yönetimi',
    assetId: 'asset-star-001',
    assetName: 'Bina Kompresörü',
    title: 'Kompresör basınç şalteri arızası',
    category: 'Electric',
    priority: 'Critical',
    status: 'In Progress',
    createdAt: '2024-04-27T14:15:00Z',
    updatedAt: '2024-04-27T16:30:00Z',
    responseTime: 12,
    assignedProvider: 'sp-001',
    assignedProviderName: 'Kaya Hidrolik Servis',
  },
  {
    id: 'gt-003',
    customerId: 'cust-003',
    customerName: 'Hasan Çınar',
    customerCompany: 'Çınar Otomotiv Servis',
    assetId: 'asset-cn-001',
    assetName: 'Pnomatik Kaldırma Sistemi',
    title: 'Pnomatik silindir sızıntısı',
    category: 'Pneumatic',
    priority: 'Medium',
    status: 'Offered',
    createdAt: '2024-04-26T09:00:00Z',
    updatedAt: '2024-04-26T14:20:00Z',
    responseTime: 320,
  },
  {
    id: 'gt-004',
    customerId: 'cust-004',
    customerName: 'Zeynep Demir',
    customerCompany: 'Demir Tekstil',
    assetId: 'asset-dm-001',
    assetName: 'Hidrolik Pres Makinesi',
    title: 'Hidrolik pompa gürültülü çalışıyor',
    category: 'Hydraulic',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2024-04-25T16:45:00Z',
    updatedAt: '2024-04-26T08:00:00Z',
    responseTime: 180,
    assignedProvider: 'sp-001',
    assignedProviderName: 'Kaya Hidrolik Servis',
  },
  {
    id: 'gt-005',
    customerId: 'cust-005',
    customerName: 'Murat Aksu',
    customerCompany: 'Aksu Klima ve Soğutma',
    assetId: 'asset-ak-002',
    assetName: 'Chiller Ünitesi Bakımı',
    title: 'Yıllık periyodik bakım',
    category: 'General',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2024-04-20T09:00:00Z',
    updatedAt: '2024-04-22T08:00:00Z',
    responseTime: 60,
    assignedProvider: 'sp-002',
    assignedProviderName: 'Aksu Klima ve Soğutma',
  },
  {
    id: 'gt-006',
    customerId: 'cust-006',
    customerName: 'Ali Yılmaz',
    customerCompany: 'Yılmaz Makina Sanayi',
    assetId: 'asset-ym-001',
    assetName: 'CNC Torna Tezgahı',
    title: 'Kontrol paneli hata kodu E-452',
    category: 'Software',
    priority: 'Critical',
    status: 'Open',
    createdAt: '2024-04-28T06:00:00Z',
    updatedAt: '2024-04-28T06:00:00Z',
    responseTime: undefined,
  },
  {
    id: 'gt-007',
    customerId: 'cust-007',
    customerName: 'Fatma Şahin',
    customerCompany: 'Şahin Gıda İşleme',
    assetId: 'asset-fs-001',
    assetName: 'Soğuk Hava Deposu',
    title: 'Kompresor devreye girmiyor',
    category: 'Electric',
    priority: 'Critical',
    status: 'In Progress',
    createdAt: '2024-04-28T05:30:00Z',
    updatedAt: '2024-04-28T07:15:00Z',
    responseTime: 105,
    assignedProvider: 'sp-002',
    assignedProviderName: 'Aksu Klima ve Soğutma',
  },
];

// ==========================================
// STORE INTERFACE
// ==========================================

interface AdminStoreState {
  providers: ServiceProvider[];
  tickets: GlobalTicket[];

  // Actions
  verifyDocument: (providerId: string, documentId: string, notes?: string) => void;
  rejectDocument: (providerId: string, documentId: string, notes?: string) => void;
  toggleTrustedStatus: (providerId: string) => void;
  assignTicket: (ticketId: string, providerId: string, providerName: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;

  // Getters
  getMetrics: () => GlobalMetrics;
  getCriticalTickets: () => GlobalTicket[];
  getPendingVerifications: () => ServiceProvider[];
  getVerifiedProviders: () => ServiceProvider[];
  getProviderById: (id: string) => ServiceProvider | undefined;
  getTicketById: (id: string) => GlobalTicket | undefined;
}

/**
 * Admin Store - Zustand
 *
 * Manages admin/operations portal data:
 * - Global system metrics
 * - Service provider verification
 * - All tickets dispatch
 */
export const useAdminStore = create<AdminStoreState>()(
  persist(
    (set, get) => ({
      providers: MOCK_PROVIDERS,
      tickets: MOCK_GLOBAL_TICKETS,

      // Verify a document
      verifyDocument: (providerId, documentId, notes) => {
        const now = new Date().toISOString();
        set((state) => ({
          providers: state.providers.map((provider) =>
            provider.id === providerId
              ? {
                  ...provider,
                  documents: provider.documents.map((doc) =>
                    doc.id === documentId
                      ? { ...doc, status: 'Verified', verifiedDate: now, notes }
                      : doc
                  ),
                  status: provider.documents.every((d) => d.status === 'Verified' || d.id === documentId)
                    ? 'Verified'
                    : provider.status,
                }
              : provider
          ),
        }));
      },

      // Reject a document
      rejectDocument: (providerId, documentId, notes) => {
        const now = new Date().toISOString();
        set((state) => ({
          providers: state.providers.map((provider) =>
            provider.id === providerId
              ? {
                  ...provider,
                  documents: provider.documents.map((doc) =>
                    doc.id === documentId ? { ...doc, status: 'Rejected', verifiedDate: now, notes } : doc
                  ),
                }
              : provider
          ),
        }));
      },

      // Toggle trusted provider status
      toggleTrustedStatus: (providerId) => {
        set((state) => ({
          providers: state.providers.map((provider) =>
            provider.id === providerId ? { ...provider, isTrusted: !provider.isTrusted } : provider
          ),
        }));
      },

      // Assign ticket to provider
      assignTicket: (ticketId, providerId, providerName) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  assignedProvider: providerId,
                  assignedProviderName: providerName,
                  status: 'In Progress',
                  updatedAt: now,
                }
              : ticket
          ),
        }));
      },

      // Update ticket status
      updateTicketStatus: (ticketId, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status, updatedAt: now } : ticket
          ),
        }));
      },

      // Get global metrics
      getMetrics: () => {
        const activeTickets = get().tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress');
        const verifiedProviders = get().providers.filter((p) => p.status === 'Verified');
        const ticketsWithResponse = get().tickets.filter((t) => t.responseTime != null);

        const avgResponseTime =
          ticketsWithResponse.length > 0
            ? ticketsWithResponse.reduce((sum, t) => sum + (t.responseTime || 0), 0) / ticketsWithResponse.length
            : 0;

        const today = new Date().toISOString().split('T')[0];
        const resolvedToday = get().tickets.filter(
          (t) => t.status === 'Resolved' && t.updatedAt.startsWith(today)
        ).length;

        const criticalTickets = get().tickets.filter(
          (t) => t.priority === 'Critical' && (t.status === 'Open' || t.status === 'In Progress')
        ).length;

        return {
          totalActiveTickets: activeTickets.length,
          totalRegisteredProviders: get().providers.length,
          verifiedProviders: verifiedProviders.length,
          averageResponseTime: Math.round(avgResponseTime),
          ticketsResolvedToday: resolvedToday,
          criticalTickets,
          pendingVerifications: get().providers.filter((p) => p.status === 'Pending Verification').length,
        };
      },

      // Get critical tickets (response time > 120 min or priority Critical)
      getCriticalTickets: () => {
        return get().tickets.filter(
          (t) =>
            (t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed') ||
            (t.responseTime && t.responseTime > 120 && t.status === 'Open')
        );
      },

      // Get providers pending verification
      getPendingVerifications: () => {
        return get().providers.filter((p) => p.status === 'Pending Verification');
      },

      // Get verified providers
      getVerifiedProviders: () => {
        return get().providers.filter((p) => p.status === 'Verified');
      },

      // Get provider by ID
      getProviderById: (id) => {
        return get().providers.find((p) => p.id === id);
      },

      // Get ticket by ID
      getTicketById: (id) => {
        return get().tickets.find((t) => t.id === id);
      },
    }),
    {
      name: 'temizinden-admin-storage',
      partialize: (state) => ({
        providers: state.providers,
        tickets: state.tickets,
      }),
    }
  )
);

// ==========================================
// HELPER HOOKS
// ==========================================

export function useAdminMetrics() {
  return useAdminStore((state) => state.getMetrics());
}

export function useCriticalTickets() {
  return useAdminStore((state) => state.getCriticalTickets());
}

export function usePendingVerifications() {
  return useAdminStore((state) => state.getPendingVerifications());
}

export function useVerifiedProviders() {
  return useAdminStore((state) => state.getVerifiedProviders());
}
