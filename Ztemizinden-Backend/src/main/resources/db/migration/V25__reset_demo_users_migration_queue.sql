UPDATE keycloak_identity_migration_queue
SET completed_at = NULL,
    attempt_count = 0,
    last_error = NULL
WHERE email LIKE '%@demo.com';
