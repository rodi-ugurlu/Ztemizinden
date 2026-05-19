package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.NotFoundException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository assetRepository;

    // ── Original flat list (backward compatibility) ───────────────────

    @Transactional(readOnly = true)
    public List<Asset> listForOwner(String ownerId) {
        return assetRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public Asset get(String assetId) {
        return assetRepository.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Asset not found: " + assetId));
    }

    // ── Tree operations ───────────────────────────────────────────────

    /**
     * Returns flat list of all assets for an owner, ordered by depth.
     * Tree assembly is done in the API layer to avoid lazy-loading issues.
     */
    @Transactional(readOnly = true)
    public List<Asset> getTreeFlat(String ownerId) {
        return assetRepository.findFullTreeByOwnerId(ownerId);
    }

    /**
     * Returns ancestors from root to the given asset's parent (breadcrumb path).
     * Walks up the parent chain within a single transaction.
     */
    @Transactional(readOnly = true)
    public List<AssetBreadcrumb> ancestors(String assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Asset not found: " + assetId));
        List<AssetBreadcrumb> path = new ArrayList<>();
        Asset current = asset.getParent();
        while (current != null) {
            path.addFirst(new AssetBreadcrumb(current.getId(), current.getName(), current.getDepth()));
            current = current.getParent();
        }
        return path;
    }

    public record AssetBreadcrumb(String id, String name, int depth) {
    }

    // ── Create ────────────────────────────────────────────────────────

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

        if (command.parentId() != null && !command.parentId().isBlank()) {
            Asset parent = assetRepository.findById(command.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent asset not found: " + command.parentId()));
            if (!parent.getOwnerId().equals(command.ownerId())) {
                throw new BadRequestException("Parent asset does not belong to customer");
            }
            parent.addChild(asset);
            return assetRepository.save(asset);
        }

        return assetRepository.save(asset);
    }

    // ── Move ──────────────────────────────────────────────────────────

    /**
     * Moves an asset to a new parent or to root (newParentId = null).
     */
    @Transactional
    public Asset move(String assetId, String newParentId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Asset not found: " + assetId));

        Asset newParent = null;
        if (newParentId != null && !newParentId.isBlank()) {
            newParent = assetRepository.findById(newParentId)
                    .orElseThrow(() -> new NotFoundException("Target parent not found: " + newParentId));
            if (!newParent.getOwnerId().equals(asset.getOwnerId())) {
                throw new BadRequestException("Target parent does not belong to the same customer");
            }
        }

        asset.moveTo(newParent);
        return assetRepository.save(asset);
    }

    // ── Reorder ───────────────────────────────────────────────────────

    /**
     * Reorders children of a given parent.
     */
    @Transactional
    public void reorder(String parentId, List<String> orderedChildIds) {
        Asset parent = assetRepository.findById(parentId)
                .orElseThrow(() -> new NotFoundException("Parent not found: " + parentId));
        parent.reorderChildren(orderedChildIds);
        assetRepository.save(parent);
    }

    // ── Delete ────────────────────────────────────────────────────────

    /**
     * Deletes an asset and its entire subtree (cascade).
     * If the deleted asset had a parent, updates the parent's leaf flag.
     */
    @Transactional
    public void delete(String assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Asset not found: " + assetId));

        if (asset.getParent() != null) {
            asset.getParent().removeChild(asset);
            assetRepository.save(asset.getParent());
        } else {
            assetRepository.delete(asset);
        }
    }

    // ── Command Records ───────────────────────────────────────────────

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
            String description,
            String parentId
    ) {
        /** Backward-compatible constructor without parentId. */
        public CreateAssetCommand(
                String ownerId, String name, String tagNo, AssetType type,
                String brand, String model, String serialNumber,
                LocalDate purchaseDate, LocalDate warrantyEndDate,
                String location, String department, String description
        ) {
            this(ownerId, name, tagNo, type, brand, model, serialNumber,
                    purchaseDate, warrantyEndDate, location, department, description, null);
        }
    }

    public record MoveAssetCommand(String newParentId) {
    }

    public record ReorderCommand(List<String> orderedChildIds) {
    }

    // ── Private helpers ───────────────────────────────────────────────
}
