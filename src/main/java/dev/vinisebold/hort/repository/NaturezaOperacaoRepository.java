package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.NaturezaOperacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NaturezaOperacaoRepository extends JpaRepository<NaturezaOperacao, Integer> {
    boolean existsByDescricao(String descricao);
}