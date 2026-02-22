package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NaturezaOperacaoResponse {
    private Integer id;
    private String descricao;
    private String tipoMovimento;
    private Boolean geraFinanceiro;
}