package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AbaterDividaResponse {
    private List<Integer> pedidosQuitados;
    private BigDecimal valorUtilizado;
    private BigDecimal creditoAdicionado;
    private BigDecimal novoSaldoCredito;
    private BigDecimal novaDividaTotal;
}
