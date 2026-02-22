package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ItemPedidoRequest {

    @NotNull(message = "O produto é obrigatório")
    private Integer produtoId;

    @NotNull(message = "A quantidade é obrigatória")
    @DecimalMin(value = "0.001", message = "A quantidade deve ser maior que zero")
    private BigDecimal quantidade;

    @NotNull(message = "O valor unitário é obrigatório")
    @DecimalMin(value = "0.00", message = "O valor unitário não pode ser negativo")
    private BigDecimal valorUnitario;
}