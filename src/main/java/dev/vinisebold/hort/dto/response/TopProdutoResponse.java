package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class TopProdutoResponse {

    private Integer produtoId;
    private String produtoNome;
    private BigDecimal quantidadeVendida;
    private BigDecimal valorTotal;
}
