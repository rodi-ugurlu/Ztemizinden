package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.TicketService;
import com.iknow.ztemizindenbackend.application.TicketService.AddOfferCommand;
import com.iknow.ztemizindenbackend.application.TicketService.CreateTicketCommand;
import com.iknow.ztemizindenbackend.application.TicketService.DisputeBillingCommand;
import com.iknow.ztemizindenbackend.application.TicketService.MessageResult;
import com.iknow.ztemizindenbackend.application.TicketService.SubmitBillingCommand;
import com.iknow.ztemizindenbackend.application.TicketService.TicketMutationResult;
import com.iknow.ztemizindenbackend.application.TicketMessageBroadcaster;
import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.domain.Enums.BillingStatus;
import com.iknow.ztemizindenbackend.domain.Enums.ConversationClosedReason;
import com.iknow.ztemizindenbackend.domain.Enums.ConversationStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import com.iknow.ztemizindenbackend.domain.TicketMessage;
import com.iknow.ztemizindenbackend.domain.TicketOffer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tickets")
public class TicketController {
    private final TicketService ticketService;
    private final CurrentUser currentUser;
    private final TicketMessageBroadcaster ticketMessageBroadcaster;

    @GetMapping
    public List<TicketResponse> list(@RequestParam String customerId) {
        return ticketService.listForCustomer(currentUser.customerId(customerId)).stream().map(TicketResponse::fromForCustomer).toList();
    }

    @GetMapping("/opportunities")
    public List<TicketResponse> listOpportunities(@RequestParam String providerId) {
        String scopedProviderId = currentUser.providerId(providerId);
        return ticketService.listOpportunities(scopedProviderId).stream()
                .map(ticket -> TicketResponse.fromForService(ticket, scopedProviderId))
                .toList();
    }

    @GetMapping("/provider")
    public List<TicketResponse> listForProvider(@RequestParam String providerId) {
        String scopedProviderId = currentUser.providerId(providerId);
        return ticketService.listForProvider(scopedProviderId).stream()
                .map(ticket -> TicketResponse.fromForService(ticket, scopedProviderId))
                .toList();
    }

    @GetMapping("/{ticketId}")
    public TicketResponse get(@PathVariable String ticketId) {
        if (currentUser.isService()) {
            String providerId = currentUser.providerId(null);
            return TicketResponse.fromForService(ticketService.getForProvider(ticketId, providerId), providerId);
        }

        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isCustomer()) {
            currentUser.requireCustomerTicket(ticket);
            return TicketResponse.fromForCustomer(ticket);
        }
        return TicketResponse.from(ticket);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(@Valid @RequestBody CreateTicketRequest request) {
        Ticket ticket = ticketService.create(new CreateTicketCommand(
                currentUser.customerId(request.customerId()),
                currentUser.displayName(request.customerName()),
                request.customerCompany(),
                request.customerLocation(),
                request.customerCity(),
                request.customerDistrict(),
                request.customerAddress(),
                request.assetId(),
                request.title(),
                request.description(),
                ApiEnums.ticketCategory(request.category()),
                ApiEnums.ticketPriority(request.priority()),
                request.mediaUrls() == null ? List.of() : request.mediaUrls()
        ));
        return TicketResponse.fromForCustomer(ticket);
    }

    @PostMapping("/{ticketId}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse addOffer(@PathVariable String ticketId, @Valid @RequestBody AddOfferRequest request) {
        TicketOffer offer = ticketService.addOffer(ticketId, new AddOfferCommand(
                currentUser.providerId(request.providerId()),
                request.providerName(),
                ApiEnums.offerType(request.type()),
                request.estimatedCost(),
                request.eta(),
                request.message()
        ));
        return OfferResponse.from(offer);
    }

    @PostMapping("/{ticketId}/offers/{offerId}/accept")
    public TicketResponse acceptOffer(@PathVariable String ticketId, @PathVariable String offerId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        TicketMutationResult result = ticketService.acceptOffer(ticketId, offerId);
        publishConversationMessages(result.messages());
        publishTicketEvent("OFFER_ACCEPTED", result.ticket(), null);
        return TicketResponse.fromForCustomer(result.ticket());
    }

    @PostMapping("/{ticketId}/offers/{offerId}/invite")
    public TicketResponse inviteOffer(@PathVariable String ticketId, @PathVariable String offerId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        TicketMutationResult result = ticketService.inviteOffer(ticketId, offerId);
        publishConversationMessages(result.messages());
        String conversationId = conversationIdForOffer(result.ticket(), offerId);
        publishTicketEvent("OFFER_INVITED", result.ticket(), conversationId);
        return TicketResponse.fromForCustomer(result.ticket());
    }

