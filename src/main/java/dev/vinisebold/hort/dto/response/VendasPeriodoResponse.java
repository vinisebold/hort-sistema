package dev.vinisebold.hort.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VendasPeriodoResponse {

  private String periodo;
  private BigDecimal totalVendido;
}
