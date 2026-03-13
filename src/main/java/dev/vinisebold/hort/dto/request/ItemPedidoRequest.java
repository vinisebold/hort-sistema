package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ItemPedidoRequest {

  @NotNull(message = "O produto é obrigatório")
  private Integer produtoId;

  @NotNull(message = "A quantidade é obrigatória")
  @DecimalMin(value = "0.001", message = "A quantidade deve ser maior que zero")
  private BigDecimal quantidade;

  // Validação dinâmica baseada em NaturezaOperacao.exigeValorUnitario
  @DecimalMin(value = "0.00", message = "O valor unitário não pode ser negativo")
  private BigDecimal valorUnitario;
}
