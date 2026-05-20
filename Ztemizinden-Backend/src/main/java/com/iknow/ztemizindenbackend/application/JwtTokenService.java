package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.SecurityProperties;
import com.iknow.ztemizindenbackend.domain.AuthUser;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtTokenService {
    private final JwtEncoder jwtEncoder;
    private final SecurityProperties securityProperties;

    public TokenResult issue(AuthUser user, String displayName) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofMinutes(securityProperties.jwtExpirationMinutes()));

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(securityProperties.jwtIssuer())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("name", displayName)
                .claim("realm_access", Map.of("roles", List.of(user.getRole().name())));

        if (user.getCustomerId() != null) {
            claims.claim("customerId", user.getCustomerId());
        }
        if (user.getProviderId() != null) {
            claims.claim("providerId", user.getProviderId());
        }

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
        return new TokenResult(token, securityProperties.jwtExpirationMinutes() * 60);
    }

    public record TokenResult(String token, long expiresInSeconds) {
    }
}
