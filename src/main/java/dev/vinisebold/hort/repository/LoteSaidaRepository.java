package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.ItemPedido;
import dev.vinisebold.hort.model.LoteSaida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteSaidaRepository extends JpaRepository<LoteSaida, Integer> {
    List<LoteSaida> findByItemPedidoVenda(ItemPedido itemPedidoVenda);
}
