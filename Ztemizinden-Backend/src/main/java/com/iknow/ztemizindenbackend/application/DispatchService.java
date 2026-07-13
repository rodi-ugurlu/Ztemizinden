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
import java.util.Locale;
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
        return TicketDetailsLoader.loadAll(ticketRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(TicketStatus.OPEN, TicketStatus.OFFERED, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED)));
    }

    @Transactional(readOnly = true)
    public List<ProviderMatch> matches(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        return serviceProviderRepository.findAll().stream()
                .filter(provider -> provider.getStatus() == ProviderStatus.VERIFIED)
                .filter(provider -> isQualifiedForTicket(provider, ticket))
                .map(provider -> score(provider, ticket))
                .sorted(Comparator.comparingInt(ProviderMatch::score).reversed())
                .toList();
    }

    @Transactional
    public Ticket assign(String ticketId, String providerId) {
        Ticket ticket = ticketRepository.findByIdForUpdate(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        if (provider.getStatus() != ProviderStatus.VERIFIED) {
            throw new IllegalStateException("Provider is not verified");
        }
        if (!isQualifiedForTicket(provider, ticket)) {
            throw new IllegalStateException("Provider is not qualified for this ticket category");
        }
        ticket.assignProvider(provider.getId(), provider.getName());
        return TicketDetailsLoader.load(ticket);
    }

    private boolean isQualifiedForTicket(ServiceProvider provider, Ticket ticket) {
        return provider.getSpecialties() != null && provider.getSpecialties().contains(ticket.getCategory());
    }

    private ProviderMatch score(ServiceProvider provider, Ticket ticket) {
        int score = 0;
        String ticketCity = locationCity(ticket);
        String ticketDistrict = text(ticket.getCustomerDistrict());
        boolean sameCity = normalizedEquals(provider.getCity(), ticketCity);
        boolean sameDistrict = sameCity && normalizedEquals(provider.getDistrict(), ticketDistrict);
        boolean coversDistrict = sameCity && containsNormalized(provider.getCoverageDistricts(), ticketDistrict);
        int etaMinutes = coversDistrict ? 45 : sameDistrict ? 60 : sameCity ? 90 : 180;

        if (provider.getSpecialties().contains(ticket.getCategory())) {
            score += 45;
        }

        score += expertiseScore(provider, ticket);

        if (coversDistrict) {
            score += 35;
        } else if (sameDistrict) {
            score += 25;
        } else if (sameCity) {
            score += 15;
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
                provider.getDistrict(),
                provider.getCoverageDistricts() == null ? List.of() : provider.getCoverageDistricts().stream().toList(),
                Math.min(score, 100),
                etaMinutes,
                provider.isTrusted()
        );
    }

    private int expertiseScore(ServiceProvider provider, Ticket ticket) {
        if (provider.getExpertiseTags() == null || provider.getExpertiseTags().isEmpty()) {
            return 0;
        }

        String context = normalizeSearchText(String.join(" ",
                text(ticket.getTitle()),
                text(ticket.getDescription()),
                text(ticket.getAsset().getName()),
                text(ticket.getAsset().getTagNo()),
                text(ticket.getAsset().getBrand()),
                text(ticket.getAsset().getModel()),
                text(ticket.getAsset().getSerialNumber()),
                text(ticket.getAsset().getLocation()),
                text(ticket.getAsset().getDepartment()),
                text(ticket.getAsset().getDescription())
        ));

        int matches = 0;
        String paddedContext = " " + context + " ";
        for (String tag : provider.getExpertiseTags()) {
            String normalizedTag = normalizeSearchText(tag);
            if (!normalizedTag.isBlank() && paddedContext.contains(" " + normalizedTag + " ")) {
                matches++;
            }
        }

        return Math.min(matches * 8, 24);
    }

    private String cityOf(String location) {
        if (location == null || location.isBlank()) {
            return "";
        }

        return location.split(",")[0].trim();
    }

    private String locationCity(Ticket ticket) {
        String city = text(ticket.getCustomerCity());
        return city.isBlank() ? cityOf(ticket.getCustomerLocation()) : city;
    }

    private boolean normalizedEquals(String left, String right) {
        return normalizeSearchText(left).equals(normalizeSearchText(right));
    }

    private boolean containsNormalized(Iterable<String> values, String needle) {
        String normalizedNeedle = normalizeSearchText(needle);
        if (normalizedNeedle.isBlank() || values == null) {
            return false;
        }
        for (String value : values) {
            if (normalizeSearchText(value).equals(normalizedNeedle)) {
                return true;
            }
        }
        return false;
    }

    private String text(String value) {
        return value == null ? "" : value;
    }

    private String normalizeSearchText(String value) {
        return text(value)
                .toLowerCase(Locale.forLanguageTag("tr-TR"))
                .replace("ı", "i")
                .replace("ğ", "g")
                .replace("ü", "u")
                .replace("ş", "s")
                .replace("ö", "o")
                .replace("ç", "c")
                .replaceAll("[^\\p{L}\\p{Nd}]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public record ProviderMatch(
            String providerId,
            String providerName,
            String city,
            String district,
            List<String> coverageDistricts,
            int score,
            int etaMinutes,
            boolean trusted
    ) {
    }
}
