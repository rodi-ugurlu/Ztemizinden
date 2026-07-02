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
* **Security & Token Handling:** Spring OAuth2 Resource Server & Nimbus JWT (RSA/HMAC token signing)
* **Build System:** Maven (using `mvnw` Maven Wrapper)
* **Containerization:** Docker Compose for local infrastructure seeding (PostgreSQL and Keycloak-optional)

---

## 3. Local Environment Setup

### Prerequisites
* JDK 21 installed.
* Docker Desktop or Docker Engine running.

### Infrastructure Provisioning
To run the local database, execute the following command from the backend root:
```bash
docker compose up -d postgres
```
This spins up PostgreSQL on port `55432`.

### Running the Application
Run the boot application with internal JWT security enabled (default local development profile):
```bash
APP_SECURITY_ENABLED=true \
APP_JWT_SECRET=ZtemizindenLocalJwtSecretMustBeAtLeast32Chars! \
APP_JWT_ISSUER=ztemizinden \
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
| `APP_SECURITY_ENABLED` | Enable/disable JWT route security | `true` |
| `APP_JWT_SECRET` | Secret key for local HS256 JWT validation | `ZtemizindenLocalJwtSecretMustBeAtLeast32Chars!` |
| `APP_JWT_ISSUER` | Expected JWT issuer claim | `ztemizinden` |
| `APP_UPLOAD_DIR` | Root folder for media/document filesystem storage | `uploads` |
| `APP_DEMO_ENSURE_ACCOUNTS` | Seed demo accounts on application startup | `true` |
| `APP_DEMO_RESET_AND_SEED` | Reset DB and populate rich presentation demo data | `true` |
| `APP_KEYCLOAK_PROVISIONING_ENABLED` | Enable dynamic Keycloak synchronization | `false` |

---

## 5. Local Demo Accounts

When `APP_DEMO_ENSURE_ACCOUNTS` or `APP_DEMO_RESET_AND_SEED` is active, the database is auto-populated with the following user credentials for development testing:

| Email / Username | Password | Role | Entity Mapped | Details |
| --- | --- | --- | --- | --- |
| `customer@demo.com` | `demo123` | `CUSTOMER` | Customer (`cust-001`) | Ayşe Demir (Ztemizinden Demo Fabrika) |
| `service@demo.com` | `demo123` | `SERVICE` | Service Provider (`sp-001`) | Kadıköy-based qualified maintenance team |
| `admin@demo.com` | `demo123` | `ADMIN` | None | Operations Center administrator account |

> [!TIP]
> Flyway migrations create default internal credentials using Spring Security's `{noop}` delegating prefix (plaintext storage `demo123`), making local sign-in easy without requiring complex OAuth2 external setup.
