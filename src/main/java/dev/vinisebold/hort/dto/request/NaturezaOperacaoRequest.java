package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import dev.vinisebold.hort.model.TipoMovimento;

@Data
public class NaturezaOperacaoRequest {
    @NotBlank(message = "A descrição é obrigatória")
    private String descricao;

    @NotBlank(message = "O tipo de movimento (ENTRADA ou SAIDA) é obrigatório")
    private TipoMovimento tipoMovimento;

    @NotNull(message = "Defina se gera financeiro")
    private Boolean geraFinanceiro;
}