package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderDocumentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "provider_documents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProviderDocument extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ServiceProvider provider;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false, length = 1_000)
    private String url;

    @Column(nullable = false)
    private String originalFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProviderDocumentStatus status = ProviderDocumentStatus.PENDING;

    private Instant verifiedDate;

    @Column(length = 2_000)
    private String notes;

    ProviderDocument(ServiceProvider provider, String type, String url, String originalFileName) {
        this.provider = provider;
        this.type = type;
        this.url = url;
        this.originalFileName = originalFileName;
    }

    void verify(String notes) {
        status = ProviderDocumentStatus.VERIFIED;
        verifiedDate = Instant.now();
        this.notes = notes;
    }

    void reject(String notes) {
        status = ProviderDocumentStatus.REJECTED;
        this.notes = notes;
    }
}
