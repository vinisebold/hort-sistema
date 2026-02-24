package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.ConfiguracoesSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfiguracoesSistemaRepository extends JpaRepository<ConfiguracoesSistema, Integer> {
}
