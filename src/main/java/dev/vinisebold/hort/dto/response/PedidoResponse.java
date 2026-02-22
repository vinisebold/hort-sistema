package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PedidoResponse {
    private Integer id;
    private String naturezaOperacao;
    private String clienteNome; // Pode ser nulo em vendas de balcão
    private String formaPagamento;
    private String documentoReferencia;
    private BigDecimal valorTotal;
    private String statusPagamento;
    private LocalDateTime dataEmissao;

    private List<ItemPedidoResponse> itens;
}