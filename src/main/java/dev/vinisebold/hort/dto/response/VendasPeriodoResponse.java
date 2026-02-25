package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class VendasPeriodoResponse {

    private String periodo;
    private BigDecimal totalVendido;
}
