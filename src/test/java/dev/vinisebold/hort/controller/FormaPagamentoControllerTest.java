package dev.vinisebold.hort.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.vinisebold.hort.dto.request.FormaPagamentoRequest;
import dev.vinisebold.hort.dto.response.FormaPagamentoResponse;
import dev.vinisebold.hort.service.FormaPagamentoService;
import dev.vinisebold.hort.service.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FormaPagamentoController.class)
@AutoConfigureMockMvc(addFilters = false)
class FormaPagamentoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private FormaPagamentoService service;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CorsConfigurationSource corsConfigurationSource;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private FormaPagamentoRequest criarRequest(String descricao, Boolean exigeCliente, Boolean exigeDocumentoReferencia) {
        FormaPagamentoRequest request = new FormaPagamentoRequest();
        request.setDescricao(descricao);
        request.setExigeCliente(exigeCliente);
        request.setExigeDocumentoReferencia(exigeDocumentoReferencia);
        return request;
    }

    private FormaPagamentoResponse criarResponse(Integer id, String descricao, Boolean exigeCliente,
                                                  Boolean exigeDocumentoReferencia, Boolean isActive) {
        return FormaPagamentoResponse.builder()
                .id(id)
                .descricao(descricao)
                .exigeCliente(exigeCliente)
                .exigeDocumentoReferencia(exigeDocumentoReferencia)
                .isActive(isActive)
                .build();
    }

    // ---------------------------------------------------------------------------
    // POST /api/formas-pagamento
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/formas-pagamento")
    class Criar {

        @Test
        @DisplayName("Deve retornar 201 ao criar forma de pagamento com sucesso")
        void deveRetornar201AoCriarComSucesso() throws Exception {
            FormaPagamentoRequest request = criarRequest("Dinheiro", false, false);
            FormaPagamentoResponse response = criarResponse(1, "Dinheiro", false, false, true);

            when(service.criar(any(FormaPagamentoRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/formas-pagamento")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.descricao").value("Dinheiro"))
                    .andExpect(jsonPath("$.exigeCliente").value(false))
                    .andExpect(jsonPath("$.exigeDocumentoReferencia").value(false))
                    .andExpect(jsonPath("$.isActive").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando descricao estiver em branco")
        void deveRetornar400QuandoDescricaoEmBranco() throws Exception {
            FormaPagamentoRequest request = criarRequest("", true, false);

            mockMvc.perform(post("/api/formas-pagamento")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando exigeCliente for nulo")
        void deveRetornar400QuandoExigeClienteNulo() throws Exception {
            FormaPagamentoRequest request = criarRequest("Dinheiro", null, false);

            mockMvc.perform(post("/api/formas-pagamento")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    // ---------------------------------------------------------------------------
    // GET /api/formas-pagamento
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/formas-pagamento")
    class Listar {

        @Test
        @DisplayName("Deve retornar 200 com lista de formas de pagamento ativas")
        void deveRetornar200ComLista() throws Exception {
            FormaPagamentoResponse fp1 = criarResponse(1, "Dinheiro", false, false, true);
            FormaPagamentoResponse fp2 = criarResponse(2, "Cartao", true, false, true);

            when(service.listarAtivos()).thenReturn(List.of(fp1, fp2));

            mockMvc.perform(get("/api/formas-pagamento"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].descricao").value("Dinheiro"))
                    .andExpect(jsonPath("$[1].id").value(2))
                    .andExpect(jsonPath("$[1].descricao").value("Cartao"));
        }
    }

    // ---------------------------------------------------------------------------
    // GET /api/formas-pagamento/{id}
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/formas-pagamento/{id}")
    class BuscarPorId {

        @Test
        @DisplayName("Deve retornar 200 ao buscar forma de pagamento por id")
        void deveRetornar200AoBuscarPorId() throws Exception {
            FormaPagamentoResponse response = criarResponse(1, "Dinheiro", false, false, true);

            when(service.buscarPorId(1)).thenReturn(response);

            mockMvc.perform(get("/api/formas-pagamento/{id}", 1))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.descricao").value("Dinheiro"))
                    .andExpect(jsonPath("$.exigeCliente").value(false))
                    .andExpect(jsonPath("$.exigeDocumentoReferencia").value(false))
                    .andExpect(jsonPath("$.isActive").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando forma de pagamento nao encontrada")
        void deveRetornar400QuandoNaoEncontrado() throws Exception {
            when(service.buscarPorId(99))
                    .thenThrow(new IllegalArgumentException("Não encontrado."));

            mockMvc.perform(get("/api/formas-pagamento/{id}", 99))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Bad Request"))
                    .andExpect(jsonPath("$.message").value("Não encontrado."));
        }
    }

    // ---------------------------------------------------------------------------
    // PUT /api/formas-pagamento/{id}
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/formas-pagamento/{id}")
    class Atualizar {

        @Test
        @DisplayName("Deve retornar 200 ao atualizar forma de pagamento com sucesso")
        void deveRetornar200AoAtualizarComSucesso() throws Exception {
            FormaPagamentoRequest request = criarRequest("Cartao de Credito", true, true);
            FormaPagamentoResponse response = criarResponse(1, "Cartao de Credito", true, true, true);

            when(service.atualizar(eq(1), any(FormaPagamentoRequest.class))).thenReturn(response);

            mockMvc.perform(put("/api/formas-pagamento/{id}", 1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.descricao").value("Cartao de Credito"))
                    .andExpect(jsonPath("$.exigeCliente").value(true))
                    .andExpect(jsonPath("$.exigeDocumentoReferencia").value(true))
                    .andExpect(jsonPath("$.isActive").value(true));
        }
    }

    // ---------------------------------------------------------------------------
    // DELETE /api/formas-pagamento/{id}
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/formas-pagamento/{id}")
    class Deletar {

        @Test
        @DisplayName("Deve retornar 204 ao deletar forma de pagamento com sucesso")
        void deveRetornar204AoDeletarComSucesso() throws Exception {
            doNothing().when(service).deletar(1);

            mockMvc.perform(delete("/api/formas-pagamento/{id}", 1))
                    .andExpect(status().isNoContent());
        }
    }
}
