package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.config.UploadProperties;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadOrphanCleanupService {
    private final UploadService uploadService;
    private final UploadProperties uploadProperties;
    private final CustomerRepository customerRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final TicketRepository ticketRepository;

    @Scheduled(cron = "${app.upload.orphan-cleanup-cron:0 15 3 * * *}")
    public void cleanup() {
        try {
            int deleted = uploadService.cleanupOrphans(
                    referencedUrls(),
                    uploadProperties.effectiveOrphanGracePeriod()
            );
            if (deleted > 0) {
                log.info("Deleted {} orphaned upload file(s)", deleted);
            }
        } catch (RuntimeException exception) {
            log.warn("Upload orphan cleanup failed; files were left untouched", exception);
        }
    }

    private Set<String> referencedUrls() {
        Set<String> urls = new HashSet<>();
        urls.addAll(customerRepository.findReferencedLogoUrls());
        urls.addAll(serviceProviderRepository.findReferencedLogoUrls());
        urls.addAll(serviceProviderRepository.findReferencedDocumentUrls());
        urls.addAll(ticketRepository.findReferencedMediaUrls());
        return urls;
    }
}
