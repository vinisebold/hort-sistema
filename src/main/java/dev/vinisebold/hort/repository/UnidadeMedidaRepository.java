package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.UnidadeMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnidadeMedidaRepository extends JpaRepository<UnidadeMedida, Integer> {
    List<UnidadeMedida> findAllByIsActiveTrue();
    boolean existsBySigla(String sigla);
}