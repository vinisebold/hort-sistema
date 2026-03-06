package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import dev.vinisebold.hort.model.CampoPropriedade;
import dev.vinisebold.hort.model.TipoMovimento;

@Data
public class NaturezaOperacaoRequest {
    @NotBlank(message = "A descrição é obrigatória")
    private String descricao;

    @NotNull(message = "O tipo de movimento (ENTRADA ou SAIDA) é obrigatório")
    private TipoMovimento tipoMovimento;

    @NotNull(message = "Campo 'propriedadeCliente' é obrigatório")
    private CampoPropriedade propriedadeCliente;

    @NotNull(message = "Campo 'propriedadeValorUnitario' é obrigatório")
    private CampoPropriedade propriedadeValorUnitario;

    @NotNull(message = "Campo 'propriedadeStatus' é obrigatório")
    private CampoPropriedade propriedadeStatus;
}
