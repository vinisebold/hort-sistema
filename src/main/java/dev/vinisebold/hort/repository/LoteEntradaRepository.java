package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.LoteEntrada;
import dev.vinisebold.hort.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteEntradaRepository extends JpaRepository<LoteEntrada, Integer> {

    /**
     * O coração do FIFO:
     * Busca todos os lotes de um produto específico que ainda têm saldo (não estão esgotados),
     * e ordena do mais antigo para o mais novo (OrderByDataEntradaAsc).
     */
    List<LoteEntrada> findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(Produto produto);
}