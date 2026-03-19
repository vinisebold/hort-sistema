package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PedidoResponse {
  private Integer id;
  private Integer naturezaOperacaoId;
  private String naturezaOperacao;
  private String naturezaOperacaoTipo;
  private Integer clienteId;
  private String clienteNome; // Usa fallback quando o cliente nao foi informado
  private String documentoReferencia;
  private BigDecimal valorTotal;
  private String status;
  private LocalDateTime dataEmissao;

  private List<ItemPedidoResponse> itens;
}
