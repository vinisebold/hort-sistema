package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.response.DashboardResumoResponse;
import dev.vinisebold.hort.dto.response.TopClienteResponse;
import dev.vinisebold.hort.dto.response.TopProdutoResponse;
import dev.vinisebold.hort.dto.response.VendasPeriodoResponse;
import dev.vinisebold.hort.model.ItemPedido;
import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.repository.ItemPedidoRepository;
import dev.vinisebold.hort.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final dev.vinisebold.hort.model.TipoMovimento TIPO_SAIDA = dev.vinisebold.hort.model.TipoMovimento.SAIDA;

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    public DashboardResumoResponse getResumo(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<Pedido> vendas = pedidoRepository
                .findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        List<ItemPedido> itens = itemPedidoRepository
                .findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        BigDecimal totalVendido = vendas.stream()
                .map(Pedido::getValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Integer, BigDecimal> produtoQuantidade = new HashMap<>();
        Map<Integer, String> produtoNomes = new HashMap<>();
        for (ItemPedido item : itens) {
            Integer prodId = item.getProduto().getId();
            produtoQuantidade.merge(prodId, item.getQuantidade(), BigDecimal::add);
            produtoNomes.putIfAbsent(prodId, item.getProduto().getDescricao());
        }

        String produtoMaisVendidoNome = null;
        Integer produtoMaisVendidoQtd = null;
        if (!produtoQuantidade.isEmpty()) {
            Map.Entry<Integer, BigDecimal> topProduto = produtoQuantidade.entrySet().stream()
                    .max(Comparator.comparing(Map.Entry::getValue))
                    .orElse(null);
            if (topProduto != null) {
                produtoMaisVendidoNome = produtoNomes.get(topProduto.getKey());
                produtoMaisVendidoQtd = topProduto.getValue().intValue();
            }
        }

        Map<Integer, Integer> clienteCompras = new HashMap<>();
        Map<Integer, String> clienteNomes = new HashMap<>();
        for (Pedido pedido : vendas) {
            if (pedido.getCliente() != null) {
                Integer clienteId = pedido.getCliente().getId();
                clienteCompras.merge(clienteId, 1, Integer::sum);
                clienteNomes.putIfAbsent(clienteId, pedido.getCliente().getRazaoSocial());
            }
        }

        String clienteMaisFielNome = null;
        Integer clienteMaisFielCompras = null;
        if (!clienteCompras.isEmpty()) {
            Map.Entry<Integer, Integer> topCliente = clienteCompras.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);
            if (topCliente != null) {
                clienteMaisFielNome = clienteNomes.get(topCliente.getKey());
                clienteMaisFielCompras = topCliente.getValue();
            }
        }

        return DashboardResumoResponse.builder()
                .produtoMaisVendidoNome(produtoMaisVendidoNome)
                .produtoMaisVendidoQtd(produtoMaisVendidoQtd)
                .clienteMaisFielNome(clienteMaisFielNome)
                .clienteMaisFielCompras(clienteMaisFielCompras)
                .totalVendidoPeriodo(totalVendido)
                .build();
    }

    public List<VendasPeriodoResponse> getVendasPorDia(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<Pedido> vendas = pedidoRepository
                .findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        Map<LocalDate, BigDecimal> vendasPorDia = vendas.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getDataEmissao().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Pedido::getValorTotal, BigDecimal::add)
                ));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

        return vendasPorDia.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> VendasPeriodoResponse.builder()
                        .periodo(e.getKey().format(formatter))
                        .totalVendido(e.getValue())
                        .build())
                .toList();
    }

    public List<VendasPeriodoResponse> getVendasPorMes(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<Pedido> vendas = pedidoRepository
                .findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        Map<YearMonth, BigDecimal> vendasPorMes = vendas.stream()
                .collect(Collectors.groupingBy(
                        p -> YearMonth.from(p.getDataEmissao()),
                        Collectors.reducing(BigDecimal.ZERO, Pedido::getValorTotal, BigDecimal::add)
                ));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");

        return vendasPorMes.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> VendasPeriodoResponse.builder()
                        .periodo(e.getKey().format(formatter))
                        .totalVendido(e.getValue())
                        .build())
                .toList();
    }

    public List<TopProdutoResponse> getTop10ProdutosMaisVendidos(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<ItemPedido> itens = itemPedidoRepository
                .findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        Map<Integer, BigDecimal> quantidadePorProduto = new HashMap<>();
        Map<Integer, String> nomesPorProduto = new HashMap<>();

        for (ItemPedido item : itens) {
            Integer prodId = item.getProduto().getId();
            quantidadePorProduto.merge(prodId, item.getQuantidade(), BigDecimal::add);
            nomesPorProduto.putIfAbsent(prodId, item.getProduto().getDescricao());
        }

        return quantidadePorProduto.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .map(e -> TopProdutoResponse.builder()
                        .produtoId(e.getKey())
                        .produtoNome(nomesPorProduto.get(e.getKey()))
                        .quantidadeVendida(e.getValue())
                        .valorTotal(null)
                        .build())
                .toList();
    }

    public List<TopProdutoResponse> getTop10ProdutosMaisLucrativos(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<ItemPedido> itens = itemPedidoRepository
                .findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        Map<Integer, BigDecimal> lucroPorProduto = new HashMap<>();
        Map<Integer, String> nomesPorProduto = new HashMap<>();

        for (ItemPedido item : itens) {
            Integer prodId = item.getProduto().getId();
            BigDecimal lucroItem = item.getValorTotal().subtract(item.getQuantidade().multiply(item.getCustoUnitario()));
            lucroPorProduto.merge(prodId, lucroItem, BigDecimal::add);
            nomesPorProduto.putIfAbsent(prodId, item.getProduto().getDescricao());
        }

        return lucroPorProduto.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .map(e -> TopProdutoResponse.builder()
                        .produtoId(e.getKey())
                        .produtoNome(nomesPorProduto.get(e.getKey()))
                        .quantidadeVendida(null)
                        .valorTotal(e.getValue())
                        .build())
                .toList();
    }

    public List<TopClienteResponse> getTop10ClientesMaisFieis(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<Pedido> vendas = pedidoRepository
                .findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        Map<Integer, Integer> comprasPorCliente = new HashMap<>();
        Map<Integer, String> nomesPorCliente = new HashMap<>();

        for (Pedido pedido : vendas) {
            if (pedido.getCliente() != null) {
                Integer clienteId = pedido.getCliente().getId();
                comprasPorCliente.merge(clienteId, 1, Integer::sum);
                nomesPorCliente.putIfAbsent(clienteId, pedido.getCliente().getRazaoSocial());
            }
        }

        return comprasPorCliente.entrySet().stream()
                .sorted(Map.Entry.<Integer, Integer>comparingByValue().reversed())
                .limit(10)
                .map(e -> TopClienteResponse.builder()
                        .clienteId(e.getKey())
                        .clienteNome(nomesPorCliente.get(e.getKey()))
                        .quantidadeCompras(e.getValue())
                        .valorTotal(null)
                        .build())
                .toList();
    }

    public List<TopClienteResponse> getTop10ClientesMaisLucrativos(String periodo) {
        LocalDateTime[] range = calcularPeriodo(periodo);
        List<Pedido> vendas = pedidoRepository
                .findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(TIPO_SAIDA, range[0], range[1]);

        Map<Integer, BigDecimal> valorPorCliente = new HashMap<>();
        Map<Integer, String> nomesPorCliente = new HashMap<>();

        for (Pedido pedido : vendas) {
            if (pedido.getCliente() != null) {
                Integer clienteId = pedido.getCliente().getId();
                valorPorCliente.merge(clienteId, pedido.getValorTotal(), BigDecimal::add);
                nomesPorCliente.putIfAbsent(clienteId, pedido.getCliente().getRazaoSocial());
            }
        }

        return valorPorCliente.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .map(e -> TopClienteResponse.builder()
                        .clienteId(e.getKey())
                        .clienteNome(nomesPorCliente.get(e.getKey()))
                        .quantidadeCompras(null)
                        .valorTotal(e.getValue())
                        .build())
                .toList();
    }

    protected LocalDateTime[] calcularPeriodo(String periodo) {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime inicio;
        LocalDateTime fim = agora;

        if (periodo == null) {
            periodo = "HOJE";
        }

        switch (periodo.toUpperCase()) {
            case "HOJE":
                inicio = agora.toLocalDate().atStartOfDay();
                break;
            case "ULTIMOS_7_DIAS":
                inicio = agora.minusDays(7).toLocalDate().atStartOfDay();
                break;
            case "ULTIMO_MES":
                inicio = YearMonth.now().atDay(1).atStartOfDay();
                break;
            case "MES_ANTERIOR":
                YearMonth mesAnterior = YearMonth.now().minusMonths(1);
                inicio = mesAnterior.atDay(1).atStartOfDay();
                fim = mesAnterior.atEndOfMonth().atTime(23, 59, 59);
                break;
            case "ESTE_ANO":
                inicio = LocalDate.now().withDayOfYear(1).atStartOfDay();
                break;
            case "ANO_ANTERIOR":
                int anoAnterior = LocalDate.now().getYear() - 1;
                inicio = LocalDate.of(anoAnterior, 1, 1).atStartOfDay();
                fim = LocalDate.of(anoAnterior, 12, 31).atTime(23, 59, 59);
                break;
            default:
                inicio = agora.toLocalDate().atStartOfDay();
        }

        return new LocalDateTime[]{inicio, fim};
    }
}
