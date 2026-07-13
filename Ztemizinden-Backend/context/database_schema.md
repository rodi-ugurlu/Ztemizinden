# Ztemizinden Database Schema Reference

This document maps out the database tables, indices, relations, and the evolution of the database structure managed via Flyway.

---

## 1. Relational Entity Relationship Diagram (ERD)

The database schema models a ticket-based marketplace bridging customers (and their equipment assets) with service providers:

```mermaid
erDiagram
    CUSTOMERS ||--o{ ASSETS : owns
    ASSETS ||--o{ TICKETS : targeted-by
    ASSETS ||--o{ ASSETS : sub-component
    CUSTOMERS ||--o{ TICKETS : creates
    TICKETS ||--o{ TICKET-OFFERS : receives
    TICKETS ||--o{ TICKET-CONVERSATIONS : hosts
    TICKETS ||--o{ TICKET-MESSAGES : logs
    TICKET-OFFERS ||--o|| TICKET-CONVERSATIONS : initiates
    TICKET-CONVERSATIONS ||--o{ TICKET-MESSAGES : contains
    SERVICE-PROVIDERS ||--o{ TICKET-OFFERS : submits
    SERVICE-PROVIDERS ||--o{ TICKET-CONVERSATIONS : negotiates
    SERVICE-PROVIDERS ||--o{ PROVIDER-DOCUMENTS : uploads
    AUTH-USERS ||--o| CUSTOMERS : links-to
    AUTH-USERS ||--o| SERVICE-PROVIDERS : links-to
```

---

## 2. Table Definitions & Database Schema

### `customers`
Stores registered customer accounts and profile data.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `name` VARCHAR(255) NOT NULL (Contact person name)
  * `email` VARCHAR(255) NOT NULL UNIQUE
  * `phone` VARCHAR(255) NOT NULL
  * `company_name` VARCHAR(255) NOT NULL
  * `city` VARCHAR(255) NOT NULL
  * `district` VARCHAR(255) NOT NULL
  * `status` VARCHAR(50) NOT NULL (`ACTIVE`, `SUSPENDED`)
  * `logo_url` VARCHAR(1000) (Optional path)
  * `address` VARCHAR(500) (Optional full address)
  * `tax_number` VARCHAR(100) (Optional)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `ux_customers_email_lower` UNIQUE (lower(email))

### `assets`
Represents equipment, machines, facilities, or home items. Implements hierarchical tree breakdown structure.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `owner_id` VARCHAR(255) NOT NULL (Maps to `customers.id`)
  * `name` VARCHAR(255) NOT NULL (Asset name)
  * `tag_no` VARCHAR(255) NOT NULL UNIQUE (Unique QR/Barcode inventory tracking number)
  * `type` VARCHAR(50) NOT NULL (`FACILITY`, `SME`, `HOME`)
  * `brand` VARCHAR(255) NOT NULL
  * `model` VARCHAR(255) NOT NULL
  * `serial_number` VARCHAR(255) NOT NULL
  * `purchase_date` DATE, `warranty_end_date` DATE
  * `status` VARCHAR(50) NOT NULL (`ACTIVE`, `UNDER_MAINTENANCE`, `INACTIVE`, `RETIRED`)
  * `location` VARCHAR(255), `department` VARCHAR(255), `description` VARCHAR(2000)
  * `parent_id` VARCHAR(255) REFERENCES `assets(id)` (Self-reference breakdown component hierarchy)
  * `depth` INTEGER NOT NULL DEFAULT 0 (Tree node depth, max 10)
  * `sort_order` INTEGER NOT NULL DEFAULT 0 (Order index among siblings)
  * `leaf` BOOLEAN NOT NULL DEFAULT TRUE (True if node has no children)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `idx_assets_owner` (owner_id)
  * `idx_assets_parent` (parent_id)
  * `idx_assets_owner_parent` (owner_id, parent_id)
  * `idx_assets_depth` (owner_id, depth)

