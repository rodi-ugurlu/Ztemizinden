# Ztemizinden Backend

Spring Boot backend for the Maintly maintenance workflow.

## Stack

- Java 21 / Spring Boot 4
- PostgreSQL / Flyway
- Keycloak 26.2.4
- Spring OAuth2 Resource Server with issuer, JWK and audience validation

Keycloak is the only authentication, password and token authority. The backend does not expose a login/token endpoint and does not store user passwords.

## Local Run

From this directory:

```bash
docker compose up -d
cd ..
KEYCLOAK_IMPORT_DEMO_USERS=true npm run keycloak:reconcile
cd Ztemizinden-Backend
./mvnw spring-boot:run
```

Services:

- PostgreSQL: `localhost:55432`
- Keycloak: `http://localhost:8081`
- Backend: `http://localhost:8080`

Local demo identities are imported into Keycloak only:

- `customer@demo.com / Demo123!`
- `service@demo.com / Demo123!`
- `admin@demo.com / Demo123!`

The realm import is used for an empty Keycloak database. For an existing realm, `npm run keycloak:reconcile` updates realm settings, roles, clients, PKCE/audience mappers and service-account privileges without deleting the realm.

For production reconciliation, provide the external app URL and Keycloak admin credentials only for that one-time command:

```bash
KEYCLOAK_ADMIN_BASE_URL=https://auth.example.com \
KEYCLOAK_ADMIN_USERNAME=<keycloak-admin> \
KEYCLOAK_ADMIN_PASSWORD=<keycloak-admin-password> \
KEYCLOAK_ADMIN_CLIENT_SECRET=<backend-service-account-secret> \
KEYCLOAK_WEB_URL=https://app.example.com \
npm run keycloak:reconcile
```

`KEYCLOAK_WEB_URL` replaces local redirect URIs, web origins and post-logout redirects. Do not set `KEYCLOAK_IMPORT_DEMO_USERS=true` in production.

## Authentication Flow

- Browser: Keycloak Authorization Code flow with PKCE S256.
- API: RS256 bearer token validated against Keycloak JWKs.
- Required API audience: `ztemizinden-api`.
- Roles: Keycloak realm roles `CUSTOMER`, `SERVICE`, `ADMIN`.
- Registration: backend creates the domain row, provisions the Keycloak user with the backend service account, and compensates the Keycloak user if the DB transaction rolls back.
- Provider approval/rejection enables or disables the matching Keycloak identity.
- Password reset: backend requests Keycloak's `UPDATE_PASSWORD` action email. SMTP must be configured in the Keycloak realm.

Local defaults are in `application.yml`. Production must provide at least:

```bash
SPRING_PROFILES_ACTIVE=prod
KEYCLOAK_ISSUER_URI=https://auth.example.com/realms/ztemizinden
KEYCLOAK_JWK_SET_URI=https://auth.example.com/realms/ztemizinden/protocol/openid-connect/certs
KEYCLOAK_ADMIN_BASE_URL=https://auth.example.com
KEYCLOAK_ADMIN_CLIENT_SECRET=<unique-secret>
KEYCLOAK_PASSWORD_RESET_REDIRECT_URI=https://app.example.com/customer/login
```

The production profile refuses HTTP issuers, the local service-account secret, disabled API security and demo data flags.

## Existing User Rollout

Flyway V22 removes the obsolete local auth tables and deliberately does not copy password hashes. It copies only e-mail, role and domain links into `keycloak_identity_migration_queue`.

For the first rollout, configure Keycloak SMTP and start one application instance with:

```bash
KEYCLOAK_MIGRATE_LEGACY_USERS=true ./mvnw spring-boot:run
```

The runner is idempotent: it provisions or updates Keycloak identities, links `identity_subject`, assigns realm roles and sends enabled users a Keycloak password-setup email. Failed rows retain `last_error` and can be retried. Disable the flag after every queue row has `completed_at`.

## Debug Security Bypass

Only for local payload debugging:

```bash
APP_SECURITY_ENABLED=false ./mvnw spring-boot:run
```

This is rejected by the `prod` profile.

## Upload Storage

```bash
APP_UPLOAD_DIR=uploads
```

Uploaded files are served from `/uploads/...`; provider documents require `ADMIN` when security is enabled. Orphan upload cleanup runs on the configured schedule after a grace period.

## Build and Verify

```bash
./mvnw test
./mvnw package
cd ..
npm run build
npm run keycloak:verify
```

`npm run keycloak:verify` is a local E2E check. It temporarily enables direct grants, verifies CUSTOMER/SERVICE/ADMIN claims and protected API calls, checks missing/wrong-audience tokens return 401, and restores the client setting in `finally`.

For a fullstack jar from the repository root:

```bash
npm run build:jar
```
