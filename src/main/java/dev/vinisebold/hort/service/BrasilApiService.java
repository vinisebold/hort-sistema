package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.response.CnpjApiResponse;
import dev.vinisebold.hort.dto.response.ConsultaCnpjResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class BrasilApiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BRASIL_API_URL = "https://brasilapi.com.br/api/cnpj/v1/";

    public ConsultaCnpjResponse consultarCnpj(String cnpj) {
        String cnpjLimpo = limparCnpj(cnpj);

        try {
            String url = BRASIL_API_URL + cnpjLimpo;
            CnpjApiResponse response = restTemplate.getForObject(url, CnpjApiResponse.class);

            if (response == null) {
                throw new IllegalArgumentException("CNPJ não encontrado.");
            }

            return mapToConsultaResponse(response);
        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalArgumentException("CNPJ não encontrado.");
        } catch (RestClientException e) {
            throw new IllegalArgumentException("Erro ao consultar CNPJ. Verifique sua conexão.");
        }
    }

    private String limparCnpj(String cnpj) {
        return cnpj.replaceAll("[^0-9]", "");
    }

    private ConsultaCnpjResponse mapToConsultaResponse(CnpjApiResponse apiResponse) {
        String endereco = montarEndereco(apiResponse);

        return ConsultaCnpjResponse.builder()
                .cnpj(limparCnpj(apiResponse.getCnpj()))
                .razaoSocial(apiResponse.getRazaoSocial())
                .nomeFantasia(apiResponse.getNomeFantasia())
                .endereco(endereco)
                .telefone(apiResponse.getTelefone())
                .email(apiResponse.getEmail())
                .build();
    }

    private String montarEndereco(CnpjApiResponse apiResponse) {
        StringBuilder endereco = new StringBuilder();

        if (apiResponse.getLogradouro() != null && !apiResponse.getLogradouro().isBlank()) {
            endereco.append(apiResponse.getLogradouro());
        }

        if (apiResponse.getNumero() != null && !apiResponse.getNumero().isBlank()) {
            if (endereco.length() > 0) {
                endereco.append(", ");
            }
            endereco.append(apiResponse.getNumero());
        }

        if (apiResponse.getMunicipio() != null && !apiResponse.getMunicipio().isBlank()) {
            if (endereco.length() > 0) {
                endereco.append(" - ");
            }
            endereco.append(apiResponse.getMunicipio());
        }

        if (apiResponse.getUf() != null && !apiResponse.getUf().isBlank()) {
            if (apiResponse.getMunicipio() != null && !apiResponse.getMunicipio().isBlank()) {
                endereco.append("/");
            }
            endereco.append(apiResponse.getUf());
        }

        return endereco.toString();
    }
}
