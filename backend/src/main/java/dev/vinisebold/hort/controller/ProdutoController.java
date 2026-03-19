package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.ProdutoRequest;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.ProdutoResponse;
import dev.vinisebold.hort.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

  private final ProdutoService service;

  @PostMapping
  public ResponseEntity<ProdutoResponse> criar(@Valid @RequestBody ProdutoRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
  }

  @GetMapping
  public ResponseEntity<CursorResponse<ProdutoResponse>> listar(
      @RequestParam(required = false) Integer cursor,
      @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(service.listarAtivos(cursor, limit));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ProdutoResponse> buscarPorId(@PathVariable Integer id) {
    return ResponseEntity.ok(service.buscarPorId(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ProdutoResponse> atualizar(@PathVariable Integer id,
      @Valid @RequestBody ProdutoRequest request) {
    return ResponseEntity.ok(service.atualizar(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deletar(@PathVariable Integer id) {
    service.deletar(id);
    return ResponseEntity.noContent().build();
  }
}
