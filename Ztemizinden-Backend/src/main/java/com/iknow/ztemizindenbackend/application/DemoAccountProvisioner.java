package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.AuthUser;
import com.iknow.ztemizindenbackend.domain.AuthUserRepository;
import com.iknow.ztemizindenbackend.domain.Customer;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.Enums.AuthRole;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import jakarta.annotation.PostConstruct;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DemoAccountProvisioner {
    private static final String DEMO_PASSWORD_HASH = "{noop}demo123";

    private static final String CUSTOMER_ID = "cust-001";
    private static final String CUSTOMER_EMAIL = "customer@demo.com";

    private static final String PROVIDER_ID = "sp-001";
    private static final String PROVIDER_EMAIL = "service@demo.com";

    private static final String ADMIN_EMAIL = "admin@demo.com";

    private final AuthUserRepository authUserRepository;
    private final CustomerRepository customerRepository;
    private final ServiceProviderRepository serviceProviderRepository;

    @PostConstruct
    void provisionDemoAccounts() {
        Customer customer = ensureDemoCustomer();
        ServiceProvider provider = ensureDemoProvider();

        restoreAuthUser(CUSTOMER_EMAIL, AuthRole.CUSTOMER, customer.getId(), null);
        restoreAuthUser(PROVIDER_EMAIL, AuthRole.SERVICE, null, provider.getId());
        restoreAuthUser(ADMIN_EMAIL, AuthRole.ADMIN, null, null);
    }

    private Customer ensureDemoCustomer() {
        Customer customer = customerRepository.findByEmailIgnoreCase(CUSTOMER_EMAIL)
                .or(() -> customerRepository.findById(CUSTOMER_ID))
                .orElseGet(this::createDemoCustomer);
        customer.activate();
        return customerRepository.save(customer);
    }

    private Customer createDemoCustomer() {
        Customer customer = new Customer(
                "Rodi Ugurlu",
                CUSTOMER_EMAIL,
                "+90 532 000 00 10",
                "Ztemizinden Demo",
                "Istanbul",
                "Kadıköy"
        );
        customer.updateProfile(
                "Rodi Ugurlu",
                "Ztemizinden Demo",
                "+90 532 000 00 10",
                "Istanbul",
                "Kadıköy",
                "Istanbul, Turkiye",
                "1111111111",
                null
        );
        return customerRepository.save(customer);
    }

    private ServiceProvider ensureDemoProvider() {
        ServiceProvider provider = serviceProviderRepository.findByEmailIgnoreCase(PROVIDER_EMAIL)
                .or(() -> serviceProviderRepository.findById(PROVIDER_ID))
                .orElseGet(this::createDemoProvider);
        provider.verify();
        return serviceProviderRepository.save(provider);
    }

    private ServiceProvider createDemoProvider() {
        ServiceProvider provider = new ServiceProvider(
                "Servis Saglayici",
                "Servis Yetkilisi",
                PROVIDER_EMAIL,
                "+90 532 000 00 00",
                "Istanbul",
                "Kadıköy",
                Set.of(
                        TicketCategory.ELECTRIC,
                        TicketCategory.MECHANIC,
                        TicketCategory.PNEUMATIC,
                        TicketCategory.HYDRAULIC,
                        TicketCategory.SOFTWARE,
                        TicketCategory.GENERAL
                ),
                Set.of(
                        "hvac",
                        "otomasyon",
                        "rulman",
                        "vana",
                        "pt100",
                        "motor",
                        "elektrik",
                        "hidrofor",
                        "pompa",
                        "inverter",
                        "kompresör",
                        "filtre"
                ),
                Set.of("Kadıköy", "Ataşehir", "Üsküdar", "Ümraniye", "Maltepe")
        );
        provider.updateProfile(
                "Servis Saglayici",
                "Servis Yetkilisi",
                "+90 532 000 00 00",
                "Istanbul",
                "Kadıköy",
                "Istanbul, Turkiye",
                "2222222222",
                null,
                Set.of(
                        TicketCategory.ELECTRIC,
                        TicketCategory.MECHANIC,
                        TicketCategory.PNEUMATIC,
                        TicketCategory.HYDRAULIC,
                        TicketCategory.SOFTWARE,
                        TicketCategory.GENERAL
                ),
                Set.of(
                        "hvac",
                        "otomasyon",
                        "rulman",
                        "vana",
                        "pt100",
                        "motor",
                        "elektrik",
                        "hidrofor",
                        "pompa",
                        "inverter",
                        "kompresör",
                        "filtre"
                ),
                Set.of("Kadıköy", "Ataşehir", "Üsküdar", "Ümraniye", "Maltepe")
        );
        provider.verify();
        return serviceProviderRepository.save(provider);
    }

    private void restoreAuthUser(String email, AuthRole role, String customerId, String providerId) {
        authUserRepository.findByEmailIgnoreCase(email)
                .ifPresentOrElse(
                        user -> {
                            user.restore(email, DEMO_PASSWORD_HASH, role, customerId, providerId);
                            authUserRepository.save(user);
                        },
                        () -> authUserRepository.save(new AuthUser(
                                email,
                                DEMO_PASSWORD_HASH,
                                role,
                                customerId,
                                providerId
                        ))
                );
    }
}
