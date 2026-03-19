package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovimentacaoEstoqueResponse {
  private Integer id;
  private Integer produtoId;
  private String produtoDescricao;
  private String naturezaOperacaoDescricao;
  private String tipoMovimento;
  private Integer pedidoId;
  private BigDecimal quantidade;
  private BigDecimal estoqueAposMovimentacao;
  private LocalDateTime dataMovimentacao;
}
