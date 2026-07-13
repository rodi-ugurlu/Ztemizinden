package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.ConversationClosedReason;
import com.iknow.ztemizindenbackend.domain.Enums.ConversationStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

@Getter
@Entity
@Table(name = "ticket_conversations")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TicketConversation extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offer_id", nullable = false)
    private TicketOffer offer;

    @Column(nullable = false)
    private String providerId;

    @Column(nullable = false)
    private String providerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    private ConversationClosedReason closedReason;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<TicketMessage> messages = new LinkedHashSet<>();

    TicketConversation(Ticket ticket, TicketOffer offer) {
        this.ticket = ticket;
        this.offer = offer;
        this.providerId = offer.getProviderId();
        this.providerName = offer.getProviderName();
    }

    void accept() {
        status = ConversationStatus.ACCEPTED;
        closedReason = null;
    }

    void closeRejected() {
        status = ConversationStatus.CLOSED;
        closedReason = ConversationClosedReason.REJECTED;
    }

    void closeNotSelected() {
        status = ConversationStatus.CLOSED;
        closedReason = ConversationClosedReason.NOT_SELECTED;
    }

    void closeTicketCancelled() {
        status = ConversationStatus.CLOSED;
        closedReason = ConversationClosedReason.TICKET_CANCELLED;
    }

    void closeTicketClosed() {
        status = ConversationStatus.CLOSED;
        closedReason = ConversationClosedReason.TICKET_CLOSED;
    }

    TicketMessage addCustomerMessage(String senderName, String body) {
        ensureWritable();
        TicketMessage message = new TicketMessage(ticket, this, "customer", displayName(senderName, ticket.getCustomerName()), body);
        messages.add(message);
        return message;
    }

    TicketMessage addServiceMessage(String senderName, String body) {
        ensureWritable();
        TicketMessage message = new TicketMessage(ticket, this, "service", displayName(senderName, providerName), body);
        messages.add(message);
        return message;
    }

    TicketMessage addSystemMessage(String body) {
        TicketMessage message = new TicketMessage(ticket, this, "system", "Ztemizinden Operasyon", body);
        messages.add(message);
        return message;
    }

    void markMessagesReadByCustomer() {
        messages.forEach(TicketMessage::markReadByCustomer);
    }

    void markMessagesReadByService() {
        messages.forEach(TicketMessage::markReadByService);
    }

    public boolean isForProvider(String providerId) {
        return this.providerId.equals(providerId);
    }

    boolean isWritable() {
        return status != ConversationStatus.CLOSED;
    }

    private void ensureWritable() {
        if (!isWritable()) {
            throw new IllegalStateException("Conversation is closed");
        }
    }

    private static String displayName(String value, String fallback) {
        if (value != null && !value.isBlank()) {
            return value;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return "Servis";
    }
}
