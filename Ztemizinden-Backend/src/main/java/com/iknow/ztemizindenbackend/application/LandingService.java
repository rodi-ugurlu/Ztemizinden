package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Enums.LandingVisibility;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LandingService {
    static final int SHOWCASE_LIMIT = 10;
    private static final String MANAGED_LOGO_PREFIX = "/uploads/profile-logos/";
    private static final Sort ROTATION_ORDER = Sort.by(
            Sort.Order.asc("createdAt"),
            Sort.Order.asc("id")
    );

    private final ServiceProviderRepository providerRepository;
    private final TicketRepository ticketRepository;
    private final Clock clock;

    @Autowired
    public LandingService(ServiceProviderRepository providerRepository, TicketRepository ticketRepository) {
        this(providerRepository, ticketRepository, Clock.systemUTC());
    }

    LandingService(
            ServiceProviderRepository providerRepository,
            TicketRepository ticketRepository,
            Clock clock
    ) {
        this.providerRepository = providerRepository;
        this.ticketRepository = ticketRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public LandingSnapshot snapshot() {
        long eligibleCount = providerRepository.countByStatusAndLandingVisibility(
                ProviderStatus.VERIFIED,
                LandingVisibility.VISIBLE
        );
        LocalDate rotationDate = LocalDate.now(clock);
        List<ProviderPreview> providers = eligibleCount == 0
                ? List.of()
                : rotatedProviders(eligibleCount, rotationDate);
        List<RibbonEntry> ribbon = providerRepository
                .findByStatusAndLandingVisibility(
                        ProviderStatus.VERIFIED,
                        LandingVisibility.VISIBLE,
                        ROTATION_ORDER
                )
                .stream()
                .map(RibbonEntry::from)
                .toList();
        LandingStats stats = new LandingStats(
                providerRepository.countByStatus(ProviderStatus.VERIFIED),
                providerRepository.countDistinctCitiesByStatus(ProviderStatus.VERIFIED),
                ticketRepository.countByStatusIn(List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED))
        );
        return new LandingSnapshot(providers, ribbon, stats, rotationDate);
    }

    private List<ProviderPreview> rotatedProviders(long eligibleCount, LocalDate rotationDate) {
        int pageCount = Math.max(1, (int) Math.ceil((double) eligibleCount / SHOWCASE_LIMIT));
        int pageIndex = Math.floorMod(rotationDate.toEpochDay(), pageCount);
        List<ServiceProvider> selected = new ArrayList<>(providerRepository
                .findByStatusAndLandingVisibility(
                        ProviderStatus.VERIFIED,
                        LandingVisibility.VISIBLE,
                        PageRequest.of(pageIndex, SHOWCASE_LIMIT, ROTATION_ORDER)
                )
                .getContent());

        if (selected.size() < SHOWCASE_LIMIT && selected.size() < eligibleCount) {
            int missing = SHOWCASE_LIMIT - selected.size();
            selected.addAll(providerRepository
                    .findByStatusAndLandingVisibility(
                            ProviderStatus.VERIFIED,
                            LandingVisibility.VISIBLE,
                            PageRequest.of(0, missing, ROTATION_ORDER)
                    )
                    .getContent());
        }

        return selected.stream().limit(SHOWCASE_LIMIT).map(ProviderPreview::from).toList();
    }

    public record LandingSnapshot(
            List<ProviderPreview> providers,
            List<RibbonEntry> ribbon,
            LandingStats stats,
            LocalDate rotationDate
    ) {
    }

    public record LandingStats(
            long verifiedProviderCount,
            long servedCityCount,
            long completedWorkOrderCount
    ) {
    }

    public record ProviderPreview(
            String name,
            String logoUrl,
            String city,
            TicketCategory primarySpecialty,
            boolean trusted
    ) {
        private static ProviderPreview from(ServiceProvider provider) {
            TicketCategory primarySpecialty = provider.getSpecialties().stream()
                    .min(Comparator.comparing(Enum::name))
                    .orElse(TicketCategory.GENERAL);
            return new ProviderPreview(
                    provider.getName(),
                    managedLogoUrl(provider.getLogoUrl()),
                    provider.getCity(),
                    primarySpecialty,
                    provider.isTrusted()
            );
        }

        private static String managedLogoUrl(String logoUrl) {
            return logoUrl != null && logoUrl.startsWith(MANAGED_LOGO_PREFIX) ? logoUrl : null;
        }
    }

    public record RibbonEntry(
            String name,
            String logoUrl
    ) {
        private static RibbonEntry from(ServiceProvider provider) {
            return new RibbonEntry(
                    provider.getName(),
                    managedLogoUrl(provider.getLogoUrl())
            );
        }

        private static String managedLogoUrl(String logoUrl) {
            return logoUrl != null && logoUrl.startsWith(MANAGED_LOGO_PREFIX) ? logoUrl : null;
        }
    }
}
