package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AbaterDividaRequest {
    @NotNull
    @Positive
    private BigDecimal valorPago;
}
