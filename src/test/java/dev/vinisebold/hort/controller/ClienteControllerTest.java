package dev.vinisebold.hort.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.dto.response.ConsultaCnpjResponse;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.service.BrasilApiService;
import dev.vinisebold.hort.service.ClienteService;
import dev.vinisebold.hort.service.JwtService;
import java.time.LocalDateTime;
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

@WebMvcTest(ClienteController.class)
@AutoConfigureMockMvc(addFilters = false)
class ClienteControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @MockitoBean
  private ClienteService clienteService;

  @MockitoBean
  private BrasilApiService brasilApiService;

  @MockitoBean
  private JwtService jwtService;

  @MockitoBean
  private CorsConfigurationSource corsConfigurationSource;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private ClienteRequest criarClienteRequest(String tipoPessoa, String razaoSocial) {
    ClienteRequest request = new ClienteRequest();
    request.setTipoPessoa(tipoPessoa);
    request.setDocumento("12345678901");
    request.setRazaoSocial(razaoSocial);
    request.setNomeFantasia("Hortifruti do Ze");
    request.setEndereco("Rua das Flores, 123");
    request.setContato("11999999999");
    return request;
  }

  private ClienteResponse criarClienteResponse(Integer id) {
    return ClienteResponse.builder()
        .id(id)
        .tipoPessoa("PF")
        .documento("12345678901")
        .razaoSocial("Jose da Silva")
        .nomeFantasia("Hortifruti do Ze")
        .endereco("Rua das Flores, 123")
        .contato("11999999999")
        .isActive(true)
        .createdAt(LocalDateTime.of(2026, 1, 15, 10, 30))
        .build();
  }

  // ---------------------------------------------------------------------------
  // POST /api/clientes
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("POST /api/clientes")
  class Criar {

    @Test
    @DisplayName("Deve retornar 201 ao criar cliente com sucesso")
    void deveRetornar201AoCriarCliente() throws Exception {
      ClienteResponse response = criarClienteResponse(1);
      when(clienteService.criar(any(ClienteRequest.class))).thenReturn(response);

      ClienteRequest request = criarClienteRequest("PF", "Jose da Silva");

      mockMvc.perform(post("/api/clientes")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.tipoPessoa").value("PF"))
          .andExpect(jsonPath("$.documento").value("12345678901"))
          .andExpect(jsonPath("$.razaoSocial").value("Jose da Silva"))
          .andExpect(jsonPath("$.nomeFantasia").value("Hortifruti do Ze"))
          .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("Deve retornar 400 quando tipoPessoa estiver em branco")
    void deveRetornar400QuandoTipoPessoaEmBranco() throws Exception {
      ClienteRequest request = criarClienteRequest("", "Jose da Silva");

      mockMvc.perform(post("/api/clientes")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Deve retornar 400 quando razaoSocial estiver em branco")
    void deveRetornar400QuandoRazaoSocialEmBranco() throws Exception {
      ClienteRequest request = criarClienteRequest("PF", "");

      mockMvc.perform(post("/api/clientes")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/clientes
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/clientes")
  class Listar {

    @Test
    @DisplayName("Deve retornar 200 com lista de clientes sem cursor")
    void deveRetornar200SemCursor() throws Exception {
      CursorResponse<ClienteResponse> response = CursorResponse.<ClienteResponse> builder()
          .data(List.of(criarClienteResponse(2), criarClienteResponse(1)))
          .nextCursor(1)
          .hasNext(false)
          .build();

      when(clienteService.listarAtivos(null, 10)).thenReturn(response);

      mockMvc.perform(get("/api/clientes"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.data").isArray())
          .andExpect(jsonPath("$.data.length()").value(2))
          .andExpect(jsonPath("$.data[0].id").value(2))
          .andExpect(jsonPath("$.data[1].id").value(1))
          .andExpect(jsonPath("$.nextCursor").value(1))
          .andExpect(jsonPath("$.hasNext").value(false));
    }

    @Test
    @DisplayName("Deve retornar 200 com lista de clientes com cursor")
    void deveRetornar200ComCursor() throws Exception {
      CursorResponse<ClienteResponse> response = CursorResponse.<ClienteResponse> builder()
          .data(List.of(criarClienteResponse(4), criarClienteResponse(3)))
          .nextCursor(3)
          .hasNext(true)
          .build();

      when(clienteService.listarAtivos(5, 2)).thenReturn(response);

      mockMvc.perform(get("/api/clientes")
          .param("cursor", "5")
          .param("limit", "2"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.data").isArray())
          .andExpect(jsonPath("$.data.length()").value(2))
          .andExpect(jsonPath("$.nextCursor").value(3))
          .andExpect(jsonPath("$.hasNext").value(true));
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/clientes/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/clientes/{id}")
  class Buscar {

    @Test
    @DisplayName("Deve retornar 200 com cliente ao buscar por id valido")
    void deveRetornar200ComCliente() throws Exception {
      ClienteResponse response = criarClienteResponse(1);
      when(clienteService.buscarPorId(1)).thenReturn(response);

      mockMvc.perform(get("/api/clientes/{id}", 1))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.razaoSocial").value("Jose da Silva"))
          .andExpect(jsonPath("$.tipoPessoa").value("PF"));
    }

    @Test
    @DisplayName("Deve retornar 400 quando cliente nao for encontrado")
    void deveRetornar400QuandoClienteNaoEncontrado() throws Exception {
      when(clienteService.buscarPorId(999))
          .thenThrow(new IllegalArgumentException("Cliente não encontrado."));

      mockMvc.perform(get("/api/clientes/{id}", 999))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.error").value("Bad Request"))
          .andExpect(jsonPath("$.message").value("Cliente não encontrado."));
    }
  }

  // ---------------------------------------------------------------------------
  // PUT /api/clientes/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("PUT /api/clientes/{id}")
  class Atualizar {

    @Test
    @DisplayName("Deve retornar 200 ao atualizar cliente com sucesso")
    void deveRetornar200AoAtualizarCliente() throws Exception {
      ClienteResponse response = ClienteResponse.builder()
          .id(1)
          .tipoPessoa("PJ")
          .documento("12345678000199")
          .razaoSocial("Empresa Atualizada LTDA")
          .nomeFantasia("Empresa Atualizada")
          .endereco("Av. Brasil, 456")
          .contato("11888888888")
          .isActive(true)
          .createdAt(LocalDateTime.of(2026, 1, 15, 10, 30))
          .build();

      when(clienteService.atualizar(eq(1), any(ClienteRequest.class))).thenReturn(response);

      ClienteRequest request = criarClienteRequest("PJ", "Empresa Atualizada LTDA");
      request.setDocumento("12345678000199");
      request.setNomeFantasia("Empresa Atualizada");
      request.setEndereco("Av. Brasil, 456");
      request.setContato("11888888888");

      mockMvc.perform(put("/api/clientes/{id}", 1)
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1))
          .andExpect(jsonPath("$.tipoPessoa").value("PJ"))
          .andExpect(jsonPath("$.razaoSocial").value("Empresa Atualizada LTDA"))
          .andExpect(jsonPath("$.nomeFantasia").value("Empresa Atualizada"));
    }

    @Test
    @DisplayName("Deve retornar 400 quando validacao falhar na atualizacao")
    void deveRetornar400QuandoValidacaoFalhar() throws Exception {
      ClienteRequest request = criarClienteRequest("", "");

      mockMvc.perform(put("/api/clientes/{id}", 1)
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").exists());
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/clientes/{id}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("DELETE /api/clientes/{id}")
  class Deletar {

    @Test
    @DisplayName("Deve retornar 204 ao deletar cliente com sucesso")
    void deveRetornar204AoDeletarCliente() throws Exception {
      doNothing().when(clienteService).deletar(1);

      mockMvc.perform(delete("/api/clientes/{id}", 1))
          .andExpect(status().isNoContent());

      verify(clienteService).deletar(1);
    }

    @Test
    @DisplayName("Deve retornar 400 quando cliente nao for encontrado ao deletar")
    void deveRetornar400QuandoClienteNaoEncontrado() throws Exception {
      doThrow(new IllegalArgumentException("Cliente não encontrado."))
          .when(clienteService).deletar(999);

      mockMvc.perform(delete("/api/clientes/{id}", 999))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.message").value("Cliente não encontrado."));
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/clientes/consulta-cnpj/{cnpj}
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("GET /api/clientes/consulta-cnpj/{cnpj}")
  class ConsultarCnpj {

    @Test
    @DisplayName("Deve retornar 200 com dados do CNPJ ao consultar com sucesso")
    void deveRetornar200ComDadosCnpj() throws Exception {
      ConsultaCnpjResponse response = ConsultaCnpjResponse.builder()
          .cnpj("12345678000199")
          .razaoSocial("Empresa Exemplo LTDA")
          .nomeFantasia("Empresa Exemplo")
          .endereco("Rua Exemplo, 100 - Sao Paulo/SP")
          .telefone("1133334444")
          .email("contato@exemplo.com")
          .build();

      when(brasilApiService.consultarCnpj("12345678000199")).thenReturn(response);

      mockMvc.perform(get("/api/clientes/consulta-cnpj/{cnpj}", "12345678000199"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.cnpj").value("12345678000199"))
          .andExpect(jsonPath("$.razaoSocial").value("Empresa Exemplo LTDA"))
          .andExpect(jsonPath("$.nomeFantasia").value("Empresa Exemplo"))
          .andExpect(jsonPath("$.endereco").value("Rua Exemplo, 100 - Sao Paulo/SP"))
          .andExpect(jsonPath("$.telefone").value("1133334444"))
          .andExpect(jsonPath("$.email").value("contato@exemplo.com"));
    }

    @Test
    @DisplayName("Deve retornar 400 quando CNPJ nao for encontrado")
    void deveRetornar400QuandoCnpjNaoEncontrado() throws Exception {
      when(brasilApiService.consultarCnpj("00000000000000"))
          .thenThrow(new IllegalArgumentException("CNPJ não encontrado."));

      mockMvc.perform(get("/api/clientes/consulta-cnpj/{cnpj}", "00000000000000"))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.status").value(400))
          .andExpect(jsonPath("$.error").value("Bad Request"))
          .andExpect(jsonPath("$.message").value("CNPJ não encontrado."));
    }
  }
}
