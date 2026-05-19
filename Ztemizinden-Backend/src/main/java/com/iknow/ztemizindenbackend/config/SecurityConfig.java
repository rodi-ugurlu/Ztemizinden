package com.iknow.ztemizindenbackend.config;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableConfigurationProperties({SecurityProperties.class, KeycloakProvisioningProperties.class})
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityProperties securityProperties) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(cors -> cors.configurationSource(corsConfigurationSource(securityProperties)));

        if (!securityProperties.enabled()) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/customers").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/providers").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/uploads/provider-documents/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/uploads/ticket-media/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/customers/me").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/customers").hasRole("ADMIN")
                .requestMatchers("/api/customers/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/providers/me").hasAnyRole("SERVICE", "ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/providers").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/uploads/ticket-media").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/uploads/provider-documents").hasAnyRole("SERVICE", "ADMIN")
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
    CorsConfigurationSource corsConfigurationSource(SecurityProperties securityProperties) {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> originPatterns = securityProperties.allowedOriginPatterns();
        if (originPatterns == null || originPatterns.isEmpty()) {
            originPatterns = List.of("http://localhost:*", "http://127.0.0.1:*");
        }
        originPatterns.forEach(configuration::addAllowedOriginPattern);
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }

    private static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
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
