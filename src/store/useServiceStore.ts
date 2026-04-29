import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketCategory, TicketPriority, TicketStatus } from '@/store/useCustomerStore';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type ProposalType = 'Discovery' | 'Fixed Price';
export type ProposalStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface Proposal {
  id: string;
  ticketId: string;
  serviceProviderId: string;
  serviceProviderName: string;
  type: ProposalType;
  estimatedCost: number;
  actualCost?: number;
  message: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerLocation: string;
  assetId: string;
  assetName: string;
  assetTagNo: string;
  assetBrand: string;
  assetModel: string;
  assetSerialNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  mediaUrls: string[];
  status: TicketStatus;
  proposals: Proposal[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// MOCK DATA - Service Provider Tickets
// ==========================================

const MOCK_SERVICE_TICKETS: ServiceTicket[] = [
  {
    id: 'st-001',
    customerId: 'cust-001',
    customerName: 'Mehmet Akman',
    customerCompany: 'Akman Kimya Sanayi',
    customerLocation: 'İzmir, Torbalı OSB',
    assetId: 'asset-ak-001',
    assetName: 'Endüstriyel Soğutma Ünitesi',
    assetTagNo: 'AKM-CH-001',
    assetBrand: 'Carrier',
    assetModel: '30XA 1402',
    assetSerialNumber: 'CAR-2021-7782341',
    title: 'Soğutma performansında düşüş - Sıcaklık tutarsızlığı',
    description: 'Soğutma ünitesi istenen sıcaklığı tutturamıyor. Sıcaklık 18°C ile 24°C arasında dalgalanıyor. Kompresör sık sık devreye girip çıkıyor. Son 1 haftadır bu şekilde çalışıyor. Üretim hattında sıcaklık kontrolü kritik öneme sahip.',
    category: 'Mechanic',
    priority: 'High',
    mediaUrls: ['/mock/cooling-unit.jpg'],
    status: 'Open',
    proposals: [],
    createdAt: '2024-04-28T08:30:00Z',
    updatedAt: '2024-04-28T08:30:00Z',
  },
  {
    id: 'st-002',
    customerId: 'cust-002',
    customerName: 'Ayşe Yıldız',
    customerCompany: 'Star Rezidans Yönetimi',
    customerLocation: 'İstanbul, Ataşehir',
    assetId: 'asset-star-001',
    assetName: 'Bina Kompresörü - Hidrofor',
    assetTagNo: 'STR-CMP-003',
    assetBrand: 'Kadıoğlu',
    assetModel: 'KDK-2000',
    assetSerialNumber: 'KDK-2023-1123456',
    title: 'Kompresör basınç şalteri arızası',
    description: 'Hidrofor kompresörü basınç şalterine basmıyor ve sürekli çalışıyor. Manuel reset yapıldığında kısa süreli düzeliyor sonra tekrar aynı sorun. Bina sakinleri su kesintisi yaşıyor.',
    category: 'Electric',
    priority: 'Critical',
    mediaUrls: ['/mock/compressor-alarm.jpg', '/mock/pressure-gauge.mp4'],
    status: 'Open',
    proposals: [],
    createdAt: '2024-04-27T14:15:00Z',
    updatedAt: '2024-04-27T14:15:00Z',
  },
  {
    id: 'st-003',
    customerId: 'cust-003',
    customerName: 'Hasan Çınar',
    customerCompany: 'Çınar Otomotiv Servis',
    customerLocation: 'Ankara, Ostim',
    assetId: 'asset-cn-001',
    assetName: 'Pnomatik Kaldırma Sistemi',
    assetTagNo: 'CNR-PN-002',
    assetBrand: 'Festo',
    assetModel: 'EFSD-80-2000',
    assetSerialNumber: 'FES-2022-5544332',
    title: 'Pnomatik silindir sızıntısı ve yavaş hareket',
    description: 'Kaldırma sisteminin ana silindiri yukarı harekette yavaşlıyor ve piston sızdırıyor. Haftada 3-4 kez yağlama yapılmasına rağmen sorun devam ediyor. Üretim verimliliği %20 düştü.',
    category: 'Pneumatic',
    priority: 'Medium',
    mediaUrls: ['/mock/pneumatic-cylinder.jpg'],
    status: 'Open',
    proposals: [],
    createdAt: '2024-04-26T09:00:00Z',
    updatedAt: '2024-04-26T09:00:00Z',
  },
  {
    id: 'st-004',
    customerId: 'cust-004',
    customerName: 'Zeynep Demir',
    customerCompany: 'Demir Tekstil',
    customerLocation: 'Bursa, Nilüfer',
    assetId: 'asset-dm-001',
    assetName: 'Hidrolik Pres Makinesi',
    assetTagNo: 'DMR-PR-005',
    assetBrand: 'Bosch Rexroth',
    assetModel: 'CytroPac 700',
    assetSerialNumber: 'BRX-2023-9988776',
    title: 'Hidrolik pompa gürültülü çalışıyor',
    description: 'Pres makinesinin hidrolik ünitesi normalden daha gürültülü çalışmaya başladı. Basınç düşüklüğü mevcut ve bazen emniyet kilidi devreye giriyor. Keşif gerektiren bir durum.',
    category: 'Hydraulic',
    priority: 'High',
    mediaUrls: [],
    status: 'Offered',
    proposals: [
      {
        id: 'prop-001',
        ticketId: 'st-004',
        serviceProviderId: 'sp-001',
        serviceProviderName: 'Kaya Hidrolik Servis',
        type: 'Discovery',
        estimatedCost: 1500,
        message: 'Keşif ücreti 1.500 TL + KDV. Keşif sonrası net fiyat verilecektir. Keşif süresi yaklaşık 2 saat. Gerekirse hidrolik yağ analizi yapılacaktır.',
        status: 'Pending',
        createdAt: '2024-04-26T11:30:00Z',
        updatedAt: '2024-04-26T11:30:00Z',
      },
    ],
    createdAt: '2024-04-25T16:45:00Z',
    updatedAt: '2024-04-26T11:30:00Z',
  },
  {
    id: 'st-005',
    customerId: 'cust-005',
    customerName: 'Murat Aksu',
    customerCompany: 'Aksu Klima ve Soğutma',
    customerLocation: 'İzmir, Bornova',
    assetId: 'asset-ak-002',
    assetName: 'Chiller Ünitesi Bakımı',
    assetTagNo: 'AKS-CH-008',
    assetBrand: 'Trane',
    assetModel: 'RTAF 280',
    assetSerialNumber: 'TRN-2021-6677890',
    title: 'Yıllık periyodik bakım ve kompresör kontrol',
    description: 'Chiller ünitesinin yıllık periyodik bakımı. Kompresör yağ değişimi, filtre temizliği, elektrik bağlantı kontrolü ve soğutucu gaz basınç kontrolü.',
    category: 'General',
    priority: 'Low',
    mediaUrls: [],
    status: 'In Progress',
    proposals: [
      {
        id: 'prop-002',
        ticketId: 'st-005',
        serviceProviderId: 'sp-001',
        serviceProviderName: 'Kaya Hidrolik Servis',
        type: 'Fixed Price',
        estimatedCost: 8500,
        actualCost: 8750,
        message: 'Yıllık bakım paketi: Kompresör yağ değişimi, filtre değişimi, elektrik kontrolü, basınç testi ve genel kontrol. İşçilik + malzeme dahil.',
        status: 'Accepted',
        createdAt: '2024-04-20T10:00:00Z',
        updatedAt: '2024-04-22T08:00:00Z',
      },
    ],
    createdAt: '2024-04-20T09:00:00Z',
    updatedAt: '2024-04-22T08:00:00Z',
  },
];

// ==========================================
// STORE INTERFACE
// ==========================================

interface ServiceStoreState {
  tickets: ServiceTicket[];
  currentProviderId: string;
  currentProviderName: string;

  // Ticket Actions
  submitProposal: (
    ticketId: string,
    proposal: Omit<Proposal, 'id' | 'ticketId' | 'serviceProviderId' | 'serviceProviderName' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Proposal;
  updateProposal: (ticketId: string, proposalId: string, updates: Partial<Proposal>) => void;
  withdrawProposal: (ticketId: string, proposalId: string) => void;
  completeJob: (ticketId: string, actualCost: number) => void;

  // Getters
  getNewOpportunities: () => ServiceTicket[];
  getMyProposals: () => ServiceTicket[];
  getActiveJobs: () => ServiceTicket[];
  getTicketById: (id: string) => ServiceTicket | undefined;
  getMyProposalForTicket: (ticketId: string) => Proposal | undefined;
}

/**
 * Service Provider Store - Zustand
 *
 * Manages service provider portal data:
 * - Incoming service tickets from customers
 * - Proposals (Teklifler) submitted by this provider
 * - Active jobs and billing
 */
export const useServiceStore = create<ServiceStoreState>()(
  persist(
    (set, get) => ({
      tickets: MOCK_SERVICE_TICKETS,
      currentProviderId: 'sp-001',
      currentProviderName: 'Kaya Hidrolik Servis',

      // Submit a new proposal for a ticket
      submitProposal: (ticketId, proposalData) => {
        const now = new Date().toISOString();
        const newProposal: Proposal = {
          ...proposalData,
          id: `prop-${Date.now()}`,
          ticketId,
          serviceProviderId: get().currentProviderId,
          serviceProviderName: get().currentProviderName,
          status: 'Pending',
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  proposals: [...ticket.proposals, newProposal],
                  status: ticket.status === 'Open' ? 'Offered' : ticket.status,
                  updatedAt: now,
                }
              : ticket
          ),
        }));

        return newProposal;
      },

      // Update an existing proposal
      updateProposal: (ticketId, proposalId, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  proposals: ticket.proposals.map((p) =>
                    p.id === proposalId ? { ...p, ...updates, updatedAt: now } : p
                  ),
                  updatedAt: now,
                }
              : ticket
          ),
        }));
      },

      // Withdraw a proposal
      withdrawProposal: (ticketId, proposalId) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  proposals: ticket.proposals.map((p) =>
                    p.id === proposalId ? { ...p, status: 'Withdrawn', updatedAt: now } : p
                  ),
                  updatedAt: now,
                }
              : ticket
          ),
        }));
      },

      // Complete a job and set actual cost (Hakediş)
      completeJob: (ticketId, actualCost) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((ticket) => {
            if (ticket.id !== ticketId) return ticket;

            // Update the accepted proposal with actual cost
            const updatedProposals = ticket.proposals.map((p) =>
              p.serviceProviderId === state.currentProviderId && p.status === 'Accepted'
                ? { ...p, actualCost, updatedAt: now }
                : p
            );

            return {
              ...ticket,
              proposals: updatedProposals,
              status: 'Resolved',
              updatedAt: now,
            };
          }),
        }));
      },

      // Getters
      getNewOpportunities: () => {
        return get().tickets.filter(
          (ticket) =>
            ticket.status === 'Open' ||
            (ticket.status === 'Offered' &&
              !ticket.proposals.some((p) => p.serviceProviderId === get().currentProviderId))
        );
      },

      getMyProposals: () => {
        return get().tickets.filter((ticket) =>
          ticket.proposals.some(
            (p) =>
              p.serviceProviderId === get().currentProviderId &&
              (p.status === 'Pending' || p.status === 'Accepted' || p.status === 'Rejected')
          )
        );
      },

      getActiveJobs: () => {
        return get().tickets.filter(
          (ticket) =>
            ticket.status === 'In Progress' &&
            ticket.proposals.some(
              (p) => p.serviceProviderId === get().currentProviderId && p.status === 'Accepted'
            )
        );
      },

      getTicketById: (id) => {
        return get().tickets.find((ticket) => ticket.id === id);
      },

      getMyProposalForTicket: (ticketId) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        return ticket?.proposals.find((p) => p.serviceProviderId === get().currentProviderId);
      },
    }),
    {
      name: 'emaintenance-service-storage',
      partialize: (state) => ({
        tickets: state.tickets,
      }),
    }
  )
);

// ==========================================
// HELPER HOOKS
// ==========================================

export function useTicketStats() {
  return useServiceStore((state) => ({
    newOpportunities: state.getNewOpportunities().length,
    myProposals: state.getMyProposals().filter((t) =>
      t.proposals.some(
        (p) =>
          p.serviceProviderId === state.currentProviderId &&
          (p.status === 'Pending' || p.status === 'Accepted')
      )
    ).length,
    activeJobs: state.getActiveJobs().length,
    completedJobs: state.tickets.filter(
      (t) =>
        t.status === 'Resolved' &&
        t.proposals.some((p) => p.serviceProviderId === state.currentProviderId && p.actualCost)
    ).length,
  }));
}

export function useNewOpportunities() {
  return useServiceStore((state) => state.getNewOpportunities());
}

export function useMyProposals() {
  return useServiceStore((state) => state.getMyProposals());
}

export function useActiveJobs() {
  return useServiceStore((state) => state.getActiveJobs());
}
