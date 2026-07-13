package com.iknow.ztemizindenbackend.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ServiceProviderDocumentTest {

    @Test
    void returnsExistingDocumentWhenTheSameContentIsUploadedAgain() {
        ServiceProvider provider = new ServiceProvider(
                "Test Servis",
                "Test Yetkili",
                "service@test.com",
                "+905000000000",
                "İstanbul",
                "Kadıköy",
                Set.of(TicketCategory.MECHANIC),
                Set.of("pompa"),
                Set.of("Kadıköy")
        );

        ProviderDocument first = provider.addDocument(
                "Vergi Levhası", "/uploads/provider-documents/first.pdf", "first.pdf", "same-sha256"
        );
        ProviderDocument repeated = provider.addDocument(
                "Vergi Levhası", "/uploads/provider-documents/repeated.pdf", "repeated.pdf", "same-sha256"
        );

        assertThat(repeated).isSameAs(first);
        assertThat(provider.getDocuments()).containsExactly(first);
    }

    @Test
    void rejectedDocumentCanBeSupersededByVerifiedReplacementOfSameType() {
        ServiceProvider provider = provider();
        ProviderDocument rejected = provider.addDocument(
                "Vergi Levhası", "/uploads/provider-documents/rejected.pdf", "rejected.pdf", "rejected-sha"
        );
        ProviderDocument replacement = provider.addDocument(
                "Vergi Levhası", "/uploads/provider-documents/replacement.pdf", "replacement.pdf", "replacement-sha"
        );
        ReflectionTestUtils.setField(rejected, "id", "doc-rejected");
        ReflectionTestUtils.setField(replacement, "id", "doc-replacement");

        provider.rejectDocument(rejected.getId(), "Belge okunamıyor");
        provider.verifyDocument(replacement.getId(), "Yeni belge doğrulandı");

        assertThat(provider.getDocuments())
                .extracting(ProviderDocument::getStatus)
                .containsExactly(
                        Enums.ProviderDocumentStatus.REJECTED,
                        Enums.ProviderDocumentStatus.VERIFIED
                );
        assertThatNoException().isThrownBy(provider::requireApprovalReadyDocuments);
    }

    @Test
    void rejectedDocumentWithoutVerifiedReplacementBlocksApproval() {
        ServiceProvider provider = provider();
        ProviderDocument rejected = provider.addDocument(
                "Vergi Levhası", "/uploads/provider-documents/rejected.pdf", "rejected.pdf", "rejected-only-sha"
        );
        ReflectionTestUtils.setField(rejected, "id", "doc-rejected-only");
        provider.rejectDocument(rejected.getId(), "Belge okunamıyor");

        assertThatThrownBy(provider::requireApprovalReadyDocuments)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("verified replacement");
    }

    private ServiceProvider provider() {
        return new ServiceProvider(
                "Test Servis",
                "Test Yetkili",
                "replacement@test.com",
                "+905000000000",
                "İstanbul",
                "Kadıköy",
                Set.of(TicketCategory.MECHANIC),
                Set.of("pompa"),
                Set.of("Kadıköy")
        );
    }
}
