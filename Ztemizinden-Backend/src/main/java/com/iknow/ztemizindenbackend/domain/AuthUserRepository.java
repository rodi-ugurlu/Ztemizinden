package com.iknow.ztemizindenbackend.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthUserRepository extends JpaRepository<AuthUser, String> {
    Optional<AuthUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
