package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.AuthService;
import com.iknow.ztemizindenbackend.application.AuthService.LoginResult;
import com.iknow.ztemizindenbackend.application.PasswordResetService;
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

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request.email(), request.password());
        return new TokenResponse(result.accessToken(), "Bearer", result.expiresInSeconds());
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.email());
        return new MessageResponse(PASSWORD_RESET_REQUESTED_MESSAGE);
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return new MessageResponse("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record ForgotPasswordRequest(
            @Email @NotBlank String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, max = 128) String newPassword
    ) {
    }

    public record TokenResponse(
            String access_token,
            String token_type,
            long expires_in
    ) {
    }

    public record MessageResponse(String message) {
    }
}