    @PostMapping("/{ticketId}/offers/{offerId}/reject")
    public TicketResponse rejectOffer(@PathVariable String ticketId, @PathVariable String offerId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        TicketMutationResult result = ticketService.rejectOffer(ticketId, offerId);
        publishConversationMessages(result.messages());
        publishTicketEvent("OFFER_REJECTED", result.ticket(), conversationIdForOffer(result.ticket(), offerId));
        return TicketResponse.fromForCustomer(result.ticket());
    }

    @PostMapping("/{ticketId}/cancel")
    public TicketResponse cancel(@PathVariable String ticketId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.fromForCustomer(ticketService.cancel(ticketId));
    }

    @PostMapping("/{ticketId}/billing")
    public TicketResponse submitBilling(@PathVariable String ticketId, @Valid @RequestBody SubmitBillingRequest request) {
        Ticket ticket = ticketService.get(ticketId);
        currentUser.requireProviderTicket(ticket);
        String providerId = currentUser.providerId(ticket.getAssignedProviderId());
        return TicketResponse.fromForService(ticketService.submitFinalBilling(
                ticketId,
                new SubmitBillingCommand(request.actualCost(), request.notes())
        ), providerId);
    }

    @PostMapping("/{ticketId}/billing/approve")
    public TicketResponse approveBilling(@PathVariable String ticketId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.fromForCustomer(ticketService.approveFinalBilling(ticketId));
    }

