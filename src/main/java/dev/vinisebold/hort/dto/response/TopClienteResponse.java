package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class TopClienteResponse {

    private Integer clienteId;
    private String clienteNome;
    private Integer quantidadeCompras;
    private BigDecimal valorTotal;
}
