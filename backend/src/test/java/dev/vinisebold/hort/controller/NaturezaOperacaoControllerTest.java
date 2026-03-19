package dev.vinisebold.hort.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.vinisebold.hort.dto.request.NaturezaOperacaoRequest;
import dev.vinisebold.hort.dto.response.NaturezaOperacaoResponse;
import dev.vinisebold.hort.model.CampoPropriedade;
import dev.vinisebold.hort.model.TipoMovimento;
import dev.vinisebold.hort.service.JwtService;
import dev.vinisebold.hort.service.NaturezaOperacaoService;
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

@WebMvcTest(NaturezaOperacaoController.class)
@AutoConfigureMockMvc(addFilters = false)
class NaturezaOperacaoControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockitoBean
  private NaturezaOperacaoService service;

  @MockitoBean
  private JwtService jwtService;

  @MockitoBean
  private CorsConfigurationSource corsConfigurationSource;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  @SuppressWarnings("SameParameterValue")
  private NaturezaOperacaoResponse criarResponse(Integer id, String descricao,
      TipoMovimento tipoMovimento, CampoPropriedade propriedadeCliente,
      CampoPropriedade propriedadeValorUnitario, CampoPropriedade propriedadeStatus) {
    return NaturezaOperacaoResponse.builder()
        .id(id)
        .descricao(descricao)
        .tipoMovimento(tipoMovimento)
        .propriedadeCliente(propriedadeCliente)
        .propriedadeValorUnitario(propriedadeValorUnitario)
        .propriedadeStatus(propriedadeStatus)
        .build();
  }

  // ---------------------------------------------------------------------------
  // POST /api/naturezas-operacao
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("POST /api/naturezas-operacao")
  class Criar {

    @Test
    @DisplayName("Deve retornar 201 ao criar natureza de operacao com sucesso")
    void deveRetornar201AoCriarComSucesso() throws Exception {
      NaturezaOperacaoResponse response = criarResponse(1, "Compra", TipoMovimento.ENTRADA,
          CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO);

      when(service.criar(any(NaturezaOperacaoRequest.class))).thenReturn(response);

      String requestJson = """
          {
              "descricao": "Compra",
              "tipoMovimento": "ENTRADA",
              "propriedadeCliente": "OBRIGATORIO",
              "propriedadeValorUnitario": "OBRIGATORIO",
              "propriedadeStatus": "OBRIGATORIO"
          }
          """;

      mockMvc.perform(post("/api/naturezas-operacao")
          .contentType(MediaType.APPLICATION_JSON)
          .content(requestJson))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.descricao").value("Compra"))
          .andExpect(jsonPath("$.tipoMovimento").value("ENTRADA"))
          .andExpect(jsonPath("$.propriedadeCliente").value("OBRIGATORIO"))
          .andExpect(jsonPath("$.propriedadeValorUnitario").value("OBRIGATORIO"))
          .andExpect(jsonPath("$.propriedadeStatus").value("OBRIGATORIO"));
    }

    @Test
    @DisplayName("Deve retornar 400 quando descricao estiver em branco")
    void deveRetornar400QuandoDescricaoEmBranco() throws Exception {
      String requestJson = """
          {
              "descricao": "",
              "tipoMovimento": "ENTRADA",
              "propriedadeCliente": "OBRIGATORIO",
              "propriedadeValorUnitario": "OBRIGATORIO",
              "propriedadeStatus": "OBRIGATORIO"
          }
          """;

      mockMvc.perform(post("/api/naturezas-operacao")
          .contentType(MediaType.APPLICATION_JSON)
          .content(requestJson))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Deve retornar 400 quando propriedadeCliente for nulo")
    void deveRetornar400QuandoPropriedadeClienteNulo() throws Exception {
      String requestJson = """
          {
              "descricao": "Compra",
              "tipoMovimento": "ENTRADA",
              "propriedadeCliente": null,
              "propriedadeValorUnitario": "OBRIGATORIO",
              "propriedadeStatus": "OBRIGATORIO"
          }
          """;

      mockMvc.perform(post("/api/naturezas-operacao")
          .contentType(MediaType.APPLICATION_JSON)
          .content(requestJson))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/naturezas-operacao
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/naturezas-operacao")
  class Listar {

    @Test
    @DisplayName("Deve retornar 200 com lista de naturezas de operacao")
    void deveRetornar200ComLista() throws Exception {
      NaturezaOperacaoResponse no1 = criarResponse(1, "Compra", TipoMovimento.ENTRADA,
          CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO);
      NaturezaOperacaoResponse no2 = criarResponse(2, "Venda", TipoMovimento.SAIDA,
          CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO);

      when(service.listarTodos()).thenReturn(List.of(no1, no2));

      mockMvc.perform(get("/api/naturezas-operacao"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].id").value(1))
          .andExpect(jsonPath("$[0].descricao").value("Compra"))
          .andExpect(jsonPath("$[0].tipoMovimento").value("ENTRADA"))
          .andExpect(jsonPath("$[1].id").value(2))
          .andExpect(jsonPath("$[1].descricao").value("Venda"))
          .andExpect(jsonPath("$[1].tipoMovimento").value("SAIDA"));
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/naturezas-operacao/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/naturezas-operacao/{id}")
  class BuscarPorId {

    @Test
    @DisplayName("Deve retornar 200 ao buscar natureza de operacao por id")
    void deveRetornar200AoBuscarPorId() throws Exception {
      NaturezaOperacaoResponse response = criarResponse(1, "Compra", TipoMovimento.ENTRADA,
          CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO);

      when(service.buscarPorId(1)).thenReturn(response);

      mockMvc.perform(get("/api/naturezas-operacao/{id}", 1))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.descricao").value("Compra"))
          .andExpect(jsonPath("$.tipoMovimento").value("ENTRADA"))
          .andExpect(jsonPath("$.propriedadeCliente").value("OBRIGATORIO"))
          .andExpect(jsonPath("$.propriedadeValorUnitario").value("OBRIGATORIO"))
          .andExpect(jsonPath("$.propriedadeStatus").value("OBRIGATORIO"));
    }

    @Test
    @DisplayName("Deve retornar 400 quando natureza de operacao nao encontrada")
    void deveRetornar400QuandoNaoEncontrado() throws Exception {
      when(service.buscarPorId(99))
          .thenThrow(new IllegalArgumentException("Natureza de Operação não encontrada."));

      mockMvc.perform(get("/api/naturezas-operacao/{id}", 99))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.error").value("Bad Request"))
          .andExpect(jsonPath("$.message").value("Natureza de Operação não encontrada."));
    }
  }

  // ---------------------------------------------------------------------------
  // PUT /api/naturezas-operacao/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("PUT /api/naturezas-operacao/{id}")
  class Atualizar {

    @Test
    @DisplayName("Deve retornar 200 ao atualizar natureza de operacao com sucesso")
    void deveRetornar200AoAtualizarComSucesso() throws Exception {
      NaturezaOperacaoResponse response = criarResponse(1, "Venda Direta", TipoMovimento.SAIDA,
          CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.DESATIVADO);

      when(service.atualizar(eq(1), any(NaturezaOperacaoRequest.class))).thenReturn(response);

      String requestJson = """
          {
              "descricao": "Venda Direta",
              "tipoMovimento": "SAIDA",
              "propriedadeCliente": "OBRIGATORIO",
              "propriedadeValorUnitario": "OBRIGATORIO",
              "propriedadeStatus": "DESATIVADO"
          }
          """;

      mockMvc.perform(put("/api/naturezas-operacao/{id}", 1)
          .contentType(MediaType.APPLICATION_JSON)
          .content(requestJson))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.descricao").value("Venda Direta"))
          .andExpect(jsonPath("$.tipoMovimento").value("SAIDA"))
          .andExpect(jsonPath("$.propriedadeCliente").value("OBRIGATORIO"))
          .andExpect(jsonPath("$.propriedadeValorUnitario").value("OBRIGATORIO"))
          .andExpect(jsonPath("$.propriedadeStatus").value("DESATIVADO"));
    }
  }
}
