package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;
import dev.vinisebold.hort.model.TipoMovimento;

@Data
@Builder
public class NaturezaOperacaoResponse {
    private Integer id;
    private String descricao;
    private TipoMovimento tipoMovimento;
    private Boolean exigeCliente;
    private Boolean exigeValorUnitario;
    private Boolean exigeStatus;
}