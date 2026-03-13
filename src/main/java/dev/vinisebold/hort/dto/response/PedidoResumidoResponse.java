package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PedidoResumidoResponse {
  private Integer id;
  private String naturezaOperacao;
  private String clienteNome;
  private BigDecimal valorTotal;
  private String status;
  private LocalDateTime dataEmissao;
}
