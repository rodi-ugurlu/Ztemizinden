package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.AssetStatus;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "assets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Asset extends BaseEntity {

    private static final int MAX_DEPTH = 10;

    @Column(nullable = false)
    private String ownerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String tagNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String serialNumber;

    private LocalDate purchaseDate;
    private LocalDate warrantyEndDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetStatus status = AssetStatus.ACTIVE;

    private String location;
    private String department;

    @Column(length = 2_000)
    private String description;

    // ── Hierarchy fields ──────────────────────────────────────────────

    /**
     * Read-only mapping of the parent_id FK column.
     * Allows reading the parent's ID without triggering lazy-loading of the parent entity.
     */
    @Column(name = "parent_id", insertable = false, updatable = false)
    private String parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Asset parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, createdAt ASC")
    private List<Asset> children = new ArrayList<>();

    @Column(nullable = false)
    private int depth = 0;

    @Column(nullable = false)
    private int sortOrder = 0;

    @Column(nullable = false)
    private boolean leaf = true;

    // ── Constructors ──────────────────────────────────────────────────

    public Asset(
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
        this.ownerId = ownerId;
        this.name = name;
        this.tagNo = tagNo;
        this.type = type;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.purchaseDate = purchaseDate;
        this.warrantyEndDate = warrantyEndDate;
        this.location = location;
        this.department = department;
        this.description = description;
    }

    // ── Status methods (existing) ─────────────────────────────────────

    public void markUnderMaintenance() {
        status = AssetStatus.UNDER_MAINTENANCE;
    }

    public void markActive() {
        status = AssetStatus.ACTIVE;
    }

    public void updateDetails(
            String name,
            String tagNo,
            AssetType type,
            String brand,
            String model,
            String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            AssetStatus status,
            String location,
            String department,
            String description
    ) {
        this.name = name;
        this.tagNo = tagNo;
        this.type = type;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.purchaseDate = purchaseDate;
        this.warrantyEndDate = warrantyEndDate;
        this.status = status;
        this.location = location;
        this.department = department;
        this.description = description;
    }

    // ── Hierarchy domain methods ──────────────────────────────────────

    /**
     * Adds a child asset to this node.
     * Updates depth, leaf flags, and owner inheritance.
     */
    public void addChild(Asset child) {
        int childDepth = this.depth + 1;
        if (childDepth > MAX_DEPTH) {
            throw new IllegalStateException(
                    "Maximum hierarchy depth (" + MAX_DEPTH + ") exceeded. Current depth: " + this.depth);
        }

        child.parent = this;
        child.depth = childDepth;
        child.ownerId = this.ownerId;
        child.sortOrder = this.children.size();
        this.children.add(child);
        this.leaf = false;
    }

    /**
     * Removes a child asset from this node.
     * Updates leaf flag if no children remain.
     */
    public void removeChild(Asset child) {
        this.children.remove(child);
        child.parent = null;
        child.depth = 0;
        if (this.children.isEmpty()) {
            this.leaf = true;
        }
    }

    /**
     * Moves this asset to a new parent (or to root if newParent is null).
     * Recursively recalculates depth for the entire subtree.
     */
    public void moveTo(Asset newParent) {
        if (newParent != null) {
            int targetDepth = newParent.depth + 1;
            if (targetDepth + subtreeMaxDepth() > MAX_DEPTH) {
                throw new IllegalStateException(
                        "Moving this subtree would exceed maximum hierarchy depth (" + MAX_DEPTH + ")");
            }
            // Prevent circular reference: new parent must not be a descendant of this node
            if (isDescendantOf(this, newParent)) {
                throw new IllegalStateException("Cannot move an asset under its own descendant");
            }
        }

        // Detach from current parent
        if (this.parent != null) {
            this.parent.children.remove(this);
            if (this.parent.children.isEmpty()) {
                this.parent.leaf = true;
            }
        }

        // Attach to new parent
        if (newParent != null) {
            this.parent = newParent;
            this.depth = newParent.depth + 1;
            this.sortOrder = newParent.children.size();
            newParent.children.add(this);
            newParent.leaf = false;
        } else {
            this.parent = null;
            this.depth = 0;
        }

        // Recalculate depth for entire subtree
        recalculateSubtreeDepth();
    }

    /**
     * Returns the ancestors path from root to this node's parent (inclusive).
     * Useful for breadcrumb navigation.
     */
    public List<Asset> ancestors() {
        List<Asset> path = new ArrayList<>();
        Asset current = this.parent;
        while (current != null) {
            path.addFirst(current);
            current = current.parent;
        }
        return path;
    }

    /**
     * Whether this node is a root node (no parent).
     */
    public boolean isRoot() {
        return parent == null;
    }

    /**
     * Total number of descendants (recursive child count).
     */
    public int descendantCount() {
        int count = children.size();
        for (Asset child : children) {
            count += child.descendantCount();
        }
        return count;
    }

    /**
     * Reorders children by the given list of child IDs.
     */
    public void reorderChildren(List<String> orderedChildIds) {
        if (orderedChildIds == null) {
            throw new BadRequestException("Ordered child IDs are required");
        }

        Set<String> seen = new HashSet<>();
        Set<String> childIds = new HashSet<>();
        for (Asset child : children) {
            childIds.add(child.getId());
        }
        if (orderedChildIds.size() != childIds.size()) {
            throw new BadRequestException("Reorder request must include every direct child exactly once");
        }

        for (int i = 0; i < orderedChildIds.size(); i++) {
            String childId = orderedChildIds.get(i);
            if (!seen.add(childId)) {
                throw new BadRequestException("Duplicate child id in reorder request");
            }
            if (!childIds.contains(childId)) {
                throw new BadRequestException("Reorder request contains a non-child asset");
            }
            for (Asset child : children) {
                if (child.getId().equals(childId)) {
                    child.sortOrder = i;
                    break;
                }
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────

    private void recalculateSubtreeDepth() {
        for (Asset child : children) {
            child.depth = this.depth + 1;
            child.recalculateSubtreeDepth();
        }
    }

    private int subtreeMaxDepth() {
        int max = 0;
        for (Asset child : children) {
            max = Math.max(max, 1 + child.subtreeMaxDepth());
        }
        return max;
    }

    private static boolean isDescendantOf(Asset potentialAncestor, Asset node) {
        Asset current = node;
        while (current != null) {
            if (current.getId() != null && current.getId().equals(potentialAncestor.getId())) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }
}
