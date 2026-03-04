package dev.vinisebold.hort.service;

import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.LoteEntradaRepository;
import dev.vinisebold.hort.repository.LoteSaidaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

/**
 * Teste de integração simulada do sistema FIFO.
 *
 * Utiliza listas em memória como banco de dados falso para permitir que múltiplas
 * chamadas ao FifoService (compra, venda, estorno) interajam entre si de forma
 * realista, sem necessidade de contexto Spring ou banco de dados real.
 */
@SuppressWarnings("unchecked")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FIFO System - Integration Scenarios")
class FifoIntegrationTest {

    @Mock
    private LoteEntradaRepository loteEntradaRepository;

    @Mock
    private LoteSaidaRepository loteSaidaRepository;

    @InjectMocks
    private FifoService fifoService;

    // ── In-memory databases ──────────────────────────────────────────
    private List<LoteEntrada> lotesEntrada;
    private List<LoteSaida> lotesSaida;
    private AtomicInteger loteEntradaIdSeq;
    private AtomicInteger loteSaidaIdSeq;
    private AtomicInteger itemPedidoIdSeq;
    private AtomicInteger pedidoIdSeq;

    // ── Shared fixtures ──────────────────────────────────────────────
    private Produto produto;

    @BeforeEach
    void setUp() {
        lotesEntrada = new ArrayList<>();
        lotesSaida = new ArrayList<>();
        loteEntradaIdSeq = new AtomicInteger(0);
        loteSaidaIdSeq = new AtomicInteger(0);
        itemPedidoIdSeq = new AtomicInteger(0);
        pedidoIdSeq = new AtomicInteger(0);

        produto = criarProduto("P001", "Tomate");

        configurarMockRepositories();
    }

    // ══════════════════════════════════════════════════════════════════
    // Mock repository configuration
    // ══════════════════════════════════════════════════════════════════

    private void configurarMockRepositories() {
        // ── LoteEntradaRepository.save ───────────────────────────────
        when(loteEntradaRepository.save(any(LoteEntrada.class))).thenAnswer(invocation -> {
            LoteEntrada lote = invocation.getArgument(0);
            if (lote.getId() == null) {
                lote.setId(loteEntradaIdSeq.incrementAndGet());
                lotesEntrada.add(lote);
            }
            // If it already has an ID, it's an update — the object is already in the list
            // because Java passes by reference, so mutations are reflected automatically.
            return lote;
        });

        // ── LoteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc
        when(loteEntradaRepository.findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(any(Produto.class)))
                .thenAnswer(invocation -> {
                    Produto p = invocation.getArgument(0);
                    return lotesEntrada.stream()
                            .filter(l -> l.getProduto().equals(p))
                            .filter(l -> !l.getIsEsgotado())
                            .sorted(Comparator.comparing(LoteEntrada::getDataEntrada))
                            .toList();
                });

        // ── LoteEntradaRepository.findByItemPedido ───────────────────
        when(loteEntradaRepository.findByItemPedido(any(ItemPedido.class))).thenAnswer(invocation -> {
            ItemPedido item = invocation.getArgument(0);
            return lotesEntrada.stream()
                    .filter(l -> l.getItemPedido() != null && l.getItemPedido().equals(item))
                    .findFirst();
        });

        // ── LoteEntradaRepository.delete ─────────────────────────────
        doAnswer(invocation -> {
            LoteEntrada lote = invocation.getArgument(0);
            lotesEntrada.remove(lote);
            return null;
        }).when(loteEntradaRepository).delete(any(LoteEntrada.class));

        // ── LoteSaidaRepository.save ─────────────────────────────────
        when(loteSaidaRepository.save(any(LoteSaida.class))).thenAnswer(invocation -> {
            LoteSaida saida = invocation.getArgument(0);
            if (saida.getId() == null) {
                saida.setId(loteSaidaIdSeq.incrementAndGet());
                lotesSaida.add(saida);
            }
            return saida;
        });

        // ── LoteSaidaRepository.findByItemPedidoVenda ────────────────
        when(loteSaidaRepository.findByItemPedidoVenda(any(ItemPedido.class))).thenAnswer(invocation -> {
            ItemPedido item = invocation.getArgument(0);
            return lotesSaida.stream()
                    .filter(s -> s.getItemPedidoVenda().equals(item))
                    .toList();
        });

        // ── LoteSaidaRepository.deleteAll ────────────────────────────
        doAnswer(invocation -> {
            Iterable<LoteSaida> saidas = invocation.getArgument(0);
            saidas.forEach(lotesSaida::remove);
            return null;
        }).when(loteSaidaRepository).deleteAll(any(Iterable.class));
    }

    // ══════════════════════════════════════════════════════════════════
    // Factory helpers
    // ══════════════════════════════════════════════════════════════════

