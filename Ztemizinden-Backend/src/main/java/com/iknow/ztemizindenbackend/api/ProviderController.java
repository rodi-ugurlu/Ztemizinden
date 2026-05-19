package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.application.ProviderService;
import com.iknow.ztemizindenbackend.application.ProviderService.AddDocumentCommand;
import com.iknow.ztemizindenbackend.application.ProviderService.CreateProviderCommand;
import com.iknow.ztemizindenbackend.application.UploadService;
import com.iknow.ztemizindenbackend.application.UploadService.StoredUpload;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderDocumentStatus;
import com.iknow.ztemizindenbackend.domain.ProviderDocument;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/providers")
public class ProviderController {
    private final ProviderService providerService;
    private final UploadService uploadService;
    private final CurrentUser currentUser;

    @GetMapping
    public List<ProviderResponse> list() {
        return providerService.list().stream().map(ProviderResponse::from).toList();
    }

    @GetMapping("/me")
    public ProviderResponse me() {
        String email = currentUser.email();
        if (email == null) {
            throw new BadRequestException("Provider email is missing from token");
        }
        return ProviderResponse.from(providerService.getByEmail(email));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProviderResponse create(@Valid @RequestBody CreateProviderRequest request) {
        throw new BadRequestException("Servis başvurusu için en az bir belge yüklenmelidir.");
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProviderResponse createWithDocuments(
            @Valid @RequestPart("request") CreateProviderRequest request,
            @RequestPart(required = false) MultipartFile taxCertificate,
            @RequestPart(required = false) MultipartFile insurance,
            @RequestPart(required = false) MultipartFile technicalLicense,
            @RequestPart(required = false) MultipartFile isoCertificate
    ) {
        if (!hasAnyRegistrationDocument(taxCertificate, insurance, technicalLicense, isoCertificate)) {
            throw new BadRequestException("Servis başvurusu için en az bir belge yüklenmelidir.");
        }
        ServiceProvider provider = createProvider(request);
        addRegistrationDocument(provider.getId(), "Vergi Levhası", taxCertificate);
        addRegistrationDocument(provider.getId(), "Sigorta Belgesi", insurance);
        addRegistrationDocument(provider.getId(), "Teknik Lisans", technicalLicense);
        addRegistrationDocument(provider.getId(), "ISO Sertifikası", isoCertificate);
        return ProviderResponse.from(providerService.getByEmail(provider.getEmail()));
    }

    private ServiceProvider createProvider(CreateProviderRequest request) {
        return providerService.create(new CreateProviderCommand(
                request.name(),
                request.contactName(),
                request.email(),
                request.phone(),
                request.city(),
                request.specialties().stream().map(ApiEnums::ticketCategory).collect(Collectors.toSet()),
                request.password()
        ));
    }

    private void addRegistrationDocument(String providerId, String type, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        StoredUpload upload = uploadService.storeProviderDocument(file);
        providerService.addDocument(providerId, new AddDocumentCommand(type, upload.url(), upload.originalFileName()));
    }

    private boolean hasAnyRegistrationDocument(MultipartFile... files) {
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    @PostMapping("/{providerId}/verify")
    public ProviderResponse verify(@PathVariable String providerId) {
        return ProviderResponse.from(providerService.verify(providerId));
    }

    @PostMapping("/{providerId}/approve")
    public ProviderResponse approve(@PathVariable String providerId) {
        return ProviderResponse.from(providerService.verify(providerId));
    }

    @PostMapping("/{providerId}/reject")
    public ProviderResponse reject(@PathVariable String providerId) {
        return ProviderResponse.from(providerService.reject(providerId));
    }

    @PutMapping("/{providerId}/trusted")
    public ProviderResponse setTrusted(@PathVariable String providerId, @Valid @RequestBody TrustedRequest request) {
        return ProviderResponse.from(providerService.setTrusted(providerId, request.trusted()));
    }

    @PostMapping("/{providerId}/documents/{documentId}/verify")
    public ProviderDocumentResponse verifyDocument(
            @PathVariable String providerId,
            @PathVariable String documentId,
            @RequestBody(required = false) DocumentReviewRequest request
    ) {
        String notes = request == null ? null : request.notes();
        return ProviderDocumentResponse.from(providerService.verifyDocument(providerId, documentId, notes));
    }

    @PostMapping("/{providerId}/documents/{documentId}/reject")
    public ProviderDocumentResponse rejectDocument(
            @PathVariable String providerId,
            @PathVariable String documentId,
            @RequestBody(required = false) DocumentReviewRequest request
    ) {
        String notes = request == null ? null : request.notes();
        return ProviderDocumentResponse.from(providerService.rejectDocument(providerId, documentId, notes));
    }

    public record CreateProviderRequest(
            @NotBlank String name,
            @NotBlank String contactName,
            @Email @NotBlank String email,
            @NotBlank String phone,
            @NotBlank String city,
            @NotEmpty Set<String> specialties,
            @NotBlank String password
    ) {
    }

    public record TrustedRequest(boolean trusted) {
    }

    public record DocumentReviewRequest(String notes) {
    }

    public record ProviderResponse(
            String id,
            String name,
            String contactName,
            String email,
            String phone,
            String city,
            ProviderStatus status,
            boolean trusted,
            boolean isTrusted,
            BigDecimal rating,
            int completedJobs,
            Set<String> specialties,
            List<ProviderDocumentResponse> documents,
            Instant createdAt,
            Instant updatedAt
    ) {
        static ProviderResponse from(ServiceProvider provider) {
            return new ProviderResponse(
                    provider.getId(),
                    provider.getName(),
                    provider.getContactName(),
                    provider.getEmail(),
                    provider.getPhone(),
                    provider.getCity(),
                    provider.getStatus(),
                    provider.isTrusted(),
                    provider.isTrusted(),
                    provider.getRating(),
                    provider.getCompletedJobs(),
                    provider.getSpecialties().stream().map(ApiEnums::display).collect(Collectors.toSet()),
                    provider.getDocuments().stream().map(ProviderDocumentResponse::from).toList(),
                    provider.getCreatedAt(),
                    provider.getUpdatedAt()
            );
        }
    }

    public record ProviderDocumentResponse(
            String id,
            String type,
            String status,
            String url,
            String originalFileName,
            Instant uploadDate,
            Instant verifiedDate,
            String notes
    ) {
        static ProviderDocumentResponse from(ProviderDocument document) {
            return new ProviderDocumentResponse(
                    document.getId(),
                    document.getType(),
                    display(document.getStatus()),
                    document.getUrl(),
                    document.getOriginalFileName(),
                    document.getCreatedAt(),
                    document.getVerifiedDate(),
                    document.getNotes()
            );
        }

        private static String display(ProviderDocumentStatus status) {
            return switch (status) {
                case PENDING -> "Pending";
                case VERIFIED -> "Verified";
                case REJECTED -> "Rejected";
            };
        }
    }
}
