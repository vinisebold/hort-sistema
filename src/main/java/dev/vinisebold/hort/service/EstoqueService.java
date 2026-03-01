package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.response.*;
import dev.vinisebold.hort.model.ItemPedido;
import dev.vinisebold.hort.model.MovimentacaoEstoque;
import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.model.TipoMovimento;
import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.model.Produto;
import dev.vinisebold.hort.repository.ItemPedidoRepository;
import dev.vinisebold.hort.repository.MovimentacaoEstoqueRepository;
import dev.vinisebold.hort.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void processarMovimentacao(Produto produto, NaturezaOperacao natureza, Pedido pedido, BigDecimal quantidade) {
        BigDecimal novoEstoque;

        if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
            novoEstoque = produto.getEstoqueAtual().add(quantidade);
        } else {
            novoEstoque = produto.getEstoqueAtual().subtract(quantidade);
            if (novoEstoque.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Estoque físico insuficiente para o produto: " + produto.getDescricao());
            }
        }

        produto.setEstoqueAtual(novoEstoque);
        produtoRepository.save(produto);

        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setNaturezaOperacao(natureza);
        mov.setPedido(pedido);
        mov.setQuantidade(quantidade);
        mov.setEstoqueAposMovimentacao(novoEstoque);

        movimentacaoRepository.save(mov);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void estornarMovimentacao(Produto produto, NaturezaOperacao natureza, Pedido pedido, BigDecimal quantidade) {
        BigDecimal novoEstoque;

        if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
            novoEstoque = produto.getEstoqueAtual().subtract(quantidade);
            if (novoEstoque.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Estoque físico insuficiente para estornar a entrada do produto: " + produto.getDescricao());
            }
        } else {
            novoEstoque = produto.getEstoqueAtual().add(quantidade);
        }

        produto.setEstoqueAtual(novoEstoque);
        produtoRepository.save(produto);

        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setNaturezaOperacao(natureza);
        mov.setPedido(pedido);
        mov.setQuantidade(quantidade.negate()); // Negativa para representar o estorno na timeline
        mov.setEstoqueAposMovimentacao(novoEstoque);

        movimentacaoRepository.save(mov);
    }

    @Transactional(readOnly = true)
    public List<ProdutoEstoqueResponse> listarProdutosComEstoque() {
        return produtoRepository.findAllByIsActiveTrue().stream()
                .map(produto -> ProdutoEstoqueResponse.builder()
                        .id(produto.getId())
                        .codigo(produto.getCodigo())
                        .descricao(produto.getDescricao())
                        .unidadeMedidaSigla(produto.getUnidadeMedida().getSigla())
                        .estoqueAtual(produto.getEstoqueAtual())
                        .isActive(produto.getIsActive())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoEstoqueResponse> getTimelineProduto(Integer produtoId) {
        if (!produtoRepository.existsById(produtoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        }

        return movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(produtoId).stream()
                .map(this::toMovimentacaoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DetalheMovimentacaoResponse getDetalheMovimentacao(Integer movimentacaoId) {
        MovimentacaoEstoque movimentacao = movimentacaoRepository.findById(movimentacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimentação não encontrada"));

        MovimentacaoEstoqueResponse movimentacaoResponse = toMovimentacaoResponse(movimentacao);

        PedidoResumidoResponse pedidoResponse = null;
        List<ItemPedidoResumidoResponse> itensResponse = Collections.emptyList();

        if (movimentacao.getPedido() != null) {
            Pedido pedido = movimentacao.getPedido();
            pedidoResponse = PedidoResumidoResponse.builder()
                    .id(pedido.getId())
                    .naturezaOperacao(pedido.getNaturezaOperacao().getDescricao())
                    .clienteNome(pedido.getCliente() != null ? pedido.getCliente().getRazaoSocial() : null)
                    .valorTotal(pedido.getValorTotal())
                    .statusPagamento(pedido.getStatusPagamento())
                    .dataEmissao(pedido.getDataEmissao())
                    .build();

            List<ItemPedido> itens = itemPedidoRepository.findByPedido(pedido);
            Integer produtoIdMovimentacao = movimentacao.getProduto().getId();

            itensResponse = itens.stream()
                    .map(item -> ItemPedidoResumidoResponse.builder()
                            .id(item.getId())
                            .produtoId(item.getProduto().getId())
                            .produtoDescricao(item.getProduto().getDescricao())
                            .quantidade(item.getQuantidade())
                            .valorUnitario(item.getValorUnitario())
                            .valorTotal(item.getValorTotal())
                            .isDestacado(item.getProduto().getId().equals(produtoIdMovimentacao))
                            .build())
                    .toList();
        }

        return DetalheMovimentacaoResponse.builder()
                .movimentacao(movimentacaoResponse)
                .pedido(pedidoResponse)
                .itens(itensResponse)
                .build();
    }

    private MovimentacaoEstoqueResponse toMovimentacaoResponse(MovimentacaoEstoque mov) {
        return MovimentacaoEstoqueResponse.builder()
                .id(mov.getId())
                .produtoId(mov.getProduto().getId())
                .produtoDescricao(mov.getProduto().getDescricao())
                .naturezaOperacaoDescricao(mov.getNaturezaOperacao().getDescricao())
                .tipoMovimento(mov.getNaturezaOperacao().getTipoMovimento().name())
                .pedidoId(mov.getPedido() != null ? mov.getPedido().getId() : null)
                .quantidade(mov.getQuantidade())
                .estoqueAposMovimentacao(mov.getEstoqueAposMovimentacao())
                .dataMovimentacao(mov.getDataMovimentacao())
                .build();
    }
}