    private Produto criarProduto(String codigo, String descricao) {
        Produto p = new Produto();
        p.setId(1);
        p.setCodigo(codigo);
        p.setDescricao(descricao);
        p.setEstoqueAtual(BigDecimal.ZERO);
        p.setIsActive(true);
        return p;
    }

    private Pedido criarPedido(LocalDateTime dataEmissao) {
        Pedido pedido = new Pedido();
        pedido.setId(pedidoIdSeq.incrementAndGet());
        pedido.setDataEmissao(dataEmissao);
        pedido.setValorTotal(BigDecimal.ZERO);
        pedido.setStatus("PENDENTE");
        return pedido;
    }

    private ItemPedido criarItemCompra(BigDecimal quantidade, BigDecimal valorUnitario, LocalDateTime dataEmissao) {
        Pedido pedido = criarPedido(dataEmissao);
        ItemPedido item = new ItemPedido();
        item.setId(itemPedidoIdSeq.incrementAndGet());
        item.setPedido(pedido);
        item.setProduto(produto);
        item.setQuantidade(quantidade);
        item.setValorUnitario(valorUnitario);
        item.setCustoUnitario(BigDecimal.ZERO);
        item.setValorTotal(quantidade.multiply(valorUnitario));
        return item;
    }

    private ItemPedido criarItemVenda(BigDecimal quantidade) {
        Pedido pedido = criarPedido(LocalDateTime.now());
        ItemPedido item = new ItemPedido();
        item.setId(itemPedidoIdSeq.incrementAndGet());
        item.setPedido(pedido);
        item.setProduto(produto);
        item.setQuantidade(quantidade);
        item.setValorUnitario(BigDecimal.ZERO); // Valor de venda irrelevante para FIFO
        item.setCustoUnitario(BigDecimal.ZERO);
        item.setValorTotal(BigDecimal.ZERO);
        return item;
    }

    /**
     * Registra uma compra e retorna o ItemPedido para referência posterior.
     */
    private ItemPedido comprar(BigDecimal quantidade, BigDecimal valorUnitario, LocalDateTime dataEntrada) {
        ItemPedido itemCompra = criarItemCompra(quantidade, valorUnitario, dataEntrada);
        fifoService.registrarLoteCompra(itemCompra);
        return itemCompra;
    }

    /**
     * Processa uma venda FIFO e retorna o custo médio ponderado calculado.
     */
    private BigDecimal vender(BigDecimal quantidade) {
        ItemPedido itemVenda = criarItemVenda(quantidade);
        return fifoService.processarVendaFifo(itemVenda);
    }

    // ══════════════════════════════════════════════════════════════════
    // Test Scenarios
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Cenário 1: Ordem FIFO Básica")
    class OrdemFifoBasica {

