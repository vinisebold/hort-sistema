package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.FormaPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FormaPagamentoRepository extends JpaRepository<FormaPagamento, Integer> {
    List<FormaPagamento> findAllByIsActiveTrue();
    boolean existsByDescricao(String descricao);
}