package dev.vinisebold.hort.dto.response;

import com.fasterxml.jackson.annotation.JsonGetter;
import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClienteFinanceiroResponse {
  private ClienteResponse cliente;
  private BigDecimal dividaTotal;
  private BigDecimal dividaMesAtual;
  private BigDecimal dividaMesAnterior;
  private BigDecimal saldoCredito;
  private Integer totalPedidosPendentes;
  private Integer totalPedidosPagos;
  private List<PedidoResponse> historicoPedidos;

  @JsonGetter("clienteResponse")
  public ClienteResponse getClienteResponseCompat() {
    return cliente;
  }
}
