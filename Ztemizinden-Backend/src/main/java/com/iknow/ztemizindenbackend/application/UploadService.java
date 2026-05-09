package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.UploadProperties;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {
    private static final Set<String> TICKET_MEDIA_PREFIXES = Set.of("image/", "video/");
    private static final Set<String> PROVIDER_DOCUMENT_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");

    private final Path rootDir;

    public UploadService(UploadProperties uploadProperties) {
        String configuredRoot = uploadProperties.rootDir() == null || uploadProperties.rootDir().isBlank()
                ? "uploads"
                : uploadProperties.rootDir();
        this.rootDir = Path.of(configuredRoot).toAbsolutePath().normalize();
    }

    public StoredUpload storeTicketMedia(MultipartFile file) {
        String contentType = contentType(file);
        boolean allowed = TICKET_MEDIA_PREFIXES.stream().anyMatch(contentType::startsWith);
        if (!allowed) {
            throw new IllegalArgumentException("Ticket media must be an image or video");
        }
        return store(file, "ticket-media");
    }

    public StoredUpload storeProviderDocument(MultipartFile file) {
        String contentType = contentType(file);
        if (!PROVIDER_DOCUMENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Provider document must be PDF, JPG, or PNG");
        }
        return store(file, "provider-documents");
    }

    private StoredUpload store(MultipartFile file, String bucket) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file is required");
        }

        try {
            Path bucketDir = rootDir.resolve(bucket).normalize();
            Files.createDirectories(bucketDir);
            String originalFileName = safeFileName(file.getOriginalFilename());
            String storedFileName = UUID.randomUUID() + "-" + originalFileName;
            Path target = bucketDir.resolve(storedFileName).normalize();
            if (!target.startsWith(bucketDir)) {
                throw new IllegalArgumentException("Invalid upload path");
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredUpload(
                    originalFileName,
                    storedFileName,
                    contentType(file),
                    file.getSize(),
                    "/uploads/" + bucket + "/" + storedFileName
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Upload could not be stored");
        }
    }

    private String contentType(MultipartFile file) {
        String contentType = file == null ? null : file.getContentType();
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType.toLowerCase(Locale.ROOT);
    }

    private String safeFileName(String value) {
        String fileName = value == null || value.isBlank() ? "upload.bin" : value;
        return fileName.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    public record StoredUpload(String originalFileName, String storedFileName, String contentType, long size, String url) {
    }
}
