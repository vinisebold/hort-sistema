package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DetalheMovimentacaoResponse {
    private MovimentacaoEstoqueResponse movimentacao;
    private PedidoResumidoResponse pedido;
    private List<ItemPedidoResumidoResponse> itens;
}
