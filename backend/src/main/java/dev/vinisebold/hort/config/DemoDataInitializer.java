package dev.vinisebold.hort.config;

import dev.vinisebold.hort.dto.request.ItemPedidoRequest;
import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.model.Cliente;
import dev.vinisebold.hort.model.ConfiguracoesSistema;
import dev.vinisebold.hort.model.Produto;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.model.Usuario;
import dev.vinisebold.hort.repository.ClienteRepository;
import dev.vinisebold.hort.repository.ConfiguracoesSistemaRepository;
import dev.vinisebold.hort.repository.ProdutoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import dev.vinisebold.hort.repository.UsuarioRepository;
import dev.vinisebold.hort.service.PedidoService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Carga de dados de demonstração (loja de hortifrúti fictícia, ~30 dias de movimento).
 *
 * <p>Só roda com o profile {@code demo} e apenas se o banco estiver vazio. Usa os mesmos serviços
 * da aplicação (compras, vendas, quebras), então lotes FIFO, estoque e custos saem consistentes. As
 * datas são retroativas para o dashboard ter histórico.
 *
 * <p>Login de demonstração: {@code demo@hort.dev} / {@code demo1234}.
 */
@Slf4j
@Component
@Profile("demo")
public class DemoDataInitializer implements ApplicationRunner {

  private static final int NATUREZA_VENDA = 1;
  private static final int NATUREZA_COMPRA = 2;
  private static final int NATUREZA_QUEBRA = 3;
  private static final DateTimeFormatter SQL_DATE =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

  private static final String DEMO_EMAIL = "demo@hort.dev";
  private static final String DEMO_SENHA = "demo1234";
  // CNPJ de exemplo da documentação da BrasilAPI (Open Knowledge Brasil).
  private static final String DEMO_CNPJ = "19131243000197";

  private final ProdutoRepository produtoRepository;
  private final ClienteRepository clienteRepository;
  private final UnidadeMedidaRepository unidadeMedidaRepository;
  private final UsuarioRepository usuarioRepository;
  private final ConfiguracoesSistemaRepository configuracoesRepository;
  private final PedidoService pedidoService;
  private final PasswordEncoder passwordEncoder;
  private final JdbcTemplate jdbc;

  public DemoDataInitializer(ProdutoRepository produtoRepository,
      ClienteRepository clienteRepository, UnidadeMedidaRepository unidadeMedidaRepository,
      UsuarioRepository usuarioRepository, ConfiguracoesSistemaRepository configuracoesRepository,
      PedidoService pedidoService, PasswordEncoder passwordEncoder, JdbcTemplate jdbc) {
    this.produtoRepository = produtoRepository;
    this.clienteRepository = clienteRepository;
    this.unidadeMedidaRepository = unidadeMedidaRepository;
    this.usuarioRepository = usuarioRepository;
    this.configuracoesRepository = configuracoesRepository;
    this.pedidoService = pedidoService;
    this.passwordEncoder = passwordEncoder;
    this.jdbc = jdbc;
  }

  /** Produto da demo: preço de compra/venda e quantidades das compras (por dia atrás). */
  private record Item(String codigo, String descricao, String unidade, double precoVenda,
      boolean inteiro) {
  }

  /** Compra: dias atrás, índice do produto, quantidade, custo unitário. */
  private record Compra(int dias, int produto, double qtd, double custo) {
  }

