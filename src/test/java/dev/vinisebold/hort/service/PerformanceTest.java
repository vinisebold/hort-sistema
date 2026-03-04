package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ItemPedidoRequest;
import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.*;
import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Performance Tests - < 2s per operation")
class PerformanceTest {

    // ── Shared test data ───────────────────────────────────────────
    private UnidadeMedida unidadeKg;

    @BeforeEach
    void setUp() {
        unidadeKg = new UnidadeMedida();
        unidadeKg.setId(1);
        unidadeKg.setSigla("KG");
        unidadeKg.setDescricao("Quilograma");
        unidadeKg.setIsActive(true);
    }

    // ══════════════════════════════════════════════════════════════════
    // Helper methods - large dataset generation
    // ══════════════════════════════════════════════════════════════════

    private Produto criarProduto(int id) {
        Produto p = new Produto();
        p.setId(id);
        p.setCodigo("P" + String.format("%04d", id));
        p.setDescricao("Produto " + id);
        p.setUnidadeMedida(unidadeKg);
        p.setEstoqueAtual(new BigDecimal("100.000"));
        p.setIsActive(true);
        p.setCreatedAt(LocalDateTime.now());
        return p;
    }

    private Cliente criarCliente(int id) {
        Cliente c = new Cliente();
        c.setId(id);
        c.setTipoPessoa("PJ");
        c.setDocumento("DOC-" + String.format("%06d", id));
        c.setRazaoSocial("Cliente " + id);
        c.setNomeFantasia("Fantasia " + id);
        c.setEndereco("Rua " + id);
        c.setContato("(11) 9999-" + String.format("%04d", id % 10000));
        c.setIsActive(true);
        c.setCreatedAt(LocalDateTime.now());
        return c;
    }

    private LoteEntrada criarLoteEntrada(int id, Produto produto, BigDecimal quantidade, BigDecimal custo, LocalDateTime data) {
        LoteEntrada lote = new LoteEntrada();
        lote.setId(id);
        lote.setProduto(produto);
        lote.setQuantidadeOriginal(quantidade);
        lote.setQuantidadeDisponivel(quantidade);
        lote.setCustoUnitario(custo);
        lote.setDataEntrada(data);
        lote.setIsEsgotado(false);
        return lote;
    }

    private Pedido criarPedidoVenda(int id, NaturezaOperacao natureza, Cliente cliente) {
        Pedido p = new Pedido();
        p.setId(id);
        p.setNaturezaOperacao(natureza);
        p.setCliente(cliente);
        p.setValorTotal(new BigDecimal("150.00"));
        p.setStatusPagamento("PAGO");
        p.setDataEmissao(LocalDateTime.now().minusDays(id % 30));
        return p;
    }

    private ItemPedido criarItemPedido(int id, Pedido pedido, Produto produto, BigDecimal quantidade, BigDecimal valorUnitario) {
        ItemPedido item = new ItemPedido();
        item.setId(id);
        item.setPedido(pedido);
        item.setProduto(produto);
        item.setQuantidade(quantidade);
        item.setValorUnitario(valorUnitario);
        item.setCustoUnitario(new BigDecimal("5.00"));
        item.setValorTotal(quantidade.multiply(valorUnitario));
        return item;
    }

    private List<Produto> gerarProdutos(int quantidade) {
        List<Produto> produtos = new ArrayList<>(quantidade);
        for (int i = 1; i <= quantidade; i++) {
            produtos.add(criarProduto(i));
        }
        return produtos;
    }

    private List<Cliente> gerarClientes(int quantidade) {
        List<Cliente> clientes = new ArrayList<>(quantidade);
        for (int i = 1; i <= quantidade; i++) {
            clientes.add(criarCliente(i));
        }
        return clientes;
    }

    private List<LoteEntrada> gerarLotesEntrada(int quantidade, Produto produto) {
        List<LoteEntrada> lotes = new ArrayList<>(quantidade);
        LocalDateTime baseDate = LocalDateTime.of(2026, 1, 1, 0, 0);
        for (int i = 1; i <= quantidade; i++) {
            BigDecimal qtd = new BigDecimal("10.000");
            BigDecimal custo = new BigDecimal(5 + (i % 10)).setScale(2, RoundingMode.HALF_UP);
            lotes.add(criarLoteEntrada(i, produto, qtd, custo, baseDate.plusDays(i)));
        }
        return lotes;
    }

    private long medirTempoMs(Runnable operacao) {
        long inicio = System.nanoTime();
        operacao.run();
        long fim = System.nanoTime();
        return (fim - inicio) / 1_000_000;
    }

    // ══════════════════════════════════════════════════════════════════
    // 1. FIFO with 1000 lots
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("FifoService Performance")
    class FifoPerformance {

        @Mock private LoteEntradaRepository loteEntradaRepository;
        @Mock private LoteSaidaRepository loteSaidaRepository;
        @InjectMocks private FifoService fifoService;

        @Test
        @DisplayName("1. FIFO processarVendaFifo with 1000 lots should complete within 2s")
        void fifoProcessarVendaCom1000Lotes() {
            Produto produto = criarProduto(1);
            List<LoteEntrada> lotes = gerarLotesEntrada(1000, produto);

            Pedido pedido = new Pedido();
            pedido.setId(1);
            pedido.setDataEmissao(LocalDateTime.now());

            ItemPedido itemVenda = new ItemPedido();
            itemVenda.setId(1);
            itemVenda.setPedido(pedido);
            itemVenda.setProduto(produto);
            itemVenda.setQuantidade(new BigDecimal("5000.000")); // Consumes ~500 lots
            itemVenda.setValorUnitario(new BigDecimal("20.00"));
            itemVenda.setValorTotal(new BigDecimal("100000.00"));

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(lotes);

            long elapsedMs = medirTempoMs(() -> fifoService.processarVendaFifo(itemVenda));

            assertThat(elapsedMs).isLessThan(2000L);
        }

        @Test
        @DisplayName("8. Batch FIFO: 100 purchases + 100 sales should complete within 2s")
        void batchFifoOperations() {
            Produto produto = criarProduto(1);

            // In-memory FIFO simulation via mock behavior
            List<LoteEntrada> lotesAtivos = new ArrayList<>();

            when(loteEntradaRepository.save(any(LoteEntrada.class))).thenAnswer(invocation -> {
                LoteEntrada lote = invocation.getArgument(0);
                if (lote.getId() == null) {
                    lote.setId(lotesAtivos.size() + 1);
                }
                if (!lotesAtivos.contains(lote)) {
                    lotesAtivos.add(lote);
                }
                return lote;
            });

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenAnswer(invocation -> lotesAtivos.stream()
                            .filter(l -> !l.getIsEsgotado()
                                    && l.getQuantidadeDisponivel().compareTo(BigDecimal.ZERO) > 0)
                            .toList());

            when(loteSaidaRepository.save(any(LoteSaida.class))).thenAnswer(invocation -> invocation.getArgument(0));

            long elapsedMs = medirTempoMs(() -> {
                // Register 100 purchase lots (each with 10 units)
                for (int i = 1; i <= 100; i++) {
                    Pedido pedidoCompra = new Pedido();
                    pedidoCompra.setId(i);
                    pedidoCompra.setDataEmissao(LocalDateTime.now().minusDays(100 - i));

                    ItemPedido itemCompra = new ItemPedido();
                    itemCompra.setId(i);
                    itemCompra.setPedido(pedidoCompra);
                    itemCompra.setProduto(produto);
                    itemCompra.setQuantidade(new BigDecimal("10.000"));
                    itemCompra.setValorUnitario(new BigDecimal("5.00"));

                    fifoService.registrarLoteCompra(itemCompra);
                }

                // Process 100 sales (each consuming 10 units = 1 lot)
                for (int i = 1; i <= 100; i++) {
                    Pedido pedidoVenda = new Pedido();
                    pedidoVenda.setId(1000 + i);
                    pedidoVenda.setDataEmissao(LocalDateTime.now());

                    ItemPedido itemVenda = new ItemPedido();
                    itemVenda.setId(1000 + i);
                    itemVenda.setPedido(pedidoVenda);
                    itemVenda.setProduto(produto);
                    itemVenda.setQuantidade(new BigDecimal("10.000"));
                    itemVenda.setValorUnitario(new BigDecimal("15.00"));
                    itemVenda.setValorTotal(new BigDecimal("150.00"));

                    fifoService.processarVendaFifo(itemVenda);
                }
            });

            assertThat(elapsedMs).isLessThan(2000L);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 2. PedidoService with 50 items
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("PedidoService Performance")
    class PedidoPerformance {

        @Mock private PedidoRepository pedidoRepository;
        @Mock private ItemPedidoRepository itemPedidoRepository;
        @Mock private NaturezaOperacaoRepository naturezaOperacaoRepository;
        @Mock private ProdutoRepository produtoRepository;
        @Mock private EstoqueService estoqueService;
        @Mock private FifoService fifoService;
        @InjectMocks private PedidoService pedidoService;

        @Test
        @DisplayName("2. PedidoService processarPedido with 50 items (ENTRADA) should complete within 2s")
        void pedidoProcessarCom50Itens() {
            NaturezaOperacao naturezaEntrada = new NaturezaOperacao();
            naturezaEntrada.setId(1);
            naturezaEntrada.setDescricao("Compra");
            naturezaEntrada.setTipoMovimento(TipoMovimento.ENTRADA);
            naturezaEntrada.setGeraFinanceiro(true);

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));

            // Build 50-item request
            List<ItemPedidoRequest> itensRequest = new ArrayList<>(50);
            for (int i = 1; i <= 50; i++) {
                ItemPedidoRequest itemReq = new ItemPedidoRequest();
                itemReq.setProdutoId(i);
                itemReq.setQuantidade(new BigDecimal("10.000"));
                itemReq.setValorUnitario(new BigDecimal("5.00"));
                itensRequest.add(itemReq);
            }

            PedidoRequest request = new PedidoRequest();
            request.setNaturezaOperacaoId(1);
            request.setStatusPagamento("PAGO");
            request.setItens(itensRequest);

            // Mock each product lookup
            for (int i = 1; i <= 50; i++) {
                Produto produto = criarProduto(i);
                when(produtoRepository.findById(i)).thenReturn(Optional.of(produto));
            }

            // Mock pedido save
            when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> {
                Pedido p = invocation.getArgument(0);
                p.setId(1);
                p.setDataEmissao(LocalDateTime.now());
                return p;
            });

