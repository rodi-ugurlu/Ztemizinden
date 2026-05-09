package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.TicketService;
import com.iknow.ztemizindenbackend.application.TicketService.AddOfferCommand;
import com.iknow.ztemizindenbackend.application.TicketService.CreateTicketCommand;
import com.iknow.ztemizindenbackend.application.TicketService.DisputeBillingCommand;
import com.iknow.ztemizindenbackend.application.TicketService.SubmitBillingCommand;
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

    @GetMapping
    public List<TicketResponse> list(@RequestParam String customerId) {
        return ticketService.listForCustomer(currentUser.customerId(customerId)).stream().map(TicketResponse::from).toList();
    }

    @GetMapping("/opportunities")
    public List<TicketResponse> listOpportunities(@RequestParam String providerId) {
        return ticketService.listOpportunities(currentUser.providerId(providerId)).stream().map(TicketResponse::from).toList();
    }

    @GetMapping("/provider")
    public List<TicketResponse> listForProvider(@RequestParam String providerId) {
        return ticketService.listForProvider(currentUser.providerId(providerId)).stream().map(TicketResponse::from).toList();
    }

    @GetMapping("/{ticketId}")
    public TicketResponse get(@PathVariable String ticketId) {
        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isCustomer()) {
            currentUser.requireCustomerTicket(ticket);
        } else if (currentUser.isService() && ticket.getAssignedProviderId() != null) {
            currentUser.requireProviderTicket(ticket);
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
                request.assetId(),
                request.title(),
                request.description(),
                ApiEnums.ticketCategory(request.category()),
                ApiEnums.ticketPriority(request.priority()),
                request.mediaUrls() == null ? List.of() : request.mediaUrls()
        ));
        return TicketResponse.from(ticket);
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
        return TicketResponse.from(ticketService.acceptOffer(ticketId, offerId));
    }

    @PostMapping("/{ticketId}/offers/{offerId}/reject")
    public TicketResponse rejectOffer(@PathVariable String ticketId, @PathVariable String offerId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.from(ticketService.rejectOffer(ticketId, offerId));
    }

    @PostMapping("/{ticketId}/cancel")
    public TicketResponse cancel(@PathVariable String ticketId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.from(ticketService.cancel(ticketId));
    }

    @PostMapping("/{ticketId}/billing")
    public TicketResponse submitBilling(@PathVariable String ticketId, @Valid @RequestBody SubmitBillingRequest request) {
        currentUser.requireProviderTicket(ticketService.get(ticketId));
        return TicketResponse.from(ticketService.submitFinalBilling(
                ticketId,
                new SubmitBillingCommand(request.actualCost(), request.notes())
        ));
    }

    @PostMapping("/{ticketId}/billing/approve")
    public TicketResponse approveBilling(@PathVariable String ticketId) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.from(ticketService.approveFinalBilling(ticketId));
    }

    @PostMapping("/{ticketId}/billing/dispute")
    public TicketResponse disputeBilling(@PathVariable String ticketId, @Valid @RequestBody DisputeBillingRequest request) {
        currentUser.requireCustomerTicket(ticketService.get(ticketId));
        return TicketResponse.from(ticketService.disputeFinalBilling(
                ticketId,
                new DisputeBillingCommand(request.reason())
        ));
    }

    @PostMapping("/{ticketId}/messages")
    public TicketResponse addMessage(@PathVariable String ticketId, @Valid @RequestBody AddMessageRequest request) {
        Ticket ticket = ticketService.get(ticketId);
        if (currentUser.isService()) {
            currentUser.requireProviderTicket(ticket);
            return TicketResponse.from(ticketService.addServiceMessage(
                    ticketId,
                    currentUser.displayName(ticket.getAssignedProviderName()),
                    request.body()
            ));
        }

        currentUser.requireCustomerTicket(ticket);
        return TicketResponse.from(ticketService.addCustomerMessage(
                ticketId,
                currentUser.displayName(ticket.getCustomerName()),
                request.body()
        ));
    }

    public record CreateTicketRequest(
            @NotBlank String customerId,
            @NotBlank String customerName,
            @NotBlank String customerCompany,
            @NotBlank String customerLocation,
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
            List<MessageResponse> messages,
            Instant createdAt,
            Instant updatedAt
    ) {
        static TicketResponse from(Ticket ticket) {
            return new TicketResponse(
                    ticket.getId(),
                    ticket.getCustomerId(),
                    ticket.getCustomerName(),
                    ticket.getCustomerCompany(),
                    ticket.getCustomerLocation(),
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
                    ticket.getOffers().stream().map(OfferResponse::from).toList(),
                    ticket.getMessages().stream().map(MessageResponse::from).toList(),
                    ticket.getCreatedAt(),
                    ticket.getUpdatedAt()
            );
        }
    }

    public record OfferResponse(
            String id,
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

    public record MessageResponse(
            String id,
            String ticketId,
            String senderRole,
            String senderName,
            String body,
            Instant createdAt
    ) {
        static MessageResponse from(TicketMessage message) {
            return new MessageResponse(
                    message.getId(),
                    message.getTicket().getId(),
                    message.getSenderRole(),
                    message.getSenderName(),
                    message.getBody(),
                    message.getCreatedAt()
            );
        }
    }
}
