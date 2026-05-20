package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.ProviderDocumentStatus;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.NotFoundException;
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
    private final AuthService authService;

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
                .orElseThrow(() -> new NotFoundException("Provider not found"));
    }

    @Transactional
    public ServiceProvider create(CreateProviderCommand command) {
        if (serviceProviderRepository.existsByEmailIgnoreCase(command.email())) {
            throw new IllegalStateException("Provider email is already registered");
        }

        ServiceProvider provider = new ServiceProvider(
                command.name(),
                command.contactName(),
                command.email(),
                command.phone(),
                command.city(),
                command.specialties()
        );

        ServiceProvider savedProvider = serviceProviderRepository.save(provider);
        authService.createServiceUser(savedProvider, command.password());
        return savedProvider;
    }

    @Transactional
    public ServiceProvider verify(String providerId) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        requireVerifiedDocuments(provider);
        provider.verify();
        authService.enableUser(provider.getEmail());
        return provider;
    }

    @Transactional
    public ServiceProvider reject(String providerId) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        provider.suspend();
        authService.disableUser(provider.getEmail());
        return provider;
    }

    @Transactional
    public ServiceProvider setTrusted(String providerId, boolean trusted) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        provider.setTrusted(trusted);
        return provider;
    }

    @Transactional
    public ProviderDocument addDocument(String providerId, AddDocumentCommand command) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        return provider.addDocument(command.type(), command.url(), command.originalFileName());
    }

    @Transactional
    public ProviderDocument verifyDocument(String providerId, String documentId, String notes) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        provider.verifyDocument(documentId, notes);
        return provider.getDocuments().stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Provider document not found"));
    }

    @Transactional
    public ProviderDocument rejectDocument(String providerId, String documentId, String notes) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        provider.rejectDocument(documentId, notes);
        return provider.getDocuments().stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Provider document not found"));
    }

    public record CreateProviderCommand(
            String name,
            String contactName,
            String email,
            String phone,
            String city,
            Set<TicketCategory> specialties,
            String password
    ) {
    }

    public record AddDocumentCommand(String type, String url, String originalFileName) {
    }

    private void requireVerifiedDocuments(ServiceProvider provider) {
        if (provider.getDocuments().isEmpty()) {
            throw new IllegalStateException("Provider must upload at least one document before approval");
        }
        boolean hasUnverifiedDocument = provider.getDocuments().stream()
                .anyMatch(document -> document.getStatus() != ProviderDocumentStatus.VERIFIED);
        if (hasUnverifiedDocument) {
            throw new IllegalStateException("All provider documents must be verified before approval");
        }
    }
}
