package com.iknow.ztemizindenbackend.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iknow.ztemizindenbackend.config.KeycloakProvisioningProperties;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class IdentityProvisioningService {
    private static final TypeReference<Map<String, Object>> MAP_OF_OBJECTS = new TypeReference<>() {
    };
    private static final TypeReference<List<Map<String, Object>>> LIST_OF_MAPS = new TypeReference<>() {
    };

    private final KeycloakProvisioningProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public IdentityProvisioningService(KeycloakProvisioningProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public void provisionCustomer(String email, String name, String password) {
        provisionUser(email, name, password, "CUSTOMER", true);
    }

    public void provisionServiceProvider(String email, String name, String password) {
        provisionUser(email, name, password, "SERVICE", true);
    }

    public void enableUser(String email) {
        setEnabled(email, true);
    }

    public void disableUser(String email) {
        setEnabled(email, false);
    }

    private void provisionUser(String email, String name, String password, String role, boolean enabled) {
        if (!properties.enabled()) {
            return;
        }

        String normalizedEmail = normalizeEmail(email);
        String accessToken = adminAccessToken();
        String userId = existingUserId(accessToken, normalizedEmail);
        boolean created = false;
        if (userId == null) {
            userId = createUser(accessToken, normalizedEmail, name, password, enabled);
            created = true;
        } else {
            setUserEnabled(accessToken, userId, enabled);
        }
        try {
            assignRealmRole(accessToken, userId, role);
        } catch (RuntimeException exception) {
            if (created) {
                deleteUserQuietly(accessToken, userId);
            }
            throw exception;
        }
    }

    private void setEnabled(String email, boolean enabled) {
        if (!properties.enabled()) {
            return;
        }

        String accessToken = adminAccessToken();
        String userId = existingUserId(accessToken, normalizeEmail(email));
        if (userId != null) {
            setUserEnabled(accessToken, userId, enabled);
        }
    }

    private String adminAccessToken() {
        String form = form(Map.of(
                "grant_type", "password",
                "client_id", value(properties.adminClientId(), "admin-cli"),
                "username", required(properties.adminUsername(), "Keycloak admin username is required"),
                "password", required(properties.adminPassword(), "Keycloak admin password is required")
        ));

        HttpRequest request = HttpRequest.newBuilder(uri("/realms/" + value(properties.adminRealm(), "master")
                        + "/protocol/openid-connect/token"))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        Map<String, Object> response = sendForMap(request, "Keycloak admin token could not be obtained");
        Object token = response.get("access_token");
        if (!(token instanceof String accessToken) || accessToken.isBlank()) {
            throw new IllegalStateException("Keycloak admin token response is invalid");
        }
        return accessToken;
    }

    private String existingUserId(String accessToken, String email) {
        String query = "?email=" + encode(email) + "&exact=true";
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + realm() + "/users" + query)
                .GET()
                .build();
        List<Map<String, Object>> users = sendForList(request, "Keycloak user lookup failed");
        if (users.isEmpty()) {
            return null;
        }
        Object id = users.getFirst().get("id");
        return id instanceof String value && StringUtils.hasText(value) ? value : null;
    }

    private String createUser(String accessToken, String email, String name, String password, boolean enabled) {
        String displayName = StringUtils.hasText(name) ? name.trim() : email;
        String resolvedPassword = StringUtils.hasText(password) ? password : value(properties.defaultPassword(), "demo123");
        Map<String, Object> payload = Map.of(
                "username", email,
                "email", email,
                "enabled", enabled,
                "emailVerified", true,
                "firstName", firstName(displayName),
                "lastName", lastName(displayName),
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", resolvedPassword,
                        "temporary", false
                ))
        );

        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + realm() + "/users")
                .header("Content-Type", "application/json")
                .POST(json(payload))
                .build();
        HttpResponse<String> response = send(request, "Keycloak user could not be created");
        if (response.statusCode() == 201) {
            return createdResourceId(response);
        }
        if (response.statusCode() == 409) {
            String existingId = existingUserId(accessToken, email);
            if (existingId != null) {
                return existingId;
            }
        }
        throw new IllegalStateException("Keycloak user could not be created");
    }

    private void assignRealmRole(String accessToken, String userId, String roleName) {
        Map<String, Object> role = realmRole(accessToken, roleName);
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + realm()
                        + "/users/" + encode(userId) + "/role-mappings/realm")
                .header("Content-Type", "application/json")
                .POST(json(List.of(role)))
                .build();
        sendNoContent(request, "Keycloak user role could not be assigned");
    }

    private void setUserEnabled(String accessToken, String userId, boolean enabled) {
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + realm()
                        + "/users/" + encode(userId))
                .header("Content-Type", "application/json")
                .PUT(json(Map.of("enabled", enabled)))
                .build();
        sendNoContent(request, "Keycloak user status could not be updated");
    }

    private void deleteUserQuietly(String accessToken, String userId) {
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + realm()
                        + "/users/" + encode(userId))
                .DELETE()
                .build();
        try {
            send(request, "Keycloak user cleanup failed");
        } catch (RuntimeException ignored) {
            // The original provisioning error is more useful to the caller.
        }
    }

    private Map<String, Object> realmRole(String accessToken, String roleName) {
        HttpRequest request = authorizedRequest(accessToken, "/admin/realms/" + realm()
                        + "/roles/" + encode(roleName))
                .GET()
                .build();
        return sendForMap(request, "Keycloak realm role not found: " + roleName);
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
            throw new IllegalStateException("Keycloak payload could not be serialized");
        }
    }

    private Map<String, Object> sendForMap(HttpRequest request, String message) {
        HttpResponse<String> response = send(request, message);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(message);
        }
        try {
            return objectMapper.readValue(response.body(), MAP_OF_OBJECTS);
        } catch (IOException exception) {
            throw new IllegalStateException(message);
        }
    }

    private List<Map<String, Object>> sendForList(HttpRequest request, String message) {
        HttpResponse<String> response = send(request, message);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(message);
        }
        try {
            return objectMapper.readValue(response.body(), LIST_OF_MAPS);
        } catch (IOException exception) {
            throw new IllegalStateException(message);
        }
    }

    private void sendNoContent(HttpRequest request, String message) {
        HttpResponse<String> response = send(request, message);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(message);
        }
    }

    private HttpResponse<String> send(HttpRequest request, String message) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException exception) {
            throw new IllegalStateException(message);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(message);
        }
    }

    private String createdResourceId(HttpResponse<String> response) {
        return response.headers().firstValue("Location")
                .map(location -> location.substring(location.lastIndexOf('/') + 1))
                .filter(StringUtils::hasText)
                .orElseThrow(() -> new IllegalStateException("Keycloak user creation response is missing Location"));
    }

    private URI uri(String path) {
        String baseUrl = value(properties.baseUrl(), "http://localhost:8081");
        return URI.create(baseUrl.replaceAll("/+$", "") + path);
    }

    private String realm() {
        return value(properties.realm(), "ztemizinden");
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
        String[] parts = displayName.trim().split("\\s+", 2);
        return parts[0];
    }

    private String lastName(String displayName) {
        String[] parts = displayName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    private String required(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
        return value;
    }

    private String value(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
