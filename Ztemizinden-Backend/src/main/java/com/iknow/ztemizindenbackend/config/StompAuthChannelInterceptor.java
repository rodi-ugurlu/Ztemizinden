package com.iknow.ztemizindenbackend.config;

import com.iknow.ztemizindenbackend.application.TicketRealtimeAccess;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {
    private static final String TICKET_MESSAGE_TOPIC_PREFIX = "/topic/tickets/";
    private static final String TICKET_MESSAGE_TOPIC_SUFFIX = "/messages";
    private static final String CONVERSATION_TOPIC_MARKER = "/conversations/";
    private static final String CUSTOMER_TICKET_TOPIC_PREFIX = "/topic/customers/";
    private static final String PROVIDER_TICKET_TOPIC_PREFIX = "/topic/providers/";
    private static final String TICKET_EVENT_TOPIC_SUFFIX = "/tickets";

    private final JwtDecoder jwtDecoder;
    private final SecurityProperties securityProperties;
    private final TicketRealtimeAccess ticketRealtimeAccess;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (accessor.getCommand() == StompCommand.CONNECT) {
            authenticate(accessor);
            return message;
        }

        if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
            requireSubscriptionAccess(accessor);
            return message;
        }

        if (accessor.getCommand() == StompCommand.SEND
                && accessor.getDestination() != null
                && accessor.getDestination().startsWith("/topic/")) {
            throw new AccessDeniedException("Clients cannot publish directly to broker topics");
        }

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        if (!securityProperties.enabled()) {
            return;
        }

        String token = bearerToken(accessor);
        if (token == null) {
            throw new AccessDeniedException("Missing WebSocket bearer token");
        }

        Jwt jwt = jwtDecoder.decode(token);
        accessor.setUser(new UsernamePasswordAuthenticationToken(jwt, jwt, authorities(jwt)));
    }

    private void requireSubscriptionAccess(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }
        if (isCustomerTicketTopic(destination)) {
            String customerId = destination.substring(
                    CUSTOMER_TICKET_TOPIC_PREFIX.length(),
                    destination.length() - TICKET_EVENT_TOPIC_SUFFIX.length()
            );
            ticketRealtimeAccess.requireCanSubscribeCustomer(customerId, accessor.getUser());
            return;
        }
        if (isProviderTicketTopic(destination)) {
            String providerId = destination.substring(
                    PROVIDER_TICKET_TOPIC_PREFIX.length(),
                    destination.length() - TICKET_EVENT_TOPIC_SUFFIX.length()
            );
            ticketRealtimeAccess.requireCanSubscribeProvider(providerId, accessor.getUser());
            return;
        }
        if (isConversationMessageTopic(destination)) {
            String topicPath = destination.substring(
                    TICKET_MESSAGE_TOPIC_PREFIX.length(),
                    destination.length() - TICKET_MESSAGE_TOPIC_SUFFIX.length()
            );
            String[] parts = topicPath.split(CONVERSATION_TOPIC_MARKER, 2);
            ticketRealtimeAccess.requireCanSubscribeConversation(parts[0], parts[1], accessor.getUser());
            return;
        }
        if (!isTicketMessageTopic(destination)) {
            return;
        }
        String ticketId = destination.substring(
                TICKET_MESSAGE_TOPIC_PREFIX.length(),
                destination.length() - TICKET_MESSAGE_TOPIC_SUFFIX.length()
        );
        ticketRealtimeAccess.requireCanSubscribe(ticketId, accessor.getUser());
    }

    private boolean isTicketMessageTopic(String destination) {
        return destination.startsWith(TICKET_MESSAGE_TOPIC_PREFIX)
                && destination.endsWith(TICKET_MESSAGE_TOPIC_SUFFIX)
                && !destination.contains(CONVERSATION_TOPIC_MARKER)
                && destination.length() > TICKET_MESSAGE_TOPIC_PREFIX.length() + TICKET_MESSAGE_TOPIC_SUFFIX.length();
    }

    private boolean isConversationMessageTopic(String destination) {
        if (!destination.startsWith(TICKET_MESSAGE_TOPIC_PREFIX)
                || !destination.endsWith(TICKET_MESSAGE_TOPIC_SUFFIX)
                || !destination.contains(CONVERSATION_TOPIC_MARKER)) {
            return false;
        }
        String topicPath = destination.substring(
                TICKET_MESSAGE_TOPIC_PREFIX.length(),
                destination.length() - TICKET_MESSAGE_TOPIC_SUFFIX.length()
        );
        String[] parts = topicPath.split(CONVERSATION_TOPIC_MARKER, 2);
        return parts.length == 2 && !parts[0].isBlank() && !parts[1].isBlank();
    }

    private boolean isCustomerTicketTopic(String destination) {
        return destination.startsWith(CUSTOMER_TICKET_TOPIC_PREFIX)
                && destination.endsWith(TICKET_EVENT_TOPIC_SUFFIX)
                && destination.length() > CUSTOMER_TICKET_TOPIC_PREFIX.length() + TICKET_EVENT_TOPIC_SUFFIX.length();
    }

    private boolean isProviderTicketTopic(String destination) {
        return destination.startsWith(PROVIDER_TICKET_TOPIC_PREFIX)
                && destination.endsWith(TICKET_EVENT_TOPIC_SUFFIX)
                && destination.length() > PROVIDER_TICKET_TOPIC_PREFIX.length() + TICKET_EVENT_TOPIC_SUFFIX.length();
    }

    private String bearerToken(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (authorization == null || authorization.isBlank()) {
            authorization = accessor.getFirstNativeHeader("authorization");
        }
        if (authorization == null || authorization.isBlank()) {
            return null;
        }
        return authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                ? authorization.substring(7).trim()
                : authorization.trim();
    }

    private Collection<GrantedAuthority> authorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        Object rolesClaim = realmAccess == null ? null : realmAccess.get("roles");
        Stream<String> realmRoles = rolesClaim instanceof Collection<?> roles
                ? roles.stream().filter(String.class::isInstance).map(String.class::cast)
                : Stream.empty();

        return realmRoles
                .flatMap(role -> Stream.of(role, role.toUpperCase()))
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
    }
}
