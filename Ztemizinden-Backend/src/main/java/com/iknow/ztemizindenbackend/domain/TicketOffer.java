package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.OfferStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "ticket_offers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TicketOffer extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String providerId;

    @Column(nullable = false)
    private String providerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    @Column(nullable = false)
    private String eta;

    @Column(nullable = false, length = 2_000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.PENDING;

    TicketOffer(
            Ticket ticket,
            String providerId,
            String providerName,
            OfferType type,
            BigDecimal estimatedCost,
            String eta,
            String message
    ) {
        this.ticket = ticket;
        this.providerId = providerId;
        this.providerName = providerName;
        this.type = type;
        this.estimatedCost = estimatedCost;
        this.eta = eta;
        this.message = message;
    }

    void accept() {
        status = OfferStatus.ACCEPTED;
    }

    void reject() {
        if (status == OfferStatus.PENDING) {
            status = OfferStatus.REJECTED;
        }
    }
}
