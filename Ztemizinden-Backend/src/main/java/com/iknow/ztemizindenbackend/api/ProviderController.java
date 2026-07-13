package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.application.ProviderService;
import com.iknow.ztemizindenbackend.application.ProviderService.AddDocumentCommand;
import com.iknow.ztemizindenbackend.application.ProviderService.CreateProviderCommand;
import com.iknow.ztemizindenbackend.application.ProviderService.UpdateProviderProfileCommand;
import com.iknow.ztemizindenbackend.application.UploadService;
import com.iknow.ztemizindenbackend.application.UploadService.StoredUpload;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderDocumentStatus;
import com.iknow.ztemizindenbackend.domain.Enums.LandingVisibility;
import com.iknow.ztemizindenbackend.domain.ProviderDocument;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.HashSet;
import java.util.ArrayList;
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
import org.springframework.transaction.annotation.Transactional;

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
        return ProviderResponse.from(providerService.getCurrent(currentUser.subject(), email));
    }

    @PutMapping("/me")
    public ProviderResponse updateMe(@Valid @RequestBody UpdateProviderProfileRequest request) {
        String email = currentUser.email();
        if (email == null) {
            throw new BadRequestException("Provider email is missing from token");
        }
        ServiceProvider provider = providerService.updateProfileByEmail(email, new UpdateProviderProfileCommand(
                request.name(),
                request.contactName(),
                request.phone(),
                request.city(),
                request.district(),
                request.address(),
                request.taxNumber(),
                request.logoUrl(),
                request.specialties().stream().map(ApiEnums::ticketCategory).collect(Collectors.toSet()),
                request.expertiseTags() == null ? Set.of() : request.expertiseTags(),
                request.coverageDistricts() == null ? Set.of() : request.coverageDistricts()
        ));
        return ProviderResponse.from(provider);
    }

    @PutMapping("/me/landing-visibility")
    public ProviderResponse updateMyLandingVisibility(@Valid @RequestBody LandingVisibilityRequest request) {
        String email = currentUser.email();
        if (email == null) {
            throw new BadRequestException("Provider email is missing from token");
        }
        return ProviderResponse.from(providerService.updateLandingRequest(
                currentUser.subject(),
                email,
                request.visible()
        ));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProviderResponse create(@Valid @RequestBody CreateProviderRequest request) {
        throw new BadRequestException("Servis başvurusu için en az bir belge yüklenmelidir.");
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
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
        validateRegistrationDocuments(taxCertificate, insurance, technicalLicense, isoCertificate);

        List<StoredUpload> storedUploads = new ArrayList<>();
        try {
            ServiceProvider provider = createProvider(request);
            addRegistrationDocument(provider.getId(), "Vergi Levhası", taxCertificate, storedUploads);
            addRegistrationDocument(provider.getId(), "Sigorta Belgesi", insurance, storedUploads);
            addRegistrationDocument(provider.getId(), "Teknik Lisans", technicalLicense, storedUploads);
            addRegistrationDocument(provider.getId(), "ISO Sertifikası", isoCertificate, storedUploads);
            return ProviderResponse.from(providerService.getByEmail(provider.getEmail()));
        } catch (RuntimeException exception) {
            storedUploads.forEach(uploadService::delete);
            throw exception;
        }
    }

    private ServiceProvider createProvider(CreateProviderRequest request) {
        return providerService.create(new CreateProviderCommand(
                request.name(),
                request.contactName(),
                request.email(),
                request.phone(),
                request.city(),
                request.district(),
                request.specialties().stream().map(ApiEnums::ticketCategory).collect(Collectors.toSet()),
                request.expertiseTags() == null ? Set.of() : request.expertiseTags(),
                request.coverageDistricts() == null ? Set.of() : request.coverageDistricts(),
                request.password()
        ));
    }

    private void addRegistrationDocument(
            String providerId,
            String type,
            MultipartFile file,
            List<StoredUpload> storedUploads
    ) {
        if (file == null || file.isEmpty()) {
            return;
        }
        StoredUpload upload = uploadService.storeProviderDocument(file);
        storedUploads.add(upload);
        providerService.addDocument(providerId, new AddDocumentCommand(
                type,
                upload.url(),
                upload.originalFileName(),
                upload.contentSha256()
        ));
    }

    private void validateRegistrationDocuments(MultipartFile... files) {
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                uploadService.validateProviderDocument(file);
            }
        }
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

    @PostMapping("/{providerId}/landing/approve")
    public ProviderResponse approveLandingVisibility(@PathVariable String providerId) {
        return ProviderResponse.from(providerService.approveLandingVisibility(providerId));
    }

    @PostMapping("/{providerId}/landing/reject")
    public ProviderResponse rejectLandingVisibility(@PathVariable String providerId) {
        return ProviderResponse.from(providerService.rejectLandingVisibility(providerId));
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
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) String contactName,
            @Email @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(max = 255) String phone,
            @NotBlank @Size(max = 255) String city,
            @NotBlank @Size(max = 255) String district,
            @NotEmpty @Size(max = 6) Set<@Size(max = 50) String> specialties,
            @Size(max = 50) Set<@Size(max = 120) String> expertiseTags,
            @Size(max = 100) Set<@Size(max = 120) String> coverageDistricts,
            @NotBlank @Size(min = 8, max = 128) String password
    ) {
    }

    public record UpdateProviderProfileRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) String contactName,
            @NotBlank @Size(max = 255) String phone,
            @NotBlank @Size(max = 255) String city,
            @NotBlank @Size(max = 255) String district,
            @Size(max = 500) String address,
            @Size(max = 100) String taxNumber,
            @Size(max = 1_000) String logoUrl,
            @NotEmpty @Size(max = 6) Set<@Size(max = 50) String> specialties,
            @Size(max = 50) Set<@Size(max = 120) String> expertiseTags,
            @Size(max = 100) Set<@Size(max = 120) String> coverageDistricts
    ) {
    }

    public record TrustedRequest(boolean trusted) {
    }

    public record LandingVisibilityRequest(boolean visible) {
    }

    public record DocumentReviewRequest(@Size(max = 2_000) String notes) {
    }

    public record ProviderResponse(
            String id,
            String name,
            String contactName,
            String email,
            String phone,
            String city,
            String district,
            String logoUrl,
            String address,
            String taxNumber,
            ProviderStatus status,
            boolean trusted,
            boolean isTrusted,
            BigDecimal rating,
            int completedJobs,
            LandingVisibility landingVisibility,
            Instant landingApprovedAt,
            Set<String> specialties,
            Set<String> expertiseTags,
            Set<String> coverageDistricts,
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
                    provider.getDistrict(),
                    provider.getLogoUrl(),
                    provider.getAddress(),
                    provider.getTaxNumber(),
                    provider.getStatus(),
                    provider.isTrusted(),
                    provider.isTrusted(),
                    provider.getRating(),
                    provider.getCompletedJobs(),
                    provider.getLandingVisibility(),
                    provider.getLandingApprovedAt(),
                    provider.getSpecialties().stream().map(ApiEnums::display).collect(Collectors.toSet()),
                    provider.getExpertiseTags() == null ? Set.of() : provider.getExpertiseTags(),
                    provider.getCoverageDistricts() == null ? Set.of() : provider.getCoverageDistricts(),
                    documentResponses(provider),
                    provider.getCreatedAt(),
                    provider.getUpdatedAt()
            );
        }

        private static List<ProviderDocumentResponse> documentResponses(ServiceProvider provider) {
            Set<String> seenIds = new HashSet<>();
            return provider.getDocuments().stream()
                    .filter(document -> seenIds.add(document.getId()))
                    .map(ProviderDocumentResponse::from)
                    .toList();
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
