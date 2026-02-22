package dev.vinisebold.hort.service;

import dev.vinisebold.hort.model.MovimentacaoEstoque;
import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.model.Produto;
import dev.vinisebold.hort.repository.MovimentacaoEstoqueRepository;
import dev.vinisebold.hort.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;

    @Transactional(propagation = Propagation.MANDATORY) // Só pode ser chamado dentro de uma transação existente (Pedido)
    public void processarMovimentacao(Produto produto, NaturezaOperacao natureza, Pedido pedido, BigDecimal quantidade) {
        BigDecimal novoEstoque;

        if ("ENTRADA".equalsIgnoreCase(natureza.getTipoMovimento())) {
            novoEstoque = produto.getEstoqueAtual().add(quantidade);
        } else {
            novoEstoque = produto.getEstoqueAtual().subtract(quantidade);
            if (novoEstoque.compareTo(BigDecimal.ZERO) < 0) {
                // Opção A: O Bloqueio Rigoroso que discutimos!
                throw new IllegalArgumentException("Estoque físico insuficiente para o produto: " + produto.getDescricao());
            }
        }

        // Atualiza a foto atual do estoque no Produto
        produto.setEstoqueAtual(novoEstoque);
        produtoRepository.save(produto);

        // Gera o extrato na timeline (Rastreabilidade)
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setNaturezaOperacao(natureza);
        mov.setPedido(pedido);
        mov.setQuantidade(quantidade);
        mov.setEstoqueAposMovimentacao(novoEstoque);

        movimentacaoRepository.save(mov);
    }
}