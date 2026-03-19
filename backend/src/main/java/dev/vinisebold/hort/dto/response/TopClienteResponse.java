package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopClienteResponse {

  private Integer clienteId;
  private String clienteNome;
  private Integer quantidadeCompras;
  private BigDecimal valorTotal;
}
