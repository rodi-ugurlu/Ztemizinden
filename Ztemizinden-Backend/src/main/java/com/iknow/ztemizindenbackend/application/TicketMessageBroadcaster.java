package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.api.TicketMessagePayload;
import com.iknow.ztemizindenbackend.domain.TicketMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketMessageBroadcaster {
    private final SimpMessagingTemplate messagingTemplate;

    public void publish(TicketMessage message) {
        messagingTemplate.convertAndSend(
                "/topic/tickets/" + message.getTicket().getId() + "/messages",
                TicketMessagePayload.from(message)
        );
    }

    public void publishConversation(TicketMessage message) {
        if (message.getConversation() == null) {
            publish(message);
            return;
        }
        messagingTemplate.convertAndSend(
                "/topic/tickets/" + message.getTicket().getId()
                        + "/conversations/" + message.getConversation().getId()
                        + "/messages",
                TicketMessagePayload.from(message)
        );
    }

    public void publishCustomerTicket(String customerId, Object payload) {
        messagingTemplate.convertAndSend("/topic/customers/" + customerId + "/tickets", payload);
    }

    public void publishProviderTicket(String providerId, Object payload) {
        messagingTemplate.convertAndSend("/topic/providers/" + providerId + "/tickets", payload);
    }
}
