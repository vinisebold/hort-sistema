package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private Integer usuarioId;
    private String email;
    private String cnpj;
    private String nomeFantasia;
    private String razaoSocial;
    private boolean primeiroAcesso;
}
