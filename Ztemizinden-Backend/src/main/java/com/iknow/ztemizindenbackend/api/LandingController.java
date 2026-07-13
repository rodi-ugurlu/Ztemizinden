package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.LandingService;
import com.iknow.ztemizindenbackend.application.LandingService.LandingSnapshot;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/landing")
public class LandingController {
    private final LandingService landingService;

    @GetMapping
    public ResponseEntity<LandingResponse> landing() {
        LandingSnapshot snapshot = landingService.snapshot();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(LandingResponse.from(snapshot));
    }

    public record LandingResponse(
            List<LandingProviderResponse> providers,
            List<RibbonResponse> ribbon,
            LandingStatsResponse stats,
            LocalDate rotationDate
    ) {
        static LandingResponse from(LandingSnapshot snapshot) {
            return new LandingResponse(
                    snapshot.providers().stream().map(LandingProviderResponse::from).toList(),
                    snapshot.ribbon().stream().map(RibbonResponse::from).toList(),
                    new LandingStatsResponse(
                            snapshot.stats().verifiedProviderCount(),
                            snapshot.stats().servedCityCount(),
                            snapshot.stats().completedWorkOrderCount()
                    ),
                    snapshot.rotationDate()
            );
        }
    }

    public record LandingProviderResponse(
            String name,
            String logoUrl,
            String city,
            String primarySpecialty,
            boolean trusted
    ) {
        static LandingProviderResponse from(LandingService.ProviderPreview provider) {
            return new LandingProviderResponse(
                    provider.name(),
                    provider.logoUrl(),
                    provider.city(),
                    specialtyLabel(provider.primarySpecialty()),
                    provider.trusted()
            );
        }

        private static String specialtyLabel(com.iknow.ztemizindenbackend.domain.Enums.TicketCategory specialty) {
            return switch (specialty) {
                case ELECTRIC -> "Elektrik";
                case MECHANIC -> "Mekanik";
                case PNEUMATIC -> "Pnömatik";
                case HYDRAULIC -> "Hidrolik";
                case GENERAL -> "Genel bakım";
                case SOFTWARE -> "Yazılım ve otomasyon";
            };
        }
    }

    public record LandingStatsResponse(
            long verifiedProviderCount,
            long servedCityCount,
            long completedWorkOrderCount
    ) {
    }

    public record RibbonResponse(
            String name,
            String logoUrl
    ) {
        static RibbonResponse from(LandingService.RibbonEntry entry) {
            return new RibbonResponse(entry.name(), entry.logoUrl());
        }
    }
}
