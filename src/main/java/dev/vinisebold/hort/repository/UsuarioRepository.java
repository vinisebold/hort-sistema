package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
  Optional<Usuario> findByEmail(String email);

  boolean existsByEmail(String email);

  boolean existsByCnpj(String cnpj);
}
