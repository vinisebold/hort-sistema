package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    // Traz apenas os clientes que NÃO foram deletados (Soft Delete)
    List<Cliente> findAllByIsActiveTrue();
    
    Page<Cliente> findAllByIsActiveTrueOrderByIdDesc(Pageable pageable);
    
    Page<Cliente> findByIdLessThanAndIsActiveTrueOrderByIdDesc(Integer id, Pageable pageable);

    // Útil para validação: impede cadastrar dois clientes com o mesmo CPF/CNPJ
    boolean existsByDocumento(String documento);

    // Busca cliente por nome (razaoSocial) e tipo, case-insensitive
    Optional<Cliente> findByRazaoSocialIgnoreCaseAndTipoPessoaAndIsActiveTrueIgnoreCase(String razaoSocial, String tipoPessoa);
}