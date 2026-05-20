package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.AuthService;
import com.iknow.ztemizindenbackend.application.AuthService.LoginResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request.email(), request.password());
        return new TokenResponse(result.accessToken(), "Bearer", result.expiresInSeconds());
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record TokenResponse(
            String access_token,
            String token_type,
            long expires_in
    ) {
    }
}
