# Ztemizinden Backend Project Overview

Welcome to the **Ztemizinden Backend** context documentation. This document provides a high-level summary of the system, its architecture scope, technical stack, configuration parameters, and instructions for running the application locally.

---

## 1. System Objective & Scope

Ztemizinden is a specialized ticket-based marketplace for industrial and commercial equipment maintenance. The project backend manages the **MVP1 Maintenance Workflow**, facilitating:
* **Asset Tracking & Breakdown Structure:** Hierarchical asset tree management (e.g., Facility → SME → Home, including multi-level subcomponents).
* **Ticket Management:** Customers raise tickets detailing technical issues on specific assets.
* **Service Marketplace (Offers & Dispatch):** Service providers submit price/discovery offers, or operations (admin) dispatches tickets directly to matched/qualified service providers.
* **Negotiation & Real-Time Messaging:** Private chat channels for negotiation before accepting an offer, and ticket-level chat channels during execution.
* **Billing & Closure:** Service providers submit final costs, customers approve or dispute final billing, and the asset status updates dynamically.

---

## 2. Technical Stack

The Ztemizinden backend is built using modern enterprise Java technologies:
* **Core Language:** Java 21 (LTS)
* **Framework:** Spring Boot 4.0.6 (Spring WebMVC, Spring Security, Spring WebSocket)
* **Database:** PostgreSQL (production & local)
* **In-Memory/Testing Database:** H2 Database (configured for automated JUnit testing)
* **Database Migrations:** Flyway (schema configuration management)
* **Security & Token Handling:** Keycloak Authorization Code + PKCE and Spring OAuth2 Resource Server (RS256/JWK)
* **Build System:** Maven (using `mvnw` Maven Wrapper)
* **Containerization:** Docker Compose for PostgreSQL and Keycloak

---

## 3. Local Environment Setup

### Prerequisites
* JDK 21 installed.
* Docker Desktop or Docker Engine running.

### Infrastructure Provisioning
To run the local database and identity provider, execute the following command from the backend root:
```bash
docker compose up -d
```
This spins up PostgreSQL on port `55432` and Keycloak on port `8081`.

### Running the Application
Reconcile an existing local realm, then run the application:
```bash
cd ..
KEYCLOAK_IMPORT_DEMO_USERS=true npm run keycloak:reconcile
cd Ztemizinden-Backend
./mvnw spring-boot:run
```

To temporarily disable security check requirements for debugging API payloads:
```bash
APP_SECURITY_ENABLED=false ./mvnw spring-boot:run
```

---

## 4. Key Configuration Parameters

All system configurations reside in `src/main/resources/application.yml`. Key environment variables and defaults include:

| Environment Variable | Description | Default Value |
| --- | --- | --- |
| `DB_URL` | PostgreSQL Connection JDBC URL | `jdbc:postgresql://localhost:55432/ztemizinden` |
| `DB_USERNAME` | DB username | `ztemizinden` |
| `DB_PASSWORD` | DB password | `ztemizinden` |
| `APP_SECURITY_ENABLED` | Enable/disable resource-server route security | `true` |
| `KEYCLOAK_ISSUER_URI` | Exact accepted token issuer | `http://localhost:8081/realms/ztemizinden` |
| `KEYCLOAK_JWK_SET_URI` | Keycloak signing-key endpoint | Local realm certs endpoint |
| `KEYCLOAK_AUDIENCE` | Required API token audience | `ztemizinden-api` |
| `KEYCLOAK_ADMIN_CLIENT_SECRET` | Backend provisioning service-account secret | Local-only development secret |
| `KEYCLOAK_MIGRATE_LEGACY_USERS` | Run the idempotent one-time identity queue | `false` |
| `APP_UPLOAD_DIR` | Root folder for media/document filesystem storage | `uploads` |
| `APP_DEMO_ENSURE_ACCOUNTS` | Seed demo accounts on application startup outside production | `false` |
| `APP_DEMO_RESET_AND_SEED` | Reset DB and populate rich presentation demo data outside production | `false` |

---

## 5. Local Demo Accounts

The local realm can import these development-only identities:

| Email / Username | Password | Role | Entity Mapped | Details |
| --- | --- | --- | --- | --- |
| `customer@demo.com` | `Demo123!` | `CUSTOMER` | Resolved by subject/domain claim, then e-mail fallback | Customer portal |
| `service@demo.com` | `Demo123!` | `SERVICE` | Resolved by subject/domain claim, then e-mail fallback | Service portal |
| `admin@demo.com` | `Demo123!` | `ADMIN` | None | Operations portal |

> [!TIP]
> Demo passwords live only in the local Keycloak import. Production must not import demo users or reuse the local service-account secret.
