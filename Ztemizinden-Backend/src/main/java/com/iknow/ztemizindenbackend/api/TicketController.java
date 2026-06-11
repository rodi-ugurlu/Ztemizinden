package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.TicketService;
import com.iknow.ztemizindenbackend.application.TicketService.AddOfferCommand;
import com.iknow.ztemizindenbackend.application.TicketService.CreateTicketCommand;
import com.iknow.ztemizindenbackend.application.TicketService.DisputeBillingCommand;
import com.iknow.ztemizindenbackend.application.TicketService.MessageResult;
import com.iknow.ztemizindenbackend.application.TicketService.SubmitBillingCommand;
import com.iknow.ztemizindenbackend.application.TicketMessageBroadcaster;
import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.domain.Enums.BillingStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferStatus;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.Ticket;
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
        return ticketService.listOpportunities(currentUser.providerId(providerId)).stream().map(TicketResponse::fromForService).toList();
    }

    @GetMapping("/provider")
    public List<TicketResponse> listForProvider(@RequestParam String providerId) {
        return ticketService.listForProvider(currentUser.providerId(providerId)).stream().map(TicketResponse::fromForService).toList();
    }

    @GetMapping("/{ticketId}")
    public TicketResponse get(@PathVariable String ticketId) {
        if (currentUser.isService()) {
            return TicketResponse.fromForService(ticketService.getForProvider(ticketId, currentUser.providerId(null)));
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
        return TicketResponse.fromForCustomer(ticketService.acceptOffer(ticketId, offerId));
    }

    @PostMapping("/{ticketId}/offers/{offerId}/reject")
    public TicketResponse rejectOffer(@PathVariable String ticketId, @PathVariable String offerId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.fromForCustomer(ticketService.rejectOffer(ticketId, offerId));
    }

    @PostMapping("/{ticketId}/cancel")
    public TicketResponse cancel(@PathVariable String ticketId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.fromForCustomer(ticketService.cancel(ticketId));
    }

    @PostMapping("/{ticketId}/billing")
    public TicketResponse submitBilling(@PathVariable String ticketId, @Valid @RequestBody SubmitBillingRequest request) {
        currentUser.requireProviderTicket(ticketService.get(ticketId));
        return TicketResponse.fromForService(ticketService.submitFinalBilling(
                ticketId,
                new SubmitBillingCommand(request.actualCost(), request.notes())
        ));
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
            MessageResult result = ticketService.addServiceMessage(
                    ticketId,
                    currentUser.displayName(ticket.getAssignedProviderName()),
                    request.body()
            );
            ticketMessageBroadcaster.publish(result.message());
            return TicketResponse.fromForService(result.ticket());
        }

        currentUser.requireCustomerTicket(ticket);
        MessageResult result = ticketService.addCustomerMessage(
                ticketId,
                currentUser.displayName(ticket.getCustomerName()),
                request.body()
        );
        ticketMessageBroadcaster.publish(result.message());
        return TicketResponse.fromForCustomer(result.ticket());
    }

    @PostMapping("/{ticketId}/messages/read")
    public TicketResponse markMessagesRead(@PathVariable String ticketId) {
        if (currentUser.isService()) {
            ticketService.getForProvider(ticketId, currentUser.providerId(null));
            return TicketResponse.fromForService(ticketService.markMessagesReadByService(ticketId));
        }

        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isCustomer()) {
            currentUser.requireCustomerTicket(ticket);
        }
        return TicketResponse.fromForCustomer(ticketService.markMessagesReadByCustomer(ticketId));
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
            return from(ticket, Viewer.SERVICE);
        }

        private static TicketResponse from(Ticket ticket, Viewer viewer) {
            List<TicketMessagePayload> messages = scopedMessages(ticket).stream()
                    .map(TicketMessagePayload::from)
                    .toList();

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
                    ticket.getOffers().stream()
                            .filter(offer -> ticket.getId().equals(offer.getTicket().getId()))
                            .map(OfferResponse::from)
                            .toList(),
                    messages,
                    unreadMessageCount(ticket, viewer),
                    latestConversationMessage(ticket),
                    ticket.getCreatedAt(),
                    ticket.getUpdatedAt()
            );
        }

        private static List<TicketMessage> scopedMessages(Ticket ticket) {
            return ticket.getMessages().stream()
                    .filter(message -> ticket.getId().equals(message.getTicket().getId()))
                    .sorted(Comparator
                            .comparing(TicketMessage::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(TicketMessage::getSenderRole, Comparator.nullsLast(String::compareTo))
                            .thenComparing(TicketMessage::getSenderName, Comparator.nullsLast(String::compareTo))
                            .thenComparing(TicketMessage::getId, Comparator.nullsLast(String::compareTo)))
                    .toList();
        }

        private static int unreadMessageCount(Ticket ticket, Viewer viewer) {
            return (int) scopedMessages(ticket).stream()
                    .filter(message -> switch (viewer) {
                        case CUSTOMER -> message.isUnreadForCustomer();
                        case SERVICE -> message.isUnreadForService();
                        case ADMIN -> false;
                    })
                    .count();
        }

        private static TicketMessagePayload latestConversationMessage(Ticket ticket) {
            return scopedMessages(ticket).stream()
                    .filter(message -> !"system".equals(message.getSenderRole()))
                    .max(Comparator.comparing(
                            TicketMessage::getCreatedAt,
                            Comparator.nullsFirst(Comparator.naturalOrder())
                    ))
                    .map(TicketMessagePayload::from)
                    .orElse(null);
        }

        private enum Viewer {
            ADMIN,
            CUSTOMER,
            SERVICE
        }
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

}
