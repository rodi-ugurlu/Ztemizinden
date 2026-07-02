package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.PasswordResetProperties;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PasswordResetMailer {
    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetMailer.class);
    private static final DateTimeFormatter EXPIRATION_FORMATTER = DateTimeFormatter
            .ofPattern("dd.MM.yyyy HH:mm")
            .withZone(ZoneId.of("Europe/Istanbul"));

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final PasswordResetProperties passwordResetProperties;

    public void sendResetLink(String email, String resetLink, Instant expiresAt) {
        if (Boolean.TRUE.equals(passwordResetProperties.logResetLink())) {
            LOGGER.info("Password reset link for {}: {}", email, resetLink);
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("JavaMailSender is not configured; password reset mail was not sent to {}", email);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(passwordResetProperties.mailFrom());
        message.setTo(email);
        message.setSubject("Maintly şifre sıfırlama bağlantınız");
        message.setText("""
                Merhaba,

                Maintly hesabınız için şifre sıfırlama talebi aldık.

                Yeni şifrenizi belirlemek için aşağıdaki bağlantıyı açın:
                %s

                Bu bağlantı %s tarihine kadar geçerlidir. Talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.

                Maintly Ekibi
                """.formatted(resetLink, EXPIRATION_FORMATTER.format(expiresAt)));

        try {
            mailSender.send(message);
        } catch (MailException exception) {
            LOGGER.warn("Password reset mail could not be sent to {}", email, exception);
        }
    }
}
