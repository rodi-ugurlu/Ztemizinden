package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.AssetStatus;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "assets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Asset extends BaseEntity {
    @Column(nullable = false)
    private String ownerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String tagNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String serialNumber;

    private LocalDate purchaseDate;
    private LocalDate warrantyEndDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetStatus status = AssetStatus.ACTIVE;

    private String location;
    private String department;

    @Column(length = 2_000)
    private String description;

    public Asset(
            String ownerId,
            String name,
            String tagNo,
            AssetType type,
            String brand,
            String model,
            String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            String location,
            String department,
            String description
    ) {
        this.ownerId = ownerId;
        this.name = name;
        this.tagNo = tagNo;
        this.type = type;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.purchaseDate = purchaseDate;
        this.warrantyEndDate = warrantyEndDate;
        this.location = location;
        this.department = department;
        this.description = description;
    }

    public void markUnderMaintenance() {
        status = AssetStatus.UNDER_MAINTENANCE;
    }

    public void markActive() {
        status = AssetStatus.ACTIVE;
    }
}
