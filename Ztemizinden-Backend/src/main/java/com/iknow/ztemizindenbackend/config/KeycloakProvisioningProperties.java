package com.iknow.ztemizindenbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.keycloak.provisioning")
public record KeycloakProvisioningProperties(
        boolean enabled,
        String baseUrl,
        String realm,
        String adminRealm,
        String adminClientId,
        String adminUsername,
        String adminPassword,
        String defaultPassword
) {
}
