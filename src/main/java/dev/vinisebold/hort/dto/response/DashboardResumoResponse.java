package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class DashboardResumoResponse {

    private String produtoMaisVendidoNome;
    private Integer produtoMaisVendidoQtd;
    private String clienteMaisFielNome;
    private Integer clienteMaisFielCompras;
    private BigDecimal totalVendidoPeriodo;
}
