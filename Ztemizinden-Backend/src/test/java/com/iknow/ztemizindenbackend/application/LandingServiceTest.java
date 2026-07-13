package com.iknow.ztemizindenbackend.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.iknow.ztemizindenbackend.domain.Enums.LandingVisibility;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.Collections;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

class LandingServiceTest {

    @Test
    void returnsAStableDailyPageAndRealAggregateStats() {
        Instant now = Instant.parse("2026-07-13T08:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        LocalDate date = LocalDate.now(clock);
        int expectedPage = Math.floorMod(date.toEpochDay(), 3);
        AtomicInteger requestedPage = new AtomicInteger(-1);
        ServiceProvider provider = visibleProvider();

        ServiceProviderRepository providerRepository = repositoryProxy(
                ServiceProviderRepository.class,
                (target, method, args) -> switch (method.getName()) {
                    case "countByStatusAndLandingVisibility" -> {
                        assertThat(args[0]).isEqualTo(ProviderStatus.VERIFIED);
                        assertThat(args[1]).isEqualTo(LandingVisibility.VISIBLE);
                        yield 25L;
                    }
                    case "findByStatusAndLandingVisibility" -> {
                        if (args[2] instanceof Pageable pageable) {
                            requestedPage.compareAndSet(-1, pageable.getPageNumber());
                            yield new PageImpl<>(Collections.nCopies(10, provider), pageable, 25);
                        }
                        // Sort overload — ribbon query returns all visible providers
                        yield Collections.nCopies(25, provider);
                    }
                    case "countByStatus" -> 25L;
                    case "countDistinctCitiesByStatus" -> 9L;
                    default -> throw new UnsupportedOperationException(method.getName());
                }
        );
        TicketRepository ticketRepository = repositoryProxy(
                TicketRepository.class,
                (target, method, args) -> {
                    if ("countByStatusIn".equals(method.getName())) return 84L;
                    throw new UnsupportedOperationException(method.getName());
                }
        );

        LandingService.LandingSnapshot snapshot = new LandingService(
                providerRepository,
                ticketRepository,
                clock
        ).snapshot();

        assertThat(requestedPage).hasValue(expectedPage);
        assertThat(snapshot.rotationDate()).isEqualTo(date);
        assertThat(snapshot.providers()).hasSize(10);
        assertThat(snapshot.providers().getFirst().name()).isEqualTo("Canlı Servis");
        assertThat(snapshot.providers().getFirst().logoUrl()).isEqualTo("/uploads/profile-logos/canli.webp");
        assertThat(snapshot.providers().getFirst().primarySpecialty()).isEqualTo(TicketCategory.MECHANIC);
        assertThat(snapshot.ribbon()).hasSize(25);
        assertThat(snapshot.ribbon().getFirst().name()).isEqualTo("Canlı Servis");
        assertThat(snapshot.ribbon().getFirst().logoUrl()).isEqualTo("/uploads/profile-logos/canli.webp");
        assertThat(snapshot.stats().verifiedProviderCount()).isEqualTo(25);
        assertThat(snapshot.stats().servedCityCount()).isEqualTo(9);
        assertThat(snapshot.stats().completedWorkOrderCount()).isEqualTo(84);
    }

    private ServiceProvider visibleProvider() {
        ServiceProvider provider = new ServiceProvider(
                "Canlı Servis",
                "Yetkili",
                "canli@example.com",
                "+90 555 000 00 00",
                "Bursa",
                "Nilüfer",
                Set.of(TicketCategory.MECHANIC),
                Set.of("bakım"),
                Set.of("Nilüfer")
        );
        provider.verify();
        provider.updateProfile(
                provider.getName(),
                provider.getContactName(),
                provider.getPhone(),
                provider.getCity(),
                provider.getDistrict(),
                "Adres",
                "1234567890",
                "/uploads/profile-logos/canli.webp",
                provider.getSpecialties(),
                provider.getExpertiseTags(),
                provider.getCoverageDistricts()
        );
        provider.approveLandingVisibility();
        return provider;
    }

    private static <T> T repositoryProxy(Class<T> type, InvocationHandler handler) {
        Object proxy = Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (target, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                return objectMethod(target, method, args);
            }
            return handler.invoke(target, method, args);
        });
        return type.cast(proxy);
    }

    private static Object objectMethod(Object target, Method method, Object[] args) {
        return switch (method.getName()) {
            case "toString" -> "repository test proxy";
            case "hashCode" -> System.identityHashCode(target);
            case "equals" -> target == args[0];
            default -> throw new UnsupportedOperationException(method.getName());
        };
    }
}
