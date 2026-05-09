package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.ProviderDocument;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProviderService {
    private final ServiceProviderRepository serviceProviderRepository;

    @Transactional(readOnly = true)
    public List<ServiceProvider> list() {
        return serviceProviderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ServiceProvider> verifiedProviders() {
        return serviceProviderRepository.findByStatusOrderByCreatedAtDesc(ProviderStatus.VERIFIED);
    }

    @Transactional(readOnly = true)
    public ServiceProvider getByEmail(String email) {
        return serviceProviderRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
    }

    @Transactional
    public ServiceProvider create(CreateProviderCommand command) {
        ServiceProvider provider = new ServiceProvider(
                command.name(),
                command.contactName(),
                command.email(),
                command.phone(),
                command.city(),
                command.specialties()
        );

        return serviceProviderRepository.save(provider);
    }

    @Transactional
    public ServiceProvider verify(String providerId) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        provider.verify();
        return provider;
    }

    @Transactional
    public ServiceProvider setTrusted(String providerId, boolean trusted) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        provider.setTrusted(trusted);
        return provider;
    }

    @Transactional
    public ProviderDocument addDocument(String providerId, AddDocumentCommand command) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        return provider.addDocument(command.type(), command.url(), command.originalFileName());
    }

    @Transactional
    public ProviderDocument verifyDocument(String providerId, String documentId, String notes) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        provider.verifyDocument(documentId, notes);
        return provider.getDocuments().stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Provider document not found"));
    }

    @Transactional
    public ProviderDocument rejectDocument(String providerId, String documentId, String notes) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        provider.rejectDocument(documentId, notes);
        return provider.getDocuments().stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Provider document not found"));
    }

    public record CreateProviderCommand(
            String name,
            String contactName,
            String email,
            String phone,
            String city,
            Set<TicketCategory> specialties
    ) {
    }

    public record AddDocumentCommand(String type, String url, String originalFileName) {
    }
}
