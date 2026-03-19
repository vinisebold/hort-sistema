package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.model.TipoMovimento;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

  List<Pedido> findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(
      TipoMovimento tipoMovimento, LocalDateTime inicio, LocalDateTime fim);

  Page<Pedido> findByIdLessThanOrderByIdDesc(Integer id, Pageable pageable);

  Page<Pedido> findAllByOrderByIdDesc(Pageable pageable);

  List<Pedido> findByClienteIdOrderByDataEmissaoAsc(Integer clienteId);

  List<Pedido> findByClienteIdAndStatusOrderByDataEmissaoAsc(Integer clienteId, String status);

}
