package dev.vinisebold.hort.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
  @Email(message = "Email deve ser válido")
  @NotBlank(message = "Email é obrigatório")
  private String email;

  @NotBlank(message = "CNPJ é obrigatório")
  @Size(min = 14, max = 14, message = "CNPJ deve ter 14 dígitos")
  private String cnpj;

  @NotBlank(message = "Senha é obrigatória")
  @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
  private String senha;
}
