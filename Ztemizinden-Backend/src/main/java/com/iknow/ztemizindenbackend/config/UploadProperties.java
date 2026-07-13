package com.iknow.ztemizindenbackend.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.upload")
public record UploadProperties(String rootDir, Duration orphanGracePeriod) {
    public Duration effectiveOrphanGracePeriod() {
        return orphanGracePeriod == null ? Duration.ofHours(24) : orphanGracePeriod;
    }
}
