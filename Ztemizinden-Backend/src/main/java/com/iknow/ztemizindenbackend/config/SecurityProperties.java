package com.iknow.ztemizindenbackend.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(boolean enabled, List<String> allowedOriginPatterns) {
}