    @PostMapping("/{ticketId}/billing/dispute")
    public TicketResponse disputeBilling(@PathVariable String ticketId, @Valid @RequestBody DisputeBillingRequest request) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.fromForCustomer(ticketService.disputeFinalBilling(
                ticketId,
                new DisputeBillingCommand(request.reason())
        ));
    }

    @PostMapping("/{ticketId}/messages")
    public TicketResponse addMessage(@PathVariable String ticketId, @Valid @RequestBody AddMessageRequest request) {
        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isService()) {
            currentUser.requireProviderTicket(ticket);
            String providerId = currentUser.providerId(ticket.getAssignedProviderId());
            MessageResult result = ticketService.addServiceMessage(
                    ticketId,
                    currentUser.displayName(ticket.getAssignedProviderName()),
                    request.body()
            );
            ticketMessageBroadcaster.publish(result.message());
            publishTicketEvent("MESSAGE", result.ticket(), null);
            return TicketResponse.fromForService(result.ticket(), providerId);
        }

        currentUser.requireCustomerTicket(ticket);
        MessageResult result = ticketService.addCustomerMessage(
                ticketId,
                currentUser.displayName(ticket.getCustomerName()),
                request.body()
        );
        ticketMessageBroadcaster.publish(result.message());
        publishTicketEvent("MESSAGE", result.ticket(), null);
        return TicketResponse.fromForCustomer(result.ticket());
    }

    @PostMapping("/{ticketId}/conversations/{conversationId}/messages")
    public TicketResponse addConversationMessage(
            @PathVariable String ticketId,
            @PathVariable String conversationId,
            @Valid @RequestBody AddMessageRequest request
    ) {
        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isService()) {
            String providerId = currentUser.providerId(null);
            ticketService.getForProvider(ticketId, providerId);
            MessageResult result = ticketService.addServiceConversationMessage(
                    ticketId,
                    conversationId,
                    providerId,
                    currentUser.displayName("Servis"),
                    request.body()
            );
            ticketMessageBroadcaster.publishConversation(result.message());
            publishTicketEvent("MESSAGE", result.ticket(), conversationId);
            return TicketResponse.fromForService(result.ticket(), providerId);
        }

        currentUser.requireCustomerTicket(ticket);
        MessageResult result = ticketService.addCustomerConversationMessage(
                ticketId,
                conversationId,
                currentUser.displayName(ticket.getCustomerName()),
                request.body()
        );
        ticketMessageBroadcaster.publishConversation(result.message());
        publishTicketEvent("MESSAGE", result.ticket(), conversationId);
        return TicketResponse.fromForCustomer(result.ticket());
    }

    @PostMapping("/{ticketId}/messages/read")
    public TicketResponse markMessagesRead(@PathVariable String ticketId) {
        if (currentUser.isService()) {
            String providerId = currentUser.providerId(null);
            ticketService.getForProvider(ticketId, providerId);
            return TicketResponse.fromForService(ticketService.markMessagesReadByService(ticketId), providerId);
        }

        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isCustomer()) {
            currentUser.requireCustomerTicket(ticket);
        }
        return TicketResponse.fromForCustomer(ticketService.markMessagesReadByCustomer(ticketId));
    }

    @PostMapping("/{ticketId}/conversations/{conversationId}/messages/read")
    public TicketResponse markConversationMessagesRead(
            @PathVariable String ticketId,
            @PathVariable String conversationId
    ) {
        if (currentUser.isService()) {
            String providerId = currentUser.providerId(null);
            ticketService.getForProvider(ticketId, providerId);
            return TicketResponse.fromForService(
                    ticketService.markConversationMessagesReadByService(ticketId, conversationId, providerId),
                    providerId
            );
        }

        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isCustomer()) {
            currentUser.requireCustomerTicket(ticket);
        }
        return TicketResponse.fromForCustomer(ticketService.markConversationMessagesReadByCustomer(ticketId, conversationId));
    }

    public record CreateTicketRequest(
            @NotBlank String customerId,
            @NotBlank String customerName,
            @NotBlank String customerCompany,
            @NotBlank String customerLocation,
            String customerCity,
            String customerDistrict,
            String customerAddress,
            @NotBlank String assetId,
            @NotBlank String title,
            @NotBlank String description,
            @NotBlank String category,
            @NotBlank String priority,
            List<String> mediaUrls
    ) {
    }

    public record AddOfferRequest(
            @NotBlank String providerId,
            @NotBlank String providerName,
            @NotBlank String type,
            @NotNull @PositiveOrZero BigDecimal estimatedCost,
            @NotBlank String eta,
            @NotBlank String message
    ) {
    }

    public record SubmitBillingRequest(@NotNull @PositiveOrZero BigDecimal actualCost, @NotBlank String notes) {
    }

    public record DisputeBillingRequest(@NotBlank String reason) {
    }

    public record AddMessageRequest(@NotBlank String body) {
    }

    public record TicketEventPayload(String type, String conversationId, TicketResponse ticket) {
    }

    public record TicketResponse(
            String id,
            String customerId,
            String customerName,
            String customerCompany,
            String customerLocation,
            String customerCity,
            String customerDistrict,
            String customerAddress,
            String assetId,
            String assetName,
            String assetTagNo,
            String assetBrand,
            String assetModel,
            String assetSerialNumber,
            String title,
            String description,
            String category,
            String priority,
            List<String> mediaUrls,
            TicketStatus status,
            int slaTargetMinutes,
            String assignedProviderId,
            String assignedProviderName,
            String serviceEta,
            BigDecimal finalEstimatedCost,
            BigDecimal finalActualCost,
            BillingStatus billingStatus,
            String finalBillingNotes,
            List<OfferResponse> offers,
            List<ConversationResponse> conversations,
            List<TicketMessagePayload> messages,
            int unreadMessageCount,
            TicketMessagePayload lastMessage,
            Instant createdAt,
            Instant updatedAt
    ) {
        static TicketResponse from(Ticket ticket) {
            return from(ticket, Viewer.ADMIN);
        }

        static TicketResponse fromForCustomer(Ticket ticket) {
            return from(ticket, Viewer.CUSTOMER);
        }

        static TicketResponse fromForService(Ticket ticket) {
            return from(ticket, Viewer.SERVICE, null);
        }

        static TicketResponse fromForService(Ticket ticket, String providerId) {
            return from(ticket, Viewer.SERVICE, providerId);
        }

        private static TicketResponse from(Ticket ticket, Viewer viewer) {
            return from(ticket, viewer, null);
        }

        private static TicketResponse from(Ticket ticket, Viewer viewer, String providerId) {
            List<TicketMessagePayload> messages = scopedMessages(ticket).stream()
                    .map(TicketMessagePayload::from)
                    .toList();
            List<TicketConversation> conversations = scopedConversations(ticket, viewer, providerId);

            return new TicketResponse(
                    ticket.getId(),
                    ticket.getCustomerId(),
                    ticket.getCustomerName(),
                    ticket.getCustomerCompany(),
                    ticket.getCustomerLocation(),
                    ticket.getCustomerCity(),
                    ticket.getCustomerDistrict(),
                    ticket.getCustomerAddress(),
                    ticket.getAsset().getId(),
                    ticket.getAsset().getName(),
                    ticket.getAsset().getTagNo(),
                    ticket.getAsset().getBrand(),
                    ticket.getAsset().getModel(),
                    ticket.getAsset().getSerialNumber(),
                    ticket.getTitle(),
                    ticket.getDescription(),
                    ApiEnums.display(ticket.getCategory()),
                    ApiEnums.display(ticket.getPriority()),
                    new ArrayList<>(ticket.getMediaUrls()),
                    ticket.getStatus(),
                    ticket.getSlaTargetMinutes(),
                    ticket.getAssignedProviderId(),
                    ticket.getAssignedProviderName(),
                    ticket.getServiceEta(),
                    ticket.getFinalEstimatedCost(),
                    ticket.getFinalActualCost(),
                    ticket.getBillingStatus(),
                    ticket.getFinalBillingNotes(),
                    scopedOffers(ticket, viewer, providerId).stream()
                            .map(OfferResponse::from)
                            .toList(),
                    conversations.stream()
                            .map(conversation -> ConversationResponse.from(conversation, viewer))
                            .toList(),
                    messages,
                    unreadMessageCount(ticket, conversations, viewer),
                    latestVisibleMessage(ticket, conversations),
                    ticket.getCreatedAt(),
                    ticket.getUpdatedAt()
            );
        }

        private static List<TicketMessage> scopedMessages(Ticket ticket) {
            return ticket.getMessages().stream()
                    .filter(message -> ticket.getId().equals(message.getTicket().getId()))
                    .filter(message -> message.getConversation() == null)
                    .sorted(Comparator
                            .comparing(TicketMessage::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(TicketMessage::getSenderRole, Comparator.nullsLast(String::compareTo))
                            .thenComparing(TicketMessage::getSenderName, Comparator.nullsLast(String::compareTo))
                            .thenComparing(TicketMessage::getId, Comparator.nullsLast(String::compareTo)))
                    .toList();
        }

        private static List<TicketOffer> scopedOffers(Ticket ticket, Viewer viewer, String providerId) {
            return ticket.getOffers().stream()
                    .filter(offer -> ticket.getId().equals(offer.getTicket().getId()))
                    .filter(offer -> viewer != Viewer.SERVICE
                            || (providerId != null && offer.getProviderId().equals(providerId)))
                    .sorted(Comparator
                            .comparing(TicketOffer::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(TicketOffer::getId, Comparator.nullsLast(String::compareTo)))
                    .toList();
        }

        private static List<TicketConversation> scopedConversations(Ticket ticket, Viewer viewer, String providerId) {
            return ticket.getConversations().stream()
                    .filter(conversation -> ticket.getId().equals(conversation.getTicket().getId()))
                    .filter(conversation -> viewer != Viewer.SERVICE
                            || (providerId != null && conversation.getProviderId().equals(providerId)))
                    .sorted(Comparator
                            .comparing(TicketConversation::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(TicketConversation::getProviderName, Comparator.nullsLast(String::compareTo))
                            .thenComparing(TicketConversation::getId, Comparator.nullsLast(String::compareTo)))
                    .toList();
        }

        private static int unreadMessageCount(Ticket ticket, List<TicketConversation> conversations, Viewer viewer) {
            List<TicketMessage> visibleMessages = new ArrayList<>(scopedMessages(ticket));
            conversations.forEach(conversation -> visibleMessages.addAll(TicketController.scopedMessages(conversation)));
            return (int) visibleMessages.stream()
                    .filter(message -> switch (viewer) {
                        case CUSTOMER -> message.isUnreadForCustomer();
                        case SERVICE -> message.isUnreadForService();
                        case ADMIN -> false;
                    })
                    .count();
        }

        private static TicketMessagePayload latestVisibleMessage(Ticket ticket, List<TicketConversation> conversations) {
            List<TicketMessage> visibleMessages = new ArrayList<>(scopedMessages(ticket));
            conversations.forEach(conversation -> visibleMessages.addAll(TicketController.scopedMessages(conversation)));
            return visibleMessages.stream()
                    .filter(message -> !"system".equals(message.getSenderRole()))
                    .max(Comparator.comparing(
                            TicketMessage::getCreatedAt,
                            Comparator.nullsFirst(Comparator.naturalOrder())
                    ))
                    .map(TicketMessagePayload::from)
                    .orElse(null);
        }
    }

    public record ConversationResponse(
            String id,
            String ticketId,
            String offerId,
            String providerId,
            String providerName,
            ConversationStatus status,
            ConversationClosedReason closedReason,
            OfferResponse offer,
            List<TicketMessagePayload> messages,
            int unreadMessageCount,
            TicketMessagePayload lastMessage,
            Instant createdAt,
            Instant updatedAt
    ) {
        static ConversationResponse from(TicketConversation conversation, Viewer viewer) {
            List<TicketMessagePayload> messages = scopedMessages(conversation).stream()
                    .map(TicketMessagePayload::from)
                    .toList();
            return new ConversationResponse(
                    conversation.getId(),
                    conversation.getTicket().getId(),
                    conversation.getOffer().getId(),
                    conversation.getProviderId(),
                    conversation.getProviderName(),
                    conversation.getStatus(),
                    conversation.getClosedReason(),
                    OfferResponse.from(conversation.getOffer()),
                    messages,
                    TicketController.unreadMessageCount(conversation, viewer),
                    latestMessage(conversation),
                    conversation.getCreatedAt(),
                    conversation.getUpdatedAt()
            );
        }
    }

    private static List<TicketMessage> scopedMessages(TicketConversation conversation) {
        return conversation.getMessages().stream()
                .filter(message -> message.getConversation() != null
                        && conversation.getId().equals(message.getConversation().getId()))
                .sorted(Comparator
                        .comparing(TicketMessage::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(TicketMessage::getSenderRole, Comparator.nullsLast(String::compareTo))
                        .thenComparing(TicketMessage::getSenderName, Comparator.nullsLast(String::compareTo))
                        .thenComparing(TicketMessage::getId, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    private static int unreadMessageCount(TicketConversation conversation, Viewer viewer) {
        return (int) scopedMessages(conversation).stream()
                .filter(message -> switch (viewer) {
                    case CUSTOMER -> message.isUnreadForCustomer();
                    case SERVICE -> message.isUnreadForService();
                    case ADMIN -> false;
                })
                .count();
    }

    private static TicketMessagePayload latestMessage(TicketConversation conversation) {
        return scopedMessages(conversation).stream()
                .filter(message -> !"system".equals(message.getSenderRole()))
                .max(Comparator.comparing(
                        TicketMessage::getCreatedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ))
                .map(TicketMessagePayload::from)
                .orElse(null);
    }

    public record OfferResponse(
            String id,
            String ticketId,
            String providerId,
            String providerName,
            OfferType type,
            BigDecimal estimatedCost,
            String eta,
            String message,
            OfferStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        static OfferResponse from(TicketOffer offer) {
            return new OfferResponse(
                    offer.getId(),
                    offer.getTicket().getId(),
                    offer.getProviderId(),
                    offer.getProviderName(),
                    offer.getType(),
                    offer.getEstimatedCost(),
                    offer.getEta(),
                    offer.getMessage(),
                    offer.getStatus(),
                    offer.getCreatedAt(),
                    offer.getUpdatedAt()
            );
        }
    }

    private enum Viewer {
        ADMIN,
        CUSTOMER,
        SERVICE
    }

    private void publishTicketEvent(String type, Ticket ticket, String conversationId) {
        ticketMessageBroadcaster.publishCustomerTicket(
                ticket.getCustomerId(),
                new TicketEventPayload(type, conversationId, TicketResponse.fromForCustomer(ticket))
        );

        providerIds(ticket).forEach(providerId -> ticketMessageBroadcaster.publishProviderTicket(
                providerId,
                new TicketEventPayload(
                        type,
                        conversationIdForProvider(ticket, providerId),
                        TicketResponse.fromForService(ticket, providerId)
                )
        ));
    }

    private void publishConversationMessages(List<TicketMessage> messages) {
        messages.forEach(ticketMessageBroadcaster::publishConversation);
    }

    private static List<String> providerIds(Ticket ticket) {
        List<String> providerIds = new ArrayList<>();
        ticket.getOffers().stream()
                .map(TicketOffer::getProviderId)
                .filter(providerId -> providerId != null && !providerId.isBlank())
                .forEach(providerIds::add);
        ticket.getConversations().stream()
                .map(TicketConversation::getProviderId)
                .filter(providerId -> providerId != null && !providerId.isBlank())
                .forEach(providerIds::add);
        if (ticket.getAssignedProviderId() != null && !ticket.getAssignedProviderId().isBlank()) {
            providerIds.add(ticket.getAssignedProviderId());
        }
        return providerIds.stream().distinct().toList();
    }

    private static String conversationIdForOffer(Ticket ticket, String offerId) {
        return ticket.getConversations().stream()
                .filter(conversation -> conversation.getOffer().getId().equals(offerId))
                .map(TicketConversation::getId)
                .findFirst()
                .orElse(null);
    }

    private static String conversationIdForProvider(Ticket ticket, String providerId) {
        return ticket.getConversations().stream()
                .filter(conversation -> conversation.getProviderId().equals(providerId))
                .map(TicketConversation::getId)
                .findFirst()
                .orElse(null);
    }

}
