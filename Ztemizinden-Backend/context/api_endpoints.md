# Ztemizinden API Endpoints Reference

This document provides a comprehensive list of REST API endpoints and WebSocket channels, detailing access control constraints, request bodies, and response structures.

---

## 1. Authentication

### Log In
There is no backend login/token endpoint. The frontend custom login forms request tokens directly from Keycloak's OpenID Connect token endpoint using the `ztemizinden-web` client. API requests carry the resulting access token as `Authorization: Bearer ...`.

### Request Password Reset
* **Path:** `POST /api/auth/forgot-password`
* **Access:** Public (rate limited)
* **Body:** `{ "email": "customer@example.com" }`
* **Behavior:** Requests a Keycloak `UPDATE_PASSWORD` action e-mail and always returns the same generic message for registered and unregistered addresses.

---

## 2. Customer Registration & Profile

### Create Customer (Register)
* **Path:** `POST /api/customers`
* **Access:** Public (Unauthenticated)
* **Request Body (`CreateCustomerRequest`):**
  ```json
  {
    "name": "Ayşe Demir",
    "email": "ayse@company.com",
    "phone": "+905320000000",
    "companyName": "Demir A.Ş.",
    "city": "İstanbul",
    "district": "Kadıköy",
    "password": "SecurePassword123"
  }
  ```

### Get My Profile
* **Path:** `GET /api/customers/me`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Update My Profile
* **Path:** `PUT /api/customers/me`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body (`UpdateCustomerProfileRequest`):**
  ```json
  {
    "name": "Ayşe Demir",
    "companyName": "Demir Endüstri",
    "phone": "+905321111111",
    "city": "İstanbul",
    "district": "Kadıköy",
    "address": "Kadıköy OSB 3. Cadde No: 5",
    "taxNumber": "1112223334",
    "logoUrl": "/uploads/profile-logos/logo-uuid.png"
  }
  ```

---

## 3. Service Provider Registration & Approval

### Register Provider with Onboarding Documents
* **Path:** `POST /api/providers`
* **Access:** Public (Unauthenticated)
* **Content-Type:** `multipart/form-data`
* **Multipart Parameters:**
  * `request` (Application JSON payload containing company info - see below)
  * `taxCertificate` (Optional File)
  * `insurance` (Optional File)
  * `technicalLicense` (Optional File)
  * `isoCertificate` (Optional File)
  * *Constraint:* At least one of these documents must be supplied during registration.
* **JSON Request (`CreateProviderRequest`):**
  ```json
  {
    "name": "Tetik Mekanik Ltd",
    "contactName": "Hakan Tetik",
    "email": "hakan@tetik.com",
    "phone": "+905420000000",
    "city": "İstanbul",
    "district": "Üsküdar",
    "specialties": ["MECHANIC", "HYDRAULIC"],
    "expertiseTags": ["pompa", "motor", "hidrofor"],
    "coverageDistricts": ["Ataşehir", "Kadıköy", "Maltepe", "Ümraniye", "Üsküdar"],
    "password": "ProviderPassword123"
  }
  ```

### Get My Provider Profile
* **Path:** `GET /api/providers/me`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`

### Update My Provider Profile
* **Path:** `PUT /api/providers/me`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`

---

## 4. Asset Hierarchy (ABS Tree)

### Flat Asset List (Legacy)
* **Path:** `GET /api/assets?ownerId={customerId}`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Nested Tree Breakdown Structure
* **Path:** `GET /api/assets/tree?ownerId={customerId}`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Response:** Returns list of top-level asset nodes containing nested `children` arrays.

### Create Asset (Supports hierarchy)
* **Path:** `POST /api/assets`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body (`CreateAssetRequest`):**
  ```json
  {
    "ownerId": "cust-001",
    "name": "Kompresör Motoru A",
    "tagNo": "INV-MTR-091",
    "type": "FACILITY",
    "brand": "Siemens",
    "model": "1LA7083",
    "serialNumber": "SN-9817293",
    "purchaseDate": "2024-01-10",
    "warrantyEndDate": "2026-01-10",
    "location": "A Blok Motor Odası",
    "department": "Üretim",
    "description": "Vidalı kompresör tahrik motoru",
    "parentId": "asset-parent-uuid" 
  }
  ```
  * Note: `parentId` is optional. If null, it is placed at root.

