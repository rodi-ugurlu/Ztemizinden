package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.domain.TicketMessage;
import java.time.Instant;

public record TicketMessagePayload(
        String id,
        String ticketId,
        String conversationId,
        String senderRole,
        String senderName,
        String body,
        boolean readByCustomer,
        boolean readByService,
        Instant createdAt
) {
    public static TicketMessagePayload from(TicketMessage message) {
        return new TicketMessagePayload(
                message.getId(),
                message.getTicket().getId(),
                message.getConversation() == null ? null : message.getConversation().getId(),
                message.getSenderRole(),
                message.getSenderName(),
                message.getBody(),
                message.isReadByCustomer(),
                message.isReadByService(),
                message.getCreatedAt()
        );
    }
}
