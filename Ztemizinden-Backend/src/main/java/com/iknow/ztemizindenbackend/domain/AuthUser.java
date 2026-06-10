package com.iknow.ztemizindenbackend.domain;

import com.iknow.ztemizindenbackend.domain.Enums.AuthRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "auth_users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuthUser extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthRole role;

    @Column(nullable = false)
    private boolean enabled = true;

    private String customerId;

    private String providerId;

    public AuthUser(String email, String passwordHash, AuthRole role, String customerId, String providerId) {
        this.email = normalizeEmail(email);
        this.passwordHash = passwordHash;
        this.role = role;
        this.customerId = customerId;
        this.providerId = providerId;
    }

    public void enable() {
        enabled = true;
    }

    public void disable() {
        enabled = false;
    }

    public void restore(String email, String passwordHash, AuthRole role, String customerId, String providerId) {
        this.email = normalizeEmail(email);
        this.passwordHash = passwordHash;
        this.role = role;
        this.customerId = customerId;
        this.providerId = providerId;
        enable();
    }

    private String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }
}
