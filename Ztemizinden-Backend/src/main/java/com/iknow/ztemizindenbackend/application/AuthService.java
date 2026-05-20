package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.application.JwtTokenService.TokenResult;
import com.iknow.ztemizindenbackend.domain.AuthUser;
import com.iknow.ztemizindenbackend.domain.AuthUserRepository;
import com.iknow.ztemizindenbackend.domain.Customer;
import com.iknow.ztemizindenbackend.domain.Enums.AuthRole;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Transactional
    public AuthUser createCustomerUser(Customer customer, String rawPassword) {
        return createUser(customer.getEmail(), rawPassword, AuthRole.CUSTOMER, customer.getId(), null);
    }

    @Transactional
    public AuthUser createServiceUser(ServiceProvider provider, String rawPassword) {
        return createUser(provider.getEmail(), rawPassword, AuthRole.SERVICE, null, provider.getId());
    }

    @Transactional
    public void enableUser(String email) {
        authUserRepository.findByEmailIgnoreCase(email).ifPresent(AuthUser::enable);
    }

    @Transactional
    public void disableUser(String email) {
        authUserRepository.findByEmailIgnoreCase(email).ifPresent(AuthUser::disable);
    }

    @Transactional(readOnly = true)
    public LoginResult login(String email, String password) {
        AuthUser user = authUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("E-posta veya şifre hatalı"));
        if (!user.isEnabled() || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("E-posta veya şifre hatalı");
        }

        TokenResult token = jwtTokenService.issue(user, displayName(user));
        return new LoginResult(token.token(), token.expiresInSeconds());
    }

    private AuthUser createUser(
            String email,
            String rawPassword,
            AuthRole role,
            String customerId,
            String providerId
    ) {
        if (authUserRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("Bu e-posta ile kayıtlı bir kullanıcı zaten var");
        }
        AuthUser user = new AuthUser(email, passwordEncoder.encode(rawPassword), role, customerId, providerId);
        return authUserRepository.save(user);
    }

    private String displayName(AuthUser user) {
        return switch (user.getRole()) {
            case CUSTOMER -> user.getEmail();
            case SERVICE -> user.getEmail();
            case ADMIN -> "Operasyon Merkezi";
        };
    }

    public record LoginResult(String accessToken, long expiresInSeconds) {
    }
}
