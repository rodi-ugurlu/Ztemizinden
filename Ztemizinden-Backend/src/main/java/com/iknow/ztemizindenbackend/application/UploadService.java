package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.UploadProperties;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {
    private static final Set<String> MANAGED_BUCKETS = Set.of(
            "ticket-media", "profile-logos", "provider-documents");
    private static final Set<String> PROFILE_LOGO_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> PROVIDER_DOCUMENT_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final Set<String> TICKET_MEDIA_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/quicktime", "video/webm"
    );
    private static final long MAX_TICKET_MEDIA_BYTES = 50L * 1024L * 1024L;
    private static final long MAX_PROFILE_LOGO_BYTES = 1L * 1024L * 1024L;
    private static final long MAX_PROVIDER_DOCUMENT_BYTES = 10L * 1024L * 1024L;

    private final Path rootDir;

    public UploadService(UploadProperties uploadProperties) {
        String configuredRoot = uploadProperties.rootDir() == null || uploadProperties.rootDir().isBlank()
                ? "uploads"
                : uploadProperties.rootDir();
        this.rootDir = Path.of(configuredRoot).toAbsolutePath().normalize();
    }

    public StoredUpload storeTicketMedia(MultipartFile file) {
        return store(file, "ticket-media", MAX_TICKET_MEDIA_BYTES, TICKET_MEDIA_TYPES,
                "Ticket media must be JPG, PNG, WEBP, GIF, MP4, MOV, or WEBM");
    }

    public StoredUpload storeProfileLogo(MultipartFile file) {
        return store(file, "profile-logos", MAX_PROFILE_LOGO_BYTES, PROFILE_LOGO_TYPES,
                "Profile logo must be JPG, PNG, or WEBP");
    }

    public StoredUpload storeProviderDocument(MultipartFile file) {
        return store(file, "provider-documents", MAX_PROVIDER_DOCUMENT_BYTES, PROVIDER_DOCUMENT_TYPES,
                "Provider document must be PDF, JPG, or PNG");
    }

    public void validateProviderDocument(MultipartFile file) {
        validate(file, MAX_PROVIDER_DOCUMENT_BYTES, PROVIDER_DOCUMENT_TYPES,
                "Provider document must be PDF, JPG, or PNG");
    }

    public void delete(StoredUpload upload) {
        if (upload == null || upload.url() == null || !upload.url().startsWith("/uploads/")) {
            return;
        }
        Path target = rootDir.resolve(upload.url().substring("/uploads/".length())).normalize();
        if (!target.startsWith(rootDir)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // A cleanup failure must not hide the original database/business failure.
        }
    }

    public int cleanupOrphans(Set<String> referencedUrls, Duration gracePeriod) {
        if (!Files.isDirectory(rootDir)) {
            return 0;
        }
        Duration safeGracePeriod = gracePeriod == null || gracePeriod.isNegative()
                ? Duration.ofHours(24)
                : gracePeriod;
        Instant cutoff = Instant.now().minus(safeGracePeriod);
        Set<String> safeReferencedUrls = referencedUrls == null ? Set.of() : referencedUrls;

        try (Stream<Path> paths = Files.walk(rootDir)) {
            return paths
                    .filter(path -> Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS))
                    .filter(this::isManagedUpload)
                    .filter(path -> !safeReferencedUrls.contains(toPublicUrl(path)))
                    .filter(path -> isOlderThan(path, cutoff))
                    .mapToInt(this::deleteOrphan)
                    .sum();
        } catch (IOException exception) {
            throw new IllegalStateException("Upload orphan cleanup could not scan the upload directory", exception);
        }
    }

    private StoredUpload store(
            MultipartFile file,
            String bucket,
            long maxSizeBytes,
            Set<String> allowedTypes,
            String invalidTypeMessage
    ) {
        FileSignature signature = validate(file, maxSizeBytes, allowedTypes, invalidTypeMessage);

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            Path bucketDir = rootDir.resolve(bucket).normalize();
            Files.createDirectories(bucketDir);
            String originalFileName = safeFileName(file.getOriginalFilename());
            String storedFileName = UUID.randomUUID() + signature.extension();
            Path target = bucketDir.resolve(storedFileName).normalize();
            if (!target.startsWith(bucketDir)) {
                throw new IllegalArgumentException("Invalid upload path");
            }
            try (InputStream inputStream = new DigestInputStream(file.getInputStream(), digest)) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredUpload(
                    originalFileName,
                    storedFileName,
                    signature.contentType(),
                    file.getSize(),
                    "/uploads/" + bucket + "/" + storedFileName,
                    HexFormat.of().formatHex(digest.digest())
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Upload could not be stored");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Upload checksum could not be calculated");
        }
    }

    private boolean isManagedUpload(Path path) {
        Path relative = rootDir.relativize(path.normalize());
        return relative.getNameCount() == 2 && MANAGED_BUCKETS.contains(relative.getName(0).toString());
    }

    private String toPublicUrl(Path path) {
        return "/uploads/" + rootDir.relativize(path.normalize()).toString().replace('\\', '/');
    }

    private boolean isOlderThan(Path path, Instant cutoff) {
        try {
            return Files.getLastModifiedTime(path, LinkOption.NOFOLLOW_LINKS).toInstant().isBefore(cutoff);
        } catch (IOException exception) {
            return false;
        }
    }

    private int deleteOrphan(Path path) {
        try {
            return Files.deleteIfExists(path) ? 1 : 0;
        } catch (IOException exception) {
            return 0;
        }
    }

    private FileSignature validate(
            MultipartFile file,
            long maxSizeBytes,
            Set<String> allowedTypes,
            String invalidTypeMessage
    ) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file is required");
        }
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("Upload file is too large");
        }

        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = inputStream.readNBytes(16);
            FileSignature signature = detectSignature(header, contentType(file));
            if (signature == null || !allowedTypes.contains(signature.contentType())) {
                throw new IllegalArgumentException(invalidTypeMessage);
            }
            return signature;
        } catch (IOException exception) {
            throw new IllegalStateException("Upload could not be inspected");
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

    private FileSignature detectSignature(byte[] header, String claimedContentType) {
        if (startsWith(header, new int[]{0x25, 0x50, 0x44, 0x46, 0x2D})) {
            return new FileSignature("application/pdf", ".pdf");
        }
        if (startsWith(header, new int[]{0xFF, 0xD8, 0xFF})) {
            return new FileSignature("image/jpeg", ".jpg");
        }
        if (startsWith(header, new int[]{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
            return new FileSignature("image/png", ".png");
        }
        if (ascii(header, 0, "RIFF") && ascii(header, 8, "WEBP")) {
            return new FileSignature("image/webp", ".webp");
        }
        if (ascii(header, 0, "GIF87a") || ascii(header, 0, "GIF89a")) {
            return new FileSignature("image/gif", ".gif");
        }
        if (ascii(header, 4, "ftyp")) {
            return "video/quicktime".equals(claimedContentType)
                    ? new FileSignature("video/quicktime", ".mov")
                    : new FileSignature("video/mp4", ".mp4");
        }
        if (startsWith(header, new int[]{0x1A, 0x45, 0xDF, 0xA3})) {
            return new FileSignature("video/webm", ".webm");
        }
        return null;
    }

    private boolean startsWith(byte[] value, int[] prefix) {
        if (value.length < prefix.length) {
            return false;
        }
        for (int index = 0; index < prefix.length; index++) {
            if ((value[index] & 0xFF) != prefix[index]) {
                return false;
            }
        }
        return true;
    }

    private boolean ascii(byte[] value, int offset, String expected) {
        if (value.length < offset + expected.length()) {
            return false;
        }
        for (int index = 0; index < expected.length(); index++) {
            if (value[offset + index] != (byte) expected.charAt(index)) {
                return false;
            }
        }
        return true;
    }

    private record FileSignature(String contentType, String extension) {
    }

    public record StoredUpload(
            String originalFileName,
            String storedFileName,
            String contentType,
            long size,
            String url,
            String contentSha256
    ) {
    }
}