### `service_providers`
Stores verified or pending contractor service businesses.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `name` VARCHAR(255) NOT NULL (Company name)
  * `contact_name` VARCHAR(255) NOT NULL
  * `email` VARCHAR(255) NOT NULL UNIQUE
  * `phone` VARCHAR(255) NOT NULL
  * `city` VARCHAR(255) NOT NULL
  * `district` VARCHAR(255) NOT NULL
  * `status` VARCHAR(50) NOT NULL (`PENDING_VERIFICATION`, `VERIFIED`, `SUSPENDED`)
  * `trusted` BOOLEAN NOT NULL DEFAULT FALSE
  * `rating` NUMERIC(3, 2) NOT NULL DEFAULT 0.00 (Customer rating aggregate)
  * `completed_jobs` INTEGER NOT NULL DEFAULT 0
  * `logo_url` VARCHAR(1000), `address` VARCHAR(500), `tax_number` VARCHAR(100)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `ux_service_providers_email_lower` UNIQUE (lower(email))

### `service_provider_specialties`
Join table mapping providers to technical ticket category specialties.
* **Fields:**
  * `provider_id` VARCHAR(255) NOT NULL REFERENCES `service_providers(id)` ON DELETE CASCADE
  * `specialty` VARCHAR(50) NOT NULL (`ELECTRIC`, `MECHANIC`, `PNEUMATIC`, `HYDRAULIC`, `GENERAL`, `SOFTWARE`)
  * PRIMARY KEY (`provider_id`, `specialty`)

### `service_provider_expertise_tags`
Join table storing provider technical skill tags (e.g. `vana`, `pompa`, `hvac`).
* **Fields:**
  * `provider_id` VARCHAR(255) NOT NULL REFERENCES `service_providers(id)` ON DELETE CASCADE
  * `tag` VARCHAR(120) NOT NULL (Lowercased Turkish normalized string)
  * PRIMARY KEY (`provider_id`, `tag`)
* **Indices:**
  * `idx_service_provider_expertise_tags_tag` (tag)

### `service_provider_coverage_districts`
Join table storing geographic coverage areas.
* **Fields:**
  * `provider_id` VARCHAR(255) NOT NULL REFERENCES `service_providers(id)` ON DELETE CASCADE
  * `district` VARCHAR(120) NOT NULL
  * PRIMARY KEY (`provider_id`, `district`)

### `provider_documents`
Verification documents uploaded by providers for onboarding.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `provider_id` VARCHAR(255) NOT NULL REFERENCES `service_providers(id)` ON DELETE CASCADE
  * `type` VARCHAR(255) NOT NULL (e.g. `Vergi Levhası`, `Ticaret Sicil Gazetesi`)
  * `url` VARCHAR(1000) NOT NULL (File path)
  * `original_file_name` VARCHAR(255) NOT NULL
  * `status` VARCHAR(50) NOT NULL (`PENDING`, `VERIFIED`, `REJECTED`)
  * `verified_date` TIMESTAMPTZ (Null until review)
  * `notes` VARCHAR(2000) (Admin reviewer feedback)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `idx_provider_documents_provider` (provider_id)

