package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "A senha é obrigatória")
    private String senha;
}
