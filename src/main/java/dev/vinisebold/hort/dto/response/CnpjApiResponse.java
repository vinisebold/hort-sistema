package dev.vinisebold.hort.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CnpjApiResponse {
  @JsonProperty("cnpj")
  private String cnpj;

  @JsonProperty("razao_social")
  private String razaoSocial;

  @JsonProperty("nome_fantasia")
  private String nomeFantasia;

  @JsonProperty("logradouro")
  private String logradouro;

  @JsonProperty("numero")
  private String numero;

  @JsonProperty("municipio")
  private String municipio;

  @JsonProperty("uf")
  private String uf;

  @JsonProperty("telefone")
  private String telefone;

  @JsonProperty("email")
  private String email;
}
