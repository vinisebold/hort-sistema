package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ItemPedidoResumidoResponse {
    private Integer id;
    private Integer produtoId;
    private String produtoDescricao;
    private BigDecimal quantidade;
    private BigDecimal valorUnitario;
    private BigDecimal valorTotal;
    private Boolean isDestacado;
}
