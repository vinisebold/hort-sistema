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

    private String documentoReferencia; // Obrigatório quando statusPagamento = PENDENTE

    private String status; // Validação dinâmica no Service

    @NotEmpty(message = "O pedido deve ter pelo menos um item")
    private List<ItemPedidoRequest> itens;
}