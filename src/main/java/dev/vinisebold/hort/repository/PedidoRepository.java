package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.model.TipoMovimento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    List<Pedido> findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(
            TipoMovimento tipoMovimento, LocalDateTime inicio, LocalDateTime fim);

    List<Pedido> findByNaturezaOperacaoTipoMovimento(TipoMovimento tipoMovimento);

    Page<Pedido> findByIdLessThanOrderByIdDesc(Integer id, Pageable pageable);

    Page<Pedido> findAllByOrderByIdDesc(Pageable pageable);
}
