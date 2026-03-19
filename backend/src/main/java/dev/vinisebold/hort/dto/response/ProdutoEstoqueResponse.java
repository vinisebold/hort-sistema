package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProdutoEstoqueResponse {
  private Integer id;
  private String codigo;
  private String descricao;
  private String unidadeMedidaSigla;
  private BigDecimal estoqueAtual;
  private Boolean isActive;
}
