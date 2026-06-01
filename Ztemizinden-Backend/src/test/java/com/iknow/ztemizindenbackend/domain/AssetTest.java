package com.iknow.ztemizindenbackend.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.iknow.ztemizindenbackend.domain.Enums.AssetStatus;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class AssetTest {

    @Test
    void updateDetailsChangesMetadataWithoutChangingHierarchy() {
        Asset parent = new Asset(
                "customer-1",
                "Uretim Hatti",
                "URT-HAT",
                AssetType.FACILITY,
                "N/A",
                "N/A",
                "N/A",
                null,
                null,
                "A Blok",
                null,
                null
        );
        Asset child = new Asset(
                "customer-1",
                "Kompresor",
                "KMP-1",
                AssetType.FACILITY,
                "Atlas",
                "GA",
                "SN-1",
                null,
                null,
                "A Blok",
                null,
                null
        );
        parent.addChild(child);

        child.updateDetails(
                "Ana Kompresor",
                "KMP-2",
                AssetType.SME,
                "Atlas Copco",
                "GA 160",
                "SN-2",
                LocalDate.of(2026, 1, 10),
                LocalDate.of(2027, 1, 10),
                AssetStatus.UNDER_MAINTENANCE,
                "B Blok",
                "Bakim",
                "Revize edildi"
        );

        assertEquals("Ana Kompresor", child.getName());
        assertEquals("KMP-2", child.getTagNo());
        assertEquals(AssetStatus.UNDER_MAINTENANCE, child.getStatus());
        assertEquals(parent, child.getParent());
        assertEquals(1, child.getDepth());
        assertFalse(parent.isLeaf());
    }
}
