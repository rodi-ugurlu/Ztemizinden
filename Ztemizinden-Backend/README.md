# Ztemizinden Backend

Spring Boot backend for the MVP1 maintenance workflow.

## Stack

- Java 21
- Spring Boot 4
- PostgreSQL
- Flyway
- Internal JWT auth with Spring OAuth2 Resource Server

## Local Infrastructure

```bash
docker compose up -d postgres
```

Services:

- PostgreSQL: `localhost:55432`

Keycloak service is still present in `docker-compose.yml` for reference, but the current MVP auth path does not depend on it.

Local internal JWT users:

- `customer@demo.com / demo123`
- `service@demo.com / demo123`
- `admin@demo.com / demo123`

## Run Backend

```bash
./mvnw spring-boot:run
```

Default local config enables API security:

```bash
APP_SECURITY_ENABLED=true
```

Flyway `V7__remove_demo_seed_content.sql` removes presentation seed tickets, assets, offers, provider documents, and extra demo providers. Local screens therefore start with clean user-created product data while keeping the demo account anchors for login.
Flyway `V10__internal_auth_users.sql` creates internal auth users for demo login and migrates existing customers/providers with temporary `demo123` passwords.

Run with internal JWT settings:

```bash
APP_SECURITY_ENABLED=true \
APP_JWT_SECRET=change-this-secret-to-a-long-random-value \
APP_JWT_ISSUER=ztemizinden \
./mvnw spring-boot:run
```

Customers receive the `CUSTOMER` role immediately. Service providers receive the `SERVICE` role so they can sign in and upload documents, but ticket opportunities and service jobs remain blocked until operations approves the provider record.

Temporarily disable security for debugging:

```bash
APP_SECURITY_ENABLED=false ./mvnw spring-boot:run
```

## Upload Storage

V1 stores ticket media and provider documents on the backend local filesystem.

```bash
APP_UPLOAD_DIR=uploads
```

Uploaded files are served from:

- `/uploads/ticket-media/...`
- `/uploads/provider-documents/...` (admin-only when API security is enabled)

## CORS

Localhost is allowed by default. For Vercel + ngrok beta runs:

```bash
APP_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://your-vercel-domain.vercel.app,https://*.ngrok-free.app,https://*.ngrok.app,https://*.ngrok.io
```

## MVP1 API Surface

- `POST /api/auth/login`
- `POST /api/assets`
- `GET /api/assets?ownerId=...`
- `POST /api/customers`
- `GET /api/customers/me`
- `POST /api/tickets`
- `GET /api/tickets?customerId=...`
- `POST /api/tickets/{ticketId}/offers`
- `POST /api/tickets/{ticketId}/offers/{offerId}/accept`
- `POST /api/tickets/{ticketId}/offers/{offerId}/reject`
- `POST /api/tickets/{ticketId}/cancel`
- `POST /api/tickets/{ticketId}/messages`
- `POST /api/tickets/{ticketId}/billing`
- `POST /api/tickets/{ticketId}/billing/approve`
- `POST /api/tickets/{ticketId}/billing/dispute`
- `POST /api/uploads/ticket-media`
- `POST /api/uploads/provider-documents`
- `POST /api/providers`
- `GET /api/providers/me`
- `POST /api/providers/{providerId}/approve`
- `POST /api/providers/{providerId}/reject`
- `POST /api/providers/{providerId}/verify`
- `PUT /api/providers/{providerId}/trusted`
- `POST /api/providers/{providerId}/documents/{documentId}/verify`
- `POST /api/providers/{providerId}/documents/{documentId}/reject`
- `GET /api/admin/dispatch/queue`
- `GET /api/admin/dispatch/tickets/{ticketId}/matches`
- `POST /api/admin/dispatch/tickets/{ticketId}/assign`

## Verify

```bash
./mvnw test
```
