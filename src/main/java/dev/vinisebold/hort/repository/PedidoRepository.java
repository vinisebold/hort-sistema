package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    List<Pedido> findByNaturezaOperacaoTipoMovimentoAndDataEmissaoBetween(
            String tipoMovimento, LocalDateTime inicio, LocalDateTime fim);

    List<Pedido> findByNaturezaOperacaoTipoMovimento(String tipoMovimento);
}
