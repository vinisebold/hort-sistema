package dev.vinisebold.hort.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClienteResponse {
  private Integer id;
  private String tipoPessoa;
  private String documento;
  private String razaoSocial;
  private String nomeFantasia;
  private String endereco;
  private String contato;
  private Boolean isActive;
  private LocalDateTime createdAt;
}
