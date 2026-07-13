package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.KeycloakIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private static final String PASSWORD_RESET_REQUESTED_MESSAGE =
            "Eğer bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.";

    private final KeycloakIdentityService keycloakIdentityService;

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        keycloakIdentityService.requestPasswordReset(request.email());
        return new MessageResponse(PASSWORD_RESET_REQUESTED_MESSAGE);
    }

    public record ForgotPasswordRequest(
            @Email @NotBlank @Size(max = 255) String email
    ) {
    }

    public record MessageResponse(String message) {
    }
}
