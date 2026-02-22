package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    // Traz apenas os clientes que NÃO foram deletados (Soft Delete)
    List<Cliente> findAllByIsActiveTrue();

    // Útil para validação: impede cadastrar dois clientes com o mesmo CPF/CNPJ
    boolean existsByDocumento(String documento);
}