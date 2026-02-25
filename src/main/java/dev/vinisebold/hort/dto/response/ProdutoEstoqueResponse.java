package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ProdutoEstoqueResponse {
    private Integer id;
    private String codigo;
    private String descricao;
    private String unidadeMedidaSigla;
    private BigDecimal estoqueAtual;
    private Boolean isActive;
}
