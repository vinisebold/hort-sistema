package dev.vinisebold.hort.util;

public class ClienteFormatter {

  private ClienteFormatter() {
    throw new AssertionError("Classe utilitária não pode ser instanciada");
  }

  /**
   * Remove todos os caracteres não numéricos de uma string (CPF, CNPJ, etc.)
   * @param input String de entrada
   * @return String contendo apenas dígitos, ou null se a entrada for null
   */
  public static String stripNonDigits(String input) {
    if (input == null) {
      return null;
    }
    return input.replaceAll("\\D", "");
  }
}
