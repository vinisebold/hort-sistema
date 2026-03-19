package dev.vinisebold.hort.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DetalheMovimentacaoResponse {
  private MovimentacaoEstoqueResponse movimentacao;
  private PedidoResumidoResponse pedido;
  private List<ItemPedidoResumidoResponse> itens;
}
