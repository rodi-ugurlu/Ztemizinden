package com.iknow.ztemizindenbackend.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.iknow.ztemizindenbackend.application.TicketMessageBroadcaster;
import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import com.iknow.ztemizindenbackend.domain.TicketOffer;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TicketEventPublisherTest {

    @Test
    void executionEventsAreOnlyPublishedToAssignedProvider() {
        Ticket ticket = ticket();
        TicketOffer selected = addOffer(ticket, "offer-1", "sp-1");
        addOffer(ticket, "offer-2", "sp-2");
        ticket.acceptOffer(selected.getId());
        int conversationNumber = 1;
        for (TicketConversation conversation : ticket.getConversations()) {
            ReflectionTestUtils.setField(conversation, "id", "conversation-" + conversationNumber++);
        }

        RecordingBroadcaster broadcaster = new RecordingBroadcaster();
        TicketEventPublisher publisher = new TicketEventPublisher(broadcaster, null);

        publisher.publish("BILLING_SUBMITTED", ticket);

        assertEquals(List.of("sp-1"), broadcaster.providerIds);
    }

    private Ticket ticket() {
        Asset asset = new Asset(
                "cust-1", "Asset", "TAG-1", AssetType.FACILITY,
                "Brand", "Model", "SN-1", null, null,
                "Istanbul", "Maintenance", null
        );
        ReflectionTestUtils.setField(asset, "id", "asset-1");
        Ticket ticket = new Ticket(
                "cust-1", "Customer", "Factory", "Istanbul",
                asset, "Ticket", "Description",
                TicketCategory.HYDRAULIC, TicketPriority.MEDIUM
        );
        ReflectionTestUtils.setField(ticket, "id", "ticket-1");
        return ticket;
    }

    private TicketOffer addOffer(Ticket ticket, String id, String providerId) {
        TicketOffer offer = ticket.addOffer(
                providerId,
                "Provider " + providerId,
                OfferType.FIXED_PRICE,
                BigDecimal.valueOf(1_000),
                "Today",
                "Offer"
        );
        ReflectionTestUtils.setField(offer, "id", id);
        return offer;
    }

    private static class RecordingBroadcaster extends TicketMessageBroadcaster {
        private final List<String> providerIds = new ArrayList<>();

        RecordingBroadcaster() {
            super(null);
        }

        @Override
        public void publishCustomerTicket(String customerId, Object payload) {
            // Customer delivery is outside this provider-isolation assertion.
        }

        @Override
        public void publishProviderTicket(String providerId, Object payload) {
            providerIds.add(providerId);
        }
    }
}
