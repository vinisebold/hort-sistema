package dev.vinisebold.hort.validator;

public class CnpjValidator {

  private CnpjValidator() {
    throw new AssertionError("Classe utilitária não pode ser instanciada");
  }

  /**
   * Valida um CNPJ verificando formato e dígitos verificadores
   * @param cnpj CNPJ com ou sem formatação (ex: 11.222.333/0001-81 ou 11222333000181)
   * @return true se o CNPJ é válido, false caso contrário
   */
  @SuppressWarnings("BooleanMethodIsAlwaysInverted")
  public static boolean isValid(String cnpj) {
    if (cnpj == null || cnpj.trim().isEmpty()) {
      return false;
    }

    // Remove caracteres especiais
    String cleanCnpj = cnpj.replaceAll("\\D", "");

    // Valida comprimento
    if (cleanCnpj.length() != 14) {
      return false;
    }

    // Valida se não é uma sequência de dígitos iguais
    if (cleanCnpj.matches("(\\d)\\1{13}")) {
      return false;
    }

    // Calcula primeiro dígito verificador
    int[] weights1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
    int sum = 0;
    for (int i = 0; i < 12; i++) {
      sum += Character.getNumericValue(cleanCnpj.charAt(i)) * weights1[i];
    }

    int remainder = sum % 11;
    int firstDigit = remainder < 2 ? 0 : 11 - remainder;

    if (Character.getNumericValue(cleanCnpj.charAt(12)) != firstDigit) {
      return false;
    }

    // Calcula segundo dígito verificador
    int[] weights2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
    sum = 0;
    for (int i = 0; i < 13; i++) {
      sum += Character.getNumericValue(cleanCnpj.charAt(i)) * weights2[i];
    }

    remainder = sum % 11;
    int secondDigit = remainder < 2 ? 0 : 11 - remainder;

    return Character.getNumericValue(cleanCnpj.charAt(13)) == secondDigit;
  }
}
