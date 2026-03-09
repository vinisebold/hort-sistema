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
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private static final String CLIENTE_NAO_INFORMADO = "N/A";

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final NaturezaOperacaoRepository naturezaOperacaoRepository;
    private final ClienteRepository clienteRepository;
    private final ProdutoRepository produtoRepository;

    // Injeção dos nossos sub-serviços
    private final EstoqueService estoqueService;
    private final FifoService fifoService;

    @Transactional
    public PedidoResponse processarPedido(PedidoRequest request) {

        // 1. Buscar natureza
        NaturezaOperacao natureza = naturezaOperacaoRepository.findById(request.getNaturezaOperacaoId())
                .orElseThrow(() -> new IllegalArgumentException("Natureza de Operação inválida"));

        // 2. VALIDAÇÃO DINÂMICA
        validatePedido(request, natureza);

        // 3. Buscar Cliente (se obrigatório)
        Cliente cliente = null;
        CampoPropriedade propriedadeCliente = resolvePropriedade(natureza.getPropriedadeCliente(), natureza.getExigeCliente());
        if (propriedadeCliente != CampoPropriedade.DESATIVADO && request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        }

        // 4. Criar Cabeçalho do Pedido
        Pedido pedido = new Pedido();
        pedido.setNaturezaOperacao(natureza);
        pedido.setCliente(cliente);
        pedido.setDocumentoReferencia(request.getDocumentoReferencia());
        pedido.setStatus(request.getStatus());
        pedido.setDataEmissao(LocalDateTime.now());

        // Calcula o valor total apenas se natureza exigir valorUnitario
        BigDecimal valorTotalPedido = BigDecimal.ZERO;
        CampoPropriedade propriedadeValorUnitario = resolvePropriedade(natureza.getPropriedadeValorUnitario(), natureza.getExigeValorUnitario());
        if (propriedadeValorUnitario != CampoPropriedade.DESATIVADO) {
            valorTotalPedido = request.getItens().stream()
                    .map(i -> {
                        BigDecimal valorUnitario = i.getValorUnitario() != null ? i.getValorUnitario() : BigDecimal.ZERO;
                        return valorUnitario.multiply(i.getQuantidade());
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        pedido.setValorTotal(valorTotalPedido);

        pedido = pedidoRepository.save(pedido);

        // 5. Processar Itens
        for (ItemPedidoRequest itemReq : request.getItens()) {
            Produto produto = produtoRepository.findById(itemReq.getProdutoId())
                    .orElseThrow(() -> new IllegalArgumentException("Produto ID " + itemReq.getProdutoId() + " não encontrado."));

            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProduto(produto);
            item.setQuantidade(itemReq.getQuantidade());
            
            // Valor unitário é setado apenas se natureza exigir
            BigDecimal valorUnitario = propriedadeValorUnitario != CampoPropriedade.DESATIVADO
                    ? (itemReq.getValorUnitario() != null ? itemReq.getValorUnitario() : BigDecimal.ZERO)
                    : BigDecimal.ZERO;
            item.setValorUnitario(valorUnitario);
            item.setValorTotal(valorUnitario.multiply(itemReq.getQuantidade()));

            // Regra base: começa com custo 0 (Compras ficam 0, Vendas recebem cálculo)
            item.setCustoUnitario(BigDecimal.ZERO);

            // Salva o item para gerar o ID (necessário para o FIFO e Estoque)
            item = itemPedidoRepository.save(item);

            // 6. Mágica do Fluxo (Entrada vs Saída)
            if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
                if (propriedadeValorUnitario != CampoPropriedade.DESATIVADO) {
                    item.setCustoUnitario(item.getValorUnitario());
                    item = itemPedidoRepository.save(item);
                    fifoService.registrarLoteCompra(item);
                }
                estoqueService.processarMovimentacao(produto, natureza, pedido, item.getQuantidade());

            } else if (TipoMovimento.SAIDA.equals(natureza.getTipoMovimento())) {
                estoqueService.processarMovimentacao(produto, natureza, pedido, item.getQuantidade());

                if (propriedadeValorUnitario != CampoPropriedade.DESATIVADO) {
                    // Puxa o custo exato do banco de lotes FIFO
                    BigDecimal custoExatoFifo = fifoService.processarVendaFifo(item);
                    item.setCustoUnitario(custoExatoFifo);
                    itemPedidoRepository.save(item);
                }
            }
        }

        List<ItemPedidoResponse> itensResponse = request.getItens().stream().map(req -> {
            Produto p = produtoRepository.findById(req.getProdutoId()).orElseThrow();
            BigDecimal valorUnit = propriedadeValorUnitario != CampoPropriedade.DESATIVADO
                    ? (req.getValorUnitario() != null ? req.getValorUnitario() : BigDecimal.ZERO)
                    : BigDecimal.ZERO;
            return ItemPedidoResponse.builder()
                    .produtoId(p.getId())
                    .produtoDescricao(p.getDescricao())
                    .quantidade(req.getQuantidade())
                    .valorUnitario(valorUnit)
                    .valorTotal(valorUnit.multiply(req.getQuantidade()))
                    .build();
        }).toList();

        return PedidoResponse.builder()
                .id(pedido.getId())
                .naturezaOperacao(natureza.getDescricao())
                .naturezaOperacaoTipo(natureza.getTipoMovimento().name())
                .clienteNome(cliente != null ? cliente.getRazaoSocial() : CLIENTE_NAO_INFORMADO)
                .documentoReferencia(pedido.getDocumentoReferencia())
                .valorTotal(pedido.getValorTotal())
                .status(pedido.getStatus())
                .dataEmissao(pedido.getDataEmissao())
                .itens(itensResponse)
                .build();
    }

    private void validatePedido(PedidoRequest request, NaturezaOperacao natureza) {
        CampoPropriedade propriedadeCliente = resolvePropriedade(natureza.getPropriedadeCliente(), natureza.getExigeCliente());
        CampoPropriedade propriedadeStatus = resolvePropriedade(natureza.getPropriedadeStatus(), natureza.getExigeStatus());
        CampoPropriedade propriedadeValorUnitario = resolvePropriedade(natureza.getPropriedadeValorUnitario(), natureza.getExigeValorUnitario());
        
        // 1. Validar Cliente
        if (propriedadeCliente == CampoPropriedade.OBRIGATORIO && request.getClienteId() == null) {
            throw new IllegalArgumentException(
                "Cliente/Fornecedor é obrigatório para: " + natureza.getDescricao()
            );
        }
        if (propriedadeCliente == CampoPropriedade.DESATIVADO && request.getClienteId() != null) {
            throw new IllegalArgumentException("Cliente/Fornecedor deve estar desativado para: " + natureza.getDescricao());
        }
        
        // 2. Validar Status
        if (propriedadeStatus == CampoPropriedade.OBRIGATORIO) {
            if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
                throw new IllegalArgumentException("Status é obrigatório para: " + natureza.getDescricao());
            }
            
            // Validar valores aceitos de status
            List<String> statusValidos = List.of("PAGO", "PENDENTE");
            if (!statusValidos.contains(request.getStatus())) {
                throw new IllegalArgumentException("Status inválido: " + request.getStatus());
            }
            
            // Se PENDENTE, exigir documento
            if ("PENDENTE".equals(request.getStatus())) {
                if (request.getDocumentoReferencia() == null || 
                    request.getDocumentoReferencia().trim().isEmpty()) {
                    throw new IllegalArgumentException(
                        "Documento de referência obrigatório para status PENDENTE"
                    );
                }
            }
        } else if (propriedadeStatus == CampoPropriedade.OPCIONAL) {
            if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
                List<String> statusValidos = List.of("PAGO", "PENDENTE");
                if (!statusValidos.contains(request.getStatus())) {
                    throw new IllegalArgumentException("Status inválido: " + request.getStatus());
                }

                if ("PENDENTE".equals(request.getStatus()) &&
                        (request.getDocumentoReferencia() == null || request.getDocumentoReferencia().trim().isEmpty())) {
                    throw new IllegalArgumentException(
                            "Documento de referência obrigatório para status PENDENTE"
                    );
                }
            } else {
                request.setStatus(null);
                request.setDocumentoReferencia(null);
            }
        } else {
            // Operação com status desativado: forçar NULL
            request.setStatus(null);
            request.setDocumentoReferencia(null);
        }
        
        // 3. Validar Valor Unitário nos Itens
        if (propriedadeValorUnitario == CampoPropriedade.OBRIGATORIO) {
            for (ItemPedidoRequest item : request.getItens()) {
                if (item.getValorUnitario() == null) {
                    throw new IllegalArgumentException(
                        "Valor unitário obrigatório para: " + natureza.getDescricao()
                    );
                }
            }
        } else if (propriedadeValorUnitario == CampoPropriedade.DESATIVADO) {
            // Operação não exige valor: forçar ZERO em todos os itens
            for (ItemPedidoRequest item : request.getItens()) {
                item.setValorUnitario(BigDecimal.ZERO);
            }
        }
        
        // 4. Validar quantidade mínima de itens
        if (request.getItens() == null || request.getItens().isEmpty()) {
            throw new IllegalArgumentException("O pedido deve ter pelo menos um item");
        }
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

        Integer nextCursor = data.isEmpty() ? null : data.getLast().getId();

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
                
        if ("CANCELADO".equalsIgnoreCase(pedido.getStatus())) {
            throw new IllegalStateException("Pedido já está cancelado.");
        }
        
        List<ItemPedido> itens = itemPedidoRepository.findByPedido(pedido);
        NaturezaOperacao natureza = pedido.getNaturezaOperacao();
        CampoPropriedade propriedadeValorUnitario = resolvePropriedade(natureza.getPropriedadeValorUnitario(), natureza.getExigeValorUnitario());
        
        for (ItemPedido item : itens) {
            Produto produto = item.getProduto();
            
            if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
                if (propriedadeValorUnitario != CampoPropriedade.DESATIVADO) {
                    fifoService.estornarLoteCompra(item);
                }
            } else if (TipoMovimento.SAIDA.equals(natureza.getTipoMovimento())) {
                if (propriedadeValorUnitario != CampoPropriedade.DESATIVADO) {
                    fifoService.estornarVendaFifo(item);
                }
            }
            
            estoqueService.estornarMovimentacao(produto, natureza, pedido, item.getQuantidade());
        }
        
        pedido.setStatus("CANCELADO");
        pedidoRepository.save(pedido);
    }

    /**
     * Marca um pedido como PAGO
     * @param pedidoId ID do pedido a marcar como pago
     */
    @Transactional
    public void marcarComoPago(Integer pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));
        
        // Validar que pedido já não é PAGO
        if ("PAGO".equalsIgnoreCase(pedido.getStatus())) {
            throw new IllegalStateException("Pedido já está marcado como PAGO.");
        }
        
        // Validar que status é PENDENTE
        if (!"PENDENTE".equalsIgnoreCase(pedido.getStatus())) {
            throw new IllegalStateException("Apenas pedidos com status PENDENTE podem ser marcados como PAGO.");
        }
        
        // Marcar como PAGO
        pedido.setStatus("PAGO");
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
                        .custoUnitario(item.getCustoUnitario())
                        .build()
        ).toList();

        return PedidoResponse.builder()
                .id(pedido.getId())
                .naturezaOperacao(pedido.getNaturezaOperacao().getDescricao())
                .naturezaOperacaoTipo(pedido.getNaturezaOperacao().getTipoMovimento().name())
                .clienteNome(pedido.getCliente() != null ? pedido.getCliente().getRazaoSocial() : CLIENTE_NAO_INFORMADO)
                .documentoReferencia(pedido.getDocumentoReferencia())
                .valorTotal(pedido.getValorTotal())
                .status(pedido.getStatus())
                .dataEmissao(pedido.getDataEmissao())
                .itens(itensResponse)
                .build();
    }

    private CampoPropriedade resolvePropriedade(CampoPropriedade propriedade, Boolean legadoExige) {
        if (propriedade != null) {
            return propriedade;
        }
        return Boolean.TRUE.equals(legadoExige) ? CampoPropriedade.OBRIGATORIO : CampoPropriedade.DESATIVADO;
    }
}
