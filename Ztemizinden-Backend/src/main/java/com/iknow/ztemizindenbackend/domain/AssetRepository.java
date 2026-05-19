package com.iknow.ztemizindenbackend.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetRepository extends JpaRepository<Asset, String> {

    /** Original flat list — still used by the legacy Assets page. */
    List<Asset> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    /** Root assets (no parent) for a given owner, ordered for tree display. */
    List<Asset> findByOwnerIdAndParentIsNullOrderBySortOrderAscCreatedAtAsc(String ownerId);

    /** Direct children of a given parent, ordered. */
    List<Asset> findByParentIdOrderBySortOrderAscCreatedAtAsc(String parentId);

    /** Find by ID with eagerly fetched children (single-level). */
    @Query("SELECT a FROM Asset a LEFT JOIN FETCH a.children WHERE a.id = :id")
    Optional<Asset> findByIdWithChildren(@Param("id") String id);

    /**
     * Full tree via PostgreSQL recursive CTE.
     * Returns all assets belonging to an owner, ordered by depth and sort_order.
     * The application layer builds the nested tree from this flat result.
     */
    @Query(nativeQuery = true, value = """
            WITH RECURSIVE tree AS (
                SELECT * FROM assets WHERE owner_id = :ownerId AND parent_id IS NULL
                UNION ALL
                SELECT a.* FROM assets a INNER JOIN tree t ON a.parent_id = t.id
            )
            SELECT * FROM tree ORDER BY depth ASC, sort_order ASC, created_at ASC
            """)
    List<Asset> findFullTreeByOwnerId(@Param("ownerId") String ownerId);

    /** Check if any children exist for a given parent. */
    boolean existsByParentId(String parentId);

    /** Count direct children of a parent. */
    long countByParentId(String parentId);
}
