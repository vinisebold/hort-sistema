package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopProdutoResponse {

  private Integer produtoId;
  private String produtoNome;
  private BigDecimal quantidadeVendida;
  private BigDecimal valorTotal;
}
