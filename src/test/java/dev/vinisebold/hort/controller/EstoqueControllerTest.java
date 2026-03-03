package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.response.*;
import dev.vinisebold.hort.service.EstoqueService;
import dev.vinisebold.hort.service.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EstoqueController.class)
@AutoConfigureMockMvc(addFilters = false)
class EstoqueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstoqueService estoqueService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CorsConfigurationSource corsConfigurationSource;

    @Test
    @DisplayName("GET /api/estoque/produtos - deve listar produtos com estoque e retornar 200")
    void listarProdutosComEstoque_deveRetornar200() throws Exception {
        ProdutoEstoqueResponse produto = ProdutoEstoqueResponse.builder()
                .id(1)
                .codigo("PROD-001")
                .descricao("Tomate Italiano")
                .unidadeMedidaSigla("KG")
                .estoqueAtual(new BigDecimal("50.000"))
                .isActive(true)
                .build();

        when(estoqueService.listarProdutosComEstoque()).thenReturn(List.of(produto));

        mockMvc.perform(get("/api/estoque/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].codigo").value("PROD-001"))
                .andExpect(jsonPath("$[0].descricao").value("Tomate Italiano"))
                .andExpect(jsonPath("$[0].unidadeMedidaSigla").value("KG"))
                .andExpect(jsonPath("$[0].estoqueAtual").value(50.000))
                .andExpect(jsonPath("$[0].isActive").value(true));

        verify(estoqueService).listarProdutosComEstoque();
    }

    @Test
    @DisplayName("GET /api/estoque/timeline/{produtoId} - deve retornar timeline do produto com 200")
    void getTimelineProduto_deveRetornar200() throws Exception {
        MovimentacaoEstoqueResponse mov = MovimentacaoEstoqueResponse.builder()
                .id(10)
                .produtoId(1)
                .produtoDescricao("Tomate Italiano")
                .naturezaOperacaoDescricao("Compra")
                .tipoMovimento("ENTRADA")
                .pedidoId(5)
                .quantidade(new BigDecimal("20.000"))
                .estoqueAposMovimentacao(new BigDecimal("70.000"))
                .dataMovimentacao(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();

        when(estoqueService.getTimelineProduto(1)).thenReturn(List.of(mov));

        mockMvc.perform(get("/api/estoque/timeline/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].produtoId").value(1))
                .andExpect(jsonPath("$[0].produtoDescricao").value("Tomate Italiano"))
                .andExpect(jsonPath("$[0].naturezaOperacaoDescricao").value("Compra"))
                .andExpect(jsonPath("$[0].tipoMovimento").value("ENTRADA"))
                .andExpect(jsonPath("$[0].pedidoId").value(5))
                .andExpect(jsonPath("$[0].quantidade").value(20.000))
                .andExpect(jsonPath("$[0].estoqueAposMovimentacao").value(70.000));

        verify(estoqueService).getTimelineProduto(1);
    }

    @Test
    @DisplayName("GET /api/estoque/timeline/{produtoId} - produto nao encontrado deve retornar 404")
    void getTimelineProduto_naoEncontrado_deveRetornar404() throws Exception {
        when(estoqueService.getTimelineProduto(999))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        mockMvc.perform(get("/api/estoque/timeline/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Produto não encontrado"));

        verify(estoqueService).getTimelineProduto(999);
    }

    @Test
    @DisplayName("GET /api/estoque/movimentacao/{movimentacaoId} - deve retornar detalhe da movimentacao com 200")
    void getDetalheMovimentacao_deveRetornar200() throws Exception {
        MovimentacaoEstoqueResponse movimentacao = MovimentacaoEstoqueResponse.builder()
                .id(10)
                .produtoId(1)
                .produtoDescricao("Tomate Italiano")
                .naturezaOperacaoDescricao("Compra")
                .tipoMovimento("ENTRADA")
                .pedidoId(5)
                .quantidade(new BigDecimal("20.000"))
                .estoqueAposMovimentacao(new BigDecimal("70.000"))
                .dataMovimentacao(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();

        PedidoResumidoResponse pedido = PedidoResumidoResponse.builder()
                .id(5)
                .naturezaOperacao("Compra")
                .clienteNome("Fornecedor ABC")
                .valorTotal(new BigDecimal("200.00"))
                .statusPagamento("PAGO")
                .dataEmissao(LocalDateTime.of(2026, 3, 1, 9, 0))
                .build();

        ItemPedidoResumidoResponse item = ItemPedidoResumidoResponse.builder()
                .id(1)
                .produtoId(1)
                .produtoDescricao("Tomate Italiano")
                .quantidade(new BigDecimal("20.000"))
                .valorUnitario(new BigDecimal("10.00"))
                .valorTotal(new BigDecimal("200.00"))
                .isDestacado(true)
                .build();

        DetalheMovimentacaoResponse response = DetalheMovimentacaoResponse.builder()
                .movimentacao(movimentacao)
                .pedido(pedido)
                .itens(List.of(item))
                .build();

        when(estoqueService.getDetalheMovimentacao(10)).thenReturn(response);

        mockMvc.perform(get("/api/estoque/movimentacao/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movimentacao.id").value(10))
                .andExpect(jsonPath("$.movimentacao.produtoId").value(1))
                .andExpect(jsonPath("$.movimentacao.tipoMovimento").value("ENTRADA"))
                .andExpect(jsonPath("$.pedido.id").value(5))
                .andExpect(jsonPath("$.pedido.naturezaOperacao").value("Compra"))
                .andExpect(jsonPath("$.pedido.clienteNome").value("Fornecedor ABC"))
                .andExpect(jsonPath("$.itens").isArray())
                .andExpect(jsonPath("$.itens[0].produtoDescricao").value("Tomate Italiano"))
                .andExpect(jsonPath("$.itens[0].isDestacado").value(true));

        verify(estoqueService).getDetalheMovimentacao(10);
    }

    @Test
    @DisplayName("GET /api/estoque/movimentacao/{movimentacaoId} - movimentacao nao encontrada deve retornar 404")
    void getDetalheMovimentacao_naoEncontrada_deveRetornar404() throws Exception {
        when(estoqueService.getDetalheMovimentacao(999))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimentação não encontrada"));

        mockMvc.perform(get("/api/estoque/movimentacao/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Movimentação não encontrada"));

        verify(estoqueService).getDetalheMovimentacao(999);
    }
}
