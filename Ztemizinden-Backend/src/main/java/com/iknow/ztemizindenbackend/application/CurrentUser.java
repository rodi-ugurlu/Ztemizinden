package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.SecurityProperties;
import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final SecurityProperties securityProperties;
    private final CustomerRepository customerRepository;
    private final ServiceProviderRepository serviceProviderRepository;

    public CurrentUser(
            SecurityProperties securityProperties,
            CustomerRepository customerRepository,
            ServiceProviderRepository serviceProviderRepository
    ) {
        this.securityProperties = securityProperties;
        this.customerRepository = customerRepository;
        this.serviceProviderRepository = serviceProviderRepository;
    }

    public boolean securityEnabled() {
        return securityProperties.enabled();
    }

    public String customerId(String requestedCustomerId) {
        if (!securityEnabled() || isAdmin()) {
            return requestedCustomerId;
        }
        String claimCustomerId = claim("customerId");
        if (claimCustomerId != null) {
            return claimCustomerId;
        }
        String identitySubject = subject();
        if (identitySubject != null) {
            return customerRepository.findByIdentitySubject(identitySubject)
                    .map(customer -> customer.getId())
                    .orElseGet(() -> customerIdByEmailOrFallback(requestedCustomerId));
        }
        return customerIdByEmailOrFallback(requestedCustomerId);
    }

    private String customerIdByEmailOrFallback(String requestedCustomerId) {
        String email = email();
        if (email != null) {
            return customerRepository.findByEmailIgnoreCase(email)
                    .map(customer -> customer.getId())
                    .orElseGet(() -> mappedPrincipalId("customer", requestedCustomerId));
        }
        return mappedPrincipalId("customer", requestedCustomerId);
    }

    public String providerId(String requestedProviderId) {
        if (!securityEnabled() || isAdmin()) {
            return requestedProviderId;
        }
        String claimProviderId = claim("providerId");
        if (claimProviderId != null) {
            return claimProviderId;
        }
        String identitySubject = subject();
        if (identitySubject != null) {
            return serviceProviderRepository.findByIdentitySubject(identitySubject)
                    .map(provider -> provider.getId())
                    .orElseGet(() -> providerIdByEmailOrFallback(requestedProviderId));
        }
        return providerIdByEmailOrFallback(requestedProviderId);
    }

    private String providerIdByEmailOrFallback(String requestedProviderId) {
        String email = email();
        if (email != null) {
            return serviceProviderRepository.findByEmailIgnoreCase(email)
                    .map(provider -> provider.getId())
                    .orElseGet(() -> mappedPrincipalId("service", requestedProviderId));
        }
        return mappedPrincipalId("service", requestedProviderId);
    }

    public String displayName(String fallback) {
        if (!securityEnabled()) {
            return fallback;
        }
        Jwt jwt = jwt();
        if (jwt == null) {
            return fallback;
        }
        String name = jwt.getClaimAsString("name");
        if (name != null && !name.isBlank()) {
            return name;
        }
        String email = jwt.getClaimAsString("email");
        return email == null || email.isBlank() ? fallback : email;
    }

    public String email() {
        return claim("email");
    }

    public String subject() {
        Jwt jwt = jwt();
        return jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank() ? null : jwt.getSubject();
    }

    private String claim(String name) {
        Jwt jwt = jwt();
        if (jwt == null) {
            return null;
        }
        String value = jwt.getClaimAsString(name);
        return value == null || value.isBlank() ? null : value;
    }

    public void requireCustomerTicket(Ticket ticket) {
        if (!securityEnabled() || isAdmin()) {
            return;
        }
        if (!isCustomer() || !customerId(ticket.getCustomerId()).equals(ticket.getCustomerId())) {
            throw new AccessDeniedException("Ticket does not belong to current customer");
        }
    }

    public void requireCustomerAsset(Asset asset) {
        if (!securityEnabled() || isAdmin()) {
            return;
        }
        if (!isCustomer() || !customerId(asset.getOwnerId()).equals(asset.getOwnerId())) {
            throw new AccessDeniedException("Asset does not belong to current customer");
        }
    }

    public void requireProviderTicket(Ticket ticket) {
        if (!securityEnabled() || isAdmin()) {
            return;
        }
        if (!isService() || ticket.getAssignedProviderId() == null
                || !providerId(ticket.getAssignedProviderId()).equals(ticket.getAssignedProviderId())) {
            throw new AccessDeniedException("Ticket is not assigned to current provider");
        }
    }

    public boolean isAdmin() {
        return hasRole("ADMIN");
    }

    public boolean isCustomer() {
        return hasRole("CUSTOMER");
    }

    public boolean isService() {
        return hasRole("SERVICE");
    }

    private boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        String authority = "ROLE_" + role.toUpperCase(Locale.ROOT);
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }

    private String mappedPrincipalId(String expectedRole, String fallback) {
        Jwt jwt = jwt();
        if (jwt == null) {
            return fallback;
        }
        String email = jwt.getClaimAsString("email");
        if ("customer".equals(expectedRole) && "customer@demo.com".equalsIgnoreCase(email)) {
            return "cust-001";
        }
        if ("service".equals(expectedRole) && "service@demo.com".equalsIgnoreCase(email)) {
            return "sp-001";
        }
        return jwt.getSubject() == null || jwt.getSubject().isBlank() ? fallback : jwt.getSubject();
    }

    private Jwt jwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            return token.getToken();
        }
        return null;
    }
}
