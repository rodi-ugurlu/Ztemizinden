package com.iknow.ztemizindenbackend.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.Enums.ConversationClosedReason;
import com.iknow.ztemizindenbackend.domain.Enums.ConversationStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import com.iknow.ztemizindenbackend.domain.TicketMessage;
import com.iknow.ztemizindenbackend.domain.TicketOffer;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.math.BigDecimal;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

class TicketServiceTest {
    private final Map<String, Ticket> ticketsById = new HashMap<>();
    private final Map<String, ServiceProvider> providersById = new HashMap<>();
    private List<Ticket> opportunityTickets = List.of();

    private final TicketRepository ticketRepository = repositoryProxy(TicketRepository.class, (proxy, method, args) -> {
        return switch (method.getName()) {
            case "findById" -> Optional.ofNullable(ticketsById.get((String) args[0]));
            case "findByStatusInOrderByCreatedAtAsc" -> opportunityTickets;
            default -> throw new UnsupportedOperationException(method.getName());
        };
    });
    private final AssetRepository assetRepository = repositoryProxy(AssetRepository.class, unsupportedRepository());
    private final ServiceProviderRepository serviceProviderRepository = repositoryProxy(
            ServiceProviderRepository.class,
            (proxy, method, args) -> {
                return switch (method.getName()) {
                    case "findById" -> Optional.ofNullable(providersById.get((String) args[0]));
                    default -> throw new UnsupportedOperationException(method.getName());
                };
            }
    );
    private final TicketService ticketService = new TicketService(
            ticketRepository,
            assetRepository,
            serviceProviderRepository
    );

    @Test
    void listOpportunitiesReturnsOnlyTicketsMatchingProviderSpecialties() {
        ServiceProvider hydraulicProvider = provider("sp-hyd", TicketCategory.HYDRAULIC);
        Ticket hydraulicTicket = ticket("ticket-hyd", TicketCategory.HYDRAULIC);
        Ticket electricTicket = ticket("ticket-electric", TicketCategory.ELECTRIC);

        providersById.put("sp-hyd", hydraulicProvider);
        opportunityTickets = List.of(hydraulicTicket, electricTicket);

        List<Ticket> opportunities = ticketService.listOpportunities("sp-hyd");

        assertEquals(1, opportunities.size());
        assertSame(hydraulicTicket, opportunities.getFirst());
    }

    @Test
    void addOfferRejectsProviderOutsideTicketCategory() {
        ServiceProvider hydraulicProvider = provider("sp-hyd", TicketCategory.HYDRAULIC);
        Ticket electricTicket = ticket("ticket-electric", TicketCategory.ELECTRIC);

        providersById.put("sp-hyd", hydraulicProvider);
        ticketsById.put("ticket-electric", electricTicket);

        assertThrows(AccessDeniedException.class, () -> ticketService.addOffer(
                "ticket-electric",
                new TicketService.AddOfferCommand(
                        "sp-hyd",
                        "Hydraulic Service",
                        OfferType.FIXED_PRICE,
                        BigDecimal.valueOf(1_000),
                        "Today",
                        "We can help"
                )
        ));
        assertEquals(0, electricTicket.getOffers().size());
    }

    @Test
    void getForProviderRejectsUnassignedTicketOutsideProviderCategory() {
        ServiceProvider hydraulicProvider = provider("sp-hyd", TicketCategory.HYDRAULIC);
        Ticket electricTicket = ticket("ticket-electric", TicketCategory.ELECTRIC);

        providersById.put("sp-hyd", hydraulicProvider);
        ticketsById.put("ticket-electric", electricTicket);

        assertThrows(
                AccessDeniedException.class,
                () -> ticketService.getForProvider("ticket-electric", "sp-hyd")
        );
    }

