package com.iknow.ztemizindenbackend.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByEmailIgnoreCase(String email);

    Optional<Customer> findByIdentitySubject(String identitySubject);

    boolean existsByEmailIgnoreCase(String email);

    @Query("select customer.logoUrl from Customer customer where customer.logoUrl is not null")
    List<String> findReferencedLogoUrls();
}
