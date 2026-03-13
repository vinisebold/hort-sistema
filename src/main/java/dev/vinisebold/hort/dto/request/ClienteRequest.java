package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequest {

  @NotBlank(message = "O tipo de pessoa (Física/Jurídica) é obrigatório")
  private String tipoPessoa;

  private String documento;

  @NotBlank(message = "O nome ou razão social é obrigatório")
  private String razaoSocial;

  private String nomeFantasia;
  private String endereco;
  private String contato;
}
