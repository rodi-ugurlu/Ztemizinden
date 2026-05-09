package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.BillingStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "tickets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Ticket extends BaseEntity {
    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerCompany;

    @Column(nullable = false)
    private String customerLocation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4_000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.OPEN;

    @Column(nullable = false)
    private int slaTargetMinutes;

    private String assignedProviderId;
    private String assignedProviderName;
    private String serviceEta;

    @Column(precision = 12, scale = 2)
    private BigDecimal finalEstimatedCost;

    @Column(precision = 12, scale = 2)
    private BigDecimal finalActualCost;

    @Column(length = 2_000)
    private String finalBillingNotes;

    @Enumerated(EnumType.STRING)
    private BillingStatus billingStatus;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketOffer> offers = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TicketMessage> messages = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "ticket_media_urls", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "media_url", nullable = false, length = 1_000)
    private Set<String> mediaUrls = new LinkedHashSet<>();

    public Ticket(
            String customerId,
            String customerName,
            String customerCompany,
            String customerLocation,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority
    ) {
        this(customerId, customerName, customerCompany, customerLocation, asset, title, description, category, priority, List.of());
    }

    public Ticket(
            String customerId,
            String customerName,
            String customerCompany,
            String customerLocation,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority,
            List<String> mediaUrls
    ) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerCompany = customerCompany;
        this.customerLocation = customerLocation;
        this.asset = asset;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.slaTargetMinutes = defaultSla(priority);
        this.mediaUrls = new LinkedHashSet<>(mediaUrls == null ? List.of() : mediaUrls);
    }

    public TicketOffer addOffer(
            String providerId,
            String providerName,
            OfferType type,
            BigDecimal estimatedCost,
            String eta,
            String message
    ) {
        ensureOpenForOffer();
        TicketOffer offer = new TicketOffer(this, providerId, providerName, type, estimatedCost, eta, message);
        offers.add(offer);
        status = TicketStatus.OFFERED;
        return offer;
    }

    public void acceptOffer(String offerId) {
        TicketOffer acceptedOffer = offers.stream()
                .filter(offer -> offer.getId().equals(offerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        offers.forEach(TicketOffer::reject);
        acceptedOffer.accept();
        assignedProviderId = acceptedOffer.getProviderId();
        assignedProviderName = acceptedOffer.getProviderName();
        serviceEta = acceptedOffer.getEta();
        finalEstimatedCost = acceptedOffer.getEstimatedCost();
        status = TicketStatus.IN_PROGRESS;
        asset.markUnderMaintenance();
        addSystemMessage(acceptedOffer.getProviderName() + " servisi davet edildi.");
    }

    public void rejectOffer(String offerId) {
        TicketOffer rejectedOffer = offers.stream()
                .filter(offer -> offer.getId().equals(offerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        rejectedOffer.reject();
        if (offers.stream().noneMatch(offer -> offer.getStatus() == com.iknow.ztemizindenbackend.domain.Enums.OfferStatus.PENDING)) {
            status = TicketStatus.OPEN;
        }
    }

    public void assignProvider(String providerId, String providerName) {
        assignedProviderId = providerId;
        assignedProviderName = providerName;
        status = TicketStatus.IN_PROGRESS;
        asset.markUnderMaintenance();
        addSystemMessage(providerName + " servisi operasyondan atandi.");
    }

    public void submitFinalBilling(BigDecimal actualCost, String notes) {
        if (status != TicketStatus.IN_PROGRESS) {
            throw new IllegalStateException("Only in-progress tickets can receive final billing");
        }
        finalActualCost = actualCost;
        finalBillingNotes = notes;
        billingStatus = BillingStatus.AWAITING_CUSTOMER_APPROVAL;
        status = TicketStatus.RESOLVED;
        addSystemMessage("Servis isi tamamlandi ve hak edis onaya gonderildi.");
    }

    public void approveFinalBilling() {
        if (billingStatus != BillingStatus.AWAITING_CUSTOMER_APPROVAL) {
            throw new IllegalStateException("No billing waiting for approval");
        }
        billingStatus = BillingStatus.APPROVED;
        status = TicketStatus.CLOSED;
        asset.markActive();
        addSystemMessage("Hak edis onaylandi ve talep kapatildi.");
    }

    public void disputeFinalBilling(String reason) {
        if (billingStatus != BillingStatus.AWAITING_CUSTOMER_APPROVAL) {
            throw new IllegalStateException("No billing waiting for approval");
        }
        billingStatus = BillingStatus.DISPUTED;
        status = TicketStatus.RESOLVED;
        addCustomerMessage(reason);
    }

    public void cancel() {
        if (status == TicketStatus.CLOSED || status == TicketStatus.CANCELLED) {
            throw new IllegalStateException("Ticket cannot be cancelled");
        }
        status = TicketStatus.CANCELLED;
        asset.markActive();
        addSystemMessage("Talep iptal edildi.");
    }

    public TicketMessage addCustomerMessage(String body) {
        return addCustomerMessage(customerName, body);
    }

    public TicketMessage addCustomerMessage(String senderName, String body) {
        TicketMessage message = new TicketMessage(this, "customer", displayName(senderName, customerName), body);
        messages.add(message);
        return message;
    }

    public TicketMessage addServiceMessage(String senderName, String body) {
        TicketMessage message = new TicketMessage(this, "service", displayName(senderName, assignedProviderName), body);
        messages.add(message);
        return message;
    }

    public TicketOffer latestOffer() {
        return offers.stream()
                .max(Comparator.comparing(TicketOffer::getCreatedAt))
                .orElse(null);
    }

    private void ensureOpenForOffer() {
        if (status != TicketStatus.OPEN && status != TicketStatus.OFFERED) {
            throw new IllegalStateException("Ticket is not open for offers");
        }
    }

    private void addSystemMessage(String body) {
        messages.add(new TicketMessage(this, "system", "Ztemizinden Operasyon", body));
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

    private static int defaultSla(TicketPriority priority) {
        return switch (priority) {
            case CRITICAL -> 45;
            case HIGH -> 120;
            case MEDIUM -> 240;
            case LOW -> 480;
        };
    }
}
