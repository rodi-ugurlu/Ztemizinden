package com.iknow.ztemizindenbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

@Component
public class ProductionSafetyValidator {

    public ProductionSafetyValidator(
            SecurityProperties securityProperties,
            KeycloakProperties keycloakProperties,
            Environment environment,
            @Value("${app.demo-data.ensure-demo-accounts:false}") boolean ensureDemoAccounts,
            @Value("${app.demo-data.reset-and-seed:false}") boolean resetAndSeed
    ) {
        if (!environment.acceptsProfiles(Profiles.of("prod"))) {
            return;
        }
        if (!securityProperties.enabled()) {
            throw new IllegalStateException("Security cannot be disabled with the prod profile");
        }
        if (!keycloakProperties.issuerUri().startsWith("https://")) {
            throw new IllegalStateException("KEYCLOAK_ISSUER_URI must use HTTPS with the prod profile");
        }
        if (!keycloakProperties.jwkSetUri().startsWith("https://")) {
            throw new IllegalStateException("KEYCLOAK_JWK_SET_URI must use HTTPS with the prod profile");
        }
        if (!keycloakProperties.adminBaseUrl().startsWith("https://")) {
            throw new IllegalStateException("KEYCLOAK_ADMIN_BASE_URL must use HTTPS with the prod profile");
        }
        if (!keycloakProperties.passwordResetRedirectUri().startsWith("https://")) {
            throw new IllegalStateException(
                    "KEYCLOAK_PASSWORD_RESET_REDIRECT_URI must use HTTPS with the prod profile"
            );
        }
        if (KeycloakProperties.LOCAL_ADMIN_CLIENT_SECRET.equals(keycloakProperties.adminClientSecret())
                || keycloakProperties.adminClientSecret().length() < 32) {
            throw new IllegalStateException(
                    "KEYCLOAK_ADMIN_CLIENT_SECRET must be unique and at least 32 characters with the prod profile"
            );
        }
        if (ensureDemoAccounts || resetAndSeed) {
            throw new IllegalStateException("Demo account provisioning and reset/seed are forbidden with the prod profile");
        }
    }
}
