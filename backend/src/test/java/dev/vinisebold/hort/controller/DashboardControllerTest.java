package dev.vinisebold.hort.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.vinisebold.hort.dto.response.DashboardResumoResponse;
import dev.vinisebold.hort.dto.response.TopClienteResponse;
import dev.vinisebold.hort.dto.response.TopProdutoResponse;
import dev.vinisebold.hort.dto.response.VendasPeriodoResponse;
import dev.vinisebold.hort.service.DashboardService;
import dev.vinisebold.hort.service.JwtService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
class DashboardControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockitoBean
  private DashboardService dashboardService;

  @MockitoBean
  private JwtService jwtService;

  @MockitoBean
  private CorsConfigurationSource corsConfigurationSource;

  @Test
  @DisplayName("GET /api/dashboard/resumo - deve retornar resumo do dashboard com 200")
  void getResumo_deveRetornar200() throws Exception {
    DashboardResumoResponse response = DashboardResumoResponse.builder()
        .produtoMaisVendidoNome("Tomate Italiano")
        .produtoMaisVendidoQtd(150)
        .clienteMaisFielNome("João da Silva")
        .clienteMaisFielCompras(12)
        .totalVendidoPeriodo(new BigDecimal("5000.00"))
        .build();

    when(dashboardService.getResumo("ULTIMOS_7_DIAS")).thenReturn(response);

    mockMvc.perform(get("/api/dashboard/resumo")
        .param("periodo", "ULTIMOS_7_DIAS"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.produtoMaisVendidoNome").value("Tomate Italiano"))
        .andExpect(jsonPath("$.produtoMaisVendidoQtd").value(150))
        .andExpect(jsonPath("$.clienteMaisFielNome").value("João da Silva"))
        .andExpect(jsonPath("$.clienteMaisFielCompras").value(12))
        .andExpect(jsonPath("$.totalVendidoPeriodo").value(5000.00));

    verify(dashboardService).getResumo("ULTIMOS_7_DIAS");
  }

  @Test
  @DisplayName("GET /api/dashboard/resumo - deve usar periodo padrao HOJE quando nao informado")
  void getResumo_periodoPadrao_deveRetornar200() throws Exception {
    DashboardResumoResponse response = DashboardResumoResponse.builder()
        .totalVendidoPeriodo(BigDecimal.ZERO)
        .build();

    when(dashboardService.getResumo("HOJE")).thenReturn(response);

    mockMvc.perform(get("/api/dashboard/resumo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalVendidoPeriodo").value(0));

    verify(dashboardService).getResumo("HOJE");
  }

  @Test
  @DisplayName("GET /api/dashboard/vendas-por-dia - deve retornar vendas por dia com 200")
  void getVendasPorDia_deveRetornar200() throws Exception {
    VendasPeriodoResponse venda = VendasPeriodoResponse.builder()
        .periodo("01/03")
        .totalVendido(new BigDecimal("1500.00"))
        .build();

    when(dashboardService.getVendasPorDia("ULTIMOS_7_DIAS")).thenReturn(List.of(venda));

    mockMvc.perform(get("/api/dashboard/vendas-por-dia")
        .param("periodo", "ULTIMOS_7_DIAS"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].periodo").value("01/03"))
        .andExpect(jsonPath("$[0].totalVendido").value(1500.00));

    verify(dashboardService).getVendasPorDia("ULTIMOS_7_DIAS");
  }

  @Test
  @DisplayName("GET /api/dashboard/vendas-por-mes - deve retornar vendas por mes com 200")
  void getVendasPorMes_deveRetornar200() throws Exception {
    VendasPeriodoResponse venda = VendasPeriodoResponse.builder()
        .periodo("03/2026")
        .totalVendido(new BigDecimal("12000.00"))
        .build();

    when(dashboardService.getVendasPorMes("ESTE_ANO")).thenReturn(List.of(venda));

    mockMvc.perform(get("/api/dashboard/vendas-por-mes")
        .param("periodo", "ESTE_ANO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].periodo").value("03/2026"))
        .andExpect(jsonPath("$[0].totalVendido").value(12000.00));

    verify(dashboardService).getVendasPorMes("ESTE_ANO");
  }

  @Test
  @DisplayName("GET /api/dashboard/top-produtos-vendidos - deve retornar top produtos vendidos com 200")
  void getTopProdutosVendidos_deveRetornar200() throws Exception {
    TopProdutoResponse produto = TopProdutoResponse.builder()
        .produtoId(1)
        .produtoNome("Tomate Italiano")
        .quantidadeVendida(new BigDecimal("300.000"))
        .valorTotal(null)
        .build();

    when(dashboardService.getTop10ProdutosMaisVendidos("ULTIMO_MES")).thenReturn(List.of(produto));

    mockMvc.perform(get("/api/dashboard/top-produtos-vendidos")
        .param("periodo", "ULTIMO_MES"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].produtoId").value(1))
        .andExpect(jsonPath("$[0].produtoNome").value("Tomate Italiano"))
        .andExpect(jsonPath("$[0].quantidadeVendida").value(300.000));

    verify(dashboardService).getTop10ProdutosMaisVendidos("ULTIMO_MES");
  }

  @Test
  @DisplayName("GET /api/dashboard/top-produtos-lucrativos - deve retornar top produtos lucrativos com 200")
  void getTopProdutosLucrativos_deveRetornar200() throws Exception {
    TopProdutoResponse produto = TopProdutoResponse.builder()
        .produtoId(2)
        .produtoNome("Alface Crespa")
        .quantidadeVendida(null)
        .valorTotal(new BigDecimal("8500.00"))
        .build();

    when(dashboardService.getTop10ProdutosMaisLucrativos("ULTIMO_MES"))
        .thenReturn(List.of(produto));

    mockMvc.perform(get("/api/dashboard/top-produtos-lucrativos")
        .param("periodo", "ULTIMO_MES"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].produtoId").value(2))
        .andExpect(jsonPath("$[0].produtoNome").value("Alface Crespa"))
        .andExpect(jsonPath("$[0].valorTotal").value(8500.00));

    verify(dashboardService).getTop10ProdutosMaisLucrativos("ULTIMO_MES");
  }

  @Test
  @DisplayName("GET /api/dashboard/top-clientes-fieis - deve retornar top clientes fieis com 200")
  void getTopClientesFieis_deveRetornar200() throws Exception {
    TopClienteResponse cliente = TopClienteResponse.builder()
        .clienteId(1)
        .clienteNome("João da Silva")
        .quantidadeCompras(25)
        .valorTotal(null)
        .build();

    when(dashboardService.getTop10ClientesMaisFieis("ULTIMOS_7_DIAS")).thenReturn(List.of(cliente));

    mockMvc.perform(get("/api/dashboard/top-clientes-fieis")
        .param("periodo", "ULTIMOS_7_DIAS"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].clienteId").value(1))
        .andExpect(jsonPath("$[0].clienteNome").value("João da Silva"))
        .andExpect(jsonPath("$[0].quantidadeCompras").value(25));

    verify(dashboardService).getTop10ClientesMaisFieis("ULTIMOS_7_DIAS");
  }

  @Test
  @DisplayName("GET /api/dashboard/top-clientes-lucrativos - deve retornar top clientes lucrativos com 200")
  void getTopClientesLucrativos_deveRetornar200() throws Exception {
    TopClienteResponse cliente = TopClienteResponse.builder()
        .clienteId(3)
        .clienteNome("Restaurante Boa Mesa")
        .quantidadeCompras(null)
        .valorTotal(new BigDecimal("15000.00"))
        .build();

    when(dashboardService.getTop10ClientesMaisLucrativos("ESTE_ANO")).thenReturn(List.of(cliente));

    mockMvc.perform(get("/api/dashboard/top-clientes-lucrativos")
        .param("periodo", "ESTE_ANO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].clienteId").value(3))
        .andExpect(jsonPath("$[0].clienteNome").value("Restaurante Boa Mesa"))
        .andExpect(jsonPath("$[0].valorTotal").value(15000.00));

    verify(dashboardService).getTop10ClientesMaisLucrativos("ESTE_ANO");
  }
}
