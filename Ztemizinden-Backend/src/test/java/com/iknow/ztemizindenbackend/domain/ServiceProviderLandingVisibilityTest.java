package com.iknow.ztemizindenbackend.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.iknow.ztemizindenbackend.domain.Enums.LandingVisibility;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ServiceProviderLandingVisibilityTest {

    @Test
    void verificationPublishesProviderAndPublicProfileChangesRequireReview() {
        ServiceProvider provider = provider();

        assertThatThrownBy(provider::requestLandingVisibility)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("verified");

        provider.verify();
        assertThat(provider.getLandingVisibility()).isEqualTo(LandingVisibility.VISIBLE);
        assertThat(provider.getLandingApprovedAt()).isNotNull();

        update(provider, "Servis Bir", "/uploads/profile-logos/logo.webp");
        assertThat(provider.getLandingVisibility()).isEqualTo(LandingVisibility.PENDING);

        provider.approveLandingVisibility();
        assertThat(provider.getLandingVisibility()).isEqualTo(LandingVisibility.VISIBLE);
        assertThat(provider.getLandingApprovedAt()).isNotNull();

        update(provider, "Servis Bir Yenilendi", "/uploads/profile-logos/logo.webp");
        assertThat(provider.getLandingVisibility()).isEqualTo(LandingVisibility.PENDING);
        assertThat(provider.getLandingApprovedAt()).isNull();
    }

    @Test
    void verifiedProviderCanBeDisplayedWithANameFallbackWhenNoLogoExists() {
        ServiceProvider provider = provider();
        provider.verify();
        provider.hideFromLanding();

        provider.requestLandingVisibility();
        provider.approveLandingVisibility();

        assertThat(provider.getLandingVisibility()).isEqualTo(LandingVisibility.VISIBLE);
    }

    @Test
    void rejectsExternalLogoUrlsForNewProfileUploads() {
        ServiceProvider provider = provider();

        assertThatThrownBy(() -> update(provider, "Servis Bir", "https://tracker.example/logo.png"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("managed profile logo");
    }

    @Test
    void suspensionRemovesProviderFromLanding() {
        ServiceProvider provider = provider();
        provider.verify();
        update(provider, "Servis Bir", "/uploads/profile-logos/logo.png");
        provider.approveLandingVisibility();

        provider.suspend();

        assertThat(provider.getLandingVisibility()).isEqualTo(LandingVisibility.HIDDEN);
        assertThat(provider.getLandingApprovedAt()).isNull();
    }

    private ServiceProvider provider() {
        return new ServiceProvider(
                "Servis Bir",
                "Yetkili",
                "servis@example.com",
                "+90 555 000 00 00",
                "Kocaeli",
                "Gebze",
                Set.of(TicketCategory.MECHANIC),
                Set.of("pompa"),
                Set.of("Gebze")
        );
    }

    private void update(ServiceProvider provider, String name, String logoUrl) {
        provider.updateProfile(
                name,
                "Yetkili",
                "+90 555 000 00 00",
                "Kocaeli",
                "Gebze",
                "Adres",
                "1234567890",
                logoUrl,
                Set.of(TicketCategory.MECHANIC),
                Set.of("pompa"),
                Set.of("Gebze")
        );
    }
}
