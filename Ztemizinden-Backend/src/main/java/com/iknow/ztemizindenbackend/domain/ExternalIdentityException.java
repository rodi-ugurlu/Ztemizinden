package com.iknow.ztemizindenbackend.domain;

public class ExternalIdentityException extends RuntimeException {
    public ExternalIdentityException(String message) {
        super(message);
    }

    public ExternalIdentityException(String message, Throwable cause) {
        super(message, cause);
    }
}
