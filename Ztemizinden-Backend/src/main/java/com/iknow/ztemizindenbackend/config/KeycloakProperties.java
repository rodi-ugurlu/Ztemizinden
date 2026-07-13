package com.iknow.ztemizindenbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.keycloak")
public record KeycloakProperties(
        String issuerUri,
        String jwkSetUri,
        String audience,
        String realm,
        String webClientId,
        String adminBaseUrl,
        String adminClientId,
        String adminClientSecret,
        String passwordResetRedirectUri,
        int passwordResetLifespanSeconds
) {
    public static final String LOCAL_ADMIN_CLIENT_SECRET = "ztemizinden-local-admin-secret-change-me";

    public KeycloakProperties {
        issuerUri = value(issuerUri, "http://localhost:8081/realms/ztemizinden");
        jwkSetUri = value(jwkSetUri, issuerUri + "/protocol/openid-connect/certs");
        audience = value(audience, "ztemizinden-api");
        realm = value(realm, "ztemizinden");
        webClientId = value(webClientId, "ztemizinden-web");
        adminBaseUrl = value(adminBaseUrl, "http://localhost:8081");
        adminClientId = value(adminClientId, "ztemizinden-backend-admin");
        adminClientSecret = value(adminClientSecret, LOCAL_ADMIN_CLIENT_SECRET);
        passwordResetRedirectUri = value(passwordResetRedirectUri, "http://localhost:5173/customer/login");
        if (passwordResetLifespanSeconds <= 0) {
            passwordResetLifespanSeconds = 900;
        }
    }

    private static String value(String candidate, String fallback) {
        return StringUtils.hasText(candidate) ? candidate.trim().replaceAll("/+$", "") : fallback;
    }
}
