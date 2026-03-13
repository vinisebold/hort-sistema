package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.response.DetalheMovimentacaoResponse;
import dev.vinisebold.hort.dto.response.MovimentacaoEstoqueResponse;
import dev.vinisebold.hort.dto.response.ProdutoEstoqueResponse;
import dev.vinisebold.hort.service.EstoqueService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class EstoqueController {

  private final EstoqueService estoqueService;

  @GetMapping("/produtos")
  public ResponseEntity<List<ProdutoEstoqueResponse>> listarProdutosComEstoque() {
    return ResponseEntity.ok(estoqueService.listarProdutosComEstoque());
  }

  @GetMapping("/timeline/{produtoId}")
  public ResponseEntity<List<MovimentacaoEstoqueResponse>> getTimelineProduto(
      @PathVariable Integer produtoId) {
    return ResponseEntity.ok(estoqueService.getTimelineProduto(produtoId));
  }

  @GetMapping("/movimentacao/{movimentacaoId}")
  public ResponseEntity<DetalheMovimentacaoResponse> getDetalheMovimentacao(
      @PathVariable Integer movimentacaoId) {
    return ResponseEntity.ok(estoqueService.getDetalheMovimentacao(movimentacaoId));
  }
}
