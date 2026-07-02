package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.DispatchService;
import com.iknow.ztemizindenbackend.application.DispatchService.ProviderMatch;
import com.iknow.ztemizindenbackend.api.TicketController.TicketResponse;
import com.iknow.ztemizindenbackend.domain.Ticket;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    public record AssignRequest(@NotBlank String providerId) {
    }
}
