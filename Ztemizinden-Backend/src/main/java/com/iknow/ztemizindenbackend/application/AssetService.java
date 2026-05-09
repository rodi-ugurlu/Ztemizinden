package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository assetRepository;

    @Transactional(readOnly = true)
    public List<Asset> listForOwner(String ownerId) {
        return assetRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional
    public Asset create(CreateAssetCommand command) {
        Asset asset = new Asset(
                command.ownerId(),
                command.name(),
                command.tagNo(),
                command.type(),
                command.brand(),
                command.model(),
                command.serialNumber(),
                command.purchaseDate(),
                command.warrantyEndDate(),
                command.location(),
                command.department(),
                command.description()
        );

        return assetRepository.save(asset);
    }

    public record CreateAssetCommand(
            String ownerId,
            String name,
            String tagNo,
            AssetType type,
            String brand,
            String model,
            String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            String location,
            String department,
            String description
    ) {
    }
}
