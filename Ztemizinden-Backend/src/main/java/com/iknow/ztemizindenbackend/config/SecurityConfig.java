package com.iknow.ztemizindenbackend.config;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableConfigurationProperties({SecurityProperties.class, KeycloakProperties.class})
public class SecurityConfig {
    private static final List<String> DEFAULT_ALLOWED_ORIGIN_PATTERNS = List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.vercel.app",
            "https://*.ngrok-free.app",
            "https://*.ngrok.app",
            "https://*.ngrok.io"
    );

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityProperties securityProperties) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(cors -> cors.configurationSource(corsConfigurationSource(securityProperties)));
        // Keycloak's silent SSO callback is loaded in a hidden same-origin iframe.
        // DENY prevents its postMessage callback from running and leaves auth initialization pending forever.
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        if (!securityProperties.enabled()) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                        HttpMethod.GET,
                        "/",
                        "/index.html",
                        "/favicon.ico",
                        "/favicon.png",
                        "/favicon.svg",
                        "/maintly-logo.webp",
                        "/silent-check-sso.html",
                        "/icons.svg",
                        "/assets/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/reset-password").permitAll()
                .requestMatchers(HttpMethod.GET, "/customer/**", "/service/**", "/admin/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/customers").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/providers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/public/landing").permitAll()
                .requestMatchers("/ws", "/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/provider-documents/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/uploads/ticket-media/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/profile-logos/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/customers/me").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/customers/me").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/customers").hasRole("ADMIN")
                .requestMatchers("/api/customers/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/providers/me").hasAnyRole("SERVICE", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/providers/me").hasAnyRole("SERVICE", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/providers/me/landing-visibility").hasAnyRole("SERVICE", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/providers").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/uploads/ticket-media").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/uploads/provider-documents").hasAnyRole("SERVICE", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/uploads/profile-logo").hasAnyRole("CUSTOMER", "SERVICE", "ADMIN")
                .requestMatchers("/api/providers/**").hasRole("ADMIN")
                .requestMatchers("/api/tickets/**").hasAnyRole("CUSTOMER", "SERVICE", "ADMIN")
                .requestMatchers("/api/assets/**").hasAnyRole("CUSTOMER", "ADMIN")
                .anyRequest().authenticated()
        );
        http.oauth2ResourceServer(resourceServer -> resourceServer.jwt(jwt ->
                jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
        ));

        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(KeycloakProperties keycloakProperties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(keycloakProperties.jwkSetUri()).build();
        OAuth2TokenValidator<Jwt> issuerValidator =
                JwtValidators.createDefaultWithIssuer(keycloakProperties.issuerUri());
        OAuth2TokenValidator<Jwt> audienceValidator = token -> token.getAudience().contains(keycloakProperties.audience())
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error(
                        "invalid_token",
                        "Required Keycloak audience is missing",
                        null
                ));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuerValidator, audienceValidator));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(SecurityProperties securityProperties) {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> originPatterns = securityProperties.allowedOriginPatterns();
        if (originPatterns == null || originPatterns.isEmpty()) {
            originPatterns = DEFAULT_ALLOWED_ORIGIN_PATTERNS;
        }
        originPatterns.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(pattern -> !pattern.isBlank())
                .forEach(configuration::addAllowedOriginPattern);
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new RealmRoleConverter());
        return converter;
    }

    private static class RealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            Object rolesClaim = realmAccess == null ? null : realmAccess.get("roles");
            Stream<String> realmRoles = rolesClaim instanceof Collection<?> roles
                    ? roles.stream().filter(String.class::isInstance).map(String.class::cast)
                    : Stream.empty();

            return realmRoles
                    .flatMap(role -> Stream.of(role, role.toUpperCase()))
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                    .distinct()
                    .map(SimpleGrantedAuthority::new)
                    .map(GrantedAuthority.class::cast)
                    .toList();
        }
    }
}