  @Override
  public void run(ApplicationArguments args) {
    if (produtoRepository.count() > 0) {
      log.info("Demo: banco já possui produtos, seed ignorado.");
      return;
    }
    log.info("Demo: carregando dados de demonstração...");

    criarUsuarioEConfiguracao();

    List<Item> itens = List.of(
        new Item("TOM-001", "Tomate Italiano", "KG", 8.90, false),
        new Item("BAN-001", "Banana Prata", "KG", 6.50, false),
        new Item("ALF-001", "Alface Crespa", "UN", 3.50, true),
        new Item("BAT-001", "Batata Inglesa (saco 20kg)", "SACO", 95.00, true),
        new Item("CEB-001", "Cebola Amarela", "KG", 6.90, false),
        new Item("MAC-001", "Maçã Gala", "KG", 12.90, false),
        new Item("LAR-001", "Laranja Pera", "KG", 5.50, false),
        new Item("CEN-001", "Cenoura", "KG", 6.20, false));

    List<Produto> produtos = new ArrayList<>();
    for (Item item : itens) {
      Produto p = new Produto();
      p.setCodigo(item.codigo());
      p.setDescricao(item.descricao());
      p.setUnidadeMedida(unidade(item.unidade()));
      produtos.add(produtoRepository.save(p));
    }

    List<Cliente> clientes = criarClientes();
    // Clientes que compram "no fiado" (viram saldo pendente).
    List<Cliente> clientesFiado = clientes.subList(0, 3);

    // Compras: o mesmo produto com custos diferentes em datas diferentes (mostra o FIFO).
    List<Compra> compras = List.of(
        new Compra(28, 0, 120, 4.20), new Compra(28, 1, 90, 3.10), new Compra(28, 2, 150, 1.40),
        new Compra(28, 3, 40, 55.00), new Compra(28, 4, 80, 3.50), new Compra(28, 5, 100, 6.80),
        new Compra(28, 6, 150, 2.60), new Compra(28, 7, 70, 3.00),
        new Compra(14, 0, 100, 5.10), new Compra(14, 1, 80, 3.60), new Compra(14, 2, 120, 1.55),
        new Compra(14, 5, 80, 7.40), new Compra(14, 4, 60, 3.90),
        new Compra(5, 0, 80, 4.80), new Compra(5, 3, 30, 58.00), new Compra(5, 6, 100, 2.90));

    Map<Integer, Double> estoque = new HashMap<>();
    Random rnd = new Random(7);
    LocalDateTime agora = LocalDateTime.now();

    for (int dia = 28; dia >= 0; dia--) {
      final int d = dia;

      for (Compra c : compras) {
        if (c.dias() != d) {
          continue;
        }
        PedidoRequest req = pedido(NATUREZA_COMPRA, null, null, null);
        req.setItens(List.of(item(produtos.get(c.produto()), c.qtd(), c.custo())));
        registrar(req, momento(agora, d, 7, rnd.nextInt(50)));
        estoque.merge(c.produto(), c.qtd(), Double::sum);
      }

      // Quebras pontuais (perda de mercadoria).
      if (d == 20) {
        quebra(produtos, estoque, 1, 4, momento(agora, d, 16, 10));
      } else if (d == 9) {
        quebra(produtos, estoque, 2, 10, momento(agora, d, 17, 20));
      } else if (d == 3) {
        quebra(produtos, estoque, 0, 6, momento(agora, d, 16, 40));
      }

      if (d > 27) {
        continue; // primeiro dia só tem compras
      }
      int vendasDoDia = d % 6 == 0 ? 0 : 1 + rnd.nextInt(3);
      for (int v = 0; v < vendasDoDia; v++) {
        List<ItemPedidoRequest> venda = new ArrayList<>();
        int qtdItens = 1 + rnd.nextInt(3);
        List<Integer> escolhidos = new ArrayList<>();
        for (int k = 0; k < qtdItens; k++) {
          int idx = rnd.nextInt(produtos.size());
          if (escolhidos.contains(idx) || estoque.getOrDefault(idx, 0.0) < 2) {
            continue;
          }
          escolhidos.add(idx);
          Item meta = itens.get(idx);
          double max = Math.min(estoque.get(idx), meta.inteiro() ? 6 : 15);
          double qtd = meta.inteiro() ? 1 + rnd.nextInt((int) max)
              : Math.max(1, Math.round(rnd.nextDouble() * max * 2) / 2.0);
          qtd = Math.min(qtd, estoque.get(idx));
          venda.add(item(produtos.get(idx), qtd, meta.precoVenda()));
          estoque.merge(idx, -qtd, Double::sum);
        }
        if (venda.isEmpty()) {
          continue;
        }
        boolean fiado = rnd.nextInt(100) < 30;
        Cliente cliente = fiado ? clientesFiado.get(rnd.nextInt(clientesFiado.size()))
            : clientes.get(rnd.nextInt(clientes.size()));
        PedidoRequest req = pedido(NATUREZA_VENDA, cliente.getId(),
            fiado ? "Caderneta " + (d + 1) + "-" + (v + 1) : null, fiado ? "PENDENTE" : "PAGO");
        req.setItens(venda);
        registrar(req, momento(agora, d, 9 + v * 3, rnd.nextInt(50)));
      }
    }

    // Clientes cadastrados "há um mês" para o histórico fazer sentido.
    jdbc.update("UPDATE cliente SET created_at = ?, saldo_credito = COALESCE(saldo_credito, 0)",
        agora.minusDays(30).format(SQL_DATE));
    jdbc.update("UPDATE produto SET created_at = ?", agora.minusDays(30).format(SQL_DATE));

    log.info("Demo: pronto. Login {} / {}", DEMO_EMAIL, DEMO_SENHA);
  }

