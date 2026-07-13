package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Ticket;
import java.util.List;

final class TicketDetailsLoader {
    private TicketDetailsLoader() {
    }

    static Ticket load(Ticket ticket) {
        ticket.getAsset().getId();
        ticket.getMediaUrls().size();
        ticket.getOffers().size();
        ticket.getMessages().size();
        ticket.getConversations().forEach(conversation -> {
            conversation.getOffer().getProviderId();
            conversation.getMessages().size();
        });
        return ticket;
    }

    static List<Ticket> loadAll(List<Ticket> tickets) {
        tickets.forEach(TicketDetailsLoader::load);
        return tickets;
    }
}
