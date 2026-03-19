package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.UnidadeMedida;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnidadeMedidaRepository extends JpaRepository<UnidadeMedida, Integer> {
  List<UnidadeMedida> findAllByIsActiveTrue();

  boolean existsBySigla(String sigla);
}
