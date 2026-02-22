package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PedidoRequest {

    @NotNull(message = "A natureza da operação (Venda/Compra) é obrigatória")
    private Integer naturezaOperacaoId;

    private Integer clienteId; // Opcional (venda rápida no balcão)

    @NotNull(message = "A forma de pagamento é obrigatória")
    private Integer formaPagamentoId;

    private String documentoReferencia; // Opcional (número do PIX, ticket do Fiado)

    @NotNull(message = "O status de pagamento é obrigatório")
    private String statusPagamento; // PENDENTE, PAGO

    @NotEmpty(message = "O pedido deve ter pelo menos um item")
    private List<ItemPedidoRequest> itens;
}