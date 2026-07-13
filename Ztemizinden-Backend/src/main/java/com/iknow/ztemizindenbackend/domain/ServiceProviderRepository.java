package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import com.iknow.ztemizindenbackend.domain.Enums.LandingVisibility;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"specialties", "expertiseTags", "coverageDistricts"})
    @Query("select provider from ServiceProvider provider where provider.id = :id")
    Optional<ServiceProvider> findByIdForUpdate(@Param("id") String id);

    @Override
    @EntityGraph(attributePaths = {"specialties", "expertiseTags", "coverageDistricts"})
    List<ServiceProvider> findAll();

    @Override
    @EntityGraph(attributePaths = {"specialties", "expertiseTags", "coverageDistricts"})
    Optional<ServiceProvider> findById(String id);

    @EntityGraph(attributePaths = {"specialties", "expertiseTags", "coverageDistricts"})
    Optional<ServiceProvider> findByEmailIgnoreCase(String email);

    Optional<ServiceProvider> findByIdentitySubject(String identitySubject);

    boolean existsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"specialties", "expertiseTags", "coverageDistricts"})
    List<ServiceProvider> findByStatusOrderByCreatedAtDesc(ProviderStatus status);

    long countByStatus(ProviderStatus status);

    long countByStatusAndLandingVisibility(
            ProviderStatus status,
            LandingVisibility landingVisibility
    );

    Page<ServiceProvider> findByStatusAndLandingVisibility(
            ProviderStatus status,
            LandingVisibility landingVisibility,
            Pageable pageable
    );

    @Query("select count(distinct lower(trim(provider.city))) from ServiceProvider provider where provider.status = :status")
    long countDistinctCitiesByStatus(@Param("status") ProviderStatus status);

    List<ServiceProvider> findByStatusAndLandingVisibility(
            ProviderStatus status,
            LandingVisibility landingVisibility,
            Sort sort
    );

    @Query("select provider.logoUrl from ServiceProvider provider where provider.logoUrl is not null")
    List<String> findReferencedLogoUrls();

    @Query("select document.url from ProviderDocument document where document.url is not null")
    List<String> findReferencedDocumentUrls();
}
