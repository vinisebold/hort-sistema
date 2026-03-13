package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.LoteEntrada;
import dev.vinisebold.hort.model.Produto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoteEntradaRepository extends JpaRepository<LoteEntrada, Integer> {

  /**
   * O coração do FIFO:
   * Busca todos os lotes de um produto específico que ainda têm saldo (não estão esgotados),
   * e ordena do mais antigo para o mais novo (OrderByDataEntradaAsc).
   */
  List<LoteEntrada> findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(Produto produto);

  java.util.Optional<LoteEntrada> findByItemPedido(dev.vinisebold.hort.model.ItemPedido itemPedido);
}
