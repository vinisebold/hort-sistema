package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    // Por enquanto, os métodos padrão do JpaRepository (save, findById) já resolvem o nosso problema.
}