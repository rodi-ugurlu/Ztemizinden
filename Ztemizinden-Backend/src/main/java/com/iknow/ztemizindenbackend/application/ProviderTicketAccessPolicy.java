package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.Ticket;
import org.springframework.stereotype.Component;

@Component
public class ProviderTicketAccessPolicy {

    public boolean canView(Ticket ticket, ServiceProvider provider) {
        if (isAssignedProvider(ticket, provider.getId())) {
            return true;
        }
        return isOpenOpportunity(ticket)
                && provider.getSpecialties() != null
                && provider.getSpecialties().contains(ticket.getCategory());
    }

    public boolean canViewTicketMessages(Ticket ticket, String providerId) {
        return isAssignedProvider(ticket, providerId);
    }

    public boolean isAssignedProvider(Ticket ticket, String providerId) {
        return providerId != null && providerId.equals(ticket.getAssignedProviderId());
    }

    private boolean isOpenOpportunity(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.OFFERED;
    }
}
