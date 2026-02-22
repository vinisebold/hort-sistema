package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ProdutoRequest;
import dev.vinisebold.hort.dto.response.ProdutoResponse;
import dev.vinisebold.hort.model.Produto;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.ProdutoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final UnidadeMedidaRepository unidadeMedidaRepository;
    private final UnidadeMedidaService unidadeMedidaService;

    @Transactional
    public ProdutoResponse criar(ProdutoRequest request) {
        if (produtoRepository.existsByCodigo(request.getCodigo())) {
            throw new IllegalArgumentException("Já existe um produto com este código.");
        }

        UnidadeMedida um = unidadeMedidaRepository.findById(request.getUnidadeMedidaId())
                .orElseThrow(() -> new IllegalArgumentException("Unidade de Medida inválida."));

        Produto produto = new Produto();
        produto.setCodigo(request.getCodigo());
        produto.setDescricao(request.getDescricao());
        produto.setUnidadeMedida(um);
        produto.setEstoqueAtual(BigDecimal.ZERO); // Regra de Ouro: Estoque nasce zerado.

        return mapToResponse(produtoRepository.save(produto));
    }

    public List<ProdutoResponse> listarAtivos() {
        return produtoRepository.findAllByIsActiveTrue()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deletar(Integer id) {
        Produto produto = produtoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Não encontrado."));
        produto.setIsActive(false); // Soft Delete
        produtoRepository.save(produto);
    }

    private ProdutoResponse mapToResponse(Produto produto) {
        return ProdutoResponse.builder()
                .id(produto.getId())
                .codigo(produto.getCodigo())
                .descricao(produto.getDescricao())
                .estoqueAtual(produto.getEstoqueAtual())
                .isActive(produto.getIsActive())
                .createdAt(produto.getCreatedAt())
                .unidadeMedida(unidadeMedidaService.mapToResponse(produto.getUnidadeMedida()))
                .build();
    }
}