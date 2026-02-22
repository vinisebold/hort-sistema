package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.MovimentacaoEstoque;
import dev.vinisebold.hort.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Integer> {

    // Este método vai ser essencial para o Frontend montar a "Timeline do Produto" (RF07)
    // Trazendo todo o histórico do mais recente para o mais antigo
    List<MovimentacaoEstoque> findByProdutoOrderByDataMovimentacaoDesc(Produto produto);
}