package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.MovimentacaoEstoque;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Integer> {

  List<MovimentacaoEstoque> findByProdutoIdOrderByDataMovimentacaoDesc(Integer produtoId);
}
