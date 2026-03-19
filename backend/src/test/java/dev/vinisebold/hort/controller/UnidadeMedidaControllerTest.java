package dev.vinisebold.hort.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.vinisebold.hort.dto.request.UnidadeMedidaRequest;
import dev.vinisebold.hort.dto.response.UnidadeMedidaResponse;
import dev.vinisebold.hort.service.JwtService;
import dev.vinisebold.hort.service.UnidadeMedidaService;
import java.util.List;
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

@WebMvcTest(UnidadeMedidaController.class)
@AutoConfigureMockMvc(addFilters = false)
class UnidadeMedidaControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @MockitoBean
  private UnidadeMedidaService service;

  @MockitoBean
  private JwtService jwtService;

  @MockitoBean
  private CorsConfigurationSource corsConfigurationSource;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private UnidadeMedidaRequest criarRequest(String sigla, String descricao) {
    UnidadeMedidaRequest request = new UnidadeMedidaRequest();
    request.setSigla(sigla);
    request.setDescricao(descricao);
    return request;
  }

  private UnidadeMedidaResponse criarResponse(Integer id, String sigla, String descricao) {
    return UnidadeMedidaResponse.builder()
        .id(id)
        .sigla(sigla)
        .descricao(descricao)
        .isActive(true)
        .build();
  }

  // ---------------------------------------------------------------------------
  // POST /api/unidades-medida
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("POST /api/unidades-medida")
  class Criar {

    @Test
    @DisplayName("Deve retornar 201 ao criar unidade de medida com sucesso")
    void deveRetornar201AoCriarComSucesso() throws Exception {
      UnidadeMedidaRequest request = criarRequest("KG", "Quilograma");
      UnidadeMedidaResponse response = criarResponse(1, "KG", "Quilograma");

      when(service.criar(any(UnidadeMedidaRequest.class))).thenReturn(response);

      mockMvc.perform(post("/api/unidades-medida")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.sigla").value("KG"))
          .andExpect(jsonPath("$.descricao").value("Quilograma"))
          .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("Deve retornar 400 quando sigla estiver em branco")
    void deveRetornar400QuandoSiglaEmBranco() throws Exception {
      UnidadeMedidaRequest request = criarRequest("", "Quilograma");

      mockMvc.perform(post("/api/unidades-medida")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Deve retornar 400 quando sigla for nula")
    void deveRetornar400QuandoSiglaNula() throws Exception {
      UnidadeMedidaRequest request = criarRequest(null, "Quilograma");

      mockMvc.perform(post("/api/unidades-medida")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/unidades-medida
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/unidades-medida")
  class Listar {

    @Test
    @DisplayName("Deve retornar 200 com lista de unidades de medida ativas")
    void deveRetornar200ComLista() throws Exception {
      UnidadeMedidaResponse um1 = criarResponse(1, "KG", "Quilograma");
      UnidadeMedidaResponse um2 = criarResponse(2, "CX", "Caixa");

      when(service.listarAtivos()).thenReturn(List.of(um1, um2));

      mockMvc.perform(get("/api/unidades-medida"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].id").value(1))
          .andExpect(jsonPath("$[0].sigla").value("KG"))
          .andExpect(jsonPath("$[0].descricao").value("Quilograma"))
          .andExpect(jsonPath("$[1].id").value(2))
          .andExpect(jsonPath("$[1].sigla").value("CX"))
          .andExpect(jsonPath("$[1].descricao").value("Caixa"));
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/unidades-medida/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/unidades-medida/{id}")
  class BuscarPorId {

    @Test
    @DisplayName("Deve retornar 200 ao buscar unidade de medida por id")
    void deveRetornar200AoBuscarPorId() throws Exception {
      UnidadeMedidaResponse response = criarResponse(1, "KG", "Quilograma");

      when(service.buscarPorId(1)).thenReturn(response);

      mockMvc.perform(get("/api/unidades-medida/{id}", 1))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.sigla").value("KG"))
          .andExpect(jsonPath("$.descricao").value("Quilograma"))
          .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("Deve retornar 400 quando unidade de medida nao encontrada")
    void deveRetornar400QuandoNaoEncontrado() throws Exception {
      when(service.buscarPorId(99))
          .thenThrow(new IllegalArgumentException("Não encontrado."));

      mockMvc.perform(get("/api/unidades-medida/{id}", 99))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.error").value("Bad Request"))
          .andExpect(jsonPath("$.message").value("Não encontrado."));
    }
  }

  // ---------------------------------------------------------------------------
  // PUT /api/unidades-medida/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("PUT /api/unidades-medida/{id}")
  class Atualizar {

    @Test
    @DisplayName("Deve retornar 200 ao atualizar unidade de medida com sucesso")
    void deveRetornar200AoAtualizarComSucesso() throws Exception {
      UnidadeMedidaRequest request = criarRequest("UN", "Unidade");
      UnidadeMedidaResponse response = criarResponse(1, "UN", "Unidade");

      when(service.atualizar(eq(1), any(UnidadeMedidaRequest.class))).thenReturn(response);

      mockMvc.perform(put("/api/unidades-medida/{id}", 1)
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.sigla").value("UN"))
          .andExpect(jsonPath("$.descricao").value("Unidade"))
          .andExpect(jsonPath("$.isActive").value(true));
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/unidades-medida/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("DELETE /api/unidades-medida/{id}")
  class Deletar {

    @Test
    @DisplayName("Deve retornar 204 ao deletar unidade de medida com sucesso")
    void deveRetornar204AoDeletarComSucesso() throws Exception {
      doNothing().when(service).deletar(1);

      mockMvc.perform(delete("/api/unidades-medida/{id}", 1))
          .andExpect(status().isNoContent());
    }
  }
}
