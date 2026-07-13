package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.AssetService;
import com.iknow.ztemizindenbackend.application.AssetService.CreateAssetCommand;
import com.iknow.ztemizindenbackend.application.AssetService.AssetBreadcrumb;
import com.iknow.ztemizindenbackend.application.AssetService.UpdateAssetCommand;
import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.domain.Asset;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assets")
public class AssetController {
    private final AssetService assetService;
    private final CurrentUser currentUser;

    // ── Existing flat list endpoint (backward compatibility) ──────────

    @GetMapping
    public List<AssetResponse> list(@RequestParam String ownerId) {
        return assetService.listForOwner(currentUser.customerId(ownerId)).stream()
                .map(AssetController::toResponse)
                .toList();
    }

    // ── Tree endpoint ─────────────────────────────────────────────────

    /**
     * Returns the full asset tree as nested JSON.
     * Uses a flat CTE query, then builds the tree in-memory using a HashMap
     * to avoid Hibernate LazyInitializationException.
     */
    @GetMapping("/tree")
    public List<AssetTreeNode> tree(@RequestParam String ownerId) {
        List<Asset> flatList = assetService.getTreeFlat(currentUser.customerId(ownerId));
        return buildTreeFromFlatList(flatList);
    }

    // ── Create (now accepts optional parentId) ────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssetResponse create(@Valid @RequestBody CreateAssetRequest request) {
        Asset asset = assetService.create(new CreateAssetCommand(
                currentUser.customerId(request.ownerId()),
                request.name(),
                request.tagNo(),
                ApiEnums.assetType(request.type()),
                request.brand(),
                request.model(),
                request.serialNumber(),
                request.purchaseDate(),
                request.warrantyEndDate(),
                request.location(),
                request.department(),
                request.description(),
                request.parentId()
        ));
        return toResponse(asset);
    }

    // ── Update metadata (does not move hierarchy) ─────────────────────

    @PutMapping("/{id}")
    public AssetResponse update(@PathVariable String id, @Valid @RequestBody UpdateAssetRequest request) {
        currentUser.requireCustomerAsset(assetService.get(id));
        Asset asset = assetService.update(id, new UpdateAssetCommand(
                request.name(),
                request.tagNo(),
                ApiEnums.assetType(request.type()),
                request.brand(),
                request.model(),
                request.serialNumber(),
                request.purchaseDate(),
                request.warrantyEndDate(),
                ApiEnums.assetStatus(request.status()),
                request.location(),
                request.department(),
                request.description()
        ));
        return toResponse(asset);
    }

    // ── Move ──────────────────────────────────────────────────────────

    @PutMapping("/{id}/move")
    public AssetResponse move(@PathVariable String id, @Valid @RequestBody MoveAssetRequest request) {
        currentUser.requireCustomerAsset(assetService.get(id));
        Asset asset = assetService.move(id, request.newParentId());
        return toResponse(asset);
    }

    // ── Reorder children ──────────────────────────────────────────────

    @PutMapping("/{id}/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@PathVariable String id, @Valid @RequestBody ReorderRequest request) {
        currentUser.requireCustomerAsset(assetService.get(id));
        assetService.reorder(id, request.orderedChildIds());
    }

    // ── Delete ────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        currentUser.requireCustomerAsset(assetService.get(id));
        assetService.delete(id);
    }

    // ── Ancestors (breadcrumb) ────────────────────────────────────────

    @GetMapping("/{id}/ancestors")
    public List<AssetBreadcrumbItem> ancestors(@PathVariable String id) {
        currentUser.requireCustomerAsset(assetService.get(id));
        return assetService.ancestors(id).stream()
                .map(b -> new AssetBreadcrumbItem(b.id(), b.name(), b.depth()))
                .toList();
    }

    // ── Tree building (DTO-based, no JPA lazy access) ─────────────────

    /**
     * Builds a nested tree from a depth-ordered flat list.
     * Uses a LinkedHashMap so insertion order is preserved.
     * Parent IDs come from the DB column directly (depth field), not from
     * JPA relationship navigation — this avoids LazyInitializationException.
     */
    private static List<AssetTreeNode> buildTreeFromFlatList(List<Asset> flatList) {
        // Step 1: Convert every entity to a mutable DTO node
        Map<String, MutableTreeNode> nodeMap = new LinkedHashMap<>();
        for (Asset asset : flatList) {
            nodeMap.put(asset.getId(), new MutableTreeNode(asset));
        }

        // Step 2: Wire parent → child relationships using the depth/parentId columns
        List<AssetTreeNode> roots = new ArrayList<>();
        for (MutableTreeNode node : nodeMap.values()) {
            if (node.parentId != null && nodeMap.containsKey(node.parentId)) {
                nodeMap.get(node.parentId).children.add(node);
            } else {
                // root node
                roots.add(null); // placeholder, will be replaced below
            }
        }

        // Step 3: Convert to immutable response records (recursive)
        roots.clear();
        for (MutableTreeNode node : nodeMap.values()) {
            if (node.parentId == null || !nodeMap.containsKey(node.parentId)) {
                roots.add(node.toRecord());
            }
        }

        return roots;
    }

    /** Mutable helper for building the tree — never touches JPA lazy fields. */
    private static class MutableTreeNode {
        final String id;
        final String ownerId;
        final String name;
        final String tagNo;
        final String type;
        final String brand;
        final String model;
        final String serialNumber;
        final String status;
        final String location;
        final String department;
        final String description;
        final String parentId;
        final int depth;
        final boolean leaf;
        final int sortOrder;
        final Instant createdAt;
        final Instant updatedAt;
        final List<MutableTreeNode> children = new ArrayList<>();

        MutableTreeNode(Asset asset) {
            this.id = asset.getId();
            this.ownerId = asset.getOwnerId();
            this.name = asset.getName();
            this.tagNo = asset.getTagNo();
            this.type = ApiEnums.display(asset.getType());
            this.brand = asset.getBrand();
            this.model = asset.getModel();
            this.serialNumber = asset.getSerialNumber();
            this.status = ApiEnums.display(asset.getStatus());
            this.location = asset.getLocation();
            this.department = asset.getDepartment();
            this.description = asset.getDescription();
            // Read parent_id from the entity's mapped column, NOT from the @ManyToOne relationship
            this.parentId = asset.getParentId();
            this.depth = asset.getDepth();
            this.leaf = asset.isLeaf();
            this.sortOrder = asset.getSortOrder();
            this.createdAt = asset.getCreatedAt();
            this.updatedAt = asset.getUpdatedAt();
        }

        int descendantCount() {
            int count = children.size();
            for (MutableTreeNode child : children) {
                count += child.descendantCount();
            }
            return count;
        }

        AssetTreeNode toRecord() {
            List<AssetTreeNode> childRecords = children.stream()
                    .map(MutableTreeNode::toRecord)
                    .toList();
            return new AssetTreeNode(
                    id, ownerId, name, tagNo, type, brand, model, serialNumber,
                    status, location, department, description, parentId,
                    depth, leaf, sortOrder,
                    children.size(), descendantCount(),
                    createdAt, updatedAt, childRecords
            );
        }
    }

    // ── Entity → flat DTO (safe, no lazy access) ──────────────────────

    private static AssetResponse toResponse(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getOwnerId(),
                asset.getName(),
                asset.getTagNo(),
                ApiEnums.display(asset.getType()),
                asset.getBrand(),
                asset.getModel(),
                asset.getSerialNumber(),
                asset.getPurchaseDate(),
                asset.getWarrantyEndDate(),
                ApiEnums.display(asset.getStatus()),
                asset.getLocation(),
                asset.getDepartment(),
                asset.getDescription(),
                asset.getParentId(),
                asset.getDepth(),
                asset.isLeaf(),
                asset.getSortOrder(),
                asset.getCreatedAt(),
                asset.getUpdatedAt()
        );
    }

    // ── Request / Response records ────────────────────────────────────

    public record CreateAssetRequest(
            @NotBlank @Size(max = 255) String ownerId,
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) String tagNo,
            @NotBlank @Size(max = 50) String type,
            @NotBlank @Size(max = 255) String brand,
            @NotBlank @Size(max = 255) String model,
            @NotBlank @Size(max = 255) String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            @Size(max = 255) String location,
            @Size(max = 255) String department,
            @Size(max = 2_000) String description,
            @Size(max = 255) String parentId
    ) {
    }

    public record MoveAssetRequest(@Size(max = 255) String newParentId) {
    }

    public record UpdateAssetRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) String tagNo,
            @NotBlank @Size(max = 50) String type,
            @NotBlank @Size(max = 255) String brand,
            @NotBlank @Size(max = 255) String model,
            @NotBlank @Size(max = 255) String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            @NotBlank @Size(max = 50) String status,
            @Size(max = 255) String location,
            @Size(max = 255) String department,
            @Size(max = 2_000) String description
    ) {
    }

    public record ReorderRequest(
            @NotEmpty @Size(max = 1_000) List<@NotBlank @Size(max = 255) String> orderedChildIds
    ) {
    }

    public record AssetBreadcrumbItem(String id, String name, int depth) {
    }

    public record AssetResponse(
            String id,
            String ownerId,
            String name,
            String tagNo,
            String type,
            String brand,
            String model,
            String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            String status,
            String location,
            String department,
            String description,
            String parentId,
            int depth,
            boolean leaf,
            int sortOrder,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record AssetTreeNode(
            String id,
            String ownerId,
            String name,
            String tagNo,
            String type,
            String brand,
            String model,
            String serialNumber,
            String status,
            String location,
            String department,
            String description,
            String parentId,
            int depth,
            boolean leaf,
            int sortOrder,
            int childCount,
            int descendantCount,
            Instant createdAt,
            Instant updatedAt,
            List<AssetTreeNode> children
    ) {
    }
}
