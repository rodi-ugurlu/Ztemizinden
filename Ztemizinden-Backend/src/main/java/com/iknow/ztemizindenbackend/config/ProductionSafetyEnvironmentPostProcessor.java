package com.iknow.ztemizindenbackend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Profiles;

public final class ProductionSafetyEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        requireResolved(environment, "app.keycloak.issuer-uri", "KEYCLOAK_ISSUER_URI");
        requireResolved(environment, "app.keycloak.jwk-set-uri", "KEYCLOAK_JWK_SET_URI");

        if (!environment.acceptsProfiles(Profiles.of("prod"))) {
            return;
        }
        if (!environment.getProperty("app.security.enabled", Boolean.class, true)) {
            throw new IllegalStateException("Security cannot be disabled with the prod profile");
        }
        requireHttps(environment, "app.keycloak.issuer-uri", "KEYCLOAK_ISSUER_URI");
        requireHttps(environment, "app.keycloak.jwk-set-uri", "KEYCLOAK_JWK_SET_URI");
        requireHttps(environment, "app.keycloak.admin-base-url", "KEYCLOAK_ADMIN_BASE_URL");
        requireHttps(
                environment,
                "app.keycloak.password-reset-redirect-uri",
                "KEYCLOAK_PASSWORD_RESET_REDIRECT_URI"
        );
        String adminSecret = requireResolved(
                environment,
                "app.keycloak.admin-client-secret",
                "KEYCLOAK_ADMIN_CLIENT_SECRET"
        );
        if (KeycloakProperties.LOCAL_ADMIN_CLIENT_SECRET.equals(adminSecret) || adminSecret.length() < 32) {
            throw new IllegalStateException(
                    "KEYCLOAK_ADMIN_CLIENT_SECRET must be unique and at least 32 characters with the prod profile"
            );
        }
        if (environment.getProperty("app.demo-data.ensure-demo-accounts", Boolean.class, false)
                || environment.getProperty("app.demo-data.reset-and-seed", Boolean.class, false)) {
            throw new IllegalStateException("Demo account provisioning and reset/seed are forbidden with the prod profile");
        }
    }

    private String requireResolved(ConfigurableEnvironment environment, String propertyName, String environmentName) {
        String value = property(environment, propertyName);
        if (value == null || value.isBlank() || value.startsWith("${")) {
            throw new IllegalStateException(environmentName + " is required before the application can start");
        }
        return value;
    }

    private String property(ConfigurableEnvironment environment, String name) {
        try {
            return environment.getProperty(name);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private void requireHttps(ConfigurableEnvironment environment, String propertyName, String environmentName) {
        String value = requireResolved(environment, propertyName, environmentName);
        if (!value.startsWith("https://")) {
            throw new IllegalStateException(environmentName + " must use HTTPS with the prod profile");
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
