package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ItemPedidoRequest;
import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ItemPedidoRepository itemPedidoRepository;

    @Mock
    private NaturezaOperacaoRepository naturezaOperacaoRepository;

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private EstoqueService estoqueService;

    @Mock
    private FifoService fifoService;

    @InjectMocks
    private PedidoService pedidoService;

    private NaturezaOperacao naturezaEntrada;
    private NaturezaOperacao naturezaSaida;
    private Cliente cliente;
    private Produto produto;

    @BeforeEach
    void setUp() {
        naturezaEntrada = new NaturezaOperacao();
        naturezaEntrada.setId(1);
        naturezaEntrada.setDescricao("Compra");
        naturezaEntrada.setTipoMovimento(TipoMovimento.ENTRADA);
        naturezaEntrada.setGeraFinanceiro(true);

        naturezaSaida = new NaturezaOperacao();
        naturezaSaida.setId(2);
        naturezaSaida.setDescricao("Venda");
        naturezaSaida.setTipoMovimento(TipoMovimento.SAIDA);
        naturezaSaida.setGeraFinanceiro(true);

        cliente = new Cliente();
        cliente.setId(1);
        cliente.setTipoPessoa("PJ");
        cliente.setDocumento("12345678000100");
        cliente.setRazaoSocial("Fornecedor ABC");
        cliente.setNomeFantasia("ABC");
        cliente.setIsActive(true);

        produto = new Produto();
        produto.setId(1);
        produto.setCodigo("P001");
        produto.setDescricao("Tomate");
        produto.setEstoqueAtual(new BigDecimal("100.000"));
        produto.setIsActive(true);
    }

    // ──────────────────────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────────────────────

    private PedidoRequest criarPedidoRequest(Integer naturezaId, Integer clienteId,
                                              List<ItemPedidoRequest> itens) {
        PedidoRequest request = new PedidoRequest();
        request.setNaturezaOperacaoId(naturezaId);
        request.setClienteId(clienteId);
        request.setDocumentoReferencia("DOC-001");
        request.setStatusPagamento("PAGO");
        request.setItens(itens);
        return request;
    }

    private ItemPedidoRequest criarItemPedidoRequest(Integer produtoId, String quantidade, String valorUnitario) {
        ItemPedidoRequest item = new ItemPedidoRequest();
        item.setProdutoId(produtoId);
        item.setQuantidade(new BigDecimal(quantidade));
        item.setValorUnitario(new BigDecimal(valorUnitario));
        return item;
    }

    private Pedido criarPedidoSalvo(Integer id, NaturezaOperacao natureza, Cliente cliente,
                                     BigDecimal valorTotal, String status) {
        Pedido pedido = new Pedido();
        pedido.setId(id);
        pedido.setNaturezaOperacao(natureza);
        pedido.setCliente(cliente);
        pedido.setDocumentoReferencia("DOC-001");
        pedido.setValorTotal(valorTotal);
        pedido.setStatusPagamento(status);
        pedido.setDataEmissao(LocalDateTime.of(2026, 3, 1, 10, 0));
        return pedido;
    }

    private ItemPedido criarItemPedidoSalvo(Integer id, Pedido pedido, Produto produto,
                                             BigDecimal quantidade, BigDecimal valorUnitario,
                                             BigDecimal custoUnitario) {
        ItemPedido item = new ItemPedido();
        item.setId(id);
        item.setPedido(pedido);
        item.setProduto(produto);
        item.setQuantidade(quantidade);
        item.setValorUnitario(valorUnitario);
        item.setCustoUnitario(custoUnitario);
        item.setValorTotal(valorUnitario.multiply(quantidade));
        return item;
    }

    /**
     * Configura pedidoRepository.save para atribuir um ID auto-incrementado ao Pedido salvo.
     */
    private void configurarPedidoSaveComId() {
        AtomicInteger pedidoIdSeq = new AtomicInteger(1);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> {
            Pedido p = invocation.getArgument(0);
            if (p.getId() == null) {
                p.setId(pedidoIdSeq.getAndIncrement());
            }
            return p;
        });
    }

    /**
     * Configura itemPedidoRepository.save para atribuir um ID auto-incrementado ao ItemPedido salvo.
     */
    private void configurarItemPedidoSaveComId() {
        AtomicInteger itemIdSeq = new AtomicInteger(1);
        when(itemPedidoRepository.save(any(ItemPedido.class))).thenAnswer(invocation -> {
            ItemPedido i = invocation.getArgument(0);
            if (i.getId() == null) {
                i.setId(itemIdSeq.getAndIncrement());
            }
            return i;
        });
    }

    // ──────────────────────────────────────────────────────────────
    // processarPedido
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("processarPedido")
    class ProcessarPedidoTests {

        @Test
        @DisplayName("ENTRADA - deve criar pedido, salvar itens, chamar estoque e fifo, e setar custoUnitario = valorUnitario")
        void deveProcessarPedidoEntrada() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(1, 1, List.of(itemReq));

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));
            // when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente)); // ENTRADA ignores cliente
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            configurarPedidoSaveComId();
            configurarItemPedidoSaveComId();

            PedidoResponse response = pedidoService.processarPedido(request);

            assertNotNull(response);
            assertEquals(1, response.getId());
            assertEquals("Compra", response.getNaturezaOperacao());
            assertEquals("Consumidor Final", response.getClienteNome());
            assertThat(response.getValorTotal()).isEqualByComparingTo(new BigDecimal("55.000"));
            assertEquals("PAGO", response.getStatusPagamento());
            assertNotNull(response.getDataEmissao());
            assertEquals(1, response.getItens().size());

            verify(pedidoRepository).save(any(Pedido.class));
            // itemPedidoRepository.save e chamado 2x para ENTRADA (1a com custo 0, 2a com custoUnitario = valorUnitario)
            verify(itemPedidoRepository, times(2)).save(any(ItemPedido.class));
            verify(estoqueService).processarMovimentacao(eq(produto), eq(naturezaEntrada), any(Pedido.class), eq(new BigDecimal("10.000")));
            verify(fifoService).registrarLoteCompra(any(ItemPedido.class));
            verifyNoMoreInteractions(fifoService);
        }

        @Test
        @DisplayName("SAIDA - deve criar pedido, salvar itens, chamar estoque e fifo, e setar custoUnitario do FIFO")
        void deveProcessarPedidoSaida() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "5.000", "20.00");
            PedidoRequest request = criarPedidoRequest(2, 1, List.of(itemReq));

            when(naturezaOperacaoRepository.findById(2)).thenReturn(Optional.of(naturezaSaida));
            when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            configurarPedidoSaveComId();
            configurarItemPedidoSaveComId();

            BigDecimal custoFifo = new BigDecimal("8.50");
            when(fifoService.processarVendaFifo(any(ItemPedido.class))).thenReturn(custoFifo);

            PedidoResponse response = pedidoService.processarPedido(request);

            assertNotNull(response);
            assertEquals(1, response.getId());
            assertEquals("Venda", response.getNaturezaOperacao());
            assertThat(response.getValorTotal()).isEqualByComparingTo(new BigDecimal("100.000"));

            verify(pedidoRepository).save(any(Pedido.class));
            // itemPedidoRepository.save e chamado 2x para SAIDA (1a com custo 0, 2a com custoUnitario do FIFO)
            verify(itemPedidoRepository, times(2)).save(any(ItemPedido.class));
            verify(estoqueService).processarMovimentacao(eq(produto), eq(naturezaSaida), any(Pedido.class), eq(new BigDecimal("5.000")));
            verify(fifoService).processarVendaFifo(any(ItemPedido.class));
            verify(fifoService, never()).registrarLoteCompra(any(ItemPedido.class));
        }

        @Test
        @DisplayName("deve lancar IllegalArgumentException quando natureza de operacao nao encontrada")
        void deveLancarExcecaoNaturezaNaoEncontrada() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(999, 1, List.of(itemReq));

            when(naturezaOperacaoRepository.findById(999)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> pedidoService.processarPedido(request));

            assertEquals("Natureza de Operação inválida", ex.getMessage());
            verifyNoInteractions(pedidoRepository, itemPedidoRepository, estoqueService, fifoService);
        }

        @Test
        @DisplayName("deve lançar exceção quando natureza de operação for SAÍDA e cliente não for encontrado")
        void deveLancarExcecaoClienteNaoEncontrado() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(2, 999, List.of(itemReq));

            when(naturezaOperacaoRepository.findById(2)).thenReturn(Optional.of(naturezaSaida));
            when(clienteRepository.findById(999)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> pedidoService.processarPedido(request));

            assertEquals("Cliente não encontrado", ex.getMessage());
            verifyNoInteractions(pedidoRepository, itemPedidoRepository, estoqueService, fifoService);
        }

        @Test
        @DisplayName("deve permitir clienteId null")
        void devePermitirClienteNull() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(1, null, List.of(itemReq));

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            configurarPedidoSaveComId();
            configurarItemPedidoSaveComId();

            PedidoResponse response = pedidoService.processarPedido(request);

            assertNotNull(response);
            assertEquals("Consumidor Final", response.getClienteNome());
            verifyNoInteractions(clienteRepository);
        }

        @Test
        @DisplayName("deve lancar IllegalArgumentException quando produto nao encontrado")
        void deveLancarExcecaoProdutoNaoEncontrado() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(999, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(1, 1, List.of(itemReq));

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));
            configurarPedidoSaveComId();
            when(produtoRepository.findById(999)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> pedidoService.processarPedido(request));

            assertEquals("Produto ID 999 não encontrado.", ex.getMessage());
            verifyNoInteractions(estoqueService, fifoService);
        }

        @Test
        @DisplayName("ENTRADA com multiplos itens - deve processar todos os itens corretamente")
        void deveProcessarEntradaComMultiplosItens() {
            Produto produto2 = new Produto();
            produto2.setId(2);
            produto2.setCodigo("P002");
            produto2.setDescricao("Cebola");
            produto2.setEstoqueAtual(new BigDecimal("50.000"));
            produto2.setIsActive(true);

            ItemPedidoRequest itemReq1 = criarItemPedidoRequest(1, "10.000", "5.50");
            ItemPedidoRequest itemReq2 = criarItemPedidoRequest(2, "20.000", "3.00");
            PedidoRequest request = criarPedidoRequest(1, 1, List.of(itemReq1, itemReq2));

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));
            // when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            when(produtoRepository.findById(2)).thenReturn(Optional.of(produto2));
            configurarPedidoSaveComId();
            configurarItemPedidoSaveComId();

            PedidoResponse response = pedidoService.processarPedido(request);

            assertNotNull(response);
            // valorTotal = (10 * 5.50) + (20 * 3.00) = 55.00 + 60.00 = 115.00
            assertThat(response.getValorTotal()).isEqualByComparingTo(new BigDecimal("115.000"));
            assertEquals(2, response.getItens().size());

            verify(estoqueService).processarMovimentacao(eq(produto), eq(naturezaEntrada), any(Pedido.class), eq(new BigDecimal("10.000")));
            verify(estoqueService).processarMovimentacao(eq(produto2), eq(naturezaEntrada), any(Pedido.class), eq(new BigDecimal("20.000")));
            verify(fifoService, times(2)).registrarLoteCompra(any(ItemPedido.class));
        }

        @Test
        @DisplayName("deve lancar IllegalArgumentException quando PENDENTE sem documentoReferencia")
        void deveLancarExcecaoPendenteSemDocumento() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(1, 1, List.of(itemReq));
            request.setStatusPagamento("PENDENTE");
            request.setDocumentoReferencia(null);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> pedidoService.processarPedido(request));

            assertEquals("Documento de referência é obrigatório para pedidos pendentes.", ex.getMessage());
            verifyNoInteractions(naturezaOperacaoRepository, pedidoRepository, itemPedidoRepository, estoqueService, fifoService);
        }

        @Test
        @DisplayName("deve permitir PAGO sem documentoReferencia")
        void devePermitirPagoSemDocumento() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(1, null, List.of(itemReq));
            request.setStatusPagamento("PAGO");
            request.setDocumentoReferencia(null);

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            configurarPedidoSaveComId();
            configurarItemPedidoSaveComId();

            PedidoResponse response = pedidoService.processarPedido(request);

            assertNotNull(response);
            assertEquals("PAGO", response.getStatusPagamento());
            assertNull(response.getDocumentoReferencia());
        }

        @Test
        @DisplayName("deve permitir PENDENTE com documentoReferencia")
        void devePermitirPendenteComDocumento() {
            ItemPedidoRequest itemReq = criarItemPedidoRequest(1, "10.000", "5.50");
            PedidoRequest request = criarPedidoRequest(1, null, List.of(itemReq));
            request.setStatusPagamento("PENDENTE");
            request.setDocumentoReferencia("NF-001");

            when(naturezaOperacaoRepository.findById(1)).thenReturn(Optional.of(naturezaEntrada));
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            configurarPedidoSaveComId();
            configurarItemPedidoSaveComId();

            PedidoResponse response = pedidoService.processarPedido(request);

            assertNotNull(response);
            assertEquals("PENDENTE", response.getStatusPagamento());
            assertEquals("NF-001", response.getDocumentoReferencia());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // listarTodos
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listarTodos")
    class ListarTodosTests {

        @Test
        @DisplayName("deve listar pedidos sem cursor (primeira pagina)")
        void deveListarSemCursor() {
            Pedido pedido1 = criarPedidoSalvo(2, naturezaSaida, cliente,
                    new BigDecimal("100.00"), "PAGO");
            Pedido pedido2 = criarPedidoSalvo(1, naturezaEntrada, null,
                    new BigDecimal("50.00"), "PENDENTE");

            Page<Pedido> page = new PageImpl<>(List.of(pedido1, pedido2));
            when(pedidoRepository.findAllByOrderByIdDesc(any(Pageable.class))).thenReturn(page);

            ItemPedido item1 = criarItemPedidoSalvo(1, pedido1, produto, new BigDecimal("5.000"),
                    new BigDecimal("20.00"), new BigDecimal("8.00"));
            ItemPedido item2 = criarItemPedidoSalvo(2, pedido2, produto, new BigDecimal("10.000"),
                    new BigDecimal("5.00"), new BigDecimal("5.00"));

            when(itemPedidoRepository.findByPedido(pedido1)).thenReturn(List.of(item1));
            when(itemPedidoRepository.findByPedido(pedido2)).thenReturn(List.of(item2));

            CursorResponse<PedidoResponse> result = pedidoService.listarTodos(null, 10);

            assertNotNull(result);
            assertEquals(2, result.getData().size());
            assertEquals(1, result.getNextCursor()); // ultimo item da lista (id=1)
            assertFalse(result.isHasNext());

            verify(pedidoRepository).findAllByOrderByIdDesc(any(Pageable.class));
            verify(pedidoRepository, never()).findByIdLessThanOrderByIdDesc(any(), any());
        }

        @Test
        @DisplayName("deve listar pedidos com cursor (paginacao)")
        void deveListarComCursor() {
            Pedido pedido1 = criarPedidoSalvo(5, naturezaSaida, cliente,
                    new BigDecimal("200.00"), "PAGO");

            Page<Pedido> page = new PageImpl<>(List.of(pedido1), org.springframework.data.domain.PageRequest.of(0, 10), 20);
            when(pedidoRepository.findByIdLessThanOrderByIdDesc(eq(10), any(Pageable.class))).thenReturn(page);

            ItemPedido item1 = criarItemPedidoSalvo(10, pedido1, produto, new BigDecimal("10.000"),
                    new BigDecimal("20.00"), new BigDecimal("12.00"));
            when(itemPedidoRepository.findByPedido(pedido1)).thenReturn(List.of(item1));

            CursorResponse<PedidoResponse> result = pedidoService.listarTodos(10, 10);

            assertNotNull(result);
            assertEquals(1, result.getData().size());
            assertEquals(5, result.getNextCursor());
            assertTrue(result.isHasNext());

            verify(pedidoRepository).findByIdLessThanOrderByIdDesc(eq(10), any(Pageable.class));
            verify(pedidoRepository, never()).findAllByOrderByIdDesc(any());
        }

        @Test
        @DisplayName("deve retornar lista vazia e nextCursor null quando nenhum pedido encontrado")
        void deveRetornarVazioQuandoSemPedidos() {
            Page<Pedido> page = new PageImpl<>(Collections.emptyList());
            when(pedidoRepository.findAllByOrderByIdDesc(any(Pageable.class))).thenReturn(page);

            CursorResponse<PedidoResponse> result = pedidoService.listarTodos(null, 10);

            assertNotNull(result);
            assertTrue(result.getData().isEmpty());
            assertNull(result.getNextCursor());
            assertFalse(result.isHasNext());
        }

        @Test
        @DisplayName("deve mapear corretamente os campos do PedidoResponse via mapToResponse")
        void deveMapearCamposCorretamente() {
            Pedido pedido = criarPedidoSalvo(1, naturezaSaida, cliente,
                    new BigDecimal("100.00"), "PAGO");

            Page<Pedido> page = new PageImpl<>(List.of(pedido));
            when(pedidoRepository.findAllByOrderByIdDesc(any(Pageable.class))).thenReturn(page);

            ItemPedido item = criarItemPedidoSalvo(1, pedido, produto, new BigDecimal("5.000"),
                    new BigDecimal("20.00"), new BigDecimal("8.00"));
            when(itemPedidoRepository.findByPedido(pedido)).thenReturn(List.of(item));

            CursorResponse<PedidoResponse> result = pedidoService.listarTodos(null, 10);
            PedidoResponse response = result.getData().getFirst();

            assertAll(
                    () -> assertEquals(1, response.getId()),
                    () -> assertEquals("Venda", response.getNaturezaOperacao()),
                    () -> assertEquals("Fornecedor ABC", response.getClienteNome()),
                    () -> assertEquals("DOC-001", response.getDocumentoReferencia()),
                    () -> assertEquals(new BigDecimal("100.00"), response.getValorTotal()),
                    () -> assertEquals("PAGO", response.getStatusPagamento()),
                    () -> assertNotNull(response.getDataEmissao()),
                    () -> assertEquals(1, response.getItens().size()),
                    () -> assertEquals(1, response.getItens().getFirst().getId()),
                    () -> assertEquals(1, response.getItens().getFirst().getProdutoId()),
                    () -> assertEquals("Tomate", response.getItens().getFirst().getProdutoDescricao()),
                    () -> assertEquals(new BigDecimal("5.000"), response.getItens().getFirst().getQuantidade()),
                    () -> assertEquals(new BigDecimal("20.00"), response.getItens().getFirst().getValorUnitario()),
                    () -> assertThat(response.getItens().getFirst().getValorTotal()).isEqualByComparingTo(new BigDecimal("100.000")),
                    () -> assertEquals(new BigDecimal("8.00"), response.getItens().getFirst().getCustoUnitario())
            );
        }

        @Test
        @DisplayName("deve retornar 'Consumidor Final' quando pedido nao tem cliente")
        void deveRetornarConsumidorFinalQuandoSemCliente() {
            Pedido pedido = criarPedidoSalvo(1, naturezaSaida, null,
                    new BigDecimal("50.00"), "PAGO");

            Page<Pedido> page = new PageImpl<>(List.of(pedido));
            when(pedidoRepository.findAllByOrderByIdDesc(any(Pageable.class))).thenReturn(page);
            when(itemPedidoRepository.findByPedido(pedido)).thenReturn(Collections.emptyList());

            CursorResponse<PedidoResponse> result = pedidoService.listarTodos(null, 10);

            assertEquals("Consumidor Final", result.getData().getFirst().getClienteNome());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // buscarPorId
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("buscarPorId")
    class BuscarPorIdTests {

        @Test
        @DisplayName("deve retornar PedidoResponse quando pedido encontrado")
        void deveRetornarPedidoQuandoEncontrado() {
            Pedido pedido = criarPedidoSalvo(1, naturezaSaida, cliente,
                    new BigDecimal("100.00"), "PAGO");

            when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));

            ItemPedido item = criarItemPedidoSalvo(1, pedido, produto, new BigDecimal("5.000"),
                    new BigDecimal("20.00"), new BigDecimal("8.00"));
            when(itemPedidoRepository.findByPedido(pedido)).thenReturn(List.of(item));

            PedidoResponse response = pedidoService.buscarPorId(1);

            assertNotNull(response);
            assertEquals(1, response.getId());
            assertEquals("Venda", response.getNaturezaOperacao());
            assertEquals("Fornecedor ABC", response.getClienteNome());
            assertEquals(1, response.getItens().size());

            verify(pedidoRepository).findById(1);
            verify(itemPedidoRepository).findByPedido(pedido);
        }

        @Test
        @DisplayName("deve lancar IllegalArgumentException quando pedido nao encontrado")
        void deveLancarExcecaoQuandoPedidoNaoEncontrado() {
            when(pedidoRepository.findById(999)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> pedidoService.buscarPorId(999));

            assertEquals("Pedido não encontrado", ex.getMessage());
            verify(itemPedidoRepository, never()).findByPedido(any());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // cancelarPedido
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("cancelarPedido")
    class CancelarPedidoTests {

        @Test
        @DisplayName("ENTRADA - deve estornar lote de compra e movimentacao de estoque, e marcar como CANCELADO")
        void deveCancelarPedidoEntrada() {
            Pedido pedido = criarPedidoSalvo(1, naturezaEntrada, cliente,
                    new BigDecimal("55.00"), "PAGO");

            ItemPedido item = criarItemPedidoSalvo(1, pedido, produto, new BigDecimal("10.000"),
                    new BigDecimal("5.50"), new BigDecimal("5.50"));

            when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));
            when(itemPedidoRepository.findByPedido(pedido)).thenReturn(List.of(item));

            pedidoService.cancelarPedido(1);

            assertEquals("CANCELADO", pedido.getStatusPagamento());
            verify(fifoService).estornarLoteCompra(item);
            verify(fifoService, never()).estornarVendaFifo(any());
            verify(estoqueService).estornarMovimentacao(produto, naturezaEntrada, pedido, new BigDecimal("10.000"));
            verify(pedidoRepository).save(pedido);
        }

        @Test
        @DisplayName("SAIDA - deve estornar venda FIFO e movimentacao de estoque, e marcar como CANCELADO")
        void deveCancelarPedidoSaida() {
            Pedido pedido = criarPedidoSalvo(1, naturezaSaida, cliente,
                    new BigDecimal("100.00"), "PAGO");

            ItemPedido item = criarItemPedidoSalvo(1, pedido, produto, new BigDecimal("5.000"),
                    new BigDecimal("20.00"), new BigDecimal("8.50"));

            when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));
            when(itemPedidoRepository.findByPedido(pedido)).thenReturn(List.of(item));

            pedidoService.cancelarPedido(1);

            assertEquals("CANCELADO", pedido.getStatusPagamento());
            verify(fifoService).estornarVendaFifo(item);
            verify(fifoService, never()).estornarLoteCompra(any());
            verify(estoqueService).estornarMovimentacao(produto, naturezaSaida, pedido, new BigDecimal("5.000"));
            verify(pedidoRepository).save(pedido);
        }

        @Test
        @DisplayName("ENTRADA com multiplos itens - deve estornar todos os itens")
        void deveCancelarPedidoEntradaComMultiplosItens() {
            Produto produto2 = new Produto();
            produto2.setId(2);
            produto2.setCodigo("P002");
            produto2.setDescricao("Cebola");

            Pedido pedido = criarPedidoSalvo(1, naturezaEntrada, cliente,
                    new BigDecimal("115.00"), "PAGO");

            ItemPedido item1 = criarItemPedidoSalvo(1, pedido, produto, new BigDecimal("10.000"),
                    new BigDecimal("5.50"), new BigDecimal("5.50"));
            ItemPedido item2 = criarItemPedidoSalvo(2, pedido, produto2, new BigDecimal("20.000"),
                    new BigDecimal("3.00"), new BigDecimal("3.00"));

            when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));
            when(itemPedidoRepository.findByPedido(pedido)).thenReturn(List.of(item1, item2));

            pedidoService.cancelarPedido(1);

            assertEquals("CANCELADO", pedido.getStatusPagamento());
            verify(fifoService).estornarLoteCompra(item1);
            verify(fifoService).estornarLoteCompra(item2);
            verify(estoqueService).estornarMovimentacao(produto, naturezaEntrada, pedido, new BigDecimal("10.000"));
            verify(estoqueService).estornarMovimentacao(produto2, naturezaEntrada, pedido, new BigDecimal("20.000"));
            verify(pedidoRepository).save(pedido);
        }

        @Test
        @DisplayName("deve lancar IllegalArgumentException quando pedido nao encontrado")
        void deveLancarExcecaoQuandoPedidoNaoEncontrado() {
            when(pedidoRepository.findById(999)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> pedidoService.cancelarPedido(999));

            assertEquals("Pedido não encontrado", ex.getMessage());
            verifyNoInteractions(itemPedidoRepository, estoqueService, fifoService);
        }

        @Test
        @DisplayName("deve lancar IllegalStateException quando pedido ja esta cancelado")
        void deveLancarExcecaoQuandoPedidoJaCancelado() {
            Pedido pedido = criarPedidoSalvo(1, naturezaEntrada, cliente,
                    new BigDecimal("55.00"), "CANCELADO");

            when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> pedidoService.cancelarPedido(1));

            assertEquals("Pedido já está cancelado.", ex.getMessage());
            verifyNoInteractions(itemPedidoRepository, estoqueService, fifoService);
            verify(pedidoRepository, never()).save(any());
        }

        @Test
        @DisplayName("deve verificar case-insensitive no status CANCELADO")
        void deveVerificarCaseInsensitiveStatusCancelado() {
            Pedido pedido = criarPedidoSalvo(1, naturezaEntrada, cliente,
                    new BigDecimal("55.00"), "cancelado");

            when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido));

            assertThrows(IllegalStateException.class,
                    () -> pedidoService.cancelarPedido(1));

            verifyNoInteractions(itemPedidoRepository, estoqueService, fifoService);
        }
    }
}