    @Test
    void ticketMessagesTrackUnreadSideByRole() {
        Ticket ticket = ticket("ticket-hyd", TicketCategory.HYDRAULIC);

        TicketMessage customerMessage = ticket.addCustomerMessage("Customer", "Makine durdu");
        TicketMessage serviceMessage = ticket.addServiceMessage("Provider", "Yola cikiyoruz");

        assertEquals(true, customerMessage.isUnreadForService());
        assertEquals(false, customerMessage.isUnreadForCustomer());
        assertEquals(true, serviceMessage.isUnreadForCustomer());
        assertEquals(false, serviceMessage.isUnreadForService());

        ticket.markMessagesReadByService();
        ticket.markMessagesReadByCustomer();

        assertEquals(false, customerMessage.isUnreadForService());
        assertEquals(false, serviceMessage.isUnreadForCustomer());
    }

    @Test
    void inviteOfferCreatesActiveConversationWithoutClosingOtherOffers() {
        Ticket ticket = ticket("ticket-hyd", TicketCategory.HYDRAULIC);
        TicketOffer firstOffer = addOffer(ticket, "offer-1", "sp-1");
        TicketOffer secondOffer = addOffer(ticket, "offer-2", "sp-2");
        ticketsById.put(ticket.getId(), ticket);

        TicketService.TicketMutationResult inviteResult = ticketService.inviteOffer(ticket.getId(), firstOffer.getId());
        ticketService.inviteOffer(ticket.getId(), secondOffer.getId());

        assertEquals(TicketStatus.OFFERED, ticket.getStatus());
        assertEquals(OfferStatus.INVITED, firstOffer.getStatus());
        assertEquals(OfferStatus.INVITED, secondOffer.getStatus());
        assertEquals(1, inviteResult.messages().size());
        assertEquals("system", inviteResult.messages().getFirst().getSenderRole());
        assertEquals(2, ticket.getConversations().size());
        assertEquals(2, ticket.getConversations().stream()
                .filter(conversation -> conversation.getStatus() == ConversationStatus.ACTIVE)
                .count());
    }

    @Test
    void acceptInvitedOfferStartsJobAndClosesOtherSelectableConversations() {
        Ticket ticket = ticket("ticket-hyd", TicketCategory.HYDRAULIC);
        TicketOffer selectedOffer = addOffer(ticket, "offer-1", "sp-1");
        TicketOffer otherOffer = addOffer(ticket, "offer-2", "sp-2");
        ticketsById.put(ticket.getId(), ticket);

        ticketService.inviteOffer(ticket.getId(), selectedOffer.getId());
        ticketService.inviteOffer(ticket.getId(), otherOffer.getId());

        TicketService.TicketMutationResult acceptResult = ticketService.acceptOffer(ticket.getId(), selectedOffer.getId());

        TicketConversation selectedConversation = conversationForOffer(ticket, selectedOffer);
        TicketConversation otherConversation = conversationForOffer(ticket, otherOffer);
        assertEquals(TicketStatus.IN_PROGRESS, ticket.getStatus());
        assertEquals("sp-1", ticket.getAssignedProviderId());
        assertEquals(OfferStatus.ACCEPTED, selectedOffer.getStatus());
        assertEquals(OfferStatus.REJECTED, otherOffer.getStatus());
        assertEquals(ConversationStatus.ACCEPTED, selectedConversation.getStatus());
        assertEquals(ConversationStatus.CLOSED, otherConversation.getStatus());
        assertEquals(ConversationClosedReason.NOT_SELECTED, otherConversation.getClosedReason());
        assertEquals(2, acceptResult.messages().size());
    }

    @Test
    void rejectInvitedOfferClosesConversationAndKeepsTicketOpenForNewOffers() {
        Ticket ticket = ticket("ticket-hyd", TicketCategory.HYDRAULIC);
        TicketOffer offer = addOffer(ticket, "offer-1", "sp-1");
        ticketsById.put(ticket.getId(), ticket);

        ticketService.inviteOffer(ticket.getId(), offer.getId());
        TicketConversation conversation = conversationForOffer(ticket, offer);
        ReflectionTestUtils.setField(conversation, "id", "conversation-1");

        TicketService.TicketMutationResult rejectResult = ticketService.rejectOffer(ticket.getId(), offer.getId());

        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(OfferStatus.REJECTED, offer.getStatus());
        assertEquals(ConversationStatus.CLOSED, conversation.getStatus());
        assertEquals(ConversationClosedReason.REJECTED, conversation.getClosedReason());
        assertEquals(1, rejectResult.messages().size());
        assertThrows(IllegalStateException.class, () -> ticketService.addCustomerConversationMessage(
                ticket.getId(),
                conversation.getId(),
                "Customer",
                "Hala gorusebilir miyiz?"
        ));
    }

