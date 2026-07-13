package com.iknow.ztemizindenbackend.application;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.keycloak.migrate-legacy-users", havingValue = "true")
public class LegacyIdentityMigrationRunner implements ApplicationRunner {
    private static final int MAX_ERROR_LENGTH = 2_000;

    private final JdbcTemplate jdbcTemplate;
    private final KeycloakIdentityService keycloakIdentityService;

    @Override
    public void run(ApplicationArguments args) {
        List<LegacyIdentity> pending = jdbcTemplate.query("""
                select legacy_auth_user_id, email, role, enabled, customer_id, provider_id
                from keycloak_identity_migration_queue
                where completed_at is null
                order by created_at, legacy_auth_user_id
                """, LegacyIdentityMigrationRunner::identity);

        int migrated = 0;
        int failed = 0;
        for (LegacyIdentity identity : pending) {
            try {
                migrate(identity);
                migrated++;
            } catch (RuntimeException exception) {
                failed++;
                recordFailure(identity.id(), exception);
                log.error("Legacy identity migration failed for {}", identity.email(), exception);
            }
        }
        log.info("Legacy Keycloak identity migration completed: {} migrated, {} failed", migrated, failed);
    }

    private void migrate(LegacyIdentity identity) {
        String attributeName = switch (identity.role()) {
            case "CUSTOMER" -> "customerId";
            case "SERVICE" -> "providerId";
            case "ADMIN" -> null;
            default -> throw new IllegalStateException("Unsupported legacy identity role: " + identity.role());
        };
        String domainId = "CUSTOMER".equals(identity.role()) ? identity.customerId() : identity.providerId();
        String subject = keycloakIdentityService.provisionMigratedIdentity(
                identity.email(),
                identity.email(),
                identity.role(),
                identity.enabled(),
                attributeName,
                domainId
        );

        if (identity.customerId() != null) {
            linkCustomer(identity.customerId(), subject);
        }
        if (identity.providerId() != null) {
            linkProvider(identity.providerId(), subject);
        }
        if (identity.enabled()) {
            keycloakIdentityService.requestPasswordReset(identity.email());
        }
        jdbcTemplate.update("""
                update keycloak_identity_migration_queue
                set identity_subject = ?, completed_at = ?, attempt_count = attempt_count + 1, last_error = null
                where legacy_auth_user_id = ?
                """, subject, Timestamp.from(Instant.now()), identity.id());
    }

    private void linkCustomer(String customerId, String subject) {
        int updated = jdbcTemplate.update("""
                update customers set identity_subject = ?
                where id = ? and (identity_subject is null or identity_subject = ?)
                """, subject, customerId, subject);
        if (updated != 1) {
            throw new IllegalStateException("Customer identity could not be linked: " + customerId);
        }
    }

    private void linkProvider(String providerId, String subject) {
        int updated = jdbcTemplate.update("""
                update service_providers set identity_subject = ?
                where id = ? and (identity_subject is null or identity_subject = ?)
                """, subject, providerId, subject);
        if (updated != 1) {
            throw new IllegalStateException("Provider identity could not be linked: " + providerId);
        }
    }

    private void recordFailure(String id, RuntimeException exception) {
        String message = exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage();
        jdbcTemplate.update("""
                update keycloak_identity_migration_queue
                set attempt_count = attempt_count + 1, last_error = ?
                where legacy_auth_user_id = ?
                """, message.substring(0, Math.min(message.length(), MAX_ERROR_LENGTH)), id);
    }

    private static LegacyIdentity identity(ResultSet resultSet, int rowNumber) throws SQLException {
        return new LegacyIdentity(
                resultSet.getString("legacy_auth_user_id"),
                resultSet.getString("email"),
                resultSet.getString("role"),
                resultSet.getBoolean("enabled"),
                resultSet.getString("customer_id"),
                resultSet.getString("provider_id")
        );
    }

    private record LegacyIdentity(
            String id,
            String email,
            String role,
            boolean enabled,
            String customerId,
            String providerId
    ) {
    }
}
