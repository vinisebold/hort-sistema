package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ClienteResponse {
    private Integer id;
    private String tipoPessoa;
    private String documento;
    private String razaoSocial;
    private String nomeFantasia;
    private String endereco;
    private String telefone;
    private Boolean isActive;
    private LocalDateTime createdAt;
}