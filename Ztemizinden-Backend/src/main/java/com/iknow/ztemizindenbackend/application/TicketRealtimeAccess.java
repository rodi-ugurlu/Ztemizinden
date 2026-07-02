package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.SecurityProperties;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import com.iknow.ztemizindenbackend.domain.NotFoundException;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketConversation;
import com.iknow.ztemizindenbackend.domain.TicketConversationRepository;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketRealtimeAccess {
    private final SecurityProperties securityProperties;
    private final TicketRepository ticketRepository;
    private final TicketConversationRepository ticketConversationRepository;
    private final CustomerRepository customerRepository;
    private final ServiceProviderRepository serviceProviderRepository;

    @Transactional(readOnly = true)
    public void requireCanSubscribe(String ticketId, Principal principal) {
        if (!securityProperties.enabled()) {
            return;
        }

        Authentication authentication = authentication(principal);
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("WebSocket session is not authenticated");
        }
        if (hasRole(authentication, "ADMIN")) {
            return;
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        if (hasRole(authentication, "CUSTOMER")) {
            String customerId = customerId(authentication);
            if (ticket.getCustomerId().equals(customerId)) {
                return;
            }
        }

        if (hasRole(authentication, "SERVICE")) {
            String providerId = providerId(authentication);
            ServiceProvider provider = serviceProviderRepository.findById(providerId)
                    .orElseThrow(() -> new NotFoundException("Provider not found"));
            if (isVisibleForProvider(ticket, provider)) {
                return;
            }
        }

        throw new AccessDeniedException("Ticket topic is not visible to current user");
    }

    @Transactional(readOnly = true)
    public void requireCanSubscribeConversation(String ticketId, String conversationId, Principal principal) {
        if (!securityProperties.enabled()) {
            return;
        }

        Authentication authentication = authentication(principal);
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("WebSocket session is not authenticated");
        }
        if (hasRole(authentication, "ADMIN")) {
            return;
        }

        TicketConversation conversation = ticketConversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));
        if (!conversation.getTicket().getId().equals(ticketId)) {
            throw new AccessDeniedException("Conversation does not belong to ticket topic");
        }

        if (hasRole(authentication, "CUSTOMER")) {
            String customerId = customerId(authentication);
            if (conversation.getTicket().getCustomerId().equals(customerId)) {
                return;
            }
        }

        if (hasRole(authentication, "SERVICE")) {
            String providerId = providerId(authentication);
            if (conversation.getProviderId().equals(providerId)) {
                return;
            }
        }

        throw new AccessDeniedException("Conversation topic is not visible to current user");
    }

    @Transactional(readOnly = true)
    public void requireCanSubscribeCustomer(String requestedCustomerId, Principal principal) {
        if (!securityProperties.enabled()) {
            return;
        }

        Authentication authentication = authentication(principal);
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("WebSocket session is not authenticated");
        }
        if (hasRole(authentication, "ADMIN")) {
            return;
        }
        if (hasRole(authentication, "CUSTOMER") && requestedCustomerId.equals(customerId(authentication))) {
            return;
        }

        throw new AccessDeniedException("Customer ticket topic is not visible to current user");
    }

    @Transactional(readOnly = true)
    public void requireCanSubscribeProvider(String requestedProviderId, Principal principal) {
        if (!securityProperties.enabled()) {
            return;
        }

        Authentication authentication = authentication(principal);
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("WebSocket session is not authenticated");
        }
        if (hasRole(authentication, "ADMIN")) {
            return;
        }
        if (hasRole(authentication, "SERVICE") && requestedProviderId.equals(providerId(authentication))) {
            return;
        }

        throw new AccessDeniedException("Provider ticket topic is not visible to current user");
    }

    private boolean isVisibleForProvider(Ticket ticket, ServiceProvider provider) {
        if (provider.getId().equals(ticket.getAssignedProviderId())) {
            return true;
        }
        if (ticket.getOffers().stream().anyMatch(offer -> offer.getProviderId().equals(provider.getId()))) {
            return true;
        }
        return isOpenOpportunity(ticket)
                && provider.getSpecialties() != null
                && provider.getSpecialties().contains(ticket.getCategory());
    }

    private boolean isOpenOpportunity(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.OFFERED;
    }

    private String customerId(Authentication authentication) {
        Jwt jwt = jwt(authentication);
        String claimCustomerId = jwt.getClaimAsString("customerId");
        if (claimCustomerId != null && !claimCustomerId.isBlank()) {
            return claimCustomerId;
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return customerRepository.findByEmailIgnoreCase(email)
                    .map(customer -> customer.getId())
                    .orElse(jwt.getSubject());
        }
        return jwt.getSubject();
    }

    private String providerId(Authentication authentication) {
        Jwt jwt = jwt(authentication);
        String claimProviderId = jwt.getClaimAsString("providerId");
        if (claimProviderId != null && !claimProviderId.isBlank()) {
            return claimProviderId;
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return serviceProviderRepository.findByEmailIgnoreCase(email)
                    .map(provider -> provider.getId())
                    .orElse(jwt.getSubject());
        }
        return jwt.getSubject();
    }

    private Authentication authentication(Principal principal) {
        return principal instanceof Authentication authentication ? authentication : null;
    }

    private boolean hasRole(Authentication authentication, String role) {
        String authority = "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
    }

    private Jwt jwt(Authentication authentication) {
        if (authentication instanceof AbstractAuthenticationToken token && token.getPrincipal() instanceof Jwt jwt) {
            return jwt;
        }
        throw new AccessDeniedException("WebSocket principal is not a JWT");
    }
}
