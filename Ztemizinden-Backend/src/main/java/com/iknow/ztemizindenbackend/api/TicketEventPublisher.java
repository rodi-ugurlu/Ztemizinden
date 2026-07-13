package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.api.TicketController.TicketEventPayload;
import com.iknow.ztemizindenbackend.api.TicketController.TicketResponse;
import com.iknow.ztemizindenbackend.application.TicketMessageBroadcaster;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class TicketEventPublisher {
    private final TicketMessageBroadcaster ticketMessageBroadcaster;
    private final ServiceProviderRepository serviceProviderRepository;

    void publish(String type, Ticket ticket) {
        publish(type, ticket, null);
    }

    void publish(String type, Ticket ticket, String conversationId) {
        ticketMessageBroadcaster.publishCustomerTicket(
                ticket.getCustomerId(),
                new TicketEventPayload(type, conversationId, TicketResponse.fromForCustomer(ticket))
        );

        providerIds(type, ticket, conversationId).forEach(providerId -> ticketMessageBroadcaster.publishProviderTicket(
                providerId,
                new TicketEventPayload(
                        type,
                        conversationIdForProvider(ticket, providerId),
                        TicketResponse.fromForService(ticket, providerId)
                )
        ));
    }

    private List<String> providerIds(String type, Ticket ticket, String conversationId) {
        if (conversationId != null && !conversationId.isBlank()) {
            return ticket.getConversations().stream()
                    .filter(conversation -> conversationId.equals(conversation.getId()))
                    .map(TicketConversation::getProviderId)
                    .filter(providerId -> providerId != null && !providerId.isBlank())
                    .distinct()
                    .toList();
        }

        List<String> providerIds = new ArrayList<>();
        if (ticket.getAssignedProviderId() != null && !ticket.getAssignedProviderId().isBlank()) {
            providerIds.add(ticket.getAssignedProviderId());
        }
        if (shouldBroadcastToMatchingProviders(type, conversationId)) {
            serviceProviderRepository.findAll().stream()
                    .filter(provider -> provider.getStatus() == ProviderStatus.VERIFIED)
                    .filter(provider -> provider.getSpecialties() != null && provider.getSpecialties().contains(ticket.getCategory()))
                    .map(ServiceProvider::getId)
                    .filter(providerId -> providerId != null && !providerId.isBlank())
                    .forEach(providerIds::add);
        }
        return providerIds.stream().distinct().toList();
    }

    private static boolean shouldBroadcastToMatchingProviders(String type, String conversationId) {
        if (conversationId != null && !conversationId.isBlank()) {
            return false;
        }
        return switch (type) {
            case "TICKET_CREATED", "OFFER_SUBMITTED", "OFFER_ACCEPTED", "TICKET_CANCELLED", "TICKET_ASSIGNED" -> true;
            default -> false;
        };
    }

    private static String conversationIdForProvider(Ticket ticket, String providerId) {
        return ticket.getConversations().stream()
                .filter(conversation -> conversation.getProviderId().equals(providerId))
                .map(TicketConversation::getId)
                .findFirst()
                .orElse(null);
    }
}
