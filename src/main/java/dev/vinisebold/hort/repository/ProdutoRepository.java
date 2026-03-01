package dev.vinisebold.hort.repository;

import dev.vinisebold.hort.model.Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Integer> {
    Optional<Produto> findByCodigo(String codigo);
    List<Produto> findAllByIsActiveTrue();
    boolean existsByCodigo(String codigo);
    
    Page<Produto> findAllByIsActiveTrueOrderByIdDesc(Pageable pageable);
    Page<Produto> findByIdLessThanAndIsActiveTrueOrderByIdDesc(Integer id, Pageable pageable);
}