package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class MovimentacaoEstoqueResponse {
    private Integer id;
    private Integer produtoId;
    private String produtoDescricao;
    private String naturezaOperacaoDescricao;
    private String tipoMovimento;
    private Integer pedidoId;
    private BigDecimal quantidade;
    private BigDecimal estoqueAposMovimentacao;
    private LocalDateTime dataMovimentacao;
}
