package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResumoResponse {

  private String produtoMaisVendidoNome;
  private Integer produtoMaisVendidoQtd;
  private String clienteMaisFielNome;
  private Integer clienteMaisFielCompras;
  private BigDecimal totalVendidoPeriodo;
}
