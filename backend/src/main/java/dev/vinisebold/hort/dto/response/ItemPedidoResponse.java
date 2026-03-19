package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ItemPedidoResponse {
  private Integer id;
  private Integer produtoId;
  private String produtoDescricao;
  private BigDecimal quantidade;
  private BigDecimal valorUnitario;
  private BigDecimal valorTotal;
  private BigDecimal custoUnitario; // Opcional expor, mas legal para ver o FIFO funcionando
}
