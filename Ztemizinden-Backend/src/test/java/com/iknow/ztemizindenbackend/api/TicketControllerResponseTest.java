package com.iknow.ztemizindenbackend.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import com.iknow.ztemizindenbackend.domain.TicketOffer;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TicketControllerResponseTest {

    @Test
    void serviceResponseOnlyIncludesThatProvidersOfferAndConversation() {
        Ticket ticket = ticket("ticket-1");
        TicketOffer firstOffer = addOffer(ticket, "offer-1", "sp-1");
        addOffer(ticket, "offer-2", "sp-2");
        ticket.inviteOffer(firstOffer.getId());
        setConversationId(ticket, firstOffer, "conversation-1");

        TicketController.TicketResponse response = TicketController.TicketResponse.fromForService(ticket, "sp-1");

        assertEquals(1, response.offers().size());
        assertEquals("sp-1", response.offers().getFirst().providerId());
        assertEquals(1, response.conversations().size());
        assertEquals("sp-1", response.conversations().getFirst().providerId());
    }

    @Test
    void serviceResponseWithoutProviderContextDoesNotExposePrivateOffersOrConversations() {
        Ticket ticket = ticket("ticket-1");
        TicketOffer offer = addOffer(ticket, "offer-1", "sp-1");
        ticket.inviteOffer(offer.getId());
        setConversationId(ticket, offer, "conversation-1");

        TicketController.TicketResponse response = TicketController.TicketResponse.fromForService(ticket);

        assertEquals(0, response.offers().size());
        assertEquals(0, response.conversations().size());
    }

    private Ticket ticket(String id) {
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
                TicketCategory.HYDRAULIC,
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

    private void setConversationId(Ticket ticket, TicketOffer offer, String id) {
        TicketConversation conversation = ticket.getConversations().stream()
                .filter(candidate -> candidate.getOffer().getId().equals(offer.getId()))
                .findFirst()
                .orElseThrow();
        ReflectionTestUtils.setField(conversation, "id", id);
    }
}
