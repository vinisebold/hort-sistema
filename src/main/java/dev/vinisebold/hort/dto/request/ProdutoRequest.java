package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProdutoRequest {
    private String codigo;

    @NotBlank(message = "A descrição do produto é obrigatória")
    private String descricao;

    @NotNull(message = "A unidade de medida é obrigatória")
    private Integer unidadeMedidaId;

    // NOTA: O estoque_atual NÃO está aqui propositalmente. O usuário não pode alterá-lo diretamente.
}