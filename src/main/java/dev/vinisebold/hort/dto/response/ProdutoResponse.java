package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ProdutoResponse {
    private Integer id;
    private String codigo;
    private String descricao;
    private UnidadeMedidaResponse unidadeMedida; // Objeto aninhado para o Frontend ter a sigla na tela
    private BigDecimal estoqueAtual;
    private Boolean isActive;
    private LocalDateTime createdAt;
}