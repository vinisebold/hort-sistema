package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UnidadeMedidaResponse {
    private Integer id;
    private String sigla;
    private String descricao;
    private Boolean isActive;
}