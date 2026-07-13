package com.iknow.ztemizindenbackend.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.iknow.ztemizindenbackend.application.UploadService.StoredUpload;
import com.iknow.ztemizindenbackend.config.UploadProperties;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class UploadServiceTest {

    @TempDir
    Path uploadRoot;

    @Test
    void storesUsingDetectedContentAndChecksumInsteadOfClientFileName() throws Exception {
        UploadService service = new UploadService(new UploadProperties(uploadRoot.toString(), Duration.ofHours(24)));
        byte[] png = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile("file", "payload.html", "text/html", png);

        StoredUpload upload = service.storeProfileLogo(file);

        assertThat(upload.storedFileName()).endsWith(".png").doesNotContain("payload.html");
        assertThat(upload.contentType()).isEqualTo("image/png");
        assertThat(upload.contentSha256()).hasSize(64);
        assertThat(Files.exists(uploadRoot.resolve("profile-logos").resolve(upload.storedFileName()))).isTrue();

        service.delete(upload);
        assertThat(Files.exists(uploadRoot.resolve("profile-logos").resolve(upload.storedFileName()))).isFalse();
    }

    @Test
    void rejectsAFileWhoseBytesDoNotMatchAnAllowedDocumentType() {
        UploadService service = new UploadService(new UploadProperties(uploadRoot.toString(), Duration.ofHours(24)));
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fake.pdf",
                "application/pdf",
                "<html>not a pdf</html>".getBytes()
        );

        assertThatThrownBy(() -> service.storeProviderDocument(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Provider document must be PDF, JPG, or PNG");
    }

    @Test
    void cleanupDeletesOnlyOldUnreferencedManagedUploads() throws Exception {
        UploadService service = new UploadService(new UploadProperties(uploadRoot.toString(), Duration.ofHours(24)));
        Path bucket = Files.createDirectories(uploadRoot.resolve("profile-logos"));
        Path referenced = Files.writeString(bucket.resolve("referenced.png"), "kept");
        Path orphan = Files.writeString(bucket.resolve("orphan.png"), "deleted");
        Path fresh = Files.writeString(bucket.resolve("fresh.png"), "kept");
        Path unmanaged = Files.writeString(uploadRoot.resolve("unmanaged.txt"), "kept");
        FileTime old = FileTime.from(Instant.now().minus(Duration.ofDays(2)));
        Files.setLastModifiedTime(referenced, old);
        Files.setLastModifiedTime(orphan, old);
        Files.setLastModifiedTime(unmanaged, old);

        int deleted = service.cleanupOrphans(Set.of("/uploads/profile-logos/referenced.png"), Duration.ofHours(24));

        assertThat(deleted).isEqualTo(1);
        assertThat(referenced).exists();
        assertThat(orphan).doesNotExist();
        assertThat(fresh).exists();
        assertThat(unmanaged).exists();
    }
}
