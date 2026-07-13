package com.iknow.ztemizindenbackend.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class ProductionSafetyValidatorTest {

    @Test
    void prodRejectsLocalKeycloakConfiguration() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        SecurityProperties properties = new SecurityProperties(true, List.of());
        KeycloakProperties keycloakProperties = keycloakProperties(
                "http://localhost:8081/realms/ztemizinden",
                KeycloakProperties.LOCAL_ADMIN_CLIENT_SECRET
        );

        assertThrows(
                IllegalStateException.class,
                () -> new ProductionSafetyValidator(properties, keycloakProperties, environment, false, false)
        );
    }

    @Test
    void prodRejectsDemoProvisioningAndAllowsSecureConfiguration() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        SecurityProperties properties = new SecurityProperties(true, List.of());
        KeycloakProperties keycloakProperties = keycloakProperties(
                "https://id.maintly.app/realms/ztemizinden",
                "unique-production-keycloak-admin-secret"
        );

        assertThrows(
                IllegalStateException.class,
                () -> new ProductionSafetyValidator(properties, keycloakProperties, environment, true, false)
        );
        assertDoesNotThrow(() -> new ProductionSafetyValidator(
                properties, keycloakProperties, environment, false, false));
    }

    @Test
    void prodRejectsDisabledSecurity() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        assertThrows(
                IllegalStateException.class,
                () -> new ProductionSafetyValidator(
                        new SecurityProperties(false, List.of()),
                        keycloakProperties("https://id.maintly.app/realms/ztemizinden", "secure-secret"),
                        environment,
                        false,
                        false
                )
        );
    }

    private KeycloakProperties keycloakProperties(String issuer, String adminSecret) {
        return new KeycloakProperties(
                issuer,
                issuer + "/protocol/openid-connect/certs",
                "ztemizinden-api",
                "ztemizinden",
                "ztemizinden-web",
                "https://id.maintly.app",
                "ztemizinden-backend-admin",
                adminSecret,
                "https://maintly.app/customer/login",
                900
        );
    }
}
