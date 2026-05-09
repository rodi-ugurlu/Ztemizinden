# Ztemizinden Backend

Spring Boot backend for the MVP1 maintenance workflow.

## Stack

- Java 21
- Spring Boot 4
- PostgreSQL
- Flyway
- Keycloak-ready OAuth2 Resource Server

## Local Infrastructure

```bash
docker compose up -d
```

Services:

- PostgreSQL: `localhost:55432`
- Keycloak: `http://localhost:8081`
- Keycloak admin: `admin / admin`

Imported realm:

- Realm: `ztemizinden`
- Frontend client: `ztemizinden-frontend`
- Backend bearer client: `ztemizinden-backend`

Local Keycloak users:

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

Flyway `V7__remove_demo_seed_content.sql` removes presentation seed tickets, assets, offers, provider documents, and extra demo providers. Local screens therefore start with clean user-created product data while keeping the Keycloak demo accounts for login.

Run with Keycloak JWT checks:

```bash
APP_SECURITY_ENABLED=true \
KEYCLOAK_ISSUER_URI=http://localhost:8081/realms/ztemizinden \
./mvnw spring-boot:run
```

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
- `/uploads/provider-documents/...`

## CORS

Localhost is allowed by default. For Vercel + ngrok beta runs:

```bash
APP_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://your-vercel-domain.vercel.app,https://*.ngrok-free.app
```

## MVP1 API Surface

- `POST /api/assets`
- `GET /api/assets?ownerId=...`
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
