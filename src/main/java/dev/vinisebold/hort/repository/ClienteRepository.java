package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Cliente;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

  Page<Cliente> findAllByIsActiveTrueOrderByIdDesc(Pageable pageable);

  Page<Cliente> findByIdLessThanAndIsActiveTrueOrderByIdDesc(Integer id, Pageable pageable);

  // Útil para validação: impede cadastrar dois clientes com o mesmo CPF/CNPJ
  boolean existsByDocumento(String documento);

  // Busca cliente por nome (razaoSocial) e tipo, case-insensitive
  Optional<Cliente> findByRazaoSocialIgnoreCaseAndTipoPessoaAndIsActiveTrue(String razaoSocial,
      String tipoPessoa);
}
