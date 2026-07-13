package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.domain.Enums.AssetStatus;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.Enums.BillingDisputeDecision;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import java.util.Locale;

final class ApiEnums {
    private ApiEnums() {
    }

    static AssetType assetType(String value) {
        return parse(AssetType.class, value);
    }

    static AssetStatus assetStatus(String value) {
        return parse(AssetStatus.class, value);
    }

    static TicketCategory ticketCategory(String value) {
        return parse(TicketCategory.class, value);
    }

    static TicketPriority ticketPriority(String value) {
        return parse(TicketPriority.class, value);
    }

    static OfferType offerType(String value) {
        return parse(OfferType.class, value);
    }

    static BillingDisputeDecision billingDisputeDecision(String value) {
        return parse(BillingDisputeDecision.class, value);
    }

    static String display(AssetType value) {
        return switch (value) {
            case FACILITY -> "Facility";
            case SME -> "SME";
            case HOME -> "Home";
        };
    }

    static String display(AssetStatus value) {
        return switch (value) {
            case ACTIVE -> "Active";
            case UNDER_MAINTENANCE -> "Under Maintenance";
            case INACTIVE -> "Inactive";
            case RETIRED -> "Retired";
        };
    }

    static String display(TicketCategory value) {
        return switch (value) {
            case ELECTRIC -> "Electric";
            case MECHANIC -> "Mechanic";
            case PNEUMATIC -> "Pneumatic";
            case HYDRAULIC -> "Hydraulic";
            case GENERAL -> "General";
            case SOFTWARE -> "Software";
        };
    }

    static String display(TicketPriority value) {
        return switch (value) {
            case LOW -> "Low";
            case MEDIUM -> "Medium";
            case HIGH -> "High";
            case CRITICAL -> "Critical";
        };
    }

    private static <E extends Enum<E>> E parse(Class<E> enumType, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(enumType.getSimpleName() + " is required");
        }

        String normalized = value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);

        return Enum.valueOf(enumType, normalized);
    }
}
