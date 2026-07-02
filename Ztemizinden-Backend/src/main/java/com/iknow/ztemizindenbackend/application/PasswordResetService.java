package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.PasswordResetProperties;
import com.iknow.ztemizindenbackend.domain.AuthUser;
import com.iknow.ztemizindenbackend.domain.AuthUserRepository;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.PasswordResetToken;
import com.iknow.ztemizindenbackend.domain.PasswordResetTokenRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final int TOKEN_BYTE_LENGTH = 32;

    private final AuthUserRepository authUserRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetMailer passwordResetMailer;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetProperties passwordResetProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void requestReset(String email) {
        authUserRepository.findByEmailIgnoreCase(email.trim())
                .filter(AuthUser::isEnabled)
                .ifPresent(this::createAndSendResetToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        Instant now = Instant.now();
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashToken(token))
                .filter(candidate -> candidate.isUsable(now))
                .orElseThrow(() -> new BadRequestException("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş."));

        AuthUser authUser = resetToken.getAuthUser();
        authUser.changePasswordHash(passwordEncoder.encode(newPassword));
        passwordResetTokenRepository.findByAuthUserAndUsedAtIsNull(authUser)
                .forEach(candidate -> candidate.markUsed(now));
    }

    private void createAndSendResetToken(AuthUser authUser) {
        Instant now = Instant.now();
        passwordResetTokenRepository.findByAuthUserAndUsedAtIsNull(authUser)
                .forEach(token -> token.markUsed(now));

        String rawToken = generateToken();
        Instant expiresAt = now.plus(Duration.ofMinutes(passwordResetProperties.tokenExpirationMinutes()));
        passwordResetTokenRepository.save(new PasswordResetToken(authUser, hashToken(rawToken), expiresAt));
        passwordResetMailer.sendResetLink(authUser.getEmail(), resetLink(rawToken), expiresAt);
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String resetLink(String token) {
        return passwordResetProperties.frontendBaseUrl()
                + "/reset-password?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private String hashToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Token hash algorithm is not available", exception);
        }
    }
}