### Move Asset Hierarchy Node
* **Path:** `PUT /api/assets/{id}/move`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body:** `{ "newParentId": "target-parent-uuid" }` (Can be null to move to root)

### Reorder Child Assets
* **Path:** `PUT /api/assets/{id}/reorder`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body:** `{ "orderedChildIds": ["child-id-1", "child-id-2"] }`

### Delete Asset
* **Path:** `DELETE /api/assets/{id}`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Behavior:** Deletes the node and recursively deletes all descendants.

### Get Ancestors Breadcrumbs
* **Path:** `GET /api/assets/{id}/ancestors`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

---

## 5. Maintenance Tickets API

### List Tickets
* **Path:** `GET /api/tickets?customerId={customerId}`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### List Opportunities (Open Marketplace)
* **Path:** `GET /api/tickets/opportunities?providerId={providerId}`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`
* **Filtering:** Returns only `OPEN` or `OFFERED` tickets matching the provider's specialties.

### List Assigned Jobs
* **Path:** `GET /api/tickets/provider?providerId={providerId}`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`
* **Filtering:** Returns tickets explicitly assigned to this provider.

### Get Ticket Details
* **Path:** `GET /api/tickets/{ticketId}`
* **Access:** `ROLE_CUSTOMER`, `ROLE_SERVICE`, `ROLE_ADMIN`

### Open New Ticket
* **Path:** `POST /api/tickets`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body (`CreateTicketRequest`):**
  ```json
  {
    "customerId": "cust-001",
    "customerName": "Ayşe Demir",
    "customerCompany": "Ztemizinden Demo Fabrika",
    "customerLocation": "Istanbul, Kadıköy OSB",
    "customerCity": "Istanbul",
    "customerDistrict": "Kadıköy",
    "customerAddress": "Bakım Müdürlüğü",
    "assetId": "asset-uuid-123",
    "title": "Kompresör Basınç Düşüşü",
    "description": "Vidalı kompresör aşırı ısınıyor ve set basıncına ulaşamıyor.",
    "category": "MECHANIC",
    "priority": "HIGH",
    "mediaUrls": ["/uploads/ticket-media/evidence-1.jpg"]
  }
  ```

---

## 6. Negotiation, Offers & Billing

### Submit Ticket Offer
* **Path:** `POST /api/tickets/{ticketId}/offers`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`
* **Request Body (`AddOfferRequest`):**
  ```json
  {
    "providerId": "sp-001",
    "providerName": "Tetik Mekanik",
    "type": "FIXED_PRICE",
    "estimatedCost": 4500.00,
    "eta": "Yarın sabah 09:00",
    "message": "Filtre ve valf değişimi gerekebilir, yerinde kontrol edeceğiz."
  }
  ```

### Invite to Conversation (Start pre-offer chat)
* **Path:** `POST /api/tickets/{ticketId}/offers/{offerId}/invite`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Accept Offer (Starts execution)
* **Path:** `POST /api/tickets/{ticketId}/offers/{offerId}/accept`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Reject Offer
* **Path:** `POST /api/tickets/{ticketId}/offers/{offerId}/reject`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Cancel Ticket
* **Path:** `POST /api/tickets/{ticketId}/cancel`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Submit Billing (Complete work)
* **Path:** `POST /api/tickets/{ticketId}/billing`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`
* **Request Body (`SubmitBillingRequest`):**
  ```json
  {
    "actualCost": 4800.00,
    "notes": "Keçeler ve filtreler yenilendi, test edilip teslim edildi."
  }
  ```

