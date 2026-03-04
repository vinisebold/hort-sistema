package dev.vinisebold.hort.util;

public class ClienteFormatter {

    private ClienteFormatter() {
        throw new AssertionError("Classe utilitária não pode ser instanciada");
    }

    /**
     * Formata um CPF para o padrão 000.000.000-00
     * @param cpf CPF com ou sem formatação
     * @return CPF formatado ou null se inválido
     */
    public static String formatCpf(String cpf) {
        if (cpf == null || cpf.trim().isEmpty()) {
            return null;
        }

        // Remove caracteres especiais
        String cleanCpf = cpf.replaceAll("\\D", "");

        // Valida comprimento
        if (cleanCpf.length() != 11) {
            return null;
        }

        return cleanCpf.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
    }

    /**
     * Remove formatação de um CPF
     * @param cpf CPF formatado
     * @return CPF sem formatação
     */
    public static String removeCpfFormatting(String cpf) {
        if (cpf == null) {
            return null;
        }
        return cpf.replaceAll("\\D", "");
    }

    /**
     * Remove formatação de um CNPJ
     * @param cnpj CNPJ formatado
     * @return CNPJ sem formatação
     */
    public static String removeCnpjFormatting(String cnpj) {
        if (cnpj == null) {
            return null;
        }
        return cnpj.replaceAll("\\D", "");
    }
}
