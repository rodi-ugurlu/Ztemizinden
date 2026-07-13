package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.application.ProviderService;
import com.iknow.ztemizindenbackend.application.ProviderService.AddDocumentCommand;
import com.iknow.ztemizindenbackend.application.UploadService;
import com.iknow.ztemizindenbackend.application.UploadService.StoredUpload;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.ProviderDocument;
import lombok.RequiredArgsConstructor;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/uploads")
public class UploadController {
    private static final Set<String> SUPPORTED_PROVIDER_DOCUMENT_TYPES = Set.of(
            "Vergi Levhası", "Sigorta Belgesi", "Teknik Lisans", "ISO Sertifikası",
            "Ticaret Sicil", "Yetkinlik Belgesi"
    );

    private final UploadService uploadService;
    private final ProviderService providerService;
    private final CurrentUser currentUser;

    @PostMapping("/ticket-media")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse uploadTicketMedia(@RequestParam("file") MultipartFile file) {
        return UploadResponse.from(uploadService.storeTicketMedia(file), null);
    }

    @PostMapping("/profile-logo")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse uploadProfileLogo(@RequestParam("file") MultipartFile file) {
        return UploadResponse.from(uploadService.storeProfileLogo(file), null);
    }

    @PostMapping("/provider-documents")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse uploadProviderDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam String type,
            @RequestParam(required = false) String providerId
    ) {
        String normalizedType = type == null ? null : type.trim();
        if (!SUPPORTED_PROVIDER_DOCUMENT_TYPES.contains(normalizedType)) {
            throw new BadRequestException("Unsupported provider document type");
        }
        String resolvedProviderId = resolveProviderId(providerId);
        if (!StringUtils.hasText(resolvedProviderId)) {
            throw new BadRequestException("Provider id is required");
        }

        StoredUpload upload = uploadService.storeProviderDocument(file);
        try {
            ProviderDocument document = providerService.addDocument(
                    resolvedProviderId,
                    new AddDocumentCommand(
                            normalizedType,
                            upload.url(),
                            upload.originalFileName(),
                            upload.contentSha256()
                    )
            );
            if (!upload.url().equals(document.getUrl())) {
                uploadService.delete(upload);
                return UploadResponse.fromExisting(document, upload);
            }
            return UploadResponse.from(upload, document.getId());
        } catch (RuntimeException exception) {
            uploadService.delete(upload);
            throw exception;
        }
    }

    public record UploadResponse(
            String url,
            String originalFileName,
            String storedFileName,
            String contentType,
            long size,
            String providerDocumentId
    ) {
        static UploadResponse from(StoredUpload upload, String providerDocumentId) {
            return new UploadResponse(
                    upload.url(),
                    upload.originalFileName(),
                    upload.storedFileName(),
                    upload.contentType(),
                    upload.size(),
                    providerDocumentId
            );
        }

        static UploadResponse fromExisting(ProviderDocument document, StoredUpload attemptedUpload) {
            String storedFileName = document.getUrl().substring(document.getUrl().lastIndexOf('/') + 1);
            return new UploadResponse(
                    document.getUrl(),
                    document.getOriginalFileName(),
                    storedFileName,
                    attemptedUpload.contentType(),
                    attemptedUpload.size(),
                    document.getId()
            );
        }
    }

    private String resolveProviderId(String requestedProviderId) {
        if (StringUtils.hasText(requestedProviderId)) {
            return currentUser.providerId(requestedProviderId);
        }
        if (currentUser.isService()) {
            return currentUser.providerId(null);
        }
        return null;
    }
}