### `tickets`
Represents maintenance jobs. Copies customer location fields on creation for historical audit.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `customer_id` VARCHAR(255) NOT NULL (Maps to `customers.id`)
  * `customer_name` VARCHAR(255) NOT NULL, `customer_company` VARCHAR(255) NOT NULL, `customer_location` VARCHAR(255) NOT NULL
  * `customer_city` VARCHAR(255) NOT NULL, `customer_district` VARCHAR(255) NOT NULL, `customer_address` VARCHAR(500)
  * `asset_id` VARCHAR(255) NOT NULL REFERENCES `assets(id)`
  * `title` VARCHAR(255) NOT NULL
  * `description` VARCHAR(4000) NOT NULL
  * `category` VARCHAR(50) NOT NULL (`ELECTRIC`, `MECHANIC`, etc.)
  * `priority` VARCHAR(50) NOT NULL (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  * `status` VARCHAR(50) NOT NULL (`OPEN`, `OFFERED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED`)
  * `sla_target_minutes` INTEGER NOT NULL (Set by priority SLA target)
  * `assigned_provider_id` VARCHAR(255) (Assigned provider link)
  * `assigned_provider_name` VARCHAR(255)
  * `service_eta` VARCHAR(255) (ETA estimate from accepted offer)
  * `final_estimated_cost` NUMERIC(12, 2)
  * `final_actual_cost` NUMERIC(12, 2)
  * `final_billing_notes` VARCHAR(2000)
  * `billing_status` VARCHAR(50) (`AWAITING_CUSTOMER_APPROVAL`, `APPROVED`, `DISPUTED`)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `idx_tickets_customer` (customer_id)
  * `idx_tickets_status_created` (status, created_at)

### `ticket_media_urls`
Images or videos uploaded as ticket failure evidence.
* **Fields:**
  * `ticket_id` VARCHAR(255) NOT NULL REFERENCES `tickets(id)` ON DELETE CASCADE
  * `media_url` VARCHAR(1000) NOT NULL
* **Indices:**
  * `idx_ticket_media_urls_ticket` (ticket_id)

### `ticket_offers`
Offers submitted by providers on tickets.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `ticket_id` VARCHAR(255) NOT NULL REFERENCES `tickets(id)` ON DELETE CASCADE
  * `provider_id` VARCHAR(255) NOT NULL (Maps to `service_providers.id`)
  * `provider_name` VARCHAR(255) NOT NULL
  * `type` VARCHAR(50) NOT NULL (`DISCOVERY`, `FIXED_PRICE`)
  * `estimated_cost` NUMERIC(12, 2) NOT NULL
  * `eta` VARCHAR(255) NOT NULL
  * `message` VARCHAR(2000) NOT NULL
  * `status` VARCHAR(50) NOT NULL (`PENDING`, `INVITED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `idx_ticket_offers_ticket` (ticket_id)

### `ticket_conversations`
Pre-offer negotiation chat sessions.
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `ticket_id` VARCHAR(255) NOT NULL REFERENCES `tickets(id)` ON DELETE CASCADE
  * `offer_id` VARCHAR(255) NOT NULL REFERENCES `ticket_offers(id)` ON DELETE CASCADE
  * `provider_id` VARCHAR(255) NOT NULL
  * `provider_name` VARCHAR(255) NOT NULL
  * `status` VARCHAR(50) NOT NULL (`ACTIVE`, `ACCEPTED`, `CLOSED`)
  * `closed_reason` VARCHAR(50) (`REJECTED`, `NOT_SELECTED`)
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `idx_ticket_conversations_ticket` (ticket_id)
  * `idx_ticket_conversations_provider` (provider_id)
  * `uq_ticket_conversations_active_provider` UNIQUE (ticket_id, provider_id) WHERE status IN ('ACTIVE', 'ACCEPTED') (Enforces single active conversation constraint per provider + ticket)

### `ticket_messages`
Messages inside chats (negotiations or active jobs).
* **Fields:**
  * `id` VARCHAR(255) PRIMARY KEY
  * `ticket_id` VARCHAR(255) NOT NULL REFERENCES `tickets(id)` ON DELETE CASCADE
  * `conversation_id` VARCHAR(255) REFERENCES `ticket_conversations(id)` ON DELETE CASCADE (Null for post-acceptance ticket chat)
  * `sender_role` VARCHAR(50) NOT NULL (`customer`, `service`, `system`)
  * `sender_name` VARCHAR(255) NOT NULL
  * `body` VARCHAR(2000) NOT NULL
  * `read_by_customer` BOOLEAN NOT NULL DEFAULT FALSE
  * `read_by_service` BOOLEAN NOT NULL DEFAULT FALSE
  * `created_at` TIMESTAMPTZ NOT NULL, `updated_at` TIMESTAMPTZ NOT NULL
* **Indices:**
  * `idx_ticket_messages_conversation` (conversation_id)

### `keycloak_identity_migration_queue`
One-time, non-secret rollout queue created by V22.
* **Fields:**
  * `legacy_auth_user_id` VARCHAR(255) PRIMARY KEY
  * `email` VARCHAR(255) NOT NULL UNIQUE
  * `role` VARCHAR(50) NOT NULL (`CUSTOMER`, `SERVICE`, `ADMIN`)
  * `enabled` BOOLEAN NOT NULL
  * `customer_id`, `provider_id`, `identity_subject` VARCHAR(255)
  * `completed_at` TIMESTAMPTZ, `attempt_count` INTEGER, `last_error` VARCHAR(2000)
* **Security:** No legacy password hash is copied. Migrated identities must set a Keycloak password.

`customers.identity_subject` and `service_providers.identity_subject` are nullable, unique references to the immutable Keycloak user `sub`.

---

## 3. Flyway Database Migrations Evolution

The schema has been incrementally evolved using the following migration scripts under `src/main/resources/db/migration/`:

* **`V1__init_mvp1_schema.sql`**
  * Core table structures: `assets`, `tickets`, `ticket_offers`, `service_providers`, and `service_provider_specialties`. Sets up initial indices.
* **`V2__demo_seed_and_messages.sql` to `V5__service_portal_seed.sql`**
  * Seeding operational simulation data for demonstration runs.
* **`V6__v1_uploads_and_provider_documents.sql`**
  * Creates `ticket_media_urls` and `provider_documents` tables. Adds index linkages.
* **`V7__remove_demo_seed_content.sql`**
  * Removes preset seed data (tickets, offers, documents) to clean up application start screen for new user actions, keeping demo user logins intact.
* **`V8__asset_hierarchy.sql`**
  * Integrates breakdown hierarchy tree support on `assets` table. Adds self-referencing relationship fields: `parent_id`, `depth`, `sort_order`, and `leaf`.
* **`V9__customers_and_registration_hardening.sql`**
  * Splits customer data out to a separate `customers` registry table. Adds unique lower-case e-mail indices to block duplicates.
* **`V10__internal_auth_users.sql`**
  * Historical migration that introduced local auth; its runtime table is removed by V22.
* **`V11__provider_expertise_tags.sql`**
  * Adds `service_provider_expertise_tags` mapping table and seeds expertise categories for matching tests.
* **`V12__profile_kunye_fields.sql`**
  * Adds profile custom parameters: `logo_url`, `address`, and `tax_number` columns to both `customers` and `service_providers`.
* **`V13__district_location_model.sql`**
  * Adds `district` fields for customers, providers. Creates `service_provider_coverage_districts` table. Registers granular coordinates columns to `tickets` (`customer_city`, `customer_district`, `customer_address`).
* **`V14__ticket_message_read_status.sql`**
  * Adds read confirmation tracking (`read_by_customer`, `read_by_service`) fields on `ticket_messages`.
* **`V15__private_offer_conversations.sql`**
  * Generates `ticket_conversations` to isolate pre-acceptance messages from main ticket dashboard. Adds unique constraints on ticket+provider conversations.
* **`V16__relax_conversation_provider_uniqueness.sql`**
  * Relaxes unique limits to allow multiple sequential negotiation chats between a customer and provider on the same ticket. Creates partial unique index `uq_ticket_conversations_active_provider` targeting only `ACTIVE` and `ACCEPTED` status lines.
* **`V22__replace_local_auth_with_keycloak.sql`**
  * Adds unique `identity_subject` links, copies only non-secret legacy identity metadata into the migration queue, and removes `auth_users` plus local password reset tokens.