### Approve Billing (Close Ticket)
* **Path:** `POST /api/tickets/{ticketId}/billing/approve`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`

### Dispute Billing
* **Path:** `POST /api/tickets/{ticketId}/billing/dispute`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Request Body:** `{ "reason": "Faturada anlaşılan fiyattan fazla tutar var, itiraz ediyorum." }`

---

## 7. Chat Messages API

### Send Ticket Message (Post-Acceptance)
* **Path:** `POST /api/tickets/{ticketId}/messages`
* **Access:** `ROLE_CUSTOMER`, `ROLE_SERVICE`, `ROLE_ADMIN`
* **Request Body:** `{ "senderName": "Ayşe Demir", "body": "İşlem ne kadar sürecek?" }`

### Send Conversation Message (Negotiation)
* **Path:** `POST /api/tickets/{ticketId}/conversations/{conversationId}/messages`
* **Access:** `ROLE_CUSTOMER`, `ROLE_SERVICE`, `ROLE_ADMIN`
* **Request Body:** `{ "senderName": "Hakan Tetik", "body": "Detayları görüşebilir miyiz?" }`

### Mark Ticket Messages Read
* **Path:** `POST /api/tickets/{ticketId}/messages/read`
* **Access:** `ROLE_CUSTOMER`, `ROLE_SERVICE`, `ROLE_ADMIN`

### Mark Conversation Messages Read
* **Path:** `POST /api/tickets/{ticketId}/conversations/{conversationId}/messages/read`
* **Access:** `ROLE_CUSTOMER`, `ROLE_SERVICE`, `ROLE_ADMIN`

---

## 8. Uploads File API

### Upload Ticket Media
* **Path:** `POST /api/uploads/ticket-media`
* **Access:** `ROLE_CUSTOMER`, `ROLE_ADMIN`
* **Parameters:** `file` (Multipart File)
* **Returns:** `{ "url": "/uploads/ticket-media/file.jpg", "originalFileName": "evidence.jpg", ... }`

### Upload Onboarding Documents
* **Path:** `POST /api/uploads/provider-documents`
* **Access:** `ROLE_SERVICE`, `ROLE_ADMIN`
* **Parameters:** `file` (Multipart File), `type` (String, e.g. "Vergi Levhası"), `providerId` (Optional string)

### Upload Profile Logo
* **Path:** `POST /api/uploads/profile-logo`
* **Access:** `ROLE_CUSTOMER`, `ROLE_SERVICE`, `ROLE_ADMIN`

---

## 9. Admin Dispatch API

### Get Admin Dispatch Queue
* **Path:** `GET /api/admin/dispatch/queue`
* **Access:** `ROLE_ADMIN`
* **Returns:** All open/active tickets waiting for dispatching.

### Match Providers for Ticket
* **Path:** `GET /api/admin/dispatch/tickets/{ticketId}/matches`
* **Access:** `ROLE_ADMIN`
* **Returns:** Sorted matched service providers based on algorithm scoring.

### Manual Ticket Assignment
* **Path:** `POST /api/admin/dispatch/tickets/{ticketId}/assign`
* **Access:** `ROLE_ADMIN`
* **Request Body:** `{ "providerId": "sp-001" }`

---

## 10. WebSockets Channels (STOMP Client Guide)

### Handshake Connection
* **Endpoint:** `/ws`
* **Header Example:**
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```

### WebSocket Topics (Client Subscription Paths)

#### Ticket Updates & Status Events (Customer Context)
* **Topic:** `/topic/customers/{customerId}/tickets`
* **Payload:** Emits state modifications of the customer's tickets.

#### Ticket Updates & Opportunities (Provider Context)
* **Topic:** `/topic/providers/{providerId}/tickets`
* **Payload:** Emits new opportunities or status updates of matching categories.

#### Chat Messages (Pre-Acceptance Conversation)
* **Topic:** `/topic/tickets/{ticketId}/conversations/{conversationId}/messages`
* **Payload:** Real-time negotiation chat logs.

#### Chat Messages (Post-Acceptance Chat)
* **Topic:** `/topic/tickets/{ticketId}/messages`
* **Payload:** Job execution chat logs.
