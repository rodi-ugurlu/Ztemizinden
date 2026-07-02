import type { OfferStatus, Ticket } from '@/store/useCustomerStore';

export type ServiceTicketView =
  | 'all'
  | 'new'
  | 'proposals'
  | 'accepted'
  | 'open-billing'
  | 'closed-billing';

export const serviceTicketViewOrder: ServiceTicketView[] = [
  'new',
  'proposals',
  'accepted',
  'open-billing',
  'closed-billing',
  'all',
];

export const serviceTicketViewMeta: Record<ServiceTicketView, { title: string; description: string; emptyTitle: string; emptyDescription: string }> = {
  all: {
    title: 'Tüm Talepler',
    description: 'Etkileşimde bulunduğunuz tüm servis taleplerini görüntüleyin',
    emptyTitle: 'Talep bulunamadı',
    emptyDescription: 'Filtrelerinizi değiştirmeyi deneyin',
  },
  new: {
    title: 'Yeni Gelen Talepler',
    description: 'Henüz teklif vermediğiniz, servis kapsamınıza düşen yeni fabrika talepleri',
    emptyTitle: 'Yeni talep yok',
    emptyDescription: 'Kapsamınıza uygun yeni talepler geldiğinde burada görünecek.',
  },
  proposals: {
    title: 'Teklif Verilen Talepler',
    description: 'Teklif gönderdiğiniz ve müşteri onayı bekleyen işler',
    emptyTitle: 'Onay bekleyen teklif yok',
    emptyDescription: 'Açık teklif verdiğiniz işler burada takip edilir.',
  },
  accepted: {
    title: 'Kabul Edilen Talepler',
    description: 'Müşterinin kabul ettiği, henüz hakediş sürecine alınmamış aktif işler',
    emptyTitle: 'Kabul edilen aktif iş yok',
    emptyDescription: 'Teklifiniz kabul edildiğinde iş burada açılır.',
  },
  'open-billing': {
    title: 'Hakediş Verilen Açık İşler',
    description: 'Hakedişi oluşturulmuş; müşteri onayı, itiraz veya ödeme süreci devam eden işler',
    emptyTitle: 'Açık hakediş süreci yok',
    emptyDescription: 'Hakediş oluşturduğunuz açık işler burada takip edilir.',
  },
  'closed-billing': {
    title: 'Hakediş Verilen Kapanan İşler',
    description: 'Onaylanmış, kapanmış ve arşive düşmüş hakedişli işler',
    emptyTitle: 'Kapanan hakedişli iş yok',
    emptyDescription: 'Tamamlanıp onaylanan işler arşivde burada yer alır.',
  },
};

export function serviceTicketViewFromParam(value: string | null): ServiceTicketView {
  return serviceTicketViewOrder.includes(value as ServiceTicketView) ? (value as ServiceTicketView) : 'all';
}

export function matchesServiceTicketView(
  ticket: Ticket,
  view: ServiceTicketView,
  providerId: string,
  opportunityIds: ReadonlySet<string>
) {
  switch (view) {
    case 'new':
      return opportunityIds.has(ticket.id);
    case 'proposals':
      return hasProviderOffer(ticket, providerId, 'PENDING') || hasProviderOffer(ticket, providerId, 'INVITED');
    case 'accepted':
      return isAcceptedActiveJob(ticket, providerId);
    case 'open-billing':
      return isOpenBillingJob(ticket);
    case 'closed-billing':
      return isClosedBillingJob(ticket);
    case 'all':
    default:
      return true;
  }
}

export function hasProviderOffer(ticket: Ticket, providerId: string, status?: OfferStatus) {
  return ticket.offers.some((offer) =>
    offer.providerId === providerId && (!status || offer.status === status)
  );
}

export function isAcceptedActiveJob(ticket: Ticket, providerId: string) {
  return (
    ticket.status === 'IN_PROGRESS' &&
    ticket.billingStatus == null &&
    (ticket.assignedProviderId === providerId || hasProviderOffer(ticket, providerId, 'ACCEPTED'))
  );
}

export function isOpenBillingJob(ticket: Ticket) {
  return (
    ticket.billingStatus === 'AWAITING_CUSTOMER_APPROVAL' ||
    ticket.billingStatus === 'DISPUTED' ||
    ticket.status === 'RESOLVED'
  );
}

export function isClosedBillingJob(ticket: Ticket) {
  return ticket.billingStatus === 'APPROVED' || ticket.status === 'CLOSED';
}

export function serviceTicketSortTimestamp(ticket: Ticket, view: ServiceTicketView) {
  const value = view === 'new' ? ticket.createdAt : ticket.updatedAt || ticket.createdAt;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
