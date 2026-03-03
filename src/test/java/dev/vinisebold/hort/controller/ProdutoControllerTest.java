package dev.vinisebold.hort.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.vinisebold.hort.dto.request.ProdutoRequest;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.ProdutoResponse;
import dev.vinisebold.hort.dto.response.UnidadeMedidaResponse;
import dev.vinisebold.hort.service.JwtService;
import dev.vinisebold.hort.service.ProdutoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProdutoController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProdutoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ProdutoService produtoService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CorsConfigurationSource corsConfigurationSource;

    private UnidadeMedidaResponse buildUnidadeMedidaResponse() {
        return UnidadeMedidaResponse.builder()
                .id(1)
                .sigla("KG")
                .descricao("Quilograma")
                .isActive(true)
                .build();
    }

    private ProdutoResponse buildProdutoResponse(Integer id) {
        return ProdutoResponse.builder()
                .id(id)
                .codigo("PROD-001")
                .descricao("Tomate Italiano")
                .unidadeMedida(buildUnidadeMedidaResponse())
                .estoqueAtual(BigDecimal.ZERO)
                .isActive(true)
                .createdAt(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();
    }

    private ProdutoRequest buildProdutoRequest() {
        ProdutoRequest request = new ProdutoRequest();
        request.setCodigo("PROD-001");
        request.setDescricao("Tomate Italiano");
        request.setUnidadeMedidaId(1);
        return request;
    }

    @Test
    @DisplayName("POST /api/produtos - deve criar produto e retornar 201")
    void criarProduto_deveRetornar201() throws Exception {
        ProdutoResponse response = buildProdutoResponse(1);
        when(produtoService.criar(any(ProdutoRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildProdutoRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.codigo").value("PROD-001"))
                .andExpect(jsonPath("$.descricao").value("Tomate Italiano"))
                .andExpect(jsonPath("$.unidadeMedida.sigla").value("KG"))
                .andExpect(jsonPath("$.estoqueAtual").value(0))
                .andExpect(jsonPath("$.isActive").value(true));

        verify(produtoService).criar(any(ProdutoRequest.class));
    }

    @Test
    @DisplayName("POST /api/produtos - campos em branco devem retornar 400")
    void criarProduto_camposEmBranco_deveRetornar400() throws Exception {
        ProdutoRequest request = new ProdutoRequest();

        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists());

        verify(produtoService, never()).criar(any());
    }

    @Test
    @DisplayName("GET /api/produtos - deve listar produtos ativos e retornar 200")
    void listarProdutos_deveRetornar200() throws Exception {
        ProdutoResponse produto = buildProdutoResponse(1);
        CursorResponse<ProdutoResponse> cursorResponse = CursorResponse.<ProdutoResponse>builder()
                .data(List.of(produto))
                .nextCursor(1)
                .hasNext(false)
                .build();

        when(produtoService.listarAtivos(isNull(), eq(10))).thenReturn(cursorResponse);

        mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].codigo").value("PROD-001"))
                .andExpect(jsonPath("$.nextCursor").value(1))
                .andExpect(jsonPath("$.hasNext").value(false));

        verify(produtoService).listarAtivos(isNull(), eq(10));
    }

    @Test
    @DisplayName("GET /api/produtos/{id} - deve retornar produto por id com 200")
    void buscarPorId_deveRetornar200() throws Exception {
        ProdutoResponse response = buildProdutoResponse(5);
        when(produtoService.buscarPorId(5)).thenReturn(response);

        mockMvc.perform(get("/api/produtos/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.codigo").value("PROD-001"))
                .andExpect(jsonPath("$.descricao").value("Tomate Italiano"));

        verify(produtoService).buscarPorId(5);
    }

    @Test
    @DisplayName("GET /api/produtos/{id} - produto nao encontrado deve retornar 400")
    void buscarPorId_naoEncontrado_deveRetornar400() throws Exception {
        when(produtoService.buscarPorId(999))
                .thenThrow(new IllegalArgumentException("Produto não encontrado."));

        mockMvc.perform(get("/api/produtos/999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Produto não encontrado."));

        verify(produtoService).buscarPorId(999);
    }

    @Test
    @DisplayName("PUT /api/produtos/{id} - deve atualizar produto e retornar 200")
    void atualizarProduto_deveRetornar200() throws Exception {
        ProdutoResponse response = ProdutoResponse.builder()
                .id(1)
                .codigo("PROD-002")
                .descricao("Tomate Cereja")
                .unidadeMedida(buildUnidadeMedidaResponse())
                .estoqueAtual(BigDecimal.TEN)
                .isActive(true)
                .createdAt(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();

        when(produtoService.atualizar(eq(1), any(ProdutoRequest.class))).thenReturn(response);

        ProdutoRequest request = new ProdutoRequest();
        request.setCodigo("PROD-002");
        request.setDescricao("Tomate Cereja");
        request.setUnidadeMedidaId(1);

        mockMvc.perform(put("/api/produtos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.codigo").value("PROD-002"))
                .andExpect(jsonPath("$.descricao").value("Tomate Cereja"));

        verify(produtoService).atualizar(eq(1), any(ProdutoRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/produtos/{id} - deve deletar produto e retornar 204")
    void deletarProduto_deveRetornar204() throws Exception {
        doNothing().when(produtoService).deletar(1);

        mockMvc.perform(delete("/api/produtos/1"))
                .andExpect(status().isNoContent());

        verify(produtoService).deletar(1);
    }
}
