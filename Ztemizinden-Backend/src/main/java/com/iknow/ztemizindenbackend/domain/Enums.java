package com.iknow.ztemizindenbackend.domain;

public final class Enums {
    private Enums() {
    }

    public enum AssetType {
        FACILITY, SME, HOME
    }

    public enum AssetStatus {
        ACTIVE, UNDER_MAINTENANCE, INACTIVE, RETIRED
    }

    public enum CustomerStatus {
        ACTIVE, SUSPENDED
    }

    public enum TicketCategory {
        ELECTRIC, MECHANIC, PNEUMATIC, HYDRAULIC, GENERAL, SOFTWARE
    }

    public enum TicketPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum TicketStatus {
        OPEN, OFFERED, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED
    }

    public enum OfferType {
        DISCOVERY, FIXED_PRICE
    }

    public enum OfferStatus {
        PENDING, INVITED, ACCEPTED, REJECTED, WITHDRAWN
    }

    public enum ConversationStatus {
        ACTIVE, ACCEPTED, CLOSED
    }

    public enum ConversationClosedReason {
        REJECTED, NOT_SELECTED, TICKET_CANCELLED, TICKET_CLOSED
    }

    public enum BillingStatus {
        AWAITING_CUSTOMER_APPROVAL, APPROVED, DISPUTED
    }

    public enum BillingDisputeDecision {
        APPROVE, REQUEST_REVISION
    }

    public enum ProviderStatus {
        PENDING_VERIFICATION, VERIFIED, SUSPENDED
    }

    public enum LandingVisibility {
        HIDDEN, PENDING, VISIBLE
    }

    public enum ProviderDocumentStatus {
        PENDING, VERIFIED, REJECTED
    }
}
