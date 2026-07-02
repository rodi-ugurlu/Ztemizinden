package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.BillingStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferStatus;
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

    private String customerCity;
    private String customerDistrict;

    @Column(length = 500)
    private String customerAddress;

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
    private Set<TicketConversation> conversations = new LinkedHashSet<>();

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
        this(customerId, customerName, customerCompany, customerLocation, null, null, null, asset, title, description, category, priority, mediaUrls);
    }

    public Ticket(
            String customerId,
            String customerName,
            String customerCompany,
            String customerLocation,
            String customerCity,
            String customerDistrict,
            String customerAddress,
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
        this.customerCity = customerCity;
        this.customerDistrict = customerDistrict;
        this.customerAddress = customerAddress;
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
        if (offers.stream().anyMatch(offer -> offer.getProviderId().equals(providerId)
                && offer.isSelectable())) {
            throw new IllegalStateException("Provider already has an active offer for this ticket");
        }
        TicketOffer offer = new TicketOffer(this, providerId, providerName, type, estimatedCost, eta, message);
        offers.add(offer);
        status = TicketStatus.OFFERED;
        return offer;
    }

    public TicketConversation inviteOffer(String offerId) {
        if (status != TicketStatus.OFFERED) {
            throw new IllegalStateException("Ticket is not waiting for offer approval");
        }
        TicketOffer invitedOffer = offer(offerId);
        invitedOffer.invite();

        TicketConversation conversation = conversationForOfferOrCreate(invitedOffer);
        conversation.addSystemMessage("Musteri gorusmeye davet etti.");
        status = TicketStatus.OFFERED;
        return conversation;
    }

    public void acceptOffer(String offerId) {
        if (status != TicketStatus.OFFERED) {
            throw new IllegalStateException("Ticket is not waiting for offer approval");
        }
        TicketOffer acceptedOffer = offer(offerId);
        if (!acceptedOffer.isSelectable()) {
            throw new IllegalStateException("Only pending or invited offers can be accepted");
        }

        offers.stream()
                .filter(offer -> !offer.getId().equals(acceptedOffer.getId()))
                .forEach(TicketOffer::reject);
        acceptedOffer.accept();

        conversations.stream()
                .filter(conversation -> !conversation.getOffer().getId().equals(acceptedOffer.getId()))
                .filter(TicketConversation::isWritable)
                .forEach(conversation -> {
                    conversation.closeNotSelected();
                    conversation.addSystemMessage("Baska bir teklif kabul edildigi icin gorusme kapatildi.");
                });
        TicketConversation acceptedConversation = conversationForOfferOrCreate(acceptedOffer);
        acceptedConversation.accept();
        acceptedConversation.addSystemMessage("Teklif kabul edildi ve servis sureci baslatildi.");

        assignedProviderId = acceptedOffer.getProviderId();
        assignedProviderName = acceptedOffer.getProviderName();
        serviceEta = acceptedOffer.getEta();
        finalEstimatedCost = acceptedOffer.getEstimatedCost();
        status = TicketStatus.IN_PROGRESS;
        asset.markUnderMaintenance();
    }

    public void rejectOffer(String offerId) {
        if (status != TicketStatus.OFFERED) {
            throw new IllegalStateException("Ticket is not waiting for offer approval");
        }
        TicketOffer rejectedOffer = offer(offerId);
        if (!rejectedOffer.isSelectable()) {
            throw new IllegalStateException("Only pending or invited offers can be rejected");
        }

        rejectedOffer.reject();
        conversationForOffer(rejectedOffer).ifPresent(conversation -> {
            if (conversation.isWritable()) {
                conversation.closeRejected();
                conversation.addSystemMessage("Teklif reddedildigi icin gorusme kapatildi.");
            }
        });
        if (offers.stream().noneMatch(TicketOffer::isSelectable)) {
            status = TicketStatus.OPEN;
        } else {
            status = TicketStatus.OFFERED;
        }
    }

    public void assignProvider(String providerId, String providerName) {
        if (status != TicketStatus.OPEN && status != TicketStatus.OFFERED) {
            throw new IllegalStateException("Only open tickets can be assigned");
        }
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

    public TicketMessage addCustomerConversationMessage(String conversationId, String senderName, String body) {
        return conversation(conversationId).addCustomerMessage(senderName, body);
    }

    public TicketMessage addServiceConversationMessage(String conversationId, String providerId, String senderName, String body) {
        TicketConversation conversation = conversation(conversationId);
        if (providerId != null && !conversation.isForProvider(providerId)) {
            throw new IllegalStateException("Provider cannot write to this conversation");
        }
        return conversation.addServiceMessage(senderName, body);
    }

    public void markMessagesReadByCustomer() {
        messages.stream()
                .filter(message -> message.getConversation() == null)
                .forEach(TicketMessage::markReadByCustomer);
    }

    public void markMessagesReadByService() {
        messages.stream()
                .filter(message -> message.getConversation() == null)
                .forEach(TicketMessage::markReadByService);
    }

    public void markConversationMessagesReadByCustomer(String conversationId) {
        conversation(conversationId).markMessagesReadByCustomer();
    }

    public void markConversationMessagesReadByService(String conversationId, String providerId) {
        TicketConversation conversation = conversation(conversationId);
        if (providerId != null && !conversation.isForProvider(providerId)) {
            throw new IllegalStateException("Provider cannot read this conversation");
        }
        conversation.markMessagesReadByService();
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

    private TicketOffer offer(String offerId) {
        return offers.stream()
                .filter(offer -> offer.getId().equals(offerId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Offer not found"));
    }

    public TicketConversation conversation(String conversationId) {
        return conversations.stream()
                .filter(conversation -> conversation.getId().equals(conversationId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Conversation not found"));
    }

    private java.util.Optional<TicketConversation> conversationForOffer(TicketOffer offer) {
        return conversations.stream()
                .filter(conversation -> conversation.getOffer().getId().equals(offer.getId()))
                .findFirst();
    }

    private TicketConversation conversationForOfferOrCreate(TicketOffer offer) {
        return conversationForOffer(offer).orElseGet(() -> {
            TicketConversation conversation = new TicketConversation(this, offer);
            conversations.add(conversation);
            return conversation;
        });
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
