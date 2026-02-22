package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FormaPagamentoResponse {
    private Integer id;
    private String descricao;
    private Boolean exigeCliente;
    private Boolean exigeDocumentoReferencia;
    private Boolean isActive;
}