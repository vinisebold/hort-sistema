package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequest {

    @NotBlank(message = "O tipo de pessoa (Física/Jurídica) é obrigatório")
    private String tipoPessoa;

    private String documento;

    @NotBlank(message = "A razão social ou nome é obrigatório")
    private String razaoSocial;

    private String nomeFantasia;
    private String endereco;
    private String telefone;
}