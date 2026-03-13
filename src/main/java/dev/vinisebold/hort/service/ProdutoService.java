package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ProdutoRequest;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.ProdutoResponse;
import dev.vinisebold.hort.model.Produto;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.ProdutoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProdutoService {

  private final ProdutoRepository produtoRepository;
  private final UnidadeMedidaRepository unidadeMedidaRepository;
  private final UnidadeMedidaService unidadeMedidaService;

  @Transactional
  public ProdutoResponse criar(ProdutoRequest request) {
    String codigo = request.getCodigo();

    // Se o código não foi fornecido, gera um automaticamente
    if (codigo == null || codigo.trim().isEmpty()) {
      codigo = gerarCodigoProduto();
    } else {
      // Se foi fornecido, verifica se já existe
      if (produtoRepository.existsByCodigo(codigo)) {
        throw new IllegalArgumentException("Já existe um produto com este código.");
      }
    }

    UnidadeMedida um = unidadeMedidaRepository.findById(request.getUnidadeMedidaId())
        .orElseThrow(() -> new IllegalArgumentException("Unidade de Medida inválida."));

    Produto produto = new Produto();
    produto.setCodigo(codigo);
    produto.setDescricao(request.getDescricao());
    produto.setUnidadeMedida(um);
    produto.setEstoqueAtual(BigDecimal.ZERO); // Regra de Ouro: Estoque nasce zerado.

    return mapToResponse(produtoRepository.save(produto));
  }

  private String gerarCodigoProduto() {
    // Gera código incremental: 1, 2, 3, 4, 5...
    long proximoNumero = produtoRepository.count() + 1;
    return String.valueOf(proximoNumero);
  }

  public CursorResponse<ProdutoResponse> listarAtivos(Integer cursor, int limit) {
    Pageable pageable = PageRequest.of(0, limit);
    Page<Produto> page;

    if (cursor != null) {
      page = produtoRepository.findByIdLessThanAndIsActiveTrueOrderByIdDesc(cursor, pageable);
    } else {
      page = produtoRepository.findAllByIsActiveTrueOrderByIdDesc(pageable);
    }

    List<ProdutoResponse> data = page.getContent()
        .stream().map(this::mapToResponse).collect(Collectors.toList());

    Integer nextCursor = data.isEmpty() ? null : data.getLast().getId();

    return CursorResponse.<ProdutoResponse> builder()
        .data(data)
        .totalCount(page.getTotalElements())
        .nextCursor(nextCursor)
        .hasNext(page.hasNext())
        .build();
  }

  public ProdutoResponse buscarPorId(Integer id) {
    Produto produto = produtoRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
    return mapToResponse(produto);
  }

  @Transactional
  public ProdutoResponse atualizar(Integer id, ProdutoRequest request) {
    Produto produto = produtoRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));

    UnidadeMedida um = unidadeMedidaRepository.findById(request.getUnidadeMedidaId())
        .orElseThrow(() -> new IllegalArgumentException("Unidade de Medida inválida."));

    produto.setCodigo(request.getCodigo());
    produto.setDescricao(request.getDescricao());
    produto.setUnidadeMedida(um);

    return mapToResponse(produtoRepository.save(produto));
  }

  @Transactional
  public void deletar(Integer id) {
    Produto produto = produtoRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Não encontrado."));
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
