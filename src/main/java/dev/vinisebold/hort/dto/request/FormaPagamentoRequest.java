package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FormaPagamentoRequest {
    @NotBlank(message = "A descrição é obrigatória")
    private String descricao;

    @NotNull(message = "Defina se exige cliente")
    private Boolean exigeCliente;

    @NotNull(message = "Defina se exige documento de referência")
    private Boolean exigeDocumentoReferencia;
}