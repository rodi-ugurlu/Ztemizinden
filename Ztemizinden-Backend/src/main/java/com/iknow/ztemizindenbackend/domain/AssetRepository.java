package com.iknow.ztemizindenbackend.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, String> {
    List<Asset> findByOwnerIdOrderByCreatedAtDesc(String ownerId);
}