        @Test
        @DisplayName("Deve consumir lotes na ordem de entrada (mais antigo primeiro)")
        void deveConsumirLotesEmOrdemFifo() {
            // Compra Lote A: 10 unidades a R$5.00
            comprar(new BigDecimal("10.000"), new BigDecimal("5.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            // Compra Lote B: 10 unidades a R$8.00
            comprar(new BigDecimal("10.000"), new BigDecimal("8.00"),
                    LocalDateTime.of(2026, 1, 5, 10, 0));

            // Vende 15 unidades → consome A(10) + B(5)
            BigDecimal custoMedio = vender(new BigDecimal("15.000"));

            // Custo esperado: (10*5 + 5*8) / 15 = 90/15 = 6.00
            assertThat(custoMedio).isEqualByComparingTo("6.00");

            // Lote A deve estar esgotado
            LoteEntrada loteA = lotesEntrada.getFirst();
            assertThat(loteA.getIsEsgotado()).isTrue();
            assertThat(loteA.getQuantidadeDisponivel()).isEqualByComparingTo("0");

            // Lote B deve ter 5 restantes
            LoteEntrada loteB = lotesEntrada.getLast();
            assertThat(loteB.getIsEsgotado()).isFalse();
            assertThat(loteB.getQuantidadeDisponivel()).isEqualByComparingTo("5.000");

            // Devem existir 2 registros de LoteSaida
            assertThat(lotesSaida).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Cenário 2: Múltiplos Lotes Pequenos")
    class MultiplosLotesPequenos {

        @Test
        @DisplayName("Deve consumir múltiplos lotes pequenos em sequência e calcular custo corretamente")
        void deveConsumirMultiplosLotesPequenosComDuasVendas() {
            // Lote A: 5 a R$2.00
            comprar(new BigDecimal("5.000"), new BigDecimal("2.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));
            // Lote B: 3 a R$4.00
            comprar(new BigDecimal("3.000"), new BigDecimal("4.00"),
                    LocalDateTime.of(2026, 1, 5, 10, 0));
            // Lote C: 7 a R$6.00
            comprar(new BigDecimal("7.000"), new BigDecimal("6.00"),
                    LocalDateTime.of(2026, 1, 10, 10, 0));

            // Primeira venda: 10 unidades → A(5) + B(3) + C(2)
            BigDecimal custoMedioPrimeiraVenda = vender(new BigDecimal("10.000"));
            // Custo: (5*2 + 3*4 + 2*6) / 10 = (10+12+12)/10 = 34/10 = 3.40
            assertThat(custoMedioPrimeiraVenda).isEqualByComparingTo("3.40");

            // Lotes A e B esgotados, C com 5 restantes
            assertThat(lotesEntrada.getFirst().getIsEsgotado()).isTrue();
            assertThat(lotesEntrada.get(1).getIsEsgotado()).isTrue();
            assertThat(lotesEntrada.getLast().getQuantidadeDisponivel()).isEqualByComparingTo("5.000");

            // Segunda venda: 5 unidades → C(5) restantes
            BigDecimal custoMedioSegundaVenda = vender(new BigDecimal("5.000"));
            // Custo: 5*6 / 5 = 6.00
            assertThat(custoMedioSegundaVenda).isEqualByComparingTo("6.00");

            // Lote C agora esgotado
            assertThat(lotesEntrada.getLast().getIsEsgotado()).isTrue();
            assertThat(lotesEntrada.getLast().getQuantidadeDisponivel()).isEqualByComparingTo("0");
        }
    }

    @Nested
    @DisplayName("Cenário 3: Consumo Exato de Lote")
    class ConsumoExatoLote {

        @Test
        @DisplayName("Deve consumir exatamente um lote inteiro e marcá-lo como esgotado")
        void deveConsumirExatamenteUmLote() {
            comprar(new BigDecimal("10.000"), new BigDecimal("5.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            BigDecimal custoMedio = vender(new BigDecimal("10.000"));

            assertThat(custoMedio).isEqualByComparingTo("5.00");

            LoteEntrada lote = lotesEntrada.getFirst();
            assertThat(lote.getIsEsgotado()).isTrue();
            assertThat(lote.getQuantidadeDisponivel()).isEqualByComparingTo("0");

            assertThat(lotesSaida).hasSize(1);
            assertThat(lotesSaida.getFirst().getQuantidadeConsumida()).isEqualByComparingTo("10.000");
        }
    }

    @Nested
    @DisplayName("Cenário 4: Estoque Insuficiente")
    class EstoqueInsuficiente {

        @Test
        @DisplayName("Deve lançar RuntimeException quando estoque FIFO é insuficiente")
        void deveLancarExcecaoEstoqueInsuficiente() {
            comprar(new BigDecimal("5.000"), new BigDecimal("10.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            ItemPedido itemVenda = criarItemVenda(new BigDecimal("10.000"));

            assertThatThrownBy(() -> fifoService.processarVendaFifo(itemVenda))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("FIFO");
        }
    }

    @Nested
    @DisplayName("Cenário 5: Cancelamento de Venda (Estorno)")
    class CancelamentoVenda {

        @Test
        @DisplayName("Deve restaurar quantidade disponível do lote e deletar registros de saída")
        void deveEstornarVendaERestaurarLote() {
            // Compra 10 a R$5.00
            comprar(new BigDecimal("10.000"), new BigDecimal("5.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            // Vende 7 → Lote A fica com 3 disponíveis
            ItemPedido itemVenda = criarItemVenda(new BigDecimal("7.000"));
            BigDecimal custoMedio = fifoService.processarVendaFifo(itemVenda);

            assertThat(custoMedio).isEqualByComparingTo("5.00");
            assertThat(lotesEntrada.getFirst().getQuantidadeDisponivel()).isEqualByComparingTo("3.000");
            assertThat(lotesSaida).hasSize(1);

            // Cancela a venda
            fifoService.estornarVendaFifo(itemVenda);

            // Lote A deve voltar a ter 10 disponíveis
            LoteEntrada loteA = lotesEntrada.getFirst();
            assertThat(loteA.getQuantidadeDisponivel()).isEqualByComparingTo("10.000");
            assertThat(loteA.getIsEsgotado()).isFalse();

            // Registros de saída devem ter sido removidos
            assertThat(lotesSaida).isEmpty();
        }
    }

    @Nested
    @DisplayName("Cenário 6: Cancelamento de Compra")
    class CancelamentoCompra {

        @Test
        @DisplayName("Deve deletar o lote quando nenhum produto foi vendido")
        void devePermitirCancelamentoCompraQuandoNadaVendido() {
            ItemPedido itemCompra = comprar(new BigDecimal("10.000"), new BigDecimal("5.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            assertThat(lotesEntrada).hasSize(1);

            fifoService.estornarLoteCompra(itemCompra);

            assertThat(lotesEntrada).isEmpty();
        }
    }

    @Nested
    @DisplayName("Cenário 7: Cancelamento de Compra Bloqueado")
    class CancelamentoCompraBloqueado {

        @Test
        @DisplayName("Deve lançar IllegalStateException quando parte do lote já foi vendida")
        void deveBloquerCancelamentoQuandoJaHouveVenda() {
            // Compra 10 a R$5.00
            ItemPedido itemCompra = comprar(new BigDecimal("10.000"), new BigDecimal("5.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            // Vende 3 → Lote com 7 restantes
            vender(new BigDecimal("3.000"));

            assertThat(lotesEntrada.getFirst().getQuantidadeDisponivel()).isEqualByComparingTo("7.000");

            // Tenta cancelar compra → deve falhar
            assertThatThrownBy(() -> fifoService.estornarLoteCompra(itemCompra))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("cancelar");
        }
    }

    @Nested
    @DisplayName("Cenário 8: Fluxo Complexo (Compra, Venda, Estorno, Nova Venda)")
    class FluxoComplexo {

        @Test
        @DisplayName("Deve manter consistência FIFO após venda, estorno e nova venda")
        void deveManterConsistenciaAposEstornoENovaVenda() {
            // Compra Lote A: 20 a R$4.00
            comprar(new BigDecimal("20.000"), new BigDecimal("4.00"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            // Compra Lote B: 10 a R$6.00
            comprar(new BigDecimal("10.000"), new BigDecimal("6.00"),
                    LocalDateTime.of(2026, 1, 10, 10, 0));

            // Vende 25 → A(20) + B(5), custo = (80+30)/25 = 4.40
            ItemPedido itemVenda25 = criarItemVenda(new BigDecimal("25.000"));
            BigDecimal custoMedio25 = fifoService.processarVendaFifo(itemVenda25);

            assertThat(custoMedio25).isEqualByComparingTo("4.40");

            // Verifica estado pós-venda
            assertThat(lotesEntrada.getFirst().getIsEsgotado()).isTrue();           // Lote A esgotado
            assertThat(lotesEntrada.getFirst().getQuantidadeDisponivel()).isEqualByComparingTo("0");
            assertThat(lotesEntrada.get(1).getQuantidadeDisponivel()).isEqualByComparingTo("5.000"); // Lote B parcial
            assertThat(lotesSaida).hasSize(2);

            // Cancela a venda de 25 → restaura A(20) e B(10)
            fifoService.estornarVendaFifo(itemVenda25);

            assertThat(lotesEntrada.getFirst().getQuantidadeDisponivel()).isEqualByComparingTo("20.000");
            assertThat(lotesEntrada.getFirst().getIsEsgotado()).isFalse();
            assertThat(lotesEntrada.getLast().getQuantidadeDisponivel()).isEqualByComparingTo("10.000");
            assertThat(lotesEntrada.getLast().getIsEsgotado()).isFalse();
            assertThat(lotesSaida).isEmpty();

            // Nova venda: 15 → consome apenas A(15), custo = R$4.00
            BigDecimal custoMedio15 = vender(new BigDecimal("15.000"));

            assertThat(custoMedio15).isEqualByComparingTo("4.00");

            // Lote A com 5 restantes, Lote B intacto
            assertThat(lotesEntrada.getFirst().getQuantidadeDisponivel()).isEqualByComparingTo("5.000");
            assertThat(lotesEntrada.getFirst().getIsEsgotado()).isFalse();
            assertThat(lotesEntrada.getLast().getQuantidadeDisponivel()).isEqualByComparingTo("10.000");
            assertThat(lotesSaida).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Cenário 9: Precisão do Custo Médio Ponderado")
    class PrecisaoCustoMedioPonderado {

        @Test
        @DisplayName("Deve calcular custo médio com arredondamento HALF_UP correto")
        void deveCalcularCustoMedioComArredondamentoCorreto() {
            // Lote A: 3 a R$7.50
            comprar(new BigDecimal("3.000"), new BigDecimal("7.50"),
                    LocalDateTime.of(2026, 1, 1, 10, 0));

            // Lote B: 2 a R$12.00
            comprar(new BigDecimal("2.000"), new BigDecimal("12.00"),
                    LocalDateTime.of(2026, 1, 5, 10, 0));

            // Vende 5 → A(3) + B(2)
            // Custo: (3*7.50 + 2*12.00) / 5 = (22.50+24.00)/5 = 46.50/5 = 9.30
            BigDecimal custoMedio = vender(new BigDecimal("5.000"));

            assertThat(custoMedio).isEqualByComparingTo("9.30");

            // Ambos esgotados
            assertThat(lotesEntrada.getFirst().getIsEsgotado()).isTrue();
            assertThat(lotesEntrada.getLast().getIsEsgotado()).isTrue();
        }
    }
}
