package com.iknow.ztemizindenbackend.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketConversationRepository extends JpaRepository<TicketConversation, String> {
    @Override
    @EntityGraph(attributePaths = {"ticket", "offer", "messages"})
    Optional<TicketConversation> findById(String id);
}
