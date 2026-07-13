package com.iknow.ztemizindenbackend.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

class ProductionSafetyEnvironmentPostProcessorTest {
    private final ProductionSafetyEnvironmentPostProcessor processor =
            new ProductionSafetyEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication(Object.class);

    @Test
    void missingKeycloakEndpointsFailBeforeApplicationContextCreation() {
        assertThrows(
                IllegalStateException.class,
                () -> processor.postProcessEnvironment(new MockEnvironment(), application)
        );
    }

    @Test
    void validNonProductionKeycloakEndpointsAreAccepted() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("app.keycloak.issuer-uri", "http://localhost:8081/realms/ztemizinden")
                .withProperty("app.keycloak.jwk-set-uri", "http://localhost:8081/realms/ztemizinden/protocol/openid-connect/certs");

        assertDoesNotThrow(() -> processor.postProcessEnvironment(environment, application));
    }

    @Test
    void productionRejectsInsecureIssuerAndDevelopmentAdminSecret() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("app.keycloak.issuer-uri", "http://localhost:8081/realms/ztemizinden")
                .withProperty("app.keycloak.jwk-set-uri", "http://localhost:8081/realms/ztemizinden/protocol/openid-connect/certs")
                .withProperty("app.keycloak.admin-client-secret", KeycloakProperties.LOCAL_ADMIN_CLIENT_SECRET);
        environment.setActiveProfiles("prod");

        assertThrows(
                IllegalStateException.class,
                () -> processor.postProcessEnvironment(environment, application)
        );
    }

    @Test
    void validProductionKeycloakEndpointsAreAccepted() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("app.security.enabled", "true")
                .withProperty("app.keycloak.issuer-uri", "https://id.maintly.app/realms/ztemizinden")
                .withProperty("app.keycloak.jwk-set-uri", "https://id.maintly.app/realms/ztemizinden/protocol/openid-connect/certs")
                .withProperty("app.keycloak.admin-base-url", "https://id.maintly.app")
                .withProperty("app.keycloak.password-reset-redirect-uri", "https://maintly.app/customer/login")
                .withProperty("app.keycloak.admin-client-secret", "a-unique-production-secret-over-32-characters");
        environment.setActiveProfiles("prod");

        assertDoesNotThrow(() -> processor.postProcessEnvironment(environment, application));
    }
}
