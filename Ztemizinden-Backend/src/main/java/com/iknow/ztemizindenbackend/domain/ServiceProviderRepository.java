package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.ProviderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, String> {
    @Override
    @EntityGraph(attributePaths = {"specialties", "documents"})
    List<ServiceProvider> findAll();

    @Override
    @EntityGraph(attributePaths = {"specialties", "documents"})
    Optional<ServiceProvider> findById(String id);

    @EntityGraph(attributePaths = {"specialties", "documents"})
    Optional<ServiceProvider> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"specialties", "documents"})
    List<ServiceProvider> findByStatusOrderByCreatedAtDesc(ProviderStatus status);
}
