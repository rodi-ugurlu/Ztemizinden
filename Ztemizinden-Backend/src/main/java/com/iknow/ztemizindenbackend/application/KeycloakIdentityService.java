package com.iknow.ztemizindenbackend.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iknow.ztemizindenbackend.config.KeycloakProperties;
import com.iknow.ztemizindenbackend.domain.ExternalIdentityException;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class KeycloakIdentityService {
    private static final Set<String> APPLICATION_ROLES = Set.of("CUSTOMER", "SERVICE", "ADMIN");
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<Map<String, Object>>> LIST_TYPE = new TypeReference<>() {
    };

    private final KeycloakProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public KeycloakIdentityService(KeycloakProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public String provisionCustomer(String domainId, String email, String name, String password) {
        return provision(domainId, email, name, password, "CUSTOMER", true, "customerId");
    }

    public String provisionServiceProvider(String domainId, String email, String name, String password) {
        return provision(domainId, email, name, password, "SERVICE", false, "providerId");
    }

    public void enableUser(String identitySubject, String email) {
        setEnabled(identitySubject, email, true, true);
    }

    public void disableUser(String identitySubject, String email) {
        setEnabled(identitySubject, email, false, false);
    }

    public void restoreEnabledAfterRollback(String identitySubject, String email, boolean enabled) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_ROLLED_BACK) {
                    return;
                }
                try {
                    setEnabled(identitySubject, email, enabled, false);
                } catch (RuntimeException exception) {
                    log.error("Keycloak user state could not be restored after database rollback", exception);
                }
            }
        });
    }

    public void requestPasswordReset(String email) {
        String accessToken = adminAccessToken();
        String userId = existingUserId(accessToken, normalizeEmail(email));
        if (userId == null) {
            return;
        }

        String query = "?client_id=" + encode(properties.webClientId())
                + "&redirect_uri=" + encode(properties.passwordResetRedirectUri())
                + "&lifespan=" + properties.passwordResetLifespanSeconds();
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users/" + encode(userId) + "/execute-actions-email" + query)
                .header("Content-Type", "application/json")
                .PUT(json(List.of("UPDATE_PASSWORD")))
                .build();
        requireSuccess(send(request, "Keycloak password reset email could not be requested"),
                "Keycloak password reset email could not be requested");
    }

    public String provisionMigratedIdentity(
            String email,
            String name,
            String role,
            boolean enabled,
            String domainIdAttribute,
            String domainId
    ) {
        String normalizedEmail = normalizeEmail(email);
        String accessToken = adminAccessToken();
        String userId = existingUserId(accessToken, normalizedEmail);
        Map<String, List<String>> attributes = StringUtils.hasText(domainIdAttribute) && StringUtils.hasText(domainId)
                ? Map.of(domainIdAttribute, List.of(domainId))
                : Map.of();
        if (userId == null) {
            userId = createUser(
                    accessToken,
                    normalizedEmail,
                    name,
                    UUID.randomUUID() + "Aa1!",
                    enabled,
                    attributes,
                    List.of("UPDATE_PASSWORD")
            );
        } else {
            requirePasswordUpdate(accessToken, userId, enabled, attributes);
        }
        replaceApplicationRealmRole(accessToken, userId, required(role, "Identity role is required"));
        return userId;
    }

    private String provision(
            String domainId,
            String email,
            String name,
            String password,
            String role,
            boolean enabled,
            String domainIdAttribute
    ) {
        String normalizedEmail = normalizeEmail(email);
        String accessToken = adminAccessToken();
        if (existingUserId(accessToken, normalizedEmail) != null) {
            throw new IllegalStateException("Identity email is already registered");
        }

        String userId = createUser(
                accessToken,
                normalizedEmail,
                name,
                password,
                enabled,
                Map.of(domainIdAttribute, List.of(domainId))
        );
        try {
            assignRealmRole(accessToken, userId, role);
            registerRollbackCleanup(userId);
            return userId;
        } catch (RuntimeException exception) {
            deleteUserQuietly(userId);
            throw exception;
        }
    }

    private void setEnabled(String identitySubject, String email, boolean enabled, boolean notifyPasswordSetup) {
        String accessToken = adminAccessToken();
        String userId = StringUtils.hasText(identitySubject)
                ? identitySubject
                : existingUserId(accessToken, normalizeEmail(email));
        if (!StringUtils.hasText(userId)) {
            throw new ExternalIdentityException("Keycloak identity could not be found");
        }

        Map<String, Object> current = user(accessToken, userId);
        boolean previouslyEnabled = Boolean.TRUE.equals(current.get("enabled"));
        Map<String, Object> payload = new LinkedHashMap<>(current);
        payload.remove("access");
        payload.put("enabled", enabled);
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users/" + encode(userId))
                .header("Content-Type", "application/json")
                .PUT(json(payload))
                .build();
        requireSuccess(send(request, "Keycloak user status could not be updated"),
                "Keycloak user status could not be updated");
        if (enabled && notifyPasswordSetup && requiresPasswordUpdate(current)) {
            try {
                requestPasswordReset(email);
            } catch (RuntimeException exception) {
                setEnabled(identitySubject, email, previouslyEnabled, false);
                throw exception;
            }
        }
    }

    private boolean requiresPasswordUpdate(Map<String, Object> user) {
        Object requiredActions = user.get("requiredActions");
        return requiredActions instanceof List<?> actions && actions.contains("UPDATE_PASSWORD");
    }

    private String createUser(
            String accessToken,
            String email,
            String name,
            String password,
            boolean enabled,
            Map<String, List<String>> attributes
    ) {
        return createUser(accessToken, email, name, password, enabled, attributes, List.of());
    }

    private String createUser(
            String accessToken,
            String email,
            String name,
            String password,
            boolean enabled,
            Map<String, List<String>> attributes,
            List<String> requiredActions
    ) {
        String displayName = StringUtils.hasText(name) ? name.trim() : email;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("username", email);
        payload.put("email", email);
        payload.put("enabled", enabled);
        payload.put("emailVerified", false);
        payload.put("firstName", firstName(displayName));
        payload.put("lastName", lastName(displayName));
        payload.put("attributes", attributes);
        payload.put("requiredActions", requiredActions);
        payload.put("credentials", List.of(Map.of(
                        "type", "password",
                        "value", required(password, "Password is required"),
                        "temporary", false
                )));

        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm()) + "/users")
                .header("Content-Type", "application/json")
                .POST(json(payload))
                .build();
        HttpResponse<String> response = send(request, "Keycloak user could not be created");
        if (response.statusCode() == 409) {
            throw new IllegalStateException("Identity email is already registered");
        }
        if (response.statusCode() != 201) {
            throw new ExternalIdentityException("Keycloak user could not be created");
        }
        return response.headers().firstValue("Location")
                .map(location -> location.substring(location.lastIndexOf('/') + 1))
                .filter(StringUtils::hasText)
                .orElseThrow(() -> new ExternalIdentityException("Keycloak user creation response is invalid"));
    }

    private void requirePasswordUpdate(
            String accessToken,
            String userId,
            boolean enabled,
            Map<String, List<String>> attributes
    ) {
        Map<String, Object> current = user(accessToken, userId);
        Map<String, Object> payload = new LinkedHashMap<>(current);
        payload.remove("access");
        payload.put("enabled", enabled);
        Map<String, Object> mergedAttributes = new LinkedHashMap<>();
        Object currentAttributes = current.get("attributes");
        if (currentAttributes instanceof Map<?, ?> values) {
            values.forEach((key, value) -> {
                if (key instanceof String stringKey) {
                    mergedAttributes.put(stringKey, value);
                }
            });
        }
        mergedAttributes.putAll(attributes);
        payload.put("attributes", mergedAttributes);
        payload.put("requiredActions", List.of("UPDATE_PASSWORD"));

        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users/" + encode(userId))
                .header("Content-Type", "application/json")
                .PUT(json(payload))
                .build();
        requireSuccess(send(request, "Keycloak migrated user could not be updated"),
                "Keycloak migrated user could not be updated");
    }

    private void assignRealmRole(String accessToken, String userId, String roleName) {
        HttpRequest roleRequest = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/roles/" + encode(roleName))
                .GET()
                .build();
        Map<String, Object> role = responseMap(
                requireSuccess(send(roleRequest, "Keycloak realm role could not be read"),
                        "Keycloak realm role could not be read"),
                "Keycloak realm role could not be read"
        );

        HttpRequest assignRequest = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users/" + encode(userId) + "/role-mappings/realm")
                .header("Content-Type", "application/json")
                .POST(json(List.of(role)))
                .build();
        requireSuccess(send(assignRequest, "Keycloak user role could not be assigned"),
                "Keycloak user role could not be assigned");
    }

    private void replaceApplicationRealmRole(String accessToken, String userId, String roleName) {
        HttpRequest currentRolesRequest = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users/" + encode(userId) + "/role-mappings/realm")
                .GET()
                .build();
        List<Map<String, Object>> currentRoles = responseList(
                requireSuccess(send(currentRolesRequest, "Keycloak user roles could not be read"),
                        "Keycloak user roles could not be read"),
                "Keycloak user roles could not be read"
        );
        List<Map<String, Object>> obsoleteRoles = currentRoles.stream()
                .filter(role -> role.get("name") instanceof String name
                        && APPLICATION_ROLES.contains(name)
                        && !roleName.equals(name))
                .toList();
        if (!obsoleteRoles.isEmpty()) {
            HttpRequest removeRequest = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                            + "/users/" + encode(userId) + "/role-mappings/realm")
                    .header("Content-Type", "application/json")
                    .method("DELETE", json(obsoleteRoles))
                    .build();
            requireSuccess(send(removeRequest, "Obsolete Keycloak user roles could not be removed"),
                    "Obsolete Keycloak user roles could not be removed");
        }
        assignRealmRole(accessToken, userId, roleName);
    }

    private Map<String, Object> user(String accessToken, String userId) {
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users/" + encode(userId))
                .GET()
                .build();
        return responseMap(requireSuccess(send(request, "Keycloak user could not be read"),
                "Keycloak user could not be read"), "Keycloak user could not be read");
    }

    private String existingUserId(String accessToken, String email) {
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                        + "/users?email=" + encode(email) + "&exact=true")
                .GET()
                .build();
        List<Map<String, Object>> users = responseList(
                requireSuccess(send(request, "Keycloak user lookup failed"), "Keycloak user lookup failed"),
                "Keycloak user lookup failed"
        );
        if (users.isEmpty()) {
            return null;
        }
        Object id = users.getFirst().get("id");
        return id instanceof String value && StringUtils.hasText(value) ? value : null;
    }

    private String adminAccessToken() {
        String form = form(Map.of(
                "grant_type", "client_credentials",
                "client_id", properties.adminClientId(),
                "client_secret", properties.adminClientSecret()
        ));
        HttpRequest request = HttpRequest.newBuilder(uri("/realms/" + encode(properties.realm())
                        + "/protocol/openid-connect/token"))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();
        Map<String, Object> response = responseMap(
                requireSuccess(send(request, "Keycloak admin token could not be obtained"),
                        "Keycloak admin token could not be obtained"),
                "Keycloak admin token could not be obtained"
        );
        Object token = response.get("access_token");
        if (!(token instanceof String accessToken) || accessToken.isBlank()) {
            throw new ExternalIdentityException("Keycloak admin token response is invalid");
        }
        return accessToken;
    }

    private void registerRollbackCleanup(String userId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    deleteUserQuietly(userId);
                }
            }
        });
    }

    private void deleteUserQuietly(String userId) {
        try {
            String accessToken = adminAccessToken();
            HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + encode(properties.realm())
                            + "/users/" + encode(userId))
                    .DELETE()
                    .build();
            HttpResponse<String> response = send(request, "Keycloak user cleanup failed");
            if (response.statusCode() != 204 && response.statusCode() != 404) {
                log.warn("Keycloak rollback cleanup returned status {} for user {}", response.statusCode(), userId);
            }
        } catch (RuntimeException exception) {
            log.error("Keycloak user {} could not be removed after transaction rollback", userId, exception);
        }
    }

    private HttpRequest.Builder authorizedRequest(String accessToken, String path) {
        return HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + accessToken);
    }

    private HttpRequest.BodyPublisher json(Object payload) {
        try {
            return HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload));
        } catch (IOException exception) {
            throw new ExternalIdentityException("Keycloak payload could not be serialized", exception);
        }
    }

    private HttpResponse<String> send(HttpRequest request, String message) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException exception) {
            throw new ExternalIdentityException(message, exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ExternalIdentityException(message, exception);
        }
    }

    private HttpResponse<String> requireSuccess(HttpResponse<String> response, String message) {
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ExternalIdentityException(message + " (status " + response.statusCode() + ")");
        }
        return response;
    }

    private Map<String, Object> responseMap(HttpResponse<String> response, String message) {
        try {
            return objectMapper.readValue(response.body(), MAP_TYPE);
        } catch (IOException exception) {
            throw new ExternalIdentityException(message, exception);
        }
    }

    private List<Map<String, Object>> responseList(HttpResponse<String> response, String message) {
        try {
            return objectMapper.readValue(response.body(), LIST_TYPE);
        } catch (IOException exception) {
            throw new ExternalIdentityException(message, exception);
        }
    }

    private URI uri(String path) {
        return URI.create(properties.adminBaseUrl() + path);
    }

    private String form(Map<String, String> values) {
        return values.entrySet().stream()
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .reduce((left, right) -> left + "&" + right)
                .orElse("");
    }

    private String normalizeEmail(String email) {
        return required(email, "Email is required").trim().toLowerCase();
    }

    private String firstName(String displayName) {
        return displayName.trim().split("\\s+", 2)[0];
    }

    private String lastName(String displayName) {
        String[] parts = displayName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    private String required(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
