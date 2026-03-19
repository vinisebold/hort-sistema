package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AbaterDividaResponse {
  private List<Integer> pedidosQuitados;
  private BigDecimal valorUtilizado;
  private BigDecimal creditoAdicionado;
  private BigDecimal novoSaldoCredito;
  private BigDecimal novaDividaTotal;
}
