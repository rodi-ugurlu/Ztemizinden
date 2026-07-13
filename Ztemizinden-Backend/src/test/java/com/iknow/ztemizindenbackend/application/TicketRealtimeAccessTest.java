package com.iknow.ztemizindenbackend.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.iknow.ztemizindenbackend.config.SecurityProperties;
import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.time.Instant;
import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

class TicketRealtimeAccessTest {

    @Test
    void sharedTicketTopicIsRestrictedToAssignedProvider() {
        Ticket ticket = ticket();
        ticket.assignProvider("sp-1", "Provider sp-1");
        TicketRepository ticketRepository = (TicketRepository) Proxy.newProxyInstance(
                TicketRepository.class.getClassLoader(),
                new Class<?>[]{TicketRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        return Optional.of(ticket);
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
        TicketRealtimeAccess access = new TicketRealtimeAccess(
                new SecurityProperties(true, List.of()),
                ticketRepository,
                null,
                null,
                null
        );

        assertDoesNotThrow(() -> access.requireCanSubscribe(ticket.getId(), provider("sp-1")));
        assertThrows(
                AccessDeniedException.class,
                () -> access.requireCanSubscribe(ticket.getId(), provider("sp-2"))
        );
    }

    private JwtAuthenticationToken provider(String providerId) {
        Instant now = Instant.now();
        Jwt jwt = new Jwt(
                "token-" + providerId,
                now,
                now.plusSeconds(60),
                Map.of("alg", "HS256"),
                Map.of("sub", providerId, "providerId", providerId)
        );
        return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
    }

    private Ticket ticket() {
        Asset asset = new Asset(
                "cust-1", "Asset", "TAG-1", AssetType.FACILITY,
                "Brand", "Model", "SN-1", null, null,
                "Istanbul", "Maintenance", null
        );
        ReflectionTestUtils.setField(asset, "id", "asset-1");
        Ticket ticket = new Ticket(
                "cust-1", "Customer", "Factory", "Istanbul",
                asset, "Ticket", "Description",
                TicketCategory.HYDRAULIC, TicketPriority.MEDIUM
        );
        ReflectionTestUtils.setField(ticket, "id", "ticket-1");
        return ticket;
    }
}
