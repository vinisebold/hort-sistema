package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProdutoResponse {
  private Integer id;
  private String codigo;
  private String descricao;
  private UnidadeMedidaResponse unidadeMedida; // Objeto aninhado para o Frontend ter a sigla na tela
  private BigDecimal estoqueAtual;
  private Boolean isActive;
  private LocalDateTime createdAt;
}
