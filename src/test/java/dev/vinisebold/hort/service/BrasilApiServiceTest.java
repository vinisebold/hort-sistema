package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.response.CnpjApiResponse;
import dev.vinisebold.hort.dto.response.ConsultaCnpjResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BrasilApiServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private BrasilApiService service;

    private static final String BRASIL_API_URL = "https://brasilapi.com.br/api/cnpj/v1/";

    @BeforeEach
    void setUp() {
        service = new BrasilApiService();
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
    }

    private CnpjApiResponse criarApiResponseCompleta() {
        CnpjApiResponse apiResponse = new CnpjApiResponse();
        apiResponse.setCnpj("12.345.678/0001-99");
        apiResponse.setRazaoSocial("Empresa Teste LTDA");
        apiResponse.setNomeFantasia("Empresa Teste");
        apiResponse.setLogradouro("Rua das Flores");
        apiResponse.setNumero("100");
        apiResponse.setMunicipio("São Paulo");
        apiResponse.setUf("SP");
        apiResponse.setTelefone("1199998888");
        apiResponse.setEmail("contato@empresa.com");
        return apiResponse;
    }

    @Nested
    @DisplayName("consultarCnpj")
    class ConsultarCnpj {

        @Test
        @DisplayName("deve consultar cnpj com sucesso e dados completos")
        void deveConsultarCnpjComSucessoEDadosCompletos() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();

            when(restTemplate.getForObject(eq(BRASIL_API_URL + "12345678000199"), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            ConsultaCnpjResponse response = service.consultarCnpj("12.345.678/0001-99");

            assertThat(response).isNotNull();
            assertThat(response.getCnpj()).isEqualTo("12345678000199");
            assertThat(response.getRazaoSocial()).isEqualTo("Empresa Teste LTDA");
            assertThat(response.getNomeFantasia()).isEqualTo("Empresa Teste");
            assertThat(response.getEndereco()).isEqualTo("Rua das Flores, 100 - São Paulo/SP");
            assertThat(response.getTelefone()).isEqualTo("1199998888");
            assertThat(response.getEmail()).isEqualTo("contato@empresa.com");

            verify(restTemplate).getForObject(BRASIL_API_URL + "12345678000199", CnpjApiResponse.class);
        }

        @Test
        @DisplayName("deve limpar cnpj removendo caracteres nao numericos")
        void deveLimparCnpjRemovendoCaracteresNaoNumericos() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();

            when(restTemplate.getForObject(eq(BRASIL_API_URL + "12345678000199"), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            service.consultarCnpj("12.345.678/0001-99");

            verify(restTemplate).getForObject(BRASIL_API_URL + "12345678000199", CnpjApiResponse.class);
        }

        @Test
        @DisplayName("deve lancar excecao quando resposta for null")
        void deveLancarExcecaoQuandoRespostaForNull() {
            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenReturn(null);

            assertThatThrownBy(() -> service.consultarCnpj("12345678000199"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("CNPJ não encontrado.");

            verify(restTemplate).getForObject(BRASIL_API_URL + "12345678000199", CnpjApiResponse.class);
        }

        @Test
        @DisplayName("deve lancar excecao quando cnpj nao encontrado na api")
        void deveLancarExcecaoQuandoCnpjNaoEncontradoNaApi() {
            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenThrow(HttpClientErrorException.NotFound.class);

            assertThatThrownBy(() -> service.consultarCnpj("00000000000000"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("CNPJ não encontrado.");

            verify(restTemplate).getForObject(BRASIL_API_URL + "00000000000000", CnpjApiResponse.class);
        }

        @Test
        @DisplayName("deve lancar excecao quando ocorrer erro de conexao")
        void deveLancarExcecaoQuandoOcorrerErroDeConexao() {
            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenThrow(new RestClientException("Connection refused"));

            assertThatThrownBy(() -> service.consultarCnpj("12345678000199"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Erro ao consultar CNPJ. Verifique sua conexão.");

            verify(restTemplate).getForObject(BRASIL_API_URL + "12345678000199", CnpjApiResponse.class);
        }
    }

    @Nested
    @DisplayName("montarEndereco")
    class MontarEndereco {

        @Test
        @DisplayName("deve montar endereco com todos os campos presentes")
        void deveMontarEnderecoComTodosCamposPresentes() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();

            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            ConsultaCnpjResponse response = service.consultarCnpj("12345678000199");

            assertThat(response.getEndereco()).isEqualTo("Rua das Flores, 100 - São Paulo/SP");
        }

        @Test
        @DisplayName("deve montar endereco sem logradouro")
        void deveMontarEnderecoSemLogradouro() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();
            apiResponse.setLogradouro(null);

            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            ConsultaCnpjResponse response = service.consultarCnpj("12345678000199");

            assertThat(response.getEndereco()).isEqualTo("100 - São Paulo/SP");
        }

        @Test
        @DisplayName("deve montar endereco sem numero")
        void deveMontarEnderecoSemNumero() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();
            apiResponse.setNumero(null);

            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            ConsultaCnpjResponse response = service.consultarCnpj("12345678000199");

            assertThat(response.getEndereco()).isEqualTo("Rua das Flores - São Paulo/SP");
        }

        @Test
        @DisplayName("deve montar endereco sem municipio")
        void deveMontarEnderecoSemMunicipio() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();
            apiResponse.setMunicipio(null);

            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            ConsultaCnpjResponse response = service.consultarCnpj("12345678000199");

            assertThat(response.getEndereco()).isEqualTo("Rua das Flores, 100SP");
        }

        @Test
        @DisplayName("deve montar endereco sem UF")
        void deveMontarEnderecoSemUf() {
            CnpjApiResponse apiResponse = criarApiResponseCompleta();
            apiResponse.setUf(null);

            when(restTemplate.getForObject(anyString(), eq(CnpjApiResponse.class)))
                    .thenReturn(apiResponse);

            ConsultaCnpjResponse response = service.consultarCnpj("12345678000199");

            assertThat(response.getEndereco()).isEqualTo("Rua das Flores, 100 - São Paulo");
        }
    }
}
