package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ClienteFinanceiroResponse {
    private ClienteResponse clienteResponse;
    private BigDecimal dividaTotal;
    private BigDecimal dividaMesAtual;
    private BigDecimal dividaMesAnterior;
    private BigDecimal saldoCredito;
    private Integer totalPedidosPendentes;
    private Integer totalPedidosPagos;
    private List<PedidoResponse> historicoPedidos;
}
