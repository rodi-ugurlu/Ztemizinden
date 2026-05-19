package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.NotFoundException;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DispatchService {
    private final TicketRepository ticketRepository;
    private final ServiceProviderRepository serviceProviderRepository;

    @Transactional(readOnly = true)
    public List<Ticket> openDispatchQueue() {
        return ticketRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(TicketStatus.OPEN, TicketStatus.OFFERED, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED));
    }

    @Transactional(readOnly = true)
    public List<ProviderMatch> matches(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        return serviceProviderRepository.findAll().stream()
                .filter(provider -> provider.getStatus() == ProviderStatus.VERIFIED)
                .map(provider -> score(provider, ticket))
                .sorted(Comparator.comparingInt(ProviderMatch::score).reversed())
                .toList();
    }

    @Transactional
    public Ticket assign(String ticketId, String providerId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        if (provider.getStatus() != ProviderStatus.VERIFIED) {
            throw new IllegalStateException("Provider is not verified");
        }
        ticket.assignProvider(provider.getId(), provider.getName());
        return ticket;
    }

    private ProviderMatch score(ServiceProvider provider, Ticket ticket) {
        int score = 0;
        int etaMinutes = provider.getCity().equalsIgnoreCase(cityOf(ticket.getCustomerLocation())) ? 60 : 180;

        if (provider.getSpecialties().contains(ticket.getCategory())) {
            score += 45;
        }

        if (provider.getCity().equalsIgnoreCase(cityOf(ticket.getCustomerLocation()))) {
            score += 25;
        }

        if (provider.isTrusted()) {
            score += 15;
        }

        if (provider.getRating().doubleValue() >= 4.5) {
            score += 10;
        } else if (provider.getRating().doubleValue() >= 4.0) {
            score += 6;
        }

        if (provider.getCompletedJobs() > 100) {
            score += 5;
        }

        return new ProviderMatch(
                provider.getId(),
                provider.getName(),
                provider.getCity(),
                Math.min(score, 100),
                etaMinutes,
                provider.isTrusted()
        );
    }

    private String cityOf(String location) {
        if (location == null || location.isBlank()) {
            return "";
        }

        return location.split(",")[0].trim();
    }

    public record ProviderMatch(
            String providerId,
            String providerName,
            String city,
            int score,
            int etaMinutes,
            boolean trusted
    ) {
    }
}
