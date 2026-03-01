package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ItemPedidoRequest;
import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.ItemPedidoResponse;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.dto.response.CursorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import dev.vinisebold.hort.model.*;
import dev.vinisebold.hort.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final NaturezaOperacaoRepository naturezaOperacaoRepository;
    private final ClienteRepository clienteRepository;
    private final FormaPagamentoRepository formaPagamentoRepository;
    private final ProdutoRepository produtoRepository;

    // Injeção dos nossos sub-serviços
    private final EstoqueService estoqueService;
    private final FifoService fifoService;

    @Transactional
    public PedidoResponse processarPedido(PedidoRequest request) {

        // 1. Validar Cadastros
        NaturezaOperacao natureza = naturezaOperacaoRepository.findById(request.getNaturezaOperacaoId())
                .orElseThrow(() -> new IllegalArgumentException("Natureza de Operação inválida"));

        FormaPagamento formaPgto = formaPagamentoRepository.findById(request.getFormaPagamentoId())
                .orElseThrow(() -> new IllegalArgumentException("Forma de Pagamento inválida"));

        Cliente cliente = null;
        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        } else if (formaPgto.getExigeCliente()) {
            throw new IllegalArgumentException("Esta forma de pagamento exige que um cliente seja informado.");
        }

        // 2. Criar Cabeçalho do Pedido
        Pedido pedido = new Pedido();
        pedido.setNaturezaOperacao(natureza);
        pedido.setCliente(cliente);
        pedido.setFormaPagamento(formaPgto);
        pedido.setDocumentoReferencia(request.getDocumentoReferencia());
        pedido.setStatusPagamento(request.getStatusPagamento());
        pedido.setDataEmissao(LocalDateTime.now());

        // Calcula o valor total iterando a request
        BigDecimal valorTotalPedido = request.getItens().stream()
                .map(i -> i.getValorUnitario().multiply(i.getQuantidade()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        pedido.setValorTotal(valorTotalPedido);

        pedido = pedidoRepository.save(pedido);

        // 3. Processar Itens
        for (ItemPedidoRequest itemReq : request.getItens()) {
            Produto produto = produtoRepository.findById(itemReq.getProdutoId())
                    .orElseThrow(() -> new IllegalArgumentException("Produto ID " + itemReq.getProdutoId() + " não encontrado."));

            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProduto(produto);
            item.setQuantidade(itemReq.getQuantidade());
            item.setValorUnitario(itemReq.getValorUnitario());
            item.setValorTotal(itemReq.getValorUnitario().multiply(itemReq.getQuantidade()));

            // Regra base: começa com custo 0 (Compras ficam 0, Vendas recebem cálculo)
            item.setCustoUnitario(BigDecimal.ZERO);

            // Salva o item para gerar o ID (necessário para o FIFO e Estoque)
            item = itemPedidoRepository.save(item);

            // 4. Mágica do Fluxo (Entrada vs Saída)
            if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
                item.setCustoUnitario(item.getValorUnitario());
                item = itemPedidoRepository.save(item);

                estoqueService.processarMovimentacao(produto, natureza, pedido, item.getQuantidade());
                fifoService.registrarLoteCompra(item);

            } else if (TipoMovimento.SAIDA.equals(natureza.getTipoMovimento())) {
                estoqueService.processarMovimentacao(produto, natureza, pedido, item.getQuantidade());

                // Puxa o custo exato do banco de lotes FIFO
                BigDecimal custoExatoFifo = fifoService.processarVendaFifo(item);
                item.setCustoUnitario(custoExatoFifo);
                itemPedidoRepository.save(item);
            }
        }


        List<ItemPedidoResponse> itensResponse = request.getItens().stream().map(req -> {
            Produto p = produtoRepository.findById(req.getProdutoId()).orElseThrow();
            return ItemPedidoResponse.builder()
                    .produtoId(p.getId())
                    .produtoDescricao(p.getDescricao())
                    .quantidade(req.getQuantidade())
                    .valorUnitario(req.getValorUnitario())
                    .valorTotal(req.getValorUnitario().multiply(req.getQuantidade()))
                    .build();
        }).toList();

        return PedidoResponse.builder()
                .id(pedido.getId())
                .naturezaOperacao(natureza.getDescricao())
                .clienteNome(cliente != null ? cliente.getRazaoSocial() : "Consumidor Final")
                .formaPagamento(formaPgto.getDescricao())
                .documentoReferencia(pedido.getDocumentoReferencia())
                .valorTotal(pedido.getValorTotal())
                .statusPagamento(pedido.getStatusPagamento())
                .dataEmissao(pedido.getDataEmissao())
                .itens(itensResponse)
                .build();
    }

    public CursorResponse<PedidoResponse> listarTodos(Integer cursor, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<Pedido> page;

        if (cursor != null) {
            page = pedidoRepository.findByIdLessThanOrderByIdDesc(cursor, pageable);
        } else {
            page = pedidoRepository.findAllByOrderByIdDesc(pageable);
        }

        List<PedidoResponse> data = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        Integer nextCursor = data.isEmpty() ? null : data.get(data.size() - 1).getId();

        return CursorResponse.<PedidoResponse>builder()
                .data(data)
                .nextCursor(nextCursor)
                .hasNext(page.hasNext())
                .build();
    }

    public PedidoResponse buscarPorId(Integer id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));
        return mapToResponse(pedido);
    }

    @Transactional
    public void cancelarPedido(Integer id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));
                
        if ("CANCELADO".equalsIgnoreCase(pedido.getStatusPagamento())) {
            throw new IllegalStateException("Pedido já está cancelado.");
        }
        
        List<ItemPedido> itens = itemPedidoRepository.findByPedido(pedido);
        NaturezaOperacao natureza = pedido.getNaturezaOperacao();
        
        for (ItemPedido item : itens) {
            Produto produto = item.getProduto();
            
            if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
                fifoService.estornarLoteCompra(item);
            } else if (TipoMovimento.SAIDA.equals(natureza.getTipoMovimento())) {
                fifoService.estornarVendaFifo(item);
            }
            
            estoqueService.estornarMovimentacao(produto, natureza, pedido, item.getQuantidade());
        }
        
        pedido.setStatusPagamento("CANCELADO");
        pedidoRepository.save(pedido);
    }

    private PedidoResponse mapToResponse(Pedido pedido) {
        // Busca os itens do pedido no banco
        List<ItemPedido> itens = itemPedidoRepository.findByPedido(pedido);

        List<ItemPedidoResponse> itensResponse = itens.stream().map(item ->
                ItemPedidoResponse.builder()
                        .id(item.getId())
                        .produtoId(item.getProduto().getId())
                        .produtoDescricao(item.getProduto().getDescricao())
                        .quantidade(item.getQuantidade())
                        .valorUnitario(item.getValorUnitario())
                        .valorTotal(item.getValorTotal())
                        .custoUnitario(item.getCustoUnitario()) // Mostra o custo calculado pelo FIFO!
                        .build()
        ).toList();

        return PedidoResponse.builder()
                .id(pedido.getId())
                .naturezaOperacao(pedido.getNaturezaOperacao().getDescricao())
                .clienteNome(pedido.getCliente() != null ? pedido.getCliente().getRazaoSocial() : "Consumidor Final")
                .formaPagamento(pedido.getFormaPagamento().getDescricao())
                .documentoReferencia(pedido.getDocumentoReferencia())
                .valorTotal(pedido.getValorTotal())
                .statusPagamento(pedido.getStatusPagamento())
                .dataEmissao(pedido.getDataEmissao())
                .itens(itensResponse)
                .build();
    }
}