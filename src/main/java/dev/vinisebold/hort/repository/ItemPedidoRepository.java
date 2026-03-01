package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.ItemPedido;
import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.model.TipoMovimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Integer> {

    List<ItemPedido> findByPedido(Pedido pedido);

    List<ItemPedido> findByPedidoId(Integer pedidoId);

    List<ItemPedido> findByPedidoNaturezaOperacaoTipoMovimentoAndPedidoDataEmissaoBetween(
            TipoMovimento tipoMovimento, LocalDateTime inicio, LocalDateTime fim);
}
