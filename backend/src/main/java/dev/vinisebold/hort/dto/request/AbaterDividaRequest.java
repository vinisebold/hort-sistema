package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class AbaterDividaRequest {
  @NotNull
  @Positive
  private BigDecimal valorPago;
}
