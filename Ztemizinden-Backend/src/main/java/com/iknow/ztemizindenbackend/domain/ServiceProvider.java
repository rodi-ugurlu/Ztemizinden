package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderDocumentStatus;
import com.iknow.ztemizindenbackend.domain.Enums.LandingVisibility;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.springframework.util.StringUtils;

@Getter
@Entity
@Table(name = "service_providers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceProvider extends BaseEntity {
    @Column(name = "identity_subject", unique = true)
    private String identitySubject;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String contactName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

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
    private ProviderStatus status = ProviderStatus.PENDING_VERIFICATION;

    @Column(nullable = false)
    private boolean trusted;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false)
    private int completedJobs;

    @Enumerated(EnumType.STRING)
    @Column(name = "landing_visibility", nullable = false)
    private LandingVisibility landingVisibility = LandingVisibility.HIDDEN;

    @Column(name = "landing_approved_at")
    private Instant landingApprovedAt;

    @ElementCollection(targetClass = TicketCategory.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "service_provider_specialties", joinColumns = @JoinColumn(name = "provider_id"))
    @Column(name = "specialty", nullable = false)
    private Set<TicketCategory> specialties = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "service_provider_expertise_tags", joinColumns = @JoinColumn(name = "provider_id"))
    @Column(name = "tag", nullable = false, length = 120)
    private Set<String> expertiseTags = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "service_provider_coverage_districts", joinColumns = @JoinColumn(name = "provider_id"))
    @Column(name = "district", nullable = false, length = 120)
    private Set<String> coverageDistricts = new LinkedHashSet<>();

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<ProviderDocument> documents = new ArrayList<>();

    public ServiceProvider(
            String name,
            String contactName,
            String email,
            String phone,
            String city,
            Set<TicketCategory> specialties,
            Set<String> expertiseTags
    ) {
        this.name = name;
        this.contactName = contactName;
        this.email = normalizeEmail(email);
        this.phone = phone;
        this.city = city;
        this.district = "Belirtilmedi";
        this.specialties = new HashSet<>(specialties);
        this.expertiseTags = normalizeExpertiseTags(expertiseTags);
        this.coverageDistricts = normalizeDistricts(Set.of(this.district));
    }

    public ServiceProvider(
            String name,
            String contactName,
            String email,
            String phone,
            String city,
            String district,
            Set<TicketCategory> specialties,
            Set<String> expertiseTags,
            Set<String> coverageDistricts
    ) {
        this.name = name;
        this.contactName = contactName;
        this.email = normalizeEmail(email);
        this.phone = phone;
        this.city = city;
        this.district = required(district, "Provider district is required");
        this.specialties = new HashSet<>(specialties);
        this.expertiseTags = normalizeExpertiseTags(expertiseTags);
        this.coverageDistricts = normalizeDistricts(withDefaultDistrict(coverageDistricts, this.district));
    }

    public void verify() {
        boolean newlyVerified = status != ProviderStatus.VERIFIED;
        status = ProviderStatus.VERIFIED;
        if (newlyVerified) {
            landingVisibility = LandingVisibility.VISIBLE;
            landingApprovedAt = Instant.now();
        }
    }

    public void suspend() {
        status = ProviderStatus.SUSPENDED;
        landingVisibility = LandingVisibility.HIDDEN;
        landingApprovedAt = null;
    }

    public void linkIdentity(String identitySubject) {
        this.identitySubject = required(identitySubject, "Provider identity subject is required");
    }

    public void setTrusted(boolean trusted) {
        this.trusted = trusted;
    }

    public void updateProfile(
            String name,
            String contactName,
            String phone,
            String city,
            String district,
            String address,
            String taxNumber,
            String logoUrl,
            Set<TicketCategory> specialties,
            Set<String> expertiseTags,
            Set<String> coverageDistricts
    ) {
        String nextName = required(name, "Provider name is required");
        String nextCity = required(city, "Provider city is required");
        String nextLogoUrl = optional(logoUrl);
        if (!Objects.equals(this.logoUrl, nextLogoUrl) && nextLogoUrl != null) {
            requireManagedLogoUrl(nextLogoUrl);
        }
        Set<TicketCategory> nextSpecialties = specialties == null || specialties.isEmpty()
                ? this.specialties
                : new HashSet<>(specialties);
        boolean publicProfileChanged = !Objects.equals(this.name, nextName)
                || !Objects.equals(this.city, nextCity)
                || !Objects.equals(this.logoUrl, nextLogoUrl)
                || !Objects.equals(this.specialties, nextSpecialties);

        this.name = nextName;
        this.contactName = required(contactName, "Provider contact name is required");
        this.phone = required(phone, "Provider phone is required");
        this.city = nextCity;
        this.district = required(district, "Provider district is required");
        this.address = optional(address);
        this.taxNumber = optional(taxNumber);
        this.logoUrl = nextLogoUrl;
        this.specialties = nextSpecialties;
        if (expertiseTags != null) {
            this.expertiseTags = normalizeExpertiseTags(expertiseTags);
        }
        if (coverageDistricts != null) {
            this.coverageDistricts = normalizeDistricts(withDefaultDistrict(coverageDistricts, this.district));
        }
        if (publicProfileChanged && landingVisibility == LandingVisibility.VISIBLE) {
            landingVisibility = LandingVisibility.PENDING;
            landingApprovedAt = null;
        }
    }

    public void requestLandingVisibility() {
        if (status != ProviderStatus.VERIFIED) {
            throw new IllegalStateException("Only verified providers can request landing visibility");
        }
        if (logoUrl != null) {
            requireManagedLogoUrl(logoUrl);
        }
        landingVisibility = LandingVisibility.PENDING;
        landingApprovedAt = null;
    }

    public void hideFromLanding() {
        landingVisibility = LandingVisibility.HIDDEN;
        landingApprovedAt = null;
    }

    public void approveLandingVisibility() {
        if (status != ProviderStatus.VERIFIED) {
            throw new IllegalStateException("Only verified providers can be published on landing");
        }
        if (landingVisibility != LandingVisibility.PENDING) {
            throw new IllegalStateException("Provider landing request is not pending");
        }
        if (logoUrl != null) {
            requireManagedLogoUrl(logoUrl);
        }
        landingVisibility = LandingVisibility.VISIBLE;
        landingApprovedAt = Instant.now();
    }

    public void rejectLandingVisibility() {
        landingVisibility = LandingVisibility.HIDDEN;
        landingApprovedAt = null;
    }

    public ProviderDocument addDocument(String type, String url, String originalFileName) {
        return addDocument(type, url, originalFileName, null);
    }

    public ProviderDocument addDocument(String type, String url, String originalFileName, String contentSha256) {
        if (contentSha256 != null && !contentSha256.isBlank()) {
            ProviderDocument existing = documents.stream()
                    .filter(document -> type.equals(document.getType()))
                    .filter(document -> contentSha256.equals(document.getContentSha256()))
                    .findFirst()
                    .orElse(null);
            if (existing != null) {
                return existing;
            }
        }
        if (documents.size() >= 50) {
            throw new IllegalStateException("Provider document limit exceeded");
        }
        ProviderDocument document = new ProviderDocument(this, type, url, originalFileName, contentSha256);
        documents.add(document);
        return document;
    }

    public void verifyDocument(String documentId, String notes) {
        document(documentId).verify(notes);
    }

    public void rejectDocument(String documentId, String notes) {
        document(documentId).reject(notes);
    }

    public void requireApprovalReadyDocuments() {
        if (documents.isEmpty()) {
            throw new IllegalStateException("Provider must upload at least one document before approval");
        }
        if (documents.stream().anyMatch(document -> document.getStatus() == ProviderDocumentStatus.PENDING)) {
            throw new IllegalStateException("All pending provider documents must be reviewed before approval");
        }
        Set<String> verifiedTypes = documents.stream()
                .filter(document -> document.getStatus() == ProviderDocumentStatus.VERIFIED)
                .map(ProviderDocument::getType)
                .collect(Collectors.toSet());
        boolean hasRejectedTypeWithoutReplacement = documents.stream()
                .filter(document -> document.getStatus() == ProviderDocumentStatus.REJECTED)
                .anyMatch(document -> !verifiedTypes.contains(document.getType()));
        if (verifiedTypes.isEmpty() || hasRejectedTypeWithoutReplacement) {
            throw new IllegalStateException("Each rejected document type must have a verified replacement before approval");
        }
    }

    private ProviderDocument document(String documentId) {
        return documents.stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Provider document not found"));
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

    private void requireManagedLogoUrl(String value) {
        if (!StringUtils.hasText(value) || !value.startsWith("/uploads/profile-logos/")) {
            throw new IllegalStateException("A managed profile logo is required for landing visibility");
        }
    }

    private Set<String> normalizeExpertiseTags(Set<String> values) {
        if (values == null) {
            return new LinkedHashSet<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().replaceAll("\\s+", " "))
                .map(value -> value.toLowerCase(Locale.forLanguageTag("tr-TR")))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> withDefaultDistrict(Set<String> values, String fallback) {
        Set<String> districts = values == null ? new LinkedHashSet<>() : new LinkedHashSet<>(values);
        if (districts.stream().noneMatch(StringUtils::hasText)) {
            districts.add(fallback);
        }
        return districts;
    }

    private Set<String> normalizeDistricts(Set<String> values) {
        if (values == null) {
            return new LinkedHashSet<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().replaceAll("\\s+", " "))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
