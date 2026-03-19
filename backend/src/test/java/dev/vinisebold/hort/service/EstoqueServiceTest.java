package dev.vinisebold.hort.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dev.vinisebold.hort.dto.response.*;
import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.ItemPedidoRepository;
import dev.vinisebold.hort.repository.MovimentacaoEstoqueRepository;
import dev.vinisebold.hort.repository.ProdutoRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
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
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class EstoqueServiceTest {

  @Mock
  private ProdutoRepository produtoRepository;

  @Mock
  private MovimentacaoEstoqueRepository movimentacaoRepository;

  @Mock
  private ItemPedidoRepository itemPedidoRepository;

  @InjectMocks
  private EstoqueService estoqueService;

  @Captor
  private ArgumentCaptor<Produto> produtoCaptor;

  @Captor
  private ArgumentCaptor<MovimentacaoEstoque> movimentacaoCaptor;

  private Produto produto;
  private NaturezaOperacao naturezaEntrada;
  private NaturezaOperacao naturezaSaida;
  private Pedido pedido;
  private UnidadeMedida unidadeMedida;

  @BeforeEach
  void setUp() {
    unidadeMedida = new UnidadeMedida();
    unidadeMedida.setId(1);
    unidadeMedida.setSigla("KG");
    unidadeMedida.setDescricao("Quilograma");
    unidadeMedida.setIsActive(true);

    produto = new Produto();
    produto.setId(1);
    produto.setCodigo("PROD-001");
    produto.setDescricao("Tomate");
    produto.setUnidadeMedida(unidadeMedida);
    produto.setEstoqueAtual(new BigDecimal("100.000"));
    produto.setIsActive(true);

    naturezaEntrada = new NaturezaOperacao();
    naturezaEntrada.setId(1);
    naturezaEntrada.setDescricao("Compra");
    naturezaEntrada.setTipoMovimento(TipoMovimento.ENTRADA);
    naturezaEntrada.setExigeCliente(false);
    naturezaEntrada.setExigeValorUnitario(true);
    naturezaEntrada.setExigeStatus(false);

    naturezaSaida = new NaturezaOperacao();
    naturezaSaida.setId(2);
    naturezaSaida.setDescricao("Venda");
    naturezaSaida.setTipoMovimento(TipoMovimento.SAIDA);
    naturezaSaida.setExigeCliente(true);
    naturezaSaida.setExigeValorUnitario(true);
    naturezaSaida.setExigeStatus(true);

    Cliente cliente = new Cliente();
    cliente.setId(1);
    cliente.setTipoPessoa("PJ");
    cliente.setDocumento("12345678000100");
    cliente.setRazaoSocial("Empresa Teste Ltda");
    cliente.setNomeFantasia("Empresa Teste");
    cliente.setIsActive(true);

    pedido = new Pedido();
    pedido.setId(1);
    pedido.setNaturezaOperacao(naturezaEntrada);
    pedido.setCliente(cliente);
    pedido.setValorTotal(new BigDecimal("500.00"));
    pedido.setStatus("PAGO");
    pedido.setDataEmissao(LocalDateTime.of(2026, 3, 1, 10, 0));
  }

  // ========================================================================
  // processarMovimentacao
  // ========================================================================

  @Nested
  @DisplayName("processarMovimentacao")
  class ProcessarMovimentacao {

    @Test
    @DisplayName("ENTRADA deve adicionar quantidade ao estoque atual")
    void entradaDeveAdicionarAoEstoque() {
      BigDecimal quantidade = new BigDecimal("50.000");

      estoqueService.processarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      verify(produtoRepository).save(produtoCaptor.capture());
      Produto produtoSalvo = produtoCaptor.getValue();
      assertThat(produtoSalvo.getEstoqueAtual()).isEqualByComparingTo(new BigDecimal("150.000"));
    }

    @Test
    @DisplayName("SAIDA deve subtrair quantidade do estoque atual")
    void saidaDeveSubtrairDoEstoque() {
      BigDecimal quantidade = new BigDecimal("30.000");

      estoqueService.processarMovimentacao(produto, naturezaSaida, pedido, quantidade);

      verify(produtoRepository).save(produtoCaptor.capture());
      Produto produtoSalvo = produtoCaptor.getValue();
      assertThat(produtoSalvo.getEstoqueAtual()).isEqualByComparingTo(new BigDecimal("70.000"));
    }

    @Test
    @DisplayName("SAIDA deve permitir zerar o estoque")
    void saidaDevePermitirZerarEstoque() {
      BigDecimal quantidade = new BigDecimal("100.000");

      estoqueService.processarMovimentacao(produto, naturezaSaida, pedido, quantidade);

      verify(produtoRepository).save(produtoCaptor.capture());
      assertThat(produtoCaptor.getValue().getEstoqueAtual()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("SAIDA deve lancar excecao quando estoque insuficiente")
    void saidaDeveLancarExcecaoQuandoEstoqueInsuficiente() {
      BigDecimal quantidade = new BigDecimal("150.000");

      assertThatThrownBy(
          () -> estoqueService.processarMovimentacao(produto, naturezaSaida, pedido, quantidade))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Estoque físico insuficiente para o produto:")
          .hasMessageContaining("Tomate");

      verify(produtoRepository, never()).save(any());
      verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("deve salvar produto com estoque atualizado")
    void deveSalvarProdutoComEstoqueAtualizado() {
      BigDecimal quantidade = new BigDecimal("25.000");

      estoqueService.processarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      verify(produtoRepository).save(produto);
      assertThat(produto.getEstoqueAtual()).isEqualByComparingTo(new BigDecimal("125.000"));
    }

    @Test
    @DisplayName("deve salvar movimentacao com dados corretos")
    void deveSalvarMovimentacaoComDadosCorretos() {
      BigDecimal quantidade = new BigDecimal("50.000");

      estoqueService.processarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      verify(movimentacaoRepository).save(movimentacaoCaptor.capture());
      MovimentacaoEstoque movSalva = movimentacaoCaptor.getValue();

      assertThat(movSalva.getProduto()).isEqualTo(produto);
      assertThat(movSalva.getNaturezaOperacao()).isEqualTo(naturezaEntrada);
      assertThat(movSalva.getPedido()).isEqualTo(pedido);
      assertThat(movSalva.getQuantidade()).isEqualByComparingTo(new BigDecimal("50.000"));
      assertThat(movSalva.getEstoqueAposMovimentacao())
          .isEqualByComparingTo(new BigDecimal("150.000"));
    }

    @Test
    @DisplayName("movimentacao de SAIDA deve registrar quantidade positiva e estoque correto")
    void saidaDeveRegistrarQuantidadePositiva() {
      BigDecimal quantidade = new BigDecimal("30.000");

      estoqueService.processarMovimentacao(produto, naturezaSaida, pedido, quantidade);

      verify(movimentacaoRepository).save(movimentacaoCaptor.capture());
      MovimentacaoEstoque movSalva = movimentacaoCaptor.getValue();

      assertThat(movSalva.getQuantidade()).isEqualByComparingTo(new BigDecimal("30.000"));
      assertThat(movSalva.getEstoqueAposMovimentacao())
          .isEqualByComparingTo(new BigDecimal("70.000"));
      assertThat(movSalva.getNaturezaOperacao()).isEqualTo(naturezaSaida);
    }

    @Test
    @DisplayName("deve salvar produto antes da movimentacao")
    void deveSalvarProdutoAntesDeMovimentacao() {
      BigDecimal quantidade = new BigDecimal("10.000");
      var inOrder = inOrder(produtoRepository, movimentacaoRepository);

      estoqueService.processarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      inOrder.verify(produtoRepository).save(produto);
      inOrder.verify(movimentacaoRepository).save(any(MovimentacaoEstoque.class));
    }
  }

  // ========================================================================
  // estornarMovimentacao
  // ========================================================================

  @Nested
  @DisplayName("estornarMovimentacao")
  class EstornarMovimentacao {

    @Test
    @DisplayName("estorno de ENTRADA deve subtrair quantidade do estoque")
    void estornoEntradaDeveSubtrairDoEstoque() {
      BigDecimal quantidade = new BigDecimal("40.000");

      estoqueService.estornarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      verify(produtoRepository).save(produtoCaptor.capture());
      assertThat(produtoCaptor.getValue().getEstoqueAtual())
          .isEqualByComparingTo(new BigDecimal("60.000"));
    }

    @Test
    @DisplayName("estorno de SAIDA deve adicionar quantidade ao estoque")
    void estornoSaidaDeveAdicionarAoEstoque() {
      BigDecimal quantidade = new BigDecimal("25.000");

      estoqueService.estornarMovimentacao(produto, naturezaSaida, pedido, quantidade);

      verify(produtoRepository).save(produtoCaptor.capture());
      assertThat(produtoCaptor.getValue().getEstoqueAtual())
          .isEqualByComparingTo(new BigDecimal("125.000"));
    }

    @Test
    @DisplayName("estorno de ENTRADA deve permitir zerar o estoque")
    void estornoEntradaDevePermitirZerarEstoque() {
      BigDecimal quantidade = new BigDecimal("100.000");

      estoqueService.estornarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      verify(produtoRepository).save(produtoCaptor.capture());
      assertThat(produtoCaptor.getValue().getEstoqueAtual()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("estorno de ENTRADA deve lancar excecao quando estoque insuficiente")
    void estornoEntradaDeveLancarExcecaoQuandoEstoqueInsuficiente() {
      BigDecimal quantidade = new BigDecimal("150.000");

      assertThatThrownBy(
          () -> estoqueService.estornarMovimentacao(produto, naturezaEntrada, pedido, quantidade))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Estoque físico insuficiente para estornar a entrada do produto:")
          .hasMessageContaining("Tomate");

      verify(produtoRepository, never()).save(any());
      verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("deve salvar movimentacao com quantidade negada para estorno")
    void deveSalvarMovimentacaoComQuantidadeNegada() {
      BigDecimal quantidade = new BigDecimal("40.000");

      estoqueService.estornarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      verify(movimentacaoRepository).save(movimentacaoCaptor.capture());
      MovimentacaoEstoque movSalva = movimentacaoCaptor.getValue();

      assertThat(movSalva.getQuantidade()).isEqualByComparingTo(new BigDecimal("-40.000"));
      assertThat(movSalva.getEstoqueAposMovimentacao())
          .isEqualByComparingTo(new BigDecimal("60.000"));
    }

    @Test
    @DisplayName("estorno de SAIDA deve salvar movimentacao com quantidade negada")
    void estornoSaidaDeveSalvarQuantidadeNegada() {
      BigDecimal quantidade = new BigDecimal("25.000");

      estoqueService.estornarMovimentacao(produto, naturezaSaida, pedido, quantidade);

      verify(movimentacaoRepository).save(movimentacaoCaptor.capture());
      MovimentacaoEstoque movSalva = movimentacaoCaptor.getValue();

      assertThat(movSalva.getQuantidade()).isEqualByComparingTo(new BigDecimal("-25.000"));
      assertThat(movSalva.getEstoqueAposMovimentacao())
          .isEqualByComparingTo(new BigDecimal("125.000"));
    }

    @Test
    @DisplayName("deve salvar movimentacao com dados corretos no estorno")
    void deveSalvarMovimentacaoComDadosCorretos() {
      BigDecimal quantidade = new BigDecimal("20.000");

      estoqueService.estornarMovimentacao(produto, naturezaSaida, pedido, quantidade);

      verify(movimentacaoRepository).save(movimentacaoCaptor.capture());
      MovimentacaoEstoque movSalva = movimentacaoCaptor.getValue();

      assertThat(movSalva.getProduto()).isEqualTo(produto);
      assertThat(movSalva.getNaturezaOperacao()).isEqualTo(naturezaSaida);
      assertThat(movSalva.getPedido()).isEqualTo(pedido);
    }

    @Test
    @DisplayName("deve salvar produto antes da movimentacao no estorno")
    void deveSalvarProdutoAntesDeMovimentacao() {
      BigDecimal quantidade = new BigDecimal("10.000");
      var inOrder = inOrder(produtoRepository, movimentacaoRepository);

      estoqueService.estornarMovimentacao(produto, naturezaEntrada, pedido, quantidade);

      inOrder.verify(produtoRepository).save(produto);
      inOrder.verify(movimentacaoRepository).save(any(MovimentacaoEstoque.class));
    }
  }

  // ========================================================================
  // listarProdutosComEstoque
  // ========================================================================

  @Nested
  @DisplayName("listarProdutosComEstoque")
  class ListarProdutosComEstoque {

    @Test
    @DisplayName("deve retornar lista mapeada de produtos ativos")
    void deveRetornarListaMapeadaDeProdutosAtivos() {
      Produto produto2 = new Produto();
      produto2.setId(2);
      produto2.setCodigo("PROD-002");
      produto2.setDescricao("Cebola");
      produto2.setUnidadeMedida(unidadeMedida);
      produto2.setEstoqueAtual(new BigDecimal("200.000"));
      produto2.setIsActive(true);

      when(produtoRepository.findAllByIsActiveTrue()).thenReturn(List.of(produto, produto2));

      List<ProdutoEstoqueResponse> resultado = estoqueService.listarProdutosComEstoque();

      assertThat(resultado).hasSize(2);

      ProdutoEstoqueResponse primeiro = resultado.getFirst();
      assertThat(primeiro.getId()).isEqualTo(1);
      assertThat(primeiro.getCodigo()).isEqualTo("PROD-001");
      assertThat(primeiro.getDescricao()).isEqualTo("Tomate");
      assertThat(primeiro.getUnidadeMedidaSigla()).isEqualTo("KG");
      assertThat(primeiro.getEstoqueAtual()).isEqualByComparingTo(new BigDecimal("100.000"));
      assertThat(primeiro.getIsActive()).isTrue();

      ProdutoEstoqueResponse segundo = resultado.getLast();
      assertThat(segundo.getId()).isEqualTo(2);
      assertThat(segundo.getCodigo()).isEqualTo("PROD-002");
      assertThat(segundo.getDescricao()).isEqualTo("Cebola");
      assertThat(segundo.getUnidadeMedidaSigla()).isEqualTo("KG");
      assertThat(segundo.getEstoqueAtual()).isEqualByComparingTo(new BigDecimal("200.000"));
      assertThat(segundo.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("deve retornar lista vazia quando nao ha produtos ativos")
    void deveRetornarListaVaziaQuandoNaoHaProdutosAtivos() {
      when(produtoRepository.findAllByIsActiveTrue()).thenReturn(Collections.emptyList());

      List<ProdutoEstoqueResponse> resultado = estoqueService.listarProdutosComEstoque();

      assertThat(resultado).isEmpty();
    }

    @Test
    @DisplayName("deve mapear sigla da unidade de medida corretamente")
    void deveMapearSiglaUnidadeMedidaCorretamente() {
      UnidadeMedida outraUnidade = new UnidadeMedida();
      outraUnidade.setId(2);
      outraUnidade.setSigla("UN");
      outraUnidade.setDescricao("Unidade");
      outraUnidade.setIsActive(true);

      Produto produtoUnidade = new Produto();
      produtoUnidade.setId(3);
      produtoUnidade.setCodigo("PROD-003");
      produtoUnidade.setDescricao("Alface");
      produtoUnidade.setUnidadeMedida(outraUnidade);
      produtoUnidade.setEstoqueAtual(new BigDecimal("50.000"));
      produtoUnidade.setIsActive(true);

      when(produtoRepository.findAllByIsActiveTrue()).thenReturn(List.of(produtoUnidade));

      List<ProdutoEstoqueResponse> resultado = estoqueService.listarProdutosComEstoque();

      assertThat(resultado).hasSize(1);
      assertThat(resultado.getFirst().getUnidadeMedidaSigla()).isEqualTo("UN");
    }

    @Test
    @DisplayName("deve chamar findAllByIsActiveTrue do repositorio")
    void deveChamarRepositorio() {
      when(produtoRepository.findAllByIsActiveTrue()).thenReturn(Collections.emptyList());

      estoqueService.listarProdutosComEstoque();

      verify(produtoRepository).findAllByIsActiveTrue();
    }
  }

  // ========================================================================
  // getTimelineProduto
  // ========================================================================

  @Nested
  @DisplayName("getTimelineProduto")
  class GetTimelineProduto {

    @Test
    @DisplayName("deve retornar timeline de movimentacoes do produto")
    void deveRetornarTimelineDosProdutos() {
      LocalDateTime dataMovimentacao = LocalDateTime.of(2026, 3, 1, 14, 30);

      MovimentacaoEstoque mov = new MovimentacaoEstoque();
      mov.setId(10);
      mov.setProduto(produto);
      mov.setNaturezaOperacao(naturezaEntrada);
      mov.setPedido(pedido);
      mov.setQuantidade(new BigDecimal("50.000"));
      mov.setEstoqueAposMovimentacao(new BigDecimal("150.000"));
      mov.setDataMovimentacao(dataMovimentacao);

      when(produtoRepository.existsById(1)).thenReturn(true);
      when(movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(1))
          .thenReturn(List.of(mov));

      List<MovimentacaoEstoqueResponse> resultado = estoqueService.getTimelineProduto(1);

      assertThat(resultado).hasSize(1);
      MovimentacaoEstoqueResponse response = resultado.getFirst();
      assertThat(response.getId()).isEqualTo(10);
      assertThat(response.getProdutoId()).isEqualTo(1);
      assertThat(response.getProdutoDescricao()).isEqualTo("Tomate");
      assertThat(response.getNaturezaOperacaoDescricao()).isEqualTo("Compra");
      assertThat(response.getTipoMovimento()).isEqualTo("ENTRADA");
      assertThat(response.getPedidoId()).isEqualTo(1);
      assertThat(response.getQuantidade()).isEqualByComparingTo(new BigDecimal("50.000"));
      assertThat(response.getEstoqueAposMovimentacao())
          .isEqualByComparingTo(new BigDecimal("150.000"));
      assertThat(response.getDataMovimentacao()).isEqualTo(dataMovimentacao);
    }

    @Test
    @DisplayName("deve retornar timeline com pedidoId null quando movimentacao sem pedido")
    void deveRetornarPedidoIdNullQuandoSemPedido() {
      MovimentacaoEstoque mov = new MovimentacaoEstoque();
      mov.setId(11);
      mov.setProduto(produto);
      mov.setNaturezaOperacao(naturezaEntrada);
      mov.setPedido(null);
      mov.setQuantidade(new BigDecimal("10.000"));
      mov.setEstoqueAposMovimentacao(new BigDecimal("110.000"));
      mov.setDataMovimentacao(LocalDateTime.now());

      when(produtoRepository.existsById(1)).thenReturn(true);
      when(movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(1))
          .thenReturn(List.of(mov));

      List<MovimentacaoEstoqueResponse> resultado = estoqueService.getTimelineProduto(1);

      assertThat(resultado).hasSize(1);
      assertThat(resultado.getFirst().getPedidoId()).isNull();
    }

    @Test
    @DisplayName("deve retornar lista vazia quando produto nao tem movimentacoes")
    void deveRetornarListaVaziaQuandoSemMovimentacoes() {
      when(produtoRepository.existsById(1)).thenReturn(true);
      when(movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(1))
          .thenReturn(Collections.emptyList());

      List<MovimentacaoEstoqueResponse> resultado = estoqueService.getTimelineProduto(1);

      assertThat(resultado).isEmpty();
    }

    @Test
    @DisplayName("deve lancar ResponseStatusException quando produto nao encontrado")
    void deveLancarExcecaoQuandoProdutoNaoEncontrado() {
      when(produtoRepository.existsById(999)).thenReturn(false);

      assertThatThrownBy(() -> estoqueService.getTimelineProduto(999))
          .isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("Produto não encontrado");

      verify(movimentacaoRepository, never()).findByProdutoIdOrderByDataMovimentacaoDesc(any());
    }

    @Test
    @DisplayName("deve retornar multiplas movimentacoes ordenadas")
    void deveRetornarMultiplasMovimentacoes() {
      MovimentacaoEstoque mov1 = new MovimentacaoEstoque();
      mov1.setId(10);
      mov1.setProduto(produto);
      mov1.setNaturezaOperacao(naturezaEntrada);
      mov1.setPedido(pedido);
      mov1.setQuantidade(new BigDecimal("50.000"));
      mov1.setEstoqueAposMovimentacao(new BigDecimal("150.000"));
      mov1.setDataMovimentacao(LocalDateTime.of(2026, 3, 2, 10, 0));

      MovimentacaoEstoque mov2 = new MovimentacaoEstoque();
      mov2.setId(9);
      mov2.setProduto(produto);
      mov2.setNaturezaOperacao(naturezaSaida);
      mov2.setPedido(pedido);
      mov2.setQuantidade(new BigDecimal("20.000"));
      mov2.setEstoqueAposMovimentacao(new BigDecimal("100.000"));
      mov2.setDataMovimentacao(LocalDateTime.of(2026, 3, 1, 10, 0));

      when(produtoRepository.existsById(1)).thenReturn(true);
      when(movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(1))
          .thenReturn(List.of(mov1, mov2));

      List<MovimentacaoEstoqueResponse> resultado = estoqueService.getTimelineProduto(1);

      assertThat(resultado).hasSize(2);
      assertThat(resultado.getFirst().getId()).isEqualTo(10);
      assertThat(resultado.getFirst().getTipoMovimento()).isEqualTo("ENTRADA");
      assertThat(resultado.getLast().getId()).isEqualTo(9);
      assertThat(resultado.getLast().getTipoMovimento()).isEqualTo("SAIDA");
    }
  }

  // ========================================================================
  // getDetalheMovimentacao
  // ========================================================================

  @Nested
  @DisplayName("getDetalheMovimentacao")
  class GetDetalheMovimentacao {

    @Test
    @DisplayName("deve retornar detalhe completo com pedido e itens")
    void deveRetornarDetalheCompletoComPedidoEItens() {
      LocalDateTime dataMovimentacao = LocalDateTime.of(2026, 3, 1, 14, 30);

      MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
      movimentacao.setId(10);
      movimentacao.setProduto(produto);
      movimentacao.setNaturezaOperacao(naturezaEntrada);
      movimentacao.setPedido(pedido);
      movimentacao.setQuantidade(new BigDecimal("50.000"));
      movimentacao.setEstoqueAposMovimentacao(new BigDecimal("150.000"));
      movimentacao.setDataMovimentacao(dataMovimentacao);

      Produto outroProduto = new Produto();
      outroProduto.setId(2);
      outroProduto.setCodigo("PROD-002");
      outroProduto.setDescricao("Cebola");
      outroProduto.setUnidadeMedida(unidadeMedida);

      ItemPedido item1 = new ItemPedido();
      item1.setId(100);
      item1.setPedido(pedido);
      item1.setProduto(produto);
      item1.setQuantidade(new BigDecimal("50.000"));
      item1.setValorUnitario(new BigDecimal("5.00"));
      item1.setValorTotal(new BigDecimal("250.00"));

      ItemPedido item2 = new ItemPedido();
      item2.setId(101);
      item2.setPedido(pedido);
      item2.setProduto(outroProduto);
      item2.setQuantidade(new BigDecimal("30.000"));
      item2.setValorUnitario(new BigDecimal("8.33"));
      item2.setValorTotal(new BigDecimal("250.00"));

      when(movimentacaoRepository.findById(10)).thenReturn(Optional.of(movimentacao));
      when(itemPedidoRepository.findByPedido(pedido)).thenReturn(List.of(item1, item2));

      DetalheMovimentacaoResponse resultado = estoqueService.getDetalheMovimentacao(10);

      // Verify movimentacao response
      assertThat(resultado.getMovimentacao()).isNotNull();
      assertThat(resultado.getMovimentacao().getId()).isEqualTo(10);
      assertThat(resultado.getMovimentacao().getProdutoId()).isEqualTo(1);
      assertThat(resultado.getMovimentacao().getProdutoDescricao()).isEqualTo("Tomate");
      assertThat(resultado.getMovimentacao().getNaturezaOperacaoDescricao()).isEqualTo("Compra");
      assertThat(resultado.getMovimentacao().getTipoMovimento()).isEqualTo("ENTRADA");
      assertThat(resultado.getMovimentacao().getPedidoId()).isEqualTo(1);
      assertThat(resultado.getMovimentacao().getQuantidade())
          .isEqualByComparingTo(new BigDecimal("50.000"));
      assertThat(resultado.getMovimentacao().getEstoqueAposMovimentacao())
          .isEqualByComparingTo(new BigDecimal("150.000"));
      assertThat(resultado.getMovimentacao().getDataMovimentacao()).isEqualTo(dataMovimentacao);

      // Verify pedido response
      assertThat(resultado.getPedido()).isNotNull();
      assertThat(resultado.getPedido().getId()).isEqualTo(1);
      assertThat(resultado.getPedido().getNaturezaOperacao()).isEqualTo("Compra");
      assertThat(resultado.getPedido().getClienteNome()).isEqualTo("Empresa Teste Ltda");
      assertThat(resultado.getPedido().getValorTotal())
          .isEqualByComparingTo(new BigDecimal("500.00"));
      assertThat(resultado.getPedido().getStatus()).isEqualTo("PAGO");
      assertThat(resultado.getPedido().getDataEmissao())
          .isEqualTo(LocalDateTime.of(2026, 3, 1, 10, 0));

      // Verify itens
      assertThat(resultado.getItens()).hasSize(2);

      ItemPedidoResumidoResponse itemResp1 = resultado.getItens().getFirst();
      assertThat(itemResp1.getId()).isEqualTo(100);
      assertThat(itemResp1.getProdutoId()).isEqualTo(1);
      assertThat(itemResp1.getProdutoDescricao()).isEqualTo("Tomate");
      assertThat(itemResp1.getQuantidade()).isEqualByComparingTo(new BigDecimal("50.000"));
      assertThat(itemResp1.getValorUnitario()).isEqualByComparingTo(new BigDecimal("5.00"));
      assertThat(itemResp1.getValorTotal()).isEqualByComparingTo(new BigDecimal("250.00"));
      assertThat(itemResp1.getIsDestacado()).isTrue();

      ItemPedidoResumidoResponse itemResp2 = resultado.getItens().getLast();
      assertThat(itemResp2.getId()).isEqualTo(101);
      assertThat(itemResp2.getProdutoId()).isEqualTo(2);
      assertThat(itemResp2.getProdutoDescricao()).isEqualTo("Cebola");
      assertThat(itemResp2.getIsDestacado()).isFalse();
    }

    @Test
    @DisplayName("deve retornar pedido null e itens vazio quando movimentacao sem pedido")
    void deveRetornarPedidoNullQuandoSemPedido() {
      MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
      movimentacao.setId(10);
      movimentacao.setProduto(produto);
      movimentacao.setNaturezaOperacao(naturezaEntrada);
      movimentacao.setPedido(null);
      movimentacao.setQuantidade(new BigDecimal("50.000"));
      movimentacao.setEstoqueAposMovimentacao(new BigDecimal("150.000"));
      movimentacao.setDataMovimentacao(LocalDateTime.now());

      when(movimentacaoRepository.findById(10)).thenReturn(Optional.of(movimentacao));

      DetalheMovimentacaoResponse resultado = estoqueService.getDetalheMovimentacao(10);

      assertThat(resultado.getMovimentacao()).isNotNull();
      assertThat(resultado.getPedido()).isNull();
      assertThat(resultado.getItens()).isEmpty();
      verify(itemPedidoRepository, never()).findByPedido(any());
    }

    @Test
    @DisplayName("deve retornar clienteNome null quando pedido sem cliente")
    void deveRetornarClienteNomeNullQuandoSemCliente() {
      Pedido pedidoSemCliente = new Pedido();
      pedidoSemCliente.setId(2);
      pedidoSemCliente.setNaturezaOperacao(naturezaEntrada);
      pedidoSemCliente.setCliente(null);
      pedidoSemCliente.setValorTotal(new BigDecimal("300.00"));
      pedidoSemCliente.setStatus("PENDENTE");
      pedidoSemCliente.setDataEmissao(LocalDateTime.of(2026, 3, 1, 12, 0));

      MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
      movimentacao.setId(11);
      movimentacao.setProduto(produto);
      movimentacao.setNaturezaOperacao(naturezaEntrada);
      movimentacao.setPedido(pedidoSemCliente);
      movimentacao.setQuantidade(new BigDecimal("30.000"));
      movimentacao.setEstoqueAposMovimentacao(new BigDecimal("130.000"));
      movimentacao.setDataMovimentacao(LocalDateTime.now());

      when(movimentacaoRepository.findById(11)).thenReturn(Optional.of(movimentacao));
      when(itemPedidoRepository.findByPedido(pedidoSemCliente)).thenReturn(Collections.emptyList());

      DetalheMovimentacaoResponse resultado = estoqueService.getDetalheMovimentacao(11);

      assertThat(resultado.getPedido()).isNotNull();
      assertThat(resultado.getPedido().getClienteNome()).isNull();
      assertThat(resultado.getPedido().getId()).isEqualTo(2);
      assertThat(resultado.getPedido().getStatus()).isEqualTo("PENDENTE");
    }

    @Test
    @DisplayName("deve lancar ResponseStatusException quando movimentacao nao encontrada")
    void deveLancarExcecaoQuandoMovimentacaoNaoEncontrada() {
      when(movimentacaoRepository.findById(999)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> estoqueService.getDetalheMovimentacao(999))
          .isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("Movimentação não encontrada");

      verify(itemPedidoRepository, never()).findByPedido(any());
    }

    @Test
    @DisplayName("deve marcar isDestacado corretamente para o produto da movimentacao")
    void deveMarcarIsDestacadoCorretamente() {
      Produto produtoMovimentado = new Produto();
      produtoMovimentado.setId(5);
      produtoMovimentado.setCodigo("PROD-005");
      produtoMovimentado.setDescricao("Batata");
      produtoMovimentado.setUnidadeMedida(unidadeMedida);

      Produto outroProduto = new Produto();
      outroProduto.setId(6);
      outroProduto.setCodigo("PROD-006");
      outroProduto.setDescricao("Cenoura");
      outroProduto.setUnidadeMedida(unidadeMedida);

      MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
      movimentacao.setId(20);
      movimentacao.setProduto(produtoMovimentado);
      movimentacao.setNaturezaOperacao(naturezaSaida);
      movimentacao.setPedido(pedido);
      movimentacao.setQuantidade(new BigDecimal("10.000"));
      movimentacao.setEstoqueAposMovimentacao(new BigDecimal("40.000"));
      movimentacao.setDataMovimentacao(LocalDateTime.now());

      ItemPedido itemDestacado = new ItemPedido();
      itemDestacado.setId(200);
      itemDestacado.setPedido(pedido);
      itemDestacado.setProduto(produtoMovimentado);
      itemDestacado.setQuantidade(new BigDecimal("10.000"));
      itemDestacado.setValorUnitario(new BigDecimal("3.00"));
      itemDestacado.setValorTotal(new BigDecimal("30.00"));

      ItemPedido itemNaoDestacado = new ItemPedido();
      itemNaoDestacado.setId(201);
      itemNaoDestacado.setPedido(pedido);
      itemNaoDestacado.setProduto(outroProduto);
      itemNaoDestacado.setQuantidade(new BigDecimal("5.000"));
      itemNaoDestacado.setValorUnitario(new BigDecimal("4.00"));
      itemNaoDestacado.setValorTotal(new BigDecimal("20.00"));

      when(movimentacaoRepository.findById(20)).thenReturn(Optional.of(movimentacao));
      when(itemPedidoRepository.findByPedido(pedido))
          .thenReturn(List.of(itemDestacado, itemNaoDestacado));

      DetalheMovimentacaoResponse resultado = estoqueService.getDetalheMovimentacao(20);

      assertThat(resultado.getItens()).hasSize(2);
      assertThat(resultado.getItens().getFirst().getIsDestacado()).isTrue();
      assertThat(resultado.getItens().getFirst().getProdutoId()).isEqualTo(5);
      assertThat(resultado.getItens().getLast().getIsDestacado()).isFalse();
      assertThat(resultado.getItens().getLast().getProdutoId()).isEqualTo(6);
    }

    @Test
    @DisplayName("deve retornar itens vazio quando pedido nao tem itens")
    void deveRetornarItensVazioQuandoPedidoSemItens() {
      MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
      movimentacao.setId(12);
      movimentacao.setProduto(produto);
      movimentacao.setNaturezaOperacao(naturezaEntrada);
      movimentacao.setPedido(pedido);
      movimentacao.setQuantidade(new BigDecimal("10.000"));
      movimentacao.setEstoqueAposMovimentacao(new BigDecimal("110.000"));
      movimentacao.setDataMovimentacao(LocalDateTime.now());

      when(movimentacaoRepository.findById(12)).thenReturn(Optional.of(movimentacao));
      when(itemPedidoRepository.findByPedido(pedido)).thenReturn(Collections.emptyList());

      DetalheMovimentacaoResponse resultado = estoqueService.getDetalheMovimentacao(12);

      assertThat(resultado.getMovimentacao()).isNotNull();
      assertThat(resultado.getPedido()).isNotNull();
      assertThat(resultado.getItens()).isEmpty();
    }

    @Test
    @DisplayName("movimentacao de SAIDA deve mapear tipoMovimento como SAIDA no response")
    void deveMapearTipoMovimentoCorretamente() {
      MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
      movimentacao.setId(13);
      movimentacao.setProduto(produto);
      movimentacao.setNaturezaOperacao(naturezaSaida);
      movimentacao.setPedido(pedido);
      movimentacao.setQuantidade(new BigDecimal("20.000"));
      movimentacao.setEstoqueAposMovimentacao(new BigDecimal("80.000"));
      movimentacao.setDataMovimentacao(LocalDateTime.now());

      when(movimentacaoRepository.findById(13)).thenReturn(Optional.of(movimentacao));
      when(itemPedidoRepository.findByPedido(pedido)).thenReturn(Collections.emptyList());

      DetalheMovimentacaoResponse resultado = estoqueService.getDetalheMovimentacao(13);

      assertThat(resultado.getMovimentacao().getTipoMovimento()).isEqualTo("SAIDA");
      assertThat(resultado.getMovimentacao().getNaturezaOperacaoDescricao()).isEqualTo("Venda");
    }
  }
}
