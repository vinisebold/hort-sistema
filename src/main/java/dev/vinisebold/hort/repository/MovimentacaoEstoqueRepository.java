package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.MovimentacaoEstoque;
import dev.vinisebold.hort.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Integer> {

    List<MovimentacaoEstoque> findByProdutoOrderByDataMovimentacaoDesc(Produto produto);

    List<MovimentacaoEstoque> findByProdutoIdOrderByDataMovimentacaoDesc(Integer produtoId);
}