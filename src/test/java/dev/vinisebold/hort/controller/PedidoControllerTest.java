package dev.vinisebold.hort.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.vinisebold.hort.dto.request.ItemPedidoRequest;
import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.ItemPedidoResponse;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.service.JwtService;
import dev.vinisebold.hort.service.PedidoService;
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
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PedidoController.class)
@AutoConfigureMockMvc(addFilters = false)
class PedidoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private PedidoService pedidoService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CorsConfigurationSource corsConfigurationSource;

    private ItemPedidoRequest buildItemPedidoRequest() {
        ItemPedidoRequest item = new ItemPedidoRequest();
        item.setProdutoId(1);
        item.setQuantidade(new BigDecimal("5.000"));
        item.setValorUnitario(new BigDecimal("3.50"));
        return item;
    }

    private PedidoRequest buildPedidoRequest() {
        PedidoRequest request = new PedidoRequest();
        request.setNaturezaOperacaoId(1);
        request.setClienteId(1);
        request.setFormaPagamentoId(1);
        request.setDocumentoReferencia("PIX-12345");
        request.setStatusPagamento("PAGO");
        request.setItens(List.of(buildItemPedidoRequest()));
        return request;
    }

    private PedidoResponse buildPedidoResponse(Integer id) {
        ItemPedidoResponse itemResponse = ItemPedidoResponse.builder()
                .id(1)
                .produtoId(1)
                .produtoDescricao("Tomate Italiano")
                .quantidade(new BigDecimal("5.000"))
                .valorUnitario(new BigDecimal("3.50"))
                .valorTotal(new BigDecimal("17.500"))
                .custoUnitario(BigDecimal.ZERO)
                .build();

        return PedidoResponse.builder()
                .id(id)
                .naturezaOperacao("Venda")
                .clienteNome("João da Silva")
                .formaPagamento("PIX")
                .documentoReferencia("PIX-12345")
                .valorTotal(new BigDecimal("17.500"))
                .statusPagamento("PAGO")
                .dataEmissao(LocalDateTime.of(2026, 3, 1, 14, 30))
                .itens(List.of(itemResponse))
                .build();
    }

    @Test
    @DisplayName("POST /api/pedidos - deve processar pedido e retornar 201")
    void processarPedido_deveRetornar201() throws Exception {
        PedidoResponse response = buildPedidoResponse(1);
        when(pedidoService.processarPedido(any(PedidoRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildPedidoRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.naturezaOperacao").value("Venda"))
                .andExpect(jsonPath("$.clienteNome").value("João da Silva"))
                .andExpect(jsonPath("$.formaPagamento").value("PIX"))
                .andExpect(jsonPath("$.valorTotal").value(17.500))
                .andExpect(jsonPath("$.statusPagamento").value("PAGO"))
                .andExpect(jsonPath("$.itens").isArray())
                .andExpect(jsonPath("$.itens[0].produtoDescricao").value("Tomate Italiano"));

        verify(pedidoService).processarPedido(any(PedidoRequest.class));
    }

    @Test
    @DisplayName("POST /api/pedidos - naturezaOperacaoId nulo e itens vazio devem retornar 400")
    void processarPedido_validacaoFalha_deveRetornar400() throws Exception {
        PedidoRequest request = new PedidoRequest();
        // naturezaOperacaoId null, formaPagamentoId null, statusPagamento null, itens null

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists());

        verify(pedidoService, never()).processarPedido(any());
    }

    @Test
    @DisplayName("GET /api/pedidos - deve listar pedidos e retornar 200")
    void listarPedidos_deveRetornar200() throws Exception {
        PedidoResponse pedido = buildPedidoResponse(1);
        CursorResponse<PedidoResponse> cursorResponse = CursorResponse.<PedidoResponse>builder()
                .data(List.of(pedido))
                .nextCursor(1)
                .hasNext(false)
                .build();

        when(pedidoService.listarTodos(isNull(), eq(10))).thenReturn(cursorResponse);

        mockMvc.perform(get("/api/pedidos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].naturezaOperacao").value("Venda"))
                .andExpect(jsonPath("$.nextCursor").value(1))
                .andExpect(jsonPath("$.hasNext").value(false));

        verify(pedidoService).listarTodos(isNull(), eq(10));
    }

    @Test
    @DisplayName("GET /api/pedidos/{id} - deve retornar pedido por id com 200")
    void buscarPorId_deveRetornar200() throws Exception {
        PedidoResponse response = buildPedidoResponse(5);
        when(pedidoService.buscarPorId(5)).thenReturn(response);

        mockMvc.perform(get("/api/pedidos/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.naturezaOperacao").value("Venda"))
                .andExpect(jsonPath("$.clienteNome").value("João da Silva"))
                .andExpect(jsonPath("$.itens[0].produtoId").value(1));

        verify(pedidoService).buscarPorId(5);
    }

    @Test
    @DisplayName("GET /api/pedidos/{id} - pedido nao encontrado deve retornar 400")
    void buscarPorId_naoEncontrado_deveRetornar400() throws Exception {
        when(pedidoService.buscarPorId(999))
                .thenThrow(new IllegalArgumentException("Pedido não encontrado"));

        mockMvc.perform(get("/api/pedidos/999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Pedido não encontrado"));

        verify(pedidoService).buscarPorId(999);
    }

    @Test
    @DisplayName("POST /api/pedidos/{id}/cancelar - deve cancelar pedido e retornar 204")
    void cancelarPedido_deveRetornar204() throws Exception {
        doNothing().when(pedidoService).cancelarPedido(1);

        mockMvc.perform(post("/api/pedidos/1/cancelar"))
                .andExpect(status().isNoContent());

        verify(pedidoService).cancelarPedido(1);
    }

    @Test
    @DisplayName("POST /api/pedidos/{id}/cancelar - pedido ja cancelado deve retornar 409")
    void cancelarPedido_jaCancelado_deveRetornar409() throws Exception {
        doThrow(new IllegalStateException("Pedido já está cancelado."))
                .when(pedidoService).cancelarPedido(1);

        mockMvc.perform(post("/api/pedidos/1/cancelar"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Pedido já está cancelado."));

        verify(pedidoService).cancelarPedido(1);
    }
}
