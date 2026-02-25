package dev.vinisebold.hort.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultaCnpjResponse {
    private String cnpj;
    private String razaoSocial;
    private String nomeFantasia;
    private String endereco;
    private String telefone;
    private String email;
}
