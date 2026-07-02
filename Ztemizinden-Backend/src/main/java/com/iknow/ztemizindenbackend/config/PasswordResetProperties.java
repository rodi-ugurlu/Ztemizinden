package com.iknow.ztemizindenbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.password-reset")
public record PasswordResetProperties(
        String frontendBaseUrl,
        String mailFrom,
        long tokenExpirationMinutes,
        Boolean logResetLink
) {
    public PasswordResetProperties {
        if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
            frontendBaseUrl = "http://localhost:5173";
        }
        frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
        if (mailFrom == null || mailFrom.isBlank()) {
            mailFrom = "no-reply@maintly.app";
        }
        if (tokenExpirationMinutes <= 0) {
            tokenExpirationMinutes = 30;
        }
        if (logResetLink == null) {
            logResetLink = Boolean.FALSE;
        }
    }
}