    @Test
    void providerCannotWriteToAnotherProvidersConversation() {
        Ticket ticket = ticket("ticket-hyd", TicketCategory.HYDRAULIC);
        TicketOffer offer = addOffer(ticket, "offer-1", "sp-1");
        ticketsById.put(ticket.getId(), ticket);

        ticketService.inviteOffer(ticket.getId(), offer.getId());
        TicketConversation conversation = conversationForOffer(ticket, offer);
        ReflectionTestUtils.setField(conversation, "id", "conversation-1");

        assertThrows(AccessDeniedException.class, () -> ticketService.addServiceConversationMessage(
                ticket.getId(),
                conversation.getId(),
                "sp-2",
                "Other Provider",
                "Bu thread bana ait degil"
        ));
    }

    private ServiceProvider provider(String id, TicketCategory specialty) {
        ServiceProvider provider = new ServiceProvider(
                "Provider " + id,
                "Contact",
                id + "@demo.com",
                "+90 532 000 00 00",
                "Istanbul",
                "Kadikoy",
                Set.of(specialty),
                Set.of(),
                Set.of("Kadikoy")
        );
        ReflectionTestUtils.setField(provider, "id", id);
        provider.verify();
        return provider;
    }

    private Ticket ticket(String id, TicketCategory category) {
        Asset asset = new Asset(
                "cust-1",
                "Asset " + id,
                "TAG-" + id,
                AssetType.FACILITY,
                "Brand",
                "Model",
                "SN-" + id,
                null,
                null,
                "Istanbul",
                "Maintenance",
                null
        );
        ReflectionTestUtils.setField(asset, "id", "asset-" + id);

        Ticket ticket = new Ticket(
                "cust-1",
                "Customer",
                "Factory",
                "Istanbul, Kadikoy",
                asset,
                "Ticket " + id,
                "Description",
                category,
                TicketPriority.MEDIUM
        );
        ReflectionTestUtils.setField(ticket, "id", id);
        return ticket;
    }

    private TicketOffer addOffer(Ticket ticket, String id, String providerId) {
        TicketOffer offer = ticket.addOffer(
                providerId,
                "Provider " + providerId,
                OfferType.FIXED_PRICE,
                BigDecimal.valueOf(1_000),
                "Bugun",
                "We can help"
        );
        ReflectionTestUtils.setField(offer, "id", id);
        return offer;
    }

    private TicketConversation conversationForOffer(Ticket ticket, TicketOffer offer) {
        return ticket.getConversations().stream()
                .filter(conversation -> conversation.getOffer().getId().equals(offer.getId()))
                .findFirst()
                .orElseThrow();
    }

    private static InvocationHandler unsupportedRepository() {
        return (proxy, method, args) -> {
            throw new UnsupportedOperationException(method.getName());
        };
    }

    private static <T> T repositoryProxy(Class<T> type, InvocationHandler handler) {
        Object proxy = Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[]{type},
                (target, method, args) -> {
                    if (method.getDeclaringClass() == Object.class) {
                        return objectMethod(target, method, args);
                    }
                    return handler.invoke(target, method, args);
                }
        );
        return type.cast(proxy);
    }

    private static Object objectMethod(Object target, Method method, Object[] args) {
        return switch (method.getName()) {
            case "toString" -> "repository test proxy";
            case "hashCode" -> System.identityHashCode(target);
            case "equals" -> target == args[0];
            default -> throw new UnsupportedOperationException(method.getName());
        };
    }
}
