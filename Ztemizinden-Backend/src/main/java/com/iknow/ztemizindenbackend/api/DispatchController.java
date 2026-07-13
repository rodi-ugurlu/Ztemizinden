package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.DispatchService;
import com.iknow.ztemizindenbackend.application.DispatchService.ProviderMatch;
import com.iknow.ztemizindenbackend.application.TicketMessageBroadcaster;
import com.iknow.ztemizindenbackend.application.TicketService;
import com.iknow.ztemizindenbackend.application.TicketService.ResolveBillingDisputeCommand;
import com.iknow.ztemizindenbackend.application.TicketService.TicketMutationResult;
import com.iknow.ztemizindenbackend.api.TicketController.TicketResponse;
import com.iknow.ztemizindenbackend.domain.Ticket;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dispatch")
public class DispatchController {
    private final DispatchService dispatchService;
    private final TicketService ticketService;
    private final TicketMessageBroadcaster ticketMessageBroadcaster;
    private final TicketEventPublisher ticketEventPublisher;

    @GetMapping("/queue")
    public List<TicketResponse> queue() {
        return dispatchService.openDispatchQueue().stream().map(TicketResponse::from).toList();
    }

    @GetMapping("/tickets/{ticketId}/matches")
    public List<ProviderMatch> matches(@PathVariable String ticketId) {
        return dispatchService.matches(ticketId);
    }

    @PostMapping("/tickets/{ticketId}/assign")
    public TicketResponse assign(@PathVariable String ticketId, @Valid @RequestBody AssignRequest request) {
        Ticket ticket = dispatchService.assign(ticketId, request.providerId());
        ticketEventPublisher.publish("TICKET_ASSIGNED", ticket);
        return TicketResponse.from(ticket);
    }

    @PostMapping("/tickets/{ticketId}/billing/resolve")
    public TicketResponse resolveBillingDispute(
            @PathVariable String ticketId,
            @Valid @RequestBody ResolveBillingDisputeRequest request
    ) {
        TicketMutationResult result = ticketService.resolveBillingDispute(
                ticketId,
                new ResolveBillingDisputeCommand(
                        ApiEnums.billingDisputeDecision(request.decision()),
                        request.note()
                )
        );
        result.messages().forEach(ticketMessageBroadcaster::publishConversation);
        ticketEventPublisher.publish("BILLING_DISPUTE_RESOLVED", result.ticket());
        return TicketResponse.from(result.ticket());
    }

    public record AssignRequest(@NotBlank @Size(max = 255) String providerId) {
    }

    public record ResolveBillingDisputeRequest(
            @NotBlank @Size(max = 50) String decision,
            @NotBlank @Size(max = 2_000) String note
    ) {
    }
}
