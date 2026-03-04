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
        int sum = 0;
        int multiplier = 5;
        for (int i = 0; i < 8; i++) {
            sum += Character.getNumericValue(cleanCnpj.charAt(i)) * multiplier;
            multiplier--;
            if (multiplier == 1) {
                multiplier = 9;
            }
        }

        int firstDigit = 11 - (sum % 11);
        firstDigit = firstDigit >= 10 ? 0 : firstDigit;

        if (Character.getNumericValue(cleanCnpj.charAt(8)) != firstDigit) {
            return false;
        }

        // Calcula segundo dígito verificador
        sum = 0;
        multiplier = 6;
        for (int i = 0; i < 9; i++) {
            sum += Character.getNumericValue(cleanCnpj.charAt(i)) * multiplier;
            multiplier--;
            if (multiplier == 1) {
                multiplier = 9;
            }
        }

        int secondDigit = 11 - (sum % 11);
        secondDigit = secondDigit >= 10 ? 0 : secondDigit;

        return Character.getNumericValue(cleanCnpj.charAt(9)) == secondDigit;
    }
}
