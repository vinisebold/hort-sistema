package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.response.DashboardResumoResponse;
import dev.vinisebold.hort.dto.response.TopClienteResponse;
import dev.vinisebold.hort.dto.response.TopProdutoResponse;
import dev.vinisebold.hort.dto.response.VendasPeriodoResponse;
import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.ItemPedidoRepository;
import dev.vinisebold.hort.repository.PedidoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ItemPedidoRepository itemPedidoRepository;

    @InjectMocks
    private DashboardService dashboardService;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private Cliente criarCliente(Integer id, String razaoSocial) {
        Cliente cliente = new Cliente();
        cliente.setId(id);
        cliente.setRazaoSocial(razaoSocial);
        return cliente;
    }

    private Produto criarProduto(Integer id, String descricao) {
        Produto produto = new Produto();
        produto.setId(id);
        produto.setDescricao(descricao);
        return produto;
    }

    private NaturezaOperacao criarNaturezaSaida() {
        NaturezaOperacao nat = new NaturezaOperacao();
        nat.setId(1);
        nat.setDescricao("Venda");
        nat.setTipoMovimento(TipoMovimento.SAIDA);
        return nat;
    }

    private Pedido criarPedido(Integer id, BigDecimal valorTotal, Cliente cliente,
                               LocalDateTime dataEmissao) {
        Pedido pedido = new Pedido();
        pedido.setId(id);
        pedido.setValorTotal(valorTotal);
        pedido.setCliente(cliente);
        pedido.setNaturezaOperacao(criarNaturezaSaida());
        pedido.setDataEmissao(dataEmissao);
        pedido.setStatusPagamento("PAGO");
        pedido.setFormaPagamento(new FormaPagamento());
        return pedido;
    }

    private ItemPedido criarItemPedido(Integer id, Pedido pedido, Produto produto,
                                       BigDecimal quantidade, BigDecimal valorUnitario,
                                       BigDecimal custoUnitario, BigDecimal valorTotal) {
        ItemPedido item = new ItemPedido();
        item.setId(id);
        item.setPedido(pedido);
        item.setProduto(produto);
        item.setQuantidade(quantidade);
        item.setValorUnitario(valorUnitario);
        item.setCustoUnitario(custoUnitario);
        item.setValorTotal(valorTotal);
        return item;
    }

    private void configurarRepositorioVendas(List<Pedido> vendas) {
        when(pedidoRepository.findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(
                eq(TipoMovimento.SAIDA), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(vendas);
    }

    private void configurarRepositorioItens(List<ItemPedido> itens) {
        when(itemPedidoRepository.findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(
                eq(TipoMovimento.SAIDA), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(itens);
    }

    // ---------------------------------------------------------------------------
    // getResumo
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getResumo")
    class GetResumo {

        @Test
        @DisplayName("Deve retornar resumo com dados de vendas no periodo")
        void deveRetornarResumoComDados() {
            Cliente cliente1 = criarCliente(1, "Joao Silva");
            Cliente cliente2 = criarCliente(2, "Maria Souza");
            Produto produto1 = criarProduto(1, "Tomate");
            Produto produto2 = criarProduto(2, "Alface");

            LocalDateTime agora = LocalDateTime.now();

            Pedido pedido1 = criarPedido(1, new BigDecimal("150.00"), cliente1, agora);
            Pedido pedido2 = criarPedido(2, new BigDecimal("200.00"), cliente1, agora);
            Pedido pedido3 = criarPedido(3, new BigDecimal("100.00"), cliente2, agora);

            ItemPedido item1 = criarItemPedido(1, pedido1, produto1,
                    new BigDecimal("10"), new BigDecimal("15.00"),
                    new BigDecimal("8.00"), new BigDecimal("150.00"));
            ItemPedido item2 = criarItemPedido(2, pedido2, produto1,
                    new BigDecimal("5"), new BigDecimal("15.00"),
                    new BigDecimal("8.00"), new BigDecimal("75.00"));
            ItemPedido item3 = criarItemPedido(3, pedido3, produto2,
                    new BigDecimal("3"), new BigDecimal("5.00"),
                    new BigDecimal("2.00"), new BigDecimal("15.00"));

            configurarRepositorioVendas(List.of(pedido1, pedido2, pedido3));
            configurarRepositorioItens(List.of(item1, item2, item3));

            DashboardResumoResponse resumo = dashboardService.getResumo("HOJE");

            assertThat(resumo).isNotNull();
            assertThat(resumo.getTotalVendidoPeriodo()).isEqualByComparingTo(new BigDecimal("450.00"));
            assertThat(resumo.getProdutoMaisVendidoNome()).isEqualTo("Tomate");
            assertThat(resumo.getProdutoMaisVendidoQtd()).isEqualTo(15);
            assertThat(resumo.getClienteMaisFielNome()).isEqualTo("Joao Silva");
            assertThat(resumo.getClienteMaisFielCompras()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar resumo vazio quando nao houver vendas")
        void deveRetornarResumoVazio_quandoSemVendas() {
            configurarRepositorioVendas(Collections.emptyList());
            configurarRepositorioItens(Collections.emptyList());

            DashboardResumoResponse resumo = dashboardService.getResumo("HOJE");

            assertThat(resumo).isNotNull();
            assertThat(resumo.getTotalVendidoPeriodo()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(resumo.getProdutoMaisVendidoNome()).isNull();
            assertThat(resumo.getProdutoMaisVendidoQtd()).isNull();
            assertThat(resumo.getClienteMaisFielNome()).isNull();
            assertThat(resumo.getClienteMaisFielCompras()).isNull();
        }

        @Test
        @DisplayName("Deve tratar vendas sem cliente (cliente nulo)")
        void deveTratarVendasSemCliente() {
            Produto produto = criarProduto(1, "Banana");
            LocalDateTime agora = LocalDateTime.now();

            Pedido pedidoSemCliente = criarPedido(1, new BigDecimal("50.00"), null, agora);

            ItemPedido item = criarItemPedido(1, pedidoSemCliente, produto,
                    new BigDecimal("5"), new BigDecimal("10.00"),
                    new BigDecimal("5.00"), new BigDecimal("50.00"));

            configurarRepositorioVendas(List.of(pedidoSemCliente));
            configurarRepositorioItens(List.of(item));

            DashboardResumoResponse resumo = dashboardService.getResumo("HOJE");

            assertThat(resumo.getTotalVendidoPeriodo()).isEqualByComparingTo(new BigDecimal("50.00"));
            assertThat(resumo.getProdutoMaisVendidoNome()).isEqualTo("Banana");
            assertThat(resumo.getClienteMaisFielNome()).isNull();
            assertThat(resumo.getClienteMaisFielCompras()).isNull();
        }
    }

    // ---------------------------------------------------------------------------
    // getVendasPorDia
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getVendasPorDia")
    class GetVendasPorDia {

        @Test
        @DisplayName("Deve agrupar vendas por dia e retornar ordenado")
        void deveAgruparVendasPorDia() {
            LocalDateTime dia1 = LocalDate.of(2026, 1, 15).atTime(10, 0);
            LocalDateTime dia2 = LocalDate.of(2026, 1, 16).atTime(14, 30);
            LocalDateTime dia1Tarde = LocalDate.of(2026, 1, 15).atTime(16, 0);

            Pedido p1 = criarPedido(1, new BigDecimal("100.00"), null, dia1);
            Pedido p2 = criarPedido(2, new BigDecimal("200.00"), null, dia2);
            Pedido p3 = criarPedido(3, new BigDecimal("50.00"), null, dia1Tarde);

            configurarRepositorioVendas(List.of(p1, p2, p3));

            List<VendasPeriodoResponse> resultado = dashboardService.getVendasPorDia("HOJE");

            assertThat(resultado).hasSize(2);
            assertThat(resultado.get(0).getPeriodo()).isEqualTo("15/01");
            assertThat(resultado.get(0).getTotalVendido()).isEqualByComparingTo(new BigDecimal("150.00"));
            assertThat(resultado.get(1).getPeriodo()).isEqualTo("16/01");
            assertThat(resultado.get(1).getTotalVendido()).isEqualByComparingTo(new BigDecimal("200.00"));
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nao houver vendas")
        void deveRetornarListaVazia_quandoSemVendas() {
            configurarRepositorioVendas(Collections.emptyList());

            List<VendasPeriodoResponse> resultado = dashboardService.getVendasPorDia("HOJE");

            assertThat(resultado).isEmpty();
        }
    }

    // ---------------------------------------------------------------------------
    // getVendasPorMes
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getVendasPorMes")
    class GetVendasPorMes {

        @Test
        @DisplayName("Deve agrupar vendas por mes e retornar ordenado")
        void deveAgruparVendasPorMes() {
            LocalDateTime jan = LocalDate.of(2026, 1, 10).atStartOfDay();
            LocalDateTime fev = LocalDate.of(2026, 2, 15).atStartOfDay();
            LocalDateTime janFim = LocalDate.of(2026, 1, 28).atTime(20, 0);

            Pedido p1 = criarPedido(1, new BigDecimal("300.00"), null, jan);
            Pedido p2 = criarPedido(2, new BigDecimal("500.00"), null, fev);
            Pedido p3 = criarPedido(3, new BigDecimal("200.00"), null, janFim);

            configurarRepositorioVendas(List.of(p1, p2, p3));

            List<VendasPeriodoResponse> resultado = dashboardService.getVendasPorMes("ESTE_ANO");

            assertThat(resultado).hasSize(2);
            assertThat(resultado.get(0).getPeriodo()).isEqualTo("01/2026");
            assertThat(resultado.get(0).getTotalVendido()).isEqualByComparingTo(new BigDecimal("500.00"));
            assertThat(resultado.get(1).getPeriodo()).isEqualTo("02/2026");
            assertThat(resultado.get(1).getTotalVendido()).isEqualByComparingTo(new BigDecimal("500.00"));
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nao houver vendas")
        void deveRetornarListaVazia_quandoSemVendas() {
            configurarRepositorioVendas(Collections.emptyList());

            List<VendasPeriodoResponse> resultado = dashboardService.getVendasPorMes("ESTE_ANO");

            assertThat(resultado).isEmpty();
        }
    }

    // ---------------------------------------------------------------------------
    // getTop10ProdutosMaisVendidos
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getTop10ProdutosMaisVendidos")
    class GetTop10ProdutosMaisVendidos {

        @Test
        @DisplayName("Deve retornar top 10 produtos ordenados por quantidade vendida")
        void deveRetornarTop10OrdenadosPorQuantidade() {
            Pedido pedido = criarPedido(1, new BigDecimal("1000.00"), null, LocalDateTime.now());

            List<ItemPedido> itens = new ArrayList<>();
            for (int i = 1; i <= 12; i++) {
                Produto produto = criarProduto(i, "Produto " + i);
                itens.add(criarItemPedido(i, pedido, produto,
                        new BigDecimal(i * 10), new BigDecimal("5.00"),
                        new BigDecimal("3.00"), new BigDecimal(i * 50)));
            }

            configurarRepositorioItens(itens);

            List<TopProdutoResponse> resultado = dashboardService.getTop10ProdutosMaisVendidos("HOJE");

            assertThat(resultado).hasSize(10);
            assertThat(resultado.get(0).getProdutoNome()).isEqualTo("Produto 12");
            assertThat(resultado.get(0).getQuantidadeVendida())
                    .isEqualByComparingTo(new BigDecimal("120"));
            assertThat(resultado.get(9).getProdutoNome()).isEqualTo("Produto 3");
            assertThat(resultado.get(9).getQuantidadeVendida())
                    .isEqualByComparingTo(new BigDecimal("30"));
        }

        @Test
        @DisplayName("Deve agregar quantidades do mesmo produto de itens diferentes")
        void deveAgregarQuantidadesDoMesmoProduto() {
            Pedido pedido = criarPedido(1, new BigDecimal("500.00"), null, LocalDateTime.now());
            Produto tomate = criarProduto(1, "Tomate");

            ItemPedido item1 = criarItemPedido(1, pedido, tomate,
                    new BigDecimal("10"), new BigDecimal("5.00"),
                    new BigDecimal("3.00"), new BigDecimal("50.00"));
            ItemPedido item2 = criarItemPedido(2, pedido, tomate,
                    new BigDecimal("15"), new BigDecimal("5.00"),
                    new BigDecimal("3.00"), new BigDecimal("75.00"));

            configurarRepositorioItens(List.of(item1, item2));

            List<TopProdutoResponse> resultado = dashboardService.getTop10ProdutosMaisVendidos("HOJE");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getProdutoNome()).isEqualTo("Tomate");
            assertThat(resultado.get(0).getQuantidadeVendida())
                    .isEqualByComparingTo(new BigDecimal("25"));
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nao houver itens")
        void deveRetornarListaVazia_quandoSemItens() {
            configurarRepositorioItens(Collections.emptyList());

            List<TopProdutoResponse> resultado = dashboardService.getTop10ProdutosMaisVendidos("HOJE");

            assertThat(resultado).isEmpty();
        }
    }

    // ---------------------------------------------------------------------------
    // getTop10ProdutosMaisLucrativos
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getTop10ProdutosMaisLucrativos")
    class GetTop10ProdutosMaisLucrativos {

        @Test
        @DisplayName("Deve calcular lucro como valorTotal - (quantidade * custoUnitario)")
        void deveCalcularLucroCorretamente() {
            Pedido pedido = criarPedido(1, new BigDecimal("500.00"), null, LocalDateTime.now());
            Produto produto = criarProduto(1, "Manga");

            // valorTotal=100, quantidade=10, custoUnitario=5 -> lucro = 100 - (10*5) = 50
            ItemPedido item = criarItemPedido(1, pedido, produto,
                    new BigDecimal("10"), new BigDecimal("10.00"),
                    new BigDecimal("5.00"), new BigDecimal("100.00"));

            configurarRepositorioItens(List.of(item));

            List<TopProdutoResponse> resultado = dashboardService.getTop10ProdutosMaisLucrativos("HOJE");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getProdutoNome()).isEqualTo("Manga");
            assertThat(resultado.get(0).getValorTotal())
                    .isEqualByComparingTo(new BigDecimal("50.00"));
        }

        @Test
        @DisplayName("Deve ordenar por lucro em ordem decrescente e limitar a 10")
        void deveOrdenarPorLucroDecrescenteELimitarA10() {
            Pedido pedido = criarPedido(1, new BigDecimal("5000.00"), null, LocalDateTime.now());

            List<ItemPedido> itens = new ArrayList<>();
            for (int i = 1; i <= 12; i++) {
                Produto produto = criarProduto(i, "Produto " + i);
                // lucro = valorTotal - (quantidade * custoUnitario)
                // = (i * 100) - (10 * (i * 3)) = i*100 - i*30 = i*70
                itens.add(criarItemPedido(i, pedido, produto,
                        new BigDecimal("10"), new BigDecimal(i * 10),
                        new BigDecimal(i * 3), new BigDecimal(i * 100)));
            }

            configurarRepositorioItens(itens);

            List<TopProdutoResponse> resultado = dashboardService.getTop10ProdutosMaisLucrativos("HOJE");

            assertThat(resultado).hasSize(10);
            assertThat(resultado.get(0).getProdutoNome()).isEqualTo("Produto 12");
            assertThat(resultado.get(0).getValorTotal())
                    .isEqualByComparingTo(new BigDecimal("840"));  // 12*70
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nao houver itens")
        void deveRetornarListaVazia_quandoSemItens() {
            configurarRepositorioItens(Collections.emptyList());

            List<TopProdutoResponse> resultado = dashboardService.getTop10ProdutosMaisLucrativos("HOJE");

            assertThat(resultado).isEmpty();
        }
    }

    // ---------------------------------------------------------------------------
    // getTop10ClientesMaisFieis
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getTop10ClientesMaisFieis")
    class GetTop10ClientesMaisFieis {

        @Test
        @DisplayName("Deve contar pedidos por cliente e retornar ordenado")
        void deveContarPedidosPorClienteEOrdenar() {
            Cliente joao = criarCliente(1, "Joao");
            Cliente maria = criarCliente(2, "Maria");
            LocalDateTime agora = LocalDateTime.now();

            Pedido p1 = criarPedido(1, new BigDecimal("100.00"), joao, agora);
            Pedido p2 = criarPedido(2, new BigDecimal("150.00"), joao, agora);
            Pedido p3 = criarPedido(3, new BigDecimal("200.00"), joao, agora);
            Pedido p4 = criarPedido(4, new BigDecimal("80.00"), maria, agora);

            configurarRepositorioVendas(List.of(p1, p2, p3, p4));

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisFieis("HOJE");

            assertThat(resultado).hasSize(2);
            assertThat(resultado.get(0).getClienteNome()).isEqualTo("Joao");
            assertThat(resultado.get(0).getQuantidadeCompras()).isEqualTo(3);
            assertThat(resultado.get(1).getClienteNome()).isEqualTo("Maria");
            assertThat(resultado.get(1).getQuantidadeCompras()).isEqualTo(1);
        }

        @Test
        @DisplayName("Deve ignorar pedidos sem cliente")
        void deveIgnorarPedidosSemCliente() {
            Cliente cliente = criarCliente(1, "Carlos");
            LocalDateTime agora = LocalDateTime.now();

            Pedido comCliente = criarPedido(1, new BigDecimal("100.00"), cliente, agora);
            Pedido semCliente = criarPedido(2, new BigDecimal("50.00"), null, agora);

            configurarRepositorioVendas(List.of(comCliente, semCliente));

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisFieis("HOJE");

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getClienteNome()).isEqualTo("Carlos");
            assertThat(resultado.get(0).getQuantidadeCompras()).isEqualTo(1);
        }

        @Test
        @DisplayName("Deve limitar resultado a 10 clientes")
        void deveLimitarA10Clientes() {
            LocalDateTime agora = LocalDateTime.now();
            List<Pedido> pedidos = new ArrayList<>();
            for (int i = 1; i <= 15; i++) {
                Cliente cliente = criarCliente(i, "Cliente " + i);
                pedidos.add(criarPedido(i, new BigDecimal("100.00"), cliente, agora));
            }

            configurarRepositorioVendas(pedidos);

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisFieis("HOJE");

            assertThat(resultado).hasSize(10);
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nao houver vendas")
        void deveRetornarListaVazia_quandoSemVendas() {
            configurarRepositorioVendas(Collections.emptyList());

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisFieis("HOJE");

            assertThat(resultado).isEmpty();
        }
    }

    // ---------------------------------------------------------------------------
    // getTop10ClientesMaisLucrativos
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("getTop10ClientesMaisLucrativos")
    class GetTop10ClientesMaisLucrativos {

        @Test
        @DisplayName("Deve somar valor total por cliente e retornar ordenado")
        void deveSomarValorTotalPorCliente() {
            Cliente joao = criarCliente(1, "Joao");
            Cliente maria = criarCliente(2, "Maria");
            LocalDateTime agora = LocalDateTime.now();

            Pedido p1 = criarPedido(1, new BigDecimal("300.00"), joao, agora);
            Pedido p2 = criarPedido(2, new BigDecimal("200.00"), joao, agora);
            Pedido p3 = criarPedido(3, new BigDecimal("600.00"), maria, agora);

            configurarRepositorioVendas(List.of(p1, p2, p3));

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisLucrativos("HOJE");

            assertThat(resultado).hasSize(2);
            assertThat(resultado.get(0).getClienteNome()).isEqualTo("Maria");
            assertThat(resultado.get(0).getValorTotal())
                    .isEqualByComparingTo(new BigDecimal("600.00"));
            assertThat(resultado.get(1).getClienteNome()).isEqualTo("Joao");
            assertThat(resultado.get(1).getValorTotal())
                    .isEqualByComparingTo(new BigDecimal("500.00"));
        }

        @Test
        @DisplayName("Deve ignorar pedidos sem cliente")
        void deveIgnorarPedidosSemCliente() {
            LocalDateTime agora = LocalDateTime.now();

            Pedido semCliente = criarPedido(1, new BigDecimal("500.00"), null, agora);

            configurarRepositorioVendas(List.of(semCliente));

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisLucrativos("HOJE");

            assertThat(resultado).isEmpty();
        }

        @Test
        @DisplayName("Deve limitar resultado a 10 clientes")
        void deveLimitarA10Clientes() {
            LocalDateTime agora = LocalDateTime.now();
            List<Pedido> pedidos = new ArrayList<>();
            for (int i = 1; i <= 15; i++) {
                Cliente cliente = criarCliente(i, "Cliente " + i);
                pedidos.add(criarPedido(i, new BigDecimal(i * 100), cliente, agora));
            }

            configurarRepositorioVendas(pedidos);

            List<TopClienteResponse> resultado = dashboardService.getTop10ClientesMaisLucrativos("HOJE");

            assertThat(resultado).hasSize(10);
        }
    }

    // ---------------------------------------------------------------------------
    // calcularPeriodo
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("calcularPeriodo")
    class CalcularPeriodo {

        /**
         * Uses a spy to access the protected method directly.
         */
        private LocalDateTime[] invocarCalcularPeriodo(String periodo) {
            return dashboardService.calcularPeriodo(periodo);
        }

        @Test
        @DisplayName("HOJE - deve retornar inicio do dia ate agora")
        void hoje_deveRetornarInicioDoDia() {
            LocalDateTime[] range = invocarCalcularPeriodo("HOJE");

            LocalDateTime inicioDoDia = LocalDate.now().atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(inicioDoDia);
            assertThat(range[1]).isAfterOrEqualTo(inicioDoDia);
            assertThat(range[1]).isBeforeOrEqualTo(LocalDateTime.now().plusSeconds(1));
        }

        @Test
        @DisplayName("ULTIMOS_7_DIAS - deve retornar 7 dias atras ate agora")
        void ultimos7Dias_deveRetornar7DiasAtras() {
            LocalDateTime[] range = invocarCalcularPeriodo("ULTIMOS_7_DIAS");

            LocalDateTime seteDiasAtras = LocalDate.now().minusDays(7).atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(seteDiasAtras);
            assertThat(range[1]).isAfterOrEqualTo(seteDiasAtras);
        }

        @Test
        @DisplayName("ULTIMO_MES - deve retornar primeiro dia do mes atual ate agora")
        void ultimoMes_deveRetornarPrimeiroDiaDoMesAtual() {
            LocalDateTime[] range = invocarCalcularPeriodo("ULTIMO_MES");

            LocalDateTime primeiroDiaDoMes = YearMonth.now().atDay(1).atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(primeiroDiaDoMes);
            assertThat(range[1]).isAfterOrEqualTo(primeiroDiaDoMes);
        }

        @Test
        @DisplayName("MES_ANTERIOR - deve retornar range completo do mes anterior")
        void mesAnterior_deveRetornarRangeDoMesAnterior() {
            LocalDateTime[] range = invocarCalcularPeriodo("MES_ANTERIOR");

            YearMonth mesAnterior = YearMonth.now().minusMonths(1);
            LocalDateTime inicioEsperado = mesAnterior.atDay(1).atStartOfDay();
            LocalDateTime fimEsperado = mesAnterior.atEndOfMonth().atTime(23, 59, 59);

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(inicioEsperado);
            assertThat(range[1]).isEqualTo(fimEsperado);
        }

        @Test
        @DisplayName("ESTE_ANO - deve retornar primeiro dia do ano ate agora")
        void esteAno_deveRetornarPrimeiroDiaDoAno() {
            LocalDateTime[] range = invocarCalcularPeriodo("ESTE_ANO");

            LocalDateTime primeiroDiaDoAno = LocalDate.now().withDayOfYear(1).atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(primeiroDiaDoAno);
            assertThat(range[1]).isAfterOrEqualTo(primeiroDiaDoAno);
        }

        @Test
        @DisplayName("ANO_ANTERIOR - deve retornar range completo do ano anterior")
        void anoAnterior_deveRetornarRangeDoAnoAnterior() {
            LocalDateTime[] range = invocarCalcularPeriodo("ANO_ANTERIOR");

            int anoAnterior = LocalDate.now().getYear() - 1;
            LocalDateTime inicioEsperado = LocalDate.of(anoAnterior, 1, 1).atStartOfDay();
            LocalDateTime fimEsperado = LocalDate.of(anoAnterior, 12, 31).atTime(23, 59, 59);

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(inicioEsperado);
            assertThat(range[1]).isEqualTo(fimEsperado);
        }

        @Test
        @DisplayName("default - periodo desconhecido deve usar inicio do dia como fallback")
        void default_deveUsarInicioDoDia() {
            LocalDateTime[] range = invocarCalcularPeriodo("PERIODO_INVALIDO");

            LocalDateTime inicioDoDia = LocalDate.now().atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(inicioDoDia);
        }

        @Test
        @DisplayName("null - periodo nulo deve ser tratado como HOJE")
        void nulo_deveSerTratadoComoHoje() {
            LocalDateTime[] range = invocarCalcularPeriodo(null);

            LocalDateTime inicioDoDia = LocalDate.now().atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(inicioDoDia);
            assertThat(range[1]).isAfterOrEqualTo(inicioDoDia);
        }

        @Test
        @DisplayName("Deve aceitar periodo em lowercase convertendo para uppercase")
        void deveAceitarLowercase() {
            LocalDateTime[] range = invocarCalcularPeriodo("hoje");

            LocalDateTime inicioDoDia = LocalDate.now().atStartOfDay();

            assertThat(range).hasSize(2);
            assertThat(range[0]).isEqualTo(inicioDoDia);
        }
    }
}
