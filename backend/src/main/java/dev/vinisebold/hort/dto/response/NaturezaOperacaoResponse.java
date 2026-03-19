package dev.vinisebold.hort.dto.response;

import dev.vinisebold.hort.model.CampoPropriedade;
import dev.vinisebold.hort.model.TipoMovimento;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NaturezaOperacaoResponse {
  private Integer id;
  private String descricao;
  private TipoMovimento tipoMovimento;
  private CampoPropriedade propriedadeCliente;
  private CampoPropriedade propriedadeValorUnitario;
  private CampoPropriedade propriedadeStatus;
}
