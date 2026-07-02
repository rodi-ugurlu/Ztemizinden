package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.TicketStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, String> {
    @Override
    @EntityGraph(attributePaths = {"asset", "offers", "messages", "conversations", "conversations.offer", "conversations.messages", "mediaUrls"})
    Optional<Ticket> findById(String id);

    @EntityGraph(attributePaths = {"asset", "offers", "messages", "conversations", "conversations.offer", "conversations.messages", "mediaUrls"})
    List<Ticket> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    @EntityGraph(attributePaths = {"asset", "offers", "messages", "conversations", "conversations.offer", "conversations.messages", "mediaUrls"})
    List<Ticket> findByStatusOrderByCreatedAtAsc(TicketStatus status);

    @EntityGraph(attributePaths = {"asset", "offers", "messages", "conversations", "conversations.offer", "conversations.messages", "mediaUrls"})
    List<Ticket> findByStatusInOrderByCreatedAtAsc(List<TicketStatus> statuses);

    @EntityGraph(attributePaths = {"asset", "offers", "messages", "conversations", "conversations.offer", "conversations.messages", "mediaUrls"})
    List<Ticket> findByAssignedProviderIdOrderByUpdatedAtDesc(String providerId);

    @EntityGraph(attributePaths = {"asset", "offers", "messages", "conversations", "conversations.offer", "conversations.messages", "mediaUrls"})
    @Query("""
            select distinct ticket
            from Ticket ticket
            left join ticket.offers offer
            where ticket.assignedProviderId = :providerId
               or offer.providerId = :providerId
            order by ticket.updatedAt desc
            """)
    List<Ticket> findVisibleForProvider(@Param("providerId") String providerId);
}
