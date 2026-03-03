package dev.vinisebold.hort.service;

import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.LoteEntradaRepository;
import dev.vinisebold.hort.repository.LoteSaidaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FifoServiceTest {

    @Mock
    private LoteEntradaRepository loteEntradaRepository;

    @Mock
    private LoteSaidaRepository loteSaidaRepository;

    @InjectMocks
    private FifoService fifoService;

    @Captor
    private ArgumentCaptor<LoteEntrada> loteEntradaCaptor;

    @Captor
    private ArgumentCaptor<LoteSaida> loteSaidaCaptor;

    private Produto produto;

    @BeforeEach
    void setUp() {
        produto = new Produto();
        produto.setId(1);
        produto.setCodigo("P001");
        produto.setDescricao("Tomate");
    }

    // ──────────────────────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────────────────────

    private Pedido criarPedido(LocalDateTime dataEmissao) {
        Pedido pedido = new Pedido();
        pedido.setId(1);
        pedido.setDataEmissao(dataEmissao);
        return pedido;
    }

    private ItemPedido criarItemPedido(Pedido pedido, BigDecimal quantidade, BigDecimal valorUnitario) {
        ItemPedido item = new ItemPedido();
        item.setId(1);
        item.setPedido(pedido);
        item.setProduto(produto);
        item.setQuantidade(quantidade);
        item.setValorUnitario(valorUnitario);
        return item;
    }

    private LoteEntrada criarLoteEntrada(BigDecimal quantidadeOriginal, BigDecimal quantidadeDisponivel,
                                         BigDecimal custoUnitario, LocalDateTime dataEntrada) {
        LoteEntrada lote = new LoteEntrada();
        lote.setId(1);
        lote.setProduto(produto);
        lote.setQuantidadeOriginal(quantidadeOriginal);
        lote.setQuantidadeDisponivel(quantidadeDisponivel);
        lote.setCustoUnitario(custoUnitario);
        lote.setDataEntrada(dataEntrada);
        lote.setIsEsgotado(false);
        return lote;
    }

    // ──────────────────────────────────────────────────────────────
    // registrarLoteCompra
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("registrarLoteCompra")
    class RegistrarLoteCompraTests {

        @Test
        @DisplayName("deve criar LoteEntrada com todos os campos corretos")
        void deveCriarLoteComCamposCorretos() {
            LocalDateTime dataEmissao = LocalDateTime.of(2026, 1, 15, 10, 30);
            Pedido pedido = criarPedido(dataEmissao);
            ItemPedido itemCompra = criarItemPedido(pedido, new BigDecimal("100.000"), new BigDecimal("5.50"));

            fifoService.registrarLoteCompra(itemCompra);

            verify(loteEntradaRepository).save(loteEntradaCaptor.capture());
            LoteEntrada loteSalvo = loteEntradaCaptor.getValue();

            assertAll(
                    () -> assertSame(itemCompra, loteSalvo.getItemPedido()),
                    () -> assertSame(produto, loteSalvo.getProduto()),
                    () -> assertEquals(new BigDecimal("100.000"), loteSalvo.getQuantidadeOriginal()),
                    () -> assertEquals(new BigDecimal("100.000"), loteSalvo.getQuantidadeDisponivel()),
                    () -> assertEquals(new BigDecimal("5.50"), loteSalvo.getCustoUnitario()),
                    () -> assertEquals(dataEmissao, loteSalvo.getDataEntrada()),
                    () -> assertFalse(loteSalvo.getIsEsgotado())
            );
        }

        @Test
        @DisplayName("deve usar dataEmissao do pedido quando disponivel")
        void deveUsarDataEmissaoDoPedido() {
            LocalDateTime dataEmissao = LocalDateTime.of(2026, 3, 1, 8, 0);
            Pedido pedido = criarPedido(dataEmissao);
            ItemPedido itemCompra = criarItemPedido(pedido, BigDecimal.TEN, BigDecimal.ONE);

            fifoService.registrarLoteCompra(itemCompra);

            verify(loteEntradaRepository).save(loteEntradaCaptor.capture());
            assertEquals(dataEmissao, loteEntradaCaptor.getValue().getDataEntrada());
        }

        @Test
        @DisplayName("deve usar LocalDateTime.now() quando dataEmissao for null")
        void deveUsarNowQuandoDataEmissaoNull() {
            Pedido pedido = criarPedido(null);
            ItemPedido itemCompra = criarItemPedido(pedido, BigDecimal.TEN, BigDecimal.ONE);

            LocalDateTime antes = LocalDateTime.now();
            fifoService.registrarLoteCompra(itemCompra);
            LocalDateTime depois = LocalDateTime.now();

            verify(loteEntradaRepository).save(loteEntradaCaptor.capture());
            LocalDateTime dataEntrada = loteEntradaCaptor.getValue().getDataEntrada();

            assertNotNull(dataEntrada);
            assertFalse(dataEntrada.isBefore(antes), "dataEntrada nao deveria ser antes do instante pre-chamada");
            assertFalse(dataEntrada.isAfter(depois), "dataEntrada nao deveria ser depois do instante pos-chamada");
        }

        @Test
        @DisplayName("deve invocar save exatamente uma vez")
        void deveInvocarSaveUmaVez() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemCompra = criarItemPedido(pedido, BigDecimal.TEN, BigDecimal.ONE);

            fifoService.registrarLoteCompra(itemCompra);

            verify(loteEntradaRepository, times(1)).save(any(LoteEntrada.class));
            verifyNoInteractions(loteSaidaRepository);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // processarVendaFifo
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("processarVendaFifo")
    class ProcessarVendaFifoTests {

        @Test
        @DisplayName("deve consumir lote unico suficiente e retornar custo correto")
        void deveConsumirLoteUnicoSuficiente() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("10.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("50.000"),
                    new BigDecimal("8.00"), LocalDateTime.of(2026, 1, 1, 0, 0));

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            // custo = 10 * 8 / 10 = 8.00
            assertEquals(new BigDecimal("8.00"), custoMedio);

            // lote parcialmente consumido, nao esgotado
            assertEquals(new BigDecimal("40.000"), lote.getQuantidadeDisponivel());
            assertFalse(lote.getIsEsgotado());

            verify(loteEntradaRepository, times(1)).save(lote);
            verify(loteSaidaRepository, times(1)).save(any(LoteSaida.class));
        }

        @Test
        @DisplayName("deve consumir lote inteiro e marcar como esgotado")
        void deveConsumirLoteInteiroEMarcarEsgotado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("50.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("50.000"),
                    new BigDecimal("8.00"), LocalDateTime.of(2026, 1, 1, 0, 0));

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            assertEquals(new BigDecimal("8.00"), custoMedio);
            assertEquals(BigDecimal.ZERO, lote.getQuantidadeDisponivel());
            assertTrue(lote.getIsEsgotado());
        }

        @Test
        @DisplayName("deve consumir multiplos lotes em ordem FIFO e calcular custo medio ponderado")
        void deveConsumirMultiplosLotesFifo() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            // Venda de 30 unidades
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("30.000"), new BigDecimal("25.00"));

            // Lote 1: 20 unidades a R$10
            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("20.000"), new BigDecimal("20.000"),
                    new BigDecimal("10.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);

            // Lote 2: 25 unidades a R$15
            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("25.000"), new BigDecimal("25.000"),
                    new BigDecimal("15.00"), LocalDateTime.of(2026, 1, 10, 0, 0));
            lote2.setId(2);

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote1, lote2));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            // Lote 1 totalmente consumido: 20 * 10 = 200
            // Lote 2 parcialmente consumido: 10 * 15 = 150
            // Custo total: 350 / 30 = 11.67 (HALF_UP)
            assertEquals(new BigDecimal("11.67"), custoMedio);

            // Verificacoes do lote 1 (esgotado)
            assertEquals(BigDecimal.ZERO, lote1.getQuantidadeDisponivel());
            assertTrue(lote1.getIsEsgotado());

            // Verificacoes do lote 2 (parcialmente consumido)
            assertEquals(new BigDecimal("15.000"), lote2.getQuantidadeDisponivel());
            assertFalse(lote2.getIsEsgotado());

            // Deve ter salvo 2 LoteSaida (um por lote consumido) e 2 LoteEntrada
            verify(loteEntradaRepository, times(2)).save(any(LoteEntrada.class));
            verify(loteSaidaRepository, times(2)).save(any(LoteSaida.class));
        }

        @Test
        @DisplayName("deve criar LoteSaida com dados corretos para cada lote consumido")
        void deveCriarLoteSaidaComDadosCorretos() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("15.000"), new BigDecimal("20.00"));

            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("5.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);

            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("20.000"), new BigDecimal("20.000"),
                    new BigDecimal("7.00"), LocalDateTime.of(2026, 1, 5, 0, 0));
            lote2.setId(2);

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote1, lote2));

            fifoService.processarVendaFifo(itemVenda);

            verify(loteSaidaRepository, times(2)).save(loteSaidaCaptor.capture());
            List<LoteSaida> saidasSalvas = loteSaidaCaptor.getAllValues();

            // Primeiro consumo: 10 unidades do lote1
            LoteSaida saida1 = saidasSalvas.get(0);
            assertAll("Primeira LoteSaida",
                    () -> assertSame(lote1, saida1.getLoteEntrada()),
                    () -> assertSame(itemVenda, saida1.getItemPedidoVenda()),
                    () -> assertEquals(new BigDecimal("10.000"), saida1.getQuantidadeConsumida()),
                    () -> assertEquals(new BigDecimal("5.00"), saida1.getCustoUnitario())
            );

            // Segundo consumo: 5 unidades do lote2
            LoteSaida saida2 = saidasSalvas.get(1);
            assertAll("Segunda LoteSaida",
                    () -> assertSame(lote2, saida2.getLoteEntrada()),
                    () -> assertSame(itemVenda, saida2.getItemPedidoVenda()),
                    () -> assertEquals(new BigDecimal("5.000"), saida2.getQuantidadeConsumida()),
                    () -> assertEquals(new BigDecimal("7.00"), saida2.getCustoUnitario())
            );
        }

        @Test
        @DisplayName("deve consumir parcialmente o lote sem marcar como esgotado")
        void deveConsumirParcialmenteSemMarcarEsgotado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("3.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("100.000"), new BigDecimal("100.000"),
                    new BigDecimal("6.00"), LocalDateTime.of(2026, 1, 1, 0, 0));

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            assertEquals(new BigDecimal("6.00"), custoMedio);
            assertEquals(new BigDecimal("97.000"), lote.getQuantidadeDisponivel());
            assertFalse(lote.getIsEsgotado());
        }

        @Test
        @DisplayName("deve retornar custo medio ponderado com arredondamento HALF_UP")
        void deveRetornarCustoMedioPonderadoComArredondamento() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            // Venda de 3 unidades
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("3.000"), new BigDecimal("20.00"));

            // Lote 1: 1 unidade a R$10.00
            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("1.000"), new BigDecimal("1.000"),
                    new BigDecimal("10.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);

            // Lote 2: 10 unidades a R$7.00
            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("7.00"), LocalDateTime.of(2026, 1, 5, 0, 0));
            lote2.setId(2);

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote1, lote2));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            // 1*10 + 2*7 = 24 / 3 = 8.00
            assertEquals(new BigDecimal("8.00"), custoMedio);
        }

        @Test
        @DisplayName("deve retornar custo medio ponderado com resultado fracionario arredondado")
        void deveRetornarCustoMedioPonderadoFracionarioArredondado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            // Venda de 7 unidades
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("7.000"), new BigDecimal("20.00"));

            // Lote 1: 4 unidades a R$10.00
            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("4.000"), new BigDecimal("4.000"),
                    new BigDecimal("10.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);

            // Lote 2: 10 unidades a R$13.00
            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("13.00"), LocalDateTime.of(2026, 1, 5, 0, 0));
            lote2.setId(2);

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote1, lote2));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            // 4*10 + 3*13 = 40 + 39 = 79 / 7 = 11.285714... -> 11.29 (HALF_UP)
            assertEquals(new BigDecimal("11.29"), custoMedio);
        }

        @Test
        @DisplayName("deve lancar RuntimeException quando estoque insuficiente")
        void deveLancarExcecaoQuandoEstoqueInsuficiente() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("100.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("50.000"),
                    new BigDecimal("8.00"), LocalDateTime.of(2026, 1, 1, 0, 0));

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fifoService.processarVendaFifo(itemVenda));

            assertTrue(ex.getMessage().contains("FIFO"));
        }

        @Test
        @DisplayName("deve lancar RuntimeException quando nenhum lote disponivel")
        void deveLancarExcecaoQuandoNenhumLoteDisponivel() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("10.000"), new BigDecimal("20.00"));

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(Collections.emptyList());

            assertThrows(RuntimeException.class, () -> fifoService.processarVendaFifo(itemVenda));
        }

        @Test
        @DisplayName("deve consumir exatamente tres lotes em ordem FIFO e esgotar todos")
        void deveConsumirTresLotesEmOrdemFifo() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            // Venda de 30 unidades
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("30.000"), new BigDecimal("25.00"));

            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("5.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);

            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("6.00"), LocalDateTime.of(2026, 1, 10, 0, 0));
            lote2.setId(2);

            LoteEntrada lote3 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("7.00"), LocalDateTime.of(2026, 1, 20, 0, 0));
            lote3.setId(3);

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote1, lote2, lote3));

            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            // 10*5 + 10*6 + 10*7 = 50+60+70 = 180 / 30 = 6.00
            assertEquals(new BigDecimal("6.00"), custoMedio);

            assertAll(
                    () -> assertTrue(lote1.getIsEsgotado()),
                    () -> assertEquals(BigDecimal.ZERO, lote1.getQuantidadeDisponivel()),
                    () -> assertTrue(lote2.getIsEsgotado()),
                    () -> assertEquals(BigDecimal.ZERO, lote2.getQuantidadeDisponivel()),
                    () -> assertTrue(lote3.getIsEsgotado()),
                    () -> assertEquals(BigDecimal.ZERO, lote3.getQuantidadeDisponivel())
            );

            verify(loteEntradaRepository, times(3)).save(any(LoteEntrada.class));
            verify(loteSaidaRepository, times(3)).save(any(LoteSaida.class));
        }

        @Test
        @DisplayName("nao deve interagir com lotes desnecessarios apos quantidade atendida")
        void naoDeveInteragirComLotesDesnecessarios() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("5.000"), new BigDecimal("20.00"));

            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("5.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);

            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("10.000"), new BigDecimal("10.000"),
                    new BigDecimal("6.00"), LocalDateTime.of(2026, 1, 10, 0, 0));
            lote2.setId(2);

            when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(produto))
                    .thenReturn(List.of(lote1, lote2));

            fifoService.processarVendaFifo(itemVenda);

            // Lote 2 nao deve ter sido modificado
            assertEquals(new BigDecimal("10.000"), lote2.getQuantidadeDisponivel());
            assertFalse(lote2.getIsEsgotado());

            // Apenas um save para LoteEntrada e LoteSaida
            verify(loteEntradaRepository, times(1)).save(lote1);
            verify(loteEntradaRepository, never()).save(lote2);
            verify(loteSaidaRepository, times(1)).save(any(LoteSaida.class));
        }
    }

    // ──────────────────────────────────────────────────────────────
    // estornarLoteCompra
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("estornarLoteCompra")
    class EstornarLoteCompraTests {

        @Test
        @DisplayName("deve deletar lote quando nenhum produto foi vendido")
        void deveDeletarLoteQuandoNenhumProdutoVendido() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemCompra = criarItemPedido(pedido, new BigDecimal("50.000"), new BigDecimal("10.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("50.000"),
                    new BigDecimal("10.00"), LocalDateTime.now());
            lote.setItemPedido(itemCompra);

            when(loteEntradaRepository.findByItemPedido(itemCompra))
                    .thenReturn(Optional.of(lote));

            fifoService.estornarLoteCompra(itemCompra);

            verify(loteEntradaRepository).delete(lote);
            verifyNoInteractions(loteSaidaRepository);
        }

        @Test
        @DisplayName("deve lancar IllegalArgumentException quando lote nao encontrado")
        void deveLancarExcecaoQuandoLoteNaoEncontrado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemCompra = criarItemPedido(pedido, BigDecimal.TEN, BigDecimal.ONE);

            when(loteEntradaRepository.findByItemPedido(itemCompra))
                    .thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> fifoService.estornarLoteCompra(itemCompra));

            assertTrue(ex.getMessage().contains("Lote de entrada"));
            verify(loteEntradaRepository, never()).delete(any());
        }

        @Test
        @DisplayName("deve lancar IllegalStateException quando parte do lote ja foi vendida")
        void deveLancarExcecaoQuandoParteJaVendida() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemCompra = criarItemPedido(pedido, new BigDecimal("50.000"), new BigDecimal("10.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("30.000"),  // 20 ja vendido
                    new BigDecimal("10.00"), LocalDateTime.now());
            lote.setItemPedido(itemCompra);

            when(loteEntradaRepository.findByItemPedido(itemCompra))
                    .thenReturn(Optional.of(lote));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> fifoService.estornarLoteCompra(itemCompra));

            assertTrue(ex.getMessage().contains("cancelar"));
            verify(loteEntradaRepository, never()).delete(any());
        }

        @Test
        @DisplayName("deve lancar IllegalStateException quando lote completamente esgotado")
        void deveLancarExcecaoQuandoLoteEsgotado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemCompra = criarItemPedido(pedido, new BigDecimal("50.000"), new BigDecimal("10.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), BigDecimal.ZERO,
                    new BigDecimal("10.00"), LocalDateTime.now());
            lote.setItemPedido(itemCompra);
            lote.setIsEsgotado(true);

            when(loteEntradaRepository.findByItemPedido(itemCompra))
                    .thenReturn(Optional.of(lote));

            assertThrows(IllegalStateException.class,
                    () -> fifoService.estornarLoteCompra(itemCompra));

            verify(loteEntradaRepository, never()).delete(any());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // estornarVendaFifo
    // ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("estornarVendaFifo")
    class EstornarVendaFifoTests {

        @Test
        @DisplayName("deve restaurar quantidade disponivel do lote apos estorno")
        void deveRestaurarQuantidadeDisponivel() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("10.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("40.000"),
                    new BigDecimal("8.00"), LocalDateTime.now());

            LoteSaida consumo = new LoteSaida();
            consumo.setId(1);
            consumo.setLoteEntrada(lote);
            consumo.setItemPedidoVenda(itemVenda);
            consumo.setQuantidadeConsumida(new BigDecimal("10.000"));
            consumo.setCustoUnitario(new BigDecimal("8.00"));

            when(loteSaidaRepository.findByItemPedidoVenda(itemVenda))
                    .thenReturn(List.of(consumo));

            fifoService.estornarVendaFifo(itemVenda);

            // 40 + 10 = 50 (volta ao original)
            assertEquals(new BigDecimal("50.000"), lote.getQuantidadeDisponivel());
            verify(loteEntradaRepository).save(lote);
            verify(loteSaidaRepository).deleteAll(List.of(consumo));
        }

        @Test
        @DisplayName("deve marcar lote anteriormente esgotado como nao esgotado")
        void deveMarcarLoteComoNaoEsgotado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("50.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), BigDecimal.ZERO,
                    new BigDecimal("8.00"), LocalDateTime.now());
            lote.setIsEsgotado(true);

            LoteSaida consumo = new LoteSaida();
            consumo.setId(1);
            consumo.setLoteEntrada(lote);
            consumo.setItemPedidoVenda(itemVenda);
            consumo.setQuantidadeConsumida(new BigDecimal("50.000"));
            consumo.setCustoUnitario(new BigDecimal("8.00"));

            when(loteSaidaRepository.findByItemPedidoVenda(itemVenda))
                    .thenReturn(List.of(consumo));

            fifoService.estornarVendaFifo(itemVenda);

            assertFalse(lote.getIsEsgotado());
            assertEquals(new BigDecimal("50.000"), lote.getQuantidadeDisponivel());
        }

        @Test
        @DisplayName("deve restaurar multiplos lotes quando venda consumiu varios")
        void deveRestaurarMultiplosLotes() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("30.000"), new BigDecimal("20.00"));

            LoteEntrada lote1 = criarLoteEntrada(
                    new BigDecimal("20.000"), BigDecimal.ZERO,
                    new BigDecimal("10.00"), LocalDateTime.of(2026, 1, 1, 0, 0));
            lote1.setId(1);
            lote1.setIsEsgotado(true);

            LoteEntrada lote2 = criarLoteEntrada(
                    new BigDecimal("25.000"), new BigDecimal("15.000"),
                    new BigDecimal("15.00"), LocalDateTime.of(2026, 1, 10, 0, 0));
            lote2.setId(2);

            LoteSaida consumo1 = new LoteSaida();
            consumo1.setId(1);
            consumo1.setLoteEntrada(lote1);
            consumo1.setItemPedidoVenda(itemVenda);
            consumo1.setQuantidadeConsumida(new BigDecimal("20.000"));
            consumo1.setCustoUnitario(new BigDecimal("10.00"));

            LoteSaida consumo2 = new LoteSaida();
            consumo2.setId(2);
            consumo2.setLoteEntrada(lote2);
            consumo2.setItemPedidoVenda(itemVenda);
            consumo2.setQuantidadeConsumida(new BigDecimal("10.000"));
            consumo2.setCustoUnitario(new BigDecimal("15.00"));

            when(loteSaidaRepository.findByItemPedidoVenda(itemVenda))
                    .thenReturn(List.of(consumo1, consumo2));

            fifoService.estornarVendaFifo(itemVenda);

            // Lote 1: 0 + 20 = 20 (volta ao original), nao mais esgotado
            assertEquals(new BigDecimal("20.000"), lote1.getQuantidadeDisponivel());
            assertFalse(lote1.getIsEsgotado());

            // Lote 2: 15 + 10 = 25 (volta ao original)
            assertEquals(new BigDecimal("25.000"), lote2.getQuantidadeDisponivel());
            assertFalse(lote2.getIsEsgotado());

            verify(loteEntradaRepository).save(lote1);
            verify(loteEntradaRepository).save(lote2);
            verify(loteSaidaRepository).deleteAll(List.of(consumo1, consumo2));
        }

        @Test
        @DisplayName("deve deletar todos os registros de LoteSaida")
        void deveDeletarTodosRegistrosLoteSaida() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("5.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("45.000"),
                    new BigDecimal("8.00"), LocalDateTime.now());

            LoteSaida consumo = new LoteSaida();
            consumo.setId(1);
            consumo.setLoteEntrada(lote);
            consumo.setItemPedidoVenda(itemVenda);
            consumo.setQuantidadeConsumida(new BigDecimal("5.000"));
            consumo.setCustoUnitario(new BigDecimal("8.00"));

            List<LoteSaida> consumos = List.of(consumo);

            when(loteSaidaRepository.findByItemPedidoVenda(itemVenda))
                    .thenReturn(consumos);

            fifoService.estornarVendaFifo(itemVenda);

            verify(loteSaidaRepository).deleteAll(consumos);
        }

        @Test
        @DisplayName("nao deve alterar lotes quando nao ha consumos para estornar")
        void naoDeveAlterarLotesQuandoSemConsumos() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, BigDecimal.TEN, BigDecimal.ONE);

            when(loteSaidaRepository.findByItemPedidoVenda(itemVenda))
                    .thenReturn(Collections.emptyList());

            fifoService.estornarVendaFifo(itemVenda);

            verify(loteEntradaRepository, never()).save(any());
            verify(loteSaidaRepository).deleteAll(Collections.emptyList());
        }

        @Test
        @DisplayName("nao deve alterar isEsgotado quando lote ja nao estava esgotado")
        void naoDeveAlterarIsEsgotadoQuandoJaNaoEsgotado() {
            Pedido pedido = criarPedido(LocalDateTime.now());
            ItemPedido itemVenda = criarItemPedido(pedido, new BigDecimal("5.000"), new BigDecimal("20.00"));

            LoteEntrada lote = criarLoteEntrada(
                    new BigDecimal("50.000"), new BigDecimal("45.000"),
                    new BigDecimal("8.00"), LocalDateTime.now());
            lote.setIsEsgotado(false);

            LoteSaida consumo = new LoteSaida();
            consumo.setId(1);
            consumo.setLoteEntrada(lote);
            consumo.setItemPedidoVenda(itemVenda);
            consumo.setQuantidadeConsumida(new BigDecimal("5.000"));
            consumo.setCustoUnitario(new BigDecimal("8.00"));

            when(loteSaidaRepository.findByItemPedidoVenda(itemVenda))
                    .thenReturn(List.of(consumo));

            fifoService.estornarVendaFifo(itemVenda);

            // Should remain false (was already false, branch not entered)
            assertFalse(lote.getIsEsgotado());
            assertEquals(new BigDecimal("50.000"), lote.getQuantidadeDisponivel());
        }
    }
}
