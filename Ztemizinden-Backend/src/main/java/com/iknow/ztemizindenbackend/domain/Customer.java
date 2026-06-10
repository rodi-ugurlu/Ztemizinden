package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.CustomerStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Getter
@Entity
@Table(name = "customers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Customer extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String district;

    @Column(length = 1_000)
    private String logoUrl;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String taxNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerStatus status = CustomerStatus.ACTIVE;

    public Customer(String name, String email, String phone, String companyName, String city) {
        this.name = name;
        this.email = normalizeEmail(email);
        this.phone = phone;
        this.companyName = companyName;
        this.city = city;
        this.district = "Belirtilmedi";
    }

    public Customer(String name, String email, String phone, String companyName, String city, String district) {
        this.name = name;
        this.email = normalizeEmail(email);
        this.phone = phone;
        this.companyName = companyName;
        this.city = city;
        this.district = required(district, "Customer district is required");
    }

    public void activate() {
        status = CustomerStatus.ACTIVE;
    }

    public void suspend() {
        status = CustomerStatus.SUSPENDED;
    }

    public void updateProfile(
            String contactName,
            String companyName,
            String phone,
            String city,
            String district,
            String address,
            String taxNumber,
            String logoUrl
    ) {
        this.name = required(contactName, "Customer contact name is required");
        this.companyName = required(companyName, "Customer company name is required");
        this.phone = required(phone, "Customer phone is required");
        this.city = required(city, "Customer city is required");
        this.district = required(district, "Customer district is required");
        this.address = optional(address);
        this.taxNumber = optional(taxNumber);
        this.logoUrl = optional(logoUrl);
    }

    private String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String required(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String optional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
