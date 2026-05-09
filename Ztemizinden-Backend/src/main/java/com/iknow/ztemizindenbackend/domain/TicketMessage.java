package com.iknow.ztemizindenbackend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "ticket_messages")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TicketMessage extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String senderRole;

    @Column(nullable = false)
    private String senderName;

    @Column(nullable = false, length = 2_000)
    private String body;

    TicketMessage(Ticket ticket, String senderRole, String senderName, String body) {
        this.ticket = ticket;
        this.senderRole = senderRole;
        this.senderName = senderName;
        this.body = body;
    }
}
