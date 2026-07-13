package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
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
    private final KeycloakIdentityService keycloakIdentityService;

    @Transactional(readOnly = true)
    public List<ServiceProvider> list() {
        List<ServiceProvider> providers = serviceProviderRepository.findAll();
        providers.forEach(this::initializeDocuments);
        return providers;
    }

    @Transactional(readOnly = true)
    public List<ServiceProvider> verifiedProviders() {
        List<ServiceProvider> providers = serviceProviderRepository.findByStatusOrderByCreatedAtDesc(ProviderStatus.VERIFIED);
        providers.forEach(this::initializeDocuments);
        return providers;
    }

    @Transactional(readOnly = true)
    public ServiceProvider getByEmail(String email) {
        ServiceProvider provider = serviceProviderRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        initializeDocuments(provider);
        return provider;
    }

    @Transactional(readOnly = true)
    public ServiceProvider getCurrent(String identitySubject, String email) {
        ServiceProvider provider = identitySubject == null || identitySubject.isBlank()
                ? getByEmail(email)
                : serviceProviderRepository.findByIdentitySubject(identitySubject)
                        .orElseGet(() -> getByEmail(email));
        initializeDocuments(provider);
        return provider;
    }

    @Transactional
    public ServiceProvider updateProfileByEmail(String email, UpdateProviderProfileCommand command) {
        ServiceProvider provider = getByEmail(email);
        provider.updateProfile(
                command.name(),
                command.contactName(),
                command.phone(),
                command.city(),
                command.district(),
                command.address(),
                command.taxNumber(),
                command.logoUrl(),
                command.specialties(),
                command.expertiseTags(),
                command.coverageDistricts()
        );
        return provider;
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
                command.district(),
                command.specialties(),
                command.expertiseTags(),
                command.coverageDistricts()
        );

        ServiceProvider savedProvider = serviceProviderRepository.saveAndFlush(provider);
        String identitySubject = keycloakIdentityService.provisionServiceProvider(
                savedProvider.getId(),
                savedProvider.getEmail(),
                savedProvider.getName(),
                command.password()
        );
        savedProvider.linkIdentity(identitySubject);
        return savedProvider;
    }

    @Transactional
    public ServiceProvider verify(String providerId) {
        ServiceProvider provider = getForUpdate(providerId);
        requireVerifiedDocuments(provider);
        boolean previouslyEnabled = provider.getStatus() == ProviderStatus.VERIFIED;
        keycloakIdentityService.enableUser(provider.getIdentitySubject(), provider.getEmail());
        keycloakIdentityService.restoreEnabledAfterRollback(
                provider.getIdentitySubject(),
                provider.getEmail(),
                previouslyEnabled
        );
        provider.verify();
        return provider;
    }

    @Transactional
    public ServiceProvider reject(String providerId) {
        ServiceProvider provider = getForUpdate(providerId);
        boolean previouslyEnabled = provider.getStatus() == ProviderStatus.VERIFIED;
        keycloakIdentityService.disableUser(provider.getIdentitySubject(), provider.getEmail());
        keycloakIdentityService.restoreEnabledAfterRollback(
                provider.getIdentitySubject(),
                provider.getEmail(),
                previouslyEnabled
        );
        provider.suspend();
        initializeDocuments(provider);
        return provider;
    }

    @Transactional
    public ServiceProvider setTrusted(String providerId, boolean trusted) {
        ServiceProvider provider = getForUpdate(providerId);
        provider.setTrusted(trusted);
        initializeDocuments(provider);
        return provider;
    }

    @Transactional
    public ServiceProvider updateLandingRequest(String identitySubject, String email, boolean visible) {
        ServiceProvider provider = getCurrent(identitySubject, email);
        if (visible) {
            provider.requestLandingVisibility();
        } else {
            provider.hideFromLanding();
        }
        return provider;
    }

    @Transactional
    public ServiceProvider approveLandingVisibility(String providerId) {
        ServiceProvider provider = getForUpdate(providerId);
        provider.approveLandingVisibility();
        return provider;
    }

    @Transactional
    public ServiceProvider rejectLandingVisibility(String providerId) {
        ServiceProvider provider = getForUpdate(providerId);
        provider.rejectLandingVisibility();
        return provider;
    }

    @Transactional
    public ProviderDocument addDocument(String providerId, AddDocumentCommand command) {
        ServiceProvider provider = getForUpdate(providerId);
        return provider.addDocument(command.type(), command.url(), command.originalFileName(), command.contentSha256());
    }

    @Transactional
    public ProviderDocument verifyDocument(String providerId, String documentId, String notes) {
        ServiceProvider provider = getForUpdate(providerId);
        provider.verifyDocument(documentId, notes);
        return provider.getDocuments().stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Provider document not found"));
    }

    @Transactional
    public ProviderDocument rejectDocument(String providerId, String documentId, String notes) {
        ServiceProvider provider = getForUpdate(providerId);
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
            String district,
            Set<TicketCategory> specialties,
            Set<String> expertiseTags,
            Set<String> coverageDistricts,
            String password
    ) {
    }

    public record UpdateProviderProfileCommand(
            String name,
            String contactName,
            String phone,
            String city,
            String district,
            String address,
            String taxNumber,
            String logoUrl,
            Set<TicketCategory> specialties,
            Set<String> expertiseTags,
            Set<String> coverageDistricts
    ) {
    }

    public record AddDocumentCommand(String type, String url, String originalFileName, String contentSha256) {
        public AddDocumentCommand(String type, String url, String originalFileName) {
            this(type, url, originalFileName, null);
        }
    }

    private void initializeDocuments(ServiceProvider provider) {
        provider.getDocuments().size();
    }

    private void requireVerifiedDocuments(ServiceProvider provider) {
        provider.requireApprovalReadyDocuments();
    }

    private ServiceProvider getForUpdate(String providerId) {
        ServiceProvider provider = serviceProviderRepository.findByIdForUpdate(providerId)
                .orElseThrow(() -> new NotFoundException("Provider not found"));
        initializeDocuments(provider);
        return provider;
    }
}
