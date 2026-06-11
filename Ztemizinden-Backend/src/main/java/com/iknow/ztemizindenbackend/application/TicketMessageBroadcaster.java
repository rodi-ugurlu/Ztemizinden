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
}
