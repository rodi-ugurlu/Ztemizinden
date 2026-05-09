package com.iknow.ztemizindenbackend.config;

import java.nio.file.Path;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(UploadProperties.class)
class StaticResourceConfig implements WebMvcConfigurer {
    private final UploadProperties uploadProperties;

    StaticResourceConfig(UploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String rootDir = uploadProperties.rootDir() == null || uploadProperties.rootDir().isBlank()
                ? "uploads"
                : uploadProperties.rootDir();
        String location = Path.of(rootDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}
