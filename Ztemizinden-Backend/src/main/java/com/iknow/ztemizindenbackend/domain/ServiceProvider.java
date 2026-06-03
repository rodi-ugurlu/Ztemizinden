package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "service_providers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceProvider extends BaseEntity {
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProviderStatus status = ProviderStatus.PENDING_VERIFICATION;

    @Column(nullable = false)
    private boolean trusted;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false)
    private int completedJobs;

    @ElementCollection(targetClass = TicketCategory.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "service_provider_specialties", joinColumns = @JoinColumn(name = "provider_id"))
    @Column(name = "specialty", nullable = false)
    private Set<TicketCategory> specialties = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "service_provider_expertise_tags", joinColumns = @JoinColumn(name = "provider_id"))
    @Column(name = "tag", nullable = false, length = 120)
    private Set<String> expertiseTags = new LinkedHashSet<>();

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
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
        this.specialties = new HashSet<>(specialties);
        this.expertiseTags = normalizeExpertiseTags(expertiseTags);
    }

    public void verify() {
        status = ProviderStatus.VERIFIED;
    }

    public void suspend() {
        status = ProviderStatus.SUSPENDED;
    }

    public void setTrusted(boolean trusted) {
        this.trusted = trusted;
    }

    public ProviderDocument addDocument(String type, String url, String originalFileName) {
        ProviderDocument document = new ProviderDocument(this, type, url, originalFileName);
        documents.add(document);
        return document;
    }

    public void verifyDocument(String documentId, String notes) {
        document(documentId).verify(notes);
    }

    public void rejectDocument(String documentId, String notes) {
        document(documentId).reject(notes);
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
}
