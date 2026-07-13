package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface TicketRepository extends JpaRepository<Ticket, String> {
    @Override
    @EntityGraph(attributePaths = {"asset"})
    Optional<Ticket> findById(String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"asset"})
    @Query("select ticket from Ticket ticket where ticket.id = :id")
    Optional<Ticket> findByIdForUpdate(@Param("id") String id);

    @EntityGraph(attributePaths = {"asset"})
    List<Ticket> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    @EntityGraph(attributePaths = {"asset"})
    List<Ticket> findByStatusOrderByCreatedAtAsc(TicketStatus status);

    @EntityGraph(attributePaths = {"asset"})
    List<Ticket> findByStatusInOrderByCreatedAtAsc(List<TicketStatus> statuses);

    long countByStatusIn(Collection<TicketStatus> statuses);

    @EntityGraph(attributePaths = {"asset"})
    List<Ticket> findByAssignedProviderIdOrderByUpdatedAtDesc(String providerId);

    @EntityGraph(attributePaths = {"asset"})
    @Query("""
            select distinct ticket
            from Ticket ticket
            left join ticket.offers offer
            where ticket.assignedProviderId = :providerId
               or (ticket.status in :opportunityStatuses and offer.providerId = :providerId)
            order by ticket.updatedAt desc
            """)
    List<Ticket> findVisibleForProvider(
            @Param("providerId") String providerId,
            @Param("opportunityStatuses") List<TicketStatus> opportunityStatuses
    );

    boolean existsByAssetIdAndIdNotAndStatusIn(
            String assetId,
            String excludedTicketId,
            List<TicketStatus> statuses
    );

    boolean existsByAssetIdIn(Collection<String> assetIds);

    @Query("select mediaUrl from Ticket ticket join ticket.mediaUrls mediaUrl")
    List<String> findReferencedMediaUrls();
}