  private void criarUsuarioEConfiguracao() {
    if (usuarioRepository.findByEmail(DEMO_EMAIL).isEmpty()) {
      Usuario u = new Usuario();
      u.setEmail(DEMO_EMAIL);
      u.setSenhaHash(passwordEncoder.encode(DEMO_SENHA));
      u.setCnpj(DEMO_CNPJ);
      u.setRazaoSocial("OPEN KNOWLEDGE BRASIL");
      u.setNomeFantasia("Hortifruti Demo");
      u.setIsActive(true);
      usuarioRepository.save(u);
    }
    if (configuracoesRepository.findAll().isEmpty()) {
      ConfiguracoesSistema c = new ConfiguracoesSistema();
      c.setSenhaMasterHash(passwordEncoder.encode(DEMO_SENHA));
      c.setNomeNegocio("Hortifruti Demo");
      configuracoesRepository.save(c);
    }
  }

  private List<Cliente> criarClientes() {
    String[][] dados = {
        {"FISICA", "Maria das Graças", "Rua das Flores, 120", "(47) 99999-0001"},
        {"JURIDICA", "Restaurante Sabor da Terra Ltda", "Av. Central, 800", "(47) 3333-0002"},
        {"FISICA", "João Pereira", "Rua XV de Novembro, 45", "(47) 99999-0003"},
        {"JURIDICA", "Mercadinho Bom Preço ME", "Rua do Comércio, 310", "(47) 3333-0004"},
        {"FISICA", "Ana Clara Souza", "Rua Bahia, 77", "(47) 99999-0005"},
        {"JURIDICA", "Padaria Pão Quente Ltda", "Rua Itajaí, 15", "(47) 3333-0006"}};
    List<Cliente> lista = new ArrayList<>();
    for (String[] d : dados) {
      Cliente c = new Cliente();
      c.setTipoPessoa(d[0]);
      c.setRazaoSocial(d[1]);
      c.setEndereco(d[2]);
      c.setContato(d[3]);
      c.setIsActive(true);
      c.setSaldoCredito(BigDecimal.ZERO);
      lista.add(clienteRepository.save(c));
    }
    return lista;
  }

  private UnidadeMedida unidade(String sigla) {
    return unidadeMedidaRepository.findAll().stream()
        .filter(u -> sigla.equalsIgnoreCase(u.getSigla()))
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("Unidade não encontrada: " + sigla));
  }

  private void quebra(List<Produto> produtos, Map<Integer, Double> estoque, int idx, double qtd,
      LocalDateTime quando) {
    if (estoque.getOrDefault(idx, 0.0) < qtd) {
      return;
    }
    PedidoRequest req = pedido(NATUREZA_QUEBRA, null, null, null);
    ItemPedidoRequest item = new ItemPedidoRequest();
    item.setProdutoId(produtos.get(idx).getId());
    item.setQuantidade(BigDecimal.valueOf(qtd));
    req.setItens(List.of(item));
    registrar(req, quando);
    estoque.merge(idx, -qtd, Double::sum);
  }

  private PedidoRequest pedido(int natureza, Integer clienteId, String documento, String status) {
    PedidoRequest req = new PedidoRequest();
    req.setNaturezaOperacaoId(natureza);
    req.setClienteId(clienteId);
    req.setDocumentoReferencia(documento);
    req.setStatus(status);
    return req;
  }

  private ItemPedidoRequest item(Produto produto, double qtd, double valorUnitario) {
    ItemPedidoRequest item = new ItemPedidoRequest();
    item.setProdutoId(produto.getId());
    item.setQuantidade(BigDecimal.valueOf(qtd).setScale(3, RoundingMode.HALF_UP));
    item.setValorUnitario(BigDecimal.valueOf(valorUnitario).setScale(2, RoundingMode.HALF_UP));
    return item;
  }

  private LocalDateTime momento(LocalDateTime agora, int diasAtras, int hora, int minuto) {
    LocalDateTime t = agora.minusDays(diasAtras).withHour(hora).withMinute(minuto).withSecond(0)
        .withNano(0);
    return t.isAfter(agora) ? agora.minusMinutes(5).withNano(0) : t;
  }

  /** Processa o pedido pelo serviço real e depois ajusta as datas para o passado. */
  private void registrar(PedidoRequest req, LocalDateTime quando) {
    PedidoResponse resp = pedidoService.processarPedido(req);
    String data = quando.format(SQL_DATE);
    jdbc.update("UPDATE pedido SET data_emissao = ? WHERE id = ?", data, resp.getId());
    jdbc.update("UPDATE movimentacao_estoque SET data_movimentacao = ? WHERE pedido_id = ?", data,
        resp.getId());
    jdbc.update("UPDATE lote_entrada SET data_entrada = ? WHERE item_pedido_id IN "
        + "(SELECT id FROM item_pedido WHERE pedido_id = ?)", data, resp.getId());
  }
}
