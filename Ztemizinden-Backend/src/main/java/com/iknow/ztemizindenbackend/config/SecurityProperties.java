package com.iknow.ztemizindenbackend.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(
        boolean enabled,
        List<String> allowedOriginPatterns,
        String jwtSecret,
        String jwtIssuer,
        long jwtExpirationMinutes
) {
    public SecurityProperties {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            jwtSecret = "ZtemizindenLocalJwtSecretMustBeAtLeast32Chars!";
        }
        if (jwtIssuer == null || jwtIssuer.isBlank()) {
            jwtIssuer = "ztemizinden";
        }
        if (jwtExpirationMinutes <= 0) {
            jwtExpirationMinutes = 480;
        }
    }
}
