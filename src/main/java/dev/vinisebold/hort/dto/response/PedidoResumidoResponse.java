package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PedidoResumidoResponse {
    private Integer id;
    private String naturezaOperacao;
    private String clienteNome;
    private BigDecimal valorTotal;
    private String statusPagamento;
    private LocalDateTime dataEmissao;
}