            // Mock item save
            when(itemPedidoRepository.save(any(ItemPedido.class))).thenAnswer(invocation -> {
                ItemPedido item = invocation.getArgument(0);
                if (item.getId() == null) {
                    item.setId((int) (Math.random() * 100000));
                }
                return item;
            });

            doNothing().when(estoqueService).processarMovimentacao(any(), any(), any(), any());
            doNothing().when(fifoService).registrarLoteCompra(any());

            long elapsedMs = medirTempoMs(() -> pedidoService.processarPedido(request));

            assertThat(elapsedMs).isLessThan(2000L);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 3. EstoqueService with 500 products
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("EstoqueService Performance")
    class EstoquePerformance {

        @Mock private ProdutoRepository produtoRepository;
        @InjectMocks private EstoqueService estoqueService;

        @Test
        @DisplayName("3. EstoqueService listarProdutosComEstoque with 500 products should complete within 2s")
        void estoqueListarProdutosComEstoque500() {
            List<Produto> produtos = gerarProdutos(500);

            when(produtoRepository.findAllByIsActiveTrue()).thenReturn(produtos);

            long elapsedMs = medirTempoMs(() -> {
                List<ProdutoEstoqueResponse> result = estoqueService.listarProdutosComEstoque();
                assertThat(result).hasSize(500);
            });

            assertThat(elapsedMs).isLessThan(2000L);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 4 & 5. DashboardService with large datasets
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("DashboardService Performance")
    class DashboardPerformance {

        @Mock private PedidoRepository pedidoRepository;
        @Mock private ItemPedidoRepository itemPedidoRepository;
        @InjectMocks private DashboardService dashboardService;

        @Test
        @DisplayName("4. DashboardService getResumo with 1000 sales and 5000 items should complete within 2s")
        void dashboardGetResumoCom1000Vendas() {
            NaturezaOperacao naturezaSaida = new NaturezaOperacao();
            naturezaSaida.setId(2);
            naturezaSaida.setDescricao("Venda");
            naturezaSaida.setTipoMovimento(TipoMovimento.SAIDA);
            naturezaSaida.setGeraFinanceiro(true);

            List<Produto> produtos = gerarProdutos(100);
            List<Cliente> clientes = gerarClientes(50);

            // Generate 1000 pedidos
            List<Pedido> vendas = new ArrayList<>(1000);
            for (int i = 1; i <= 1000; i++) {
                Cliente cliente = clientes.get(i % clientes.size());
                vendas.add(criarPedidoVenda(i, naturezaSaida, cliente));
            }

            // Generate 5000 item pedidos (5 items per pedido)
            List<ItemPedido> itens = new ArrayList<>(5000);
            int itemId = 1;
            for (Pedido pedido : vendas) {
                for (int j = 0; j < 5; j++) {
                    Produto produto = produtos.get((itemId - 1) % produtos.size());
                    itens.add(criarItemPedido(itemId++, pedido, produto,
                            new BigDecimal("2.000"), new BigDecimal("10.00")));
                }
            }

            when(pedidoRepository.findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(
                    eq(TipoMovimento.SAIDA), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(vendas);

            when(itemPedidoRepository.findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(
                    eq(TipoMovimento.SAIDA), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(itens);

            long elapsedMs = medirTempoMs(() -> {
                DashboardResumoResponse resumo = dashboardService.getResumo("ESTE_ANO");
                assertThat(resumo).isNotNull();
                assertThat(resumo.getTotalVendidoPeriodo()).isNotNull();
            });

            assertThat(elapsedMs).isLessThan(2000L);
        }

        @Test
        @DisplayName("5. DashboardService getTop10ProdutosMaisVendidos with 10000 items across 500 products should complete within 2s")
        void dashboardGetTop10Com10000Itens() {
            NaturezaOperacao naturezaSaida = new NaturezaOperacao();
            naturezaSaida.setId(2);
            naturezaSaida.setDescricao("Venda");
            naturezaSaida.setTipoMovimento(TipoMovimento.SAIDA);
            naturezaSaida.setGeraFinanceiro(true);

            List<Produto> produtos = gerarProdutos(500);

            // Generate 10000 item pedidos across 500 products
            List<ItemPedido> itens = new ArrayList<>(10000);
            for (int i = 1; i <= 10000; i++) {
                Pedido pedido = new Pedido();
                pedido.setId(i);
                pedido.setNaturezaOperacao(naturezaSaida);
                pedido.setDataEmissao(LocalDateTime.now().minusDays(i % 30));
                pedido.setValorTotal(new BigDecimal("50.00"));
                pedido.setStatusPagamento("PAGO");

                Produto produto = produtos.get((i - 1) % 500);
                itens.add(criarItemPedido(i, pedido, produto,
                        new BigDecimal("3.000"), new BigDecimal("15.00")));
            }

            when(itemPedidoRepository.findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(
                    eq(TipoMovimento.SAIDA), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(itens);

            long elapsedMs = medirTempoMs(() -> {
                List<TopProdutoResponse> top10 = dashboardService.getTop10ProdutosMaisVendidos("ESTE_ANO");
                assertThat(top10).hasSize(10);
            });

            assertThat(elapsedMs).isLessThan(2000L);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 6. ProdutoService with 200 products
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("ProdutoService Performance")
    class ProdutoPerformance {

        @Mock private ProdutoRepository produtoRepository;
        @Mock private UnidadeMedidaService unidadeMedidaService;
        @InjectMocks private ProdutoService produtoService;

        @Test
        @DisplayName("6. ProdutoService listarAtivos with 200 products should complete within 2s")
        void produtoListarAtivos200() {
            List<Produto> produtos = gerarProdutos(200);
            Page<Produto> page = new PageImpl<>(produtos);

            when(produtoRepository.findAllByIsActiveTrueOrderByIdDesc(any(Pageable.class))).thenReturn(page);
            when(unidadeMedidaService.mapToResponse(any(UnidadeMedida.class))).thenReturn(
                    UnidadeMedidaResponse.builder()
                            .id(1).sigla("KG").descricao("Quilograma").isActive(true)
                            .build()
            );

            long elapsedMs = medirTempoMs(() -> {
                CursorResponse<ProdutoResponse> result = produtoService.listarAtivos(null, 200);
                assertThat(result.getData()).hasSize(200);
            });

            assertThat(elapsedMs).isLessThan(2000L);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 7. ClienteService with 200 clients
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("ClienteService Performance")
    class ClientePerformance {

        @Mock private ClienteRepository clienteRepository;
        @InjectMocks private ClienteService clienteService;

        @Test
        @DisplayName("7. ClienteService listarAtivos with 200 clients should complete within 2s")
        void clienteListarAtivos200() {
            List<Cliente> clientes = gerarClientes(200);
            Page<Cliente> page = new PageImpl<>(clientes);

            when(clienteRepository.findAllByIsActiveTrueOrderByIdDesc(any(Pageable.class))).thenReturn(page);

            long elapsedMs = medirTempoMs(() -> {
                CursorResponse<ClienteResponse> result = clienteService.listarAtivos(null, 200);
                assertThat(result.getData()).hasSize(200);
            });

            assertThat(elapsedMs).isLessThan(2000L);
        }
    }
}
