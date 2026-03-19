package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnidadeMedidaRequest {
  @NotBlank(message = "A sigla é obrigatória (ex: KG, CX)")
  private String sigla;
  private String descricao;
}
