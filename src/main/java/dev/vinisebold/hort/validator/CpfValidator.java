package dev.vinisebold.hort.validator;

public class CpfValidator {

    private CpfValidator() {
        throw new AssertionError("Classe utilitária não pode ser instanciada");
    }

    /**
     * Valida um CPF verificando formato e dígitos verificadores
     * @param cpf CPF com ou sem formatação (ex: 123.456.789-00 ou 12345678900)
     * @return true se o CPF é válido, false caso contrário
     */
    public static boolean isValid(String cpf) {
        if (cpf == null || cpf.trim().isEmpty()) {
            return false;
        }

        // Remove caracteres especiais
        String cleanCpf = cpf.replaceAll("\\D", "");

        // Valida comprimento
        if (cleanCpf.length() != 11) {
            return false;
        }

        // Valida se não é uma sequência de dígitos iguais
        if (cleanCpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        // Calcula primeiro dígito verificador
        int sum = 0;
        int multiplier = 10;
        for (int i = 0; i < 9; i++) {
            sum += Character.getNumericValue(cleanCpf.charAt(i)) * multiplier;
            multiplier--;
        }

        int firstDigit = 11 - (sum % 11);
        firstDigit = firstDigit >= 10 ? 0 : firstDigit;

        if (Character.getNumericValue(cleanCpf.charAt(9)) != firstDigit) {
            return false;
        }

        // Calcula segundo dígito verificador
        sum = 0;
        multiplier = 11;
        for (int i = 0; i < 10; i++) {
            sum += Character.getNumericValue(cleanCpf.charAt(i)) * multiplier;
            multiplier--;
        }

        int secondDigit = 11 - (sum % 11);
        secondDigit = secondDigit >= 10 ? 0 : secondDigit;

        return Character.getNumericValue(cleanCpf.charAt(10)) == secondDigit;
    }
}
