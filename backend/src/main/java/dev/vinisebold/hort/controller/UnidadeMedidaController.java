package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.UnidadeMedidaRequest;
import dev.vinisebold.hort.dto.response.UnidadeMedidaResponse;
import dev.vinisebold.hort.service.UnidadeMedidaService;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/unidades-medida")
@RequiredArgsConstructor
public class UnidadeMedidaController {

  private final UnidadeMedidaService service;

  @PostMapping
  public ResponseEntity<UnidadeMedidaResponse> criar(
      @Valid @RequestBody UnidadeMedidaRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
  }

  @GetMapping
  public ResponseEntity<List<UnidadeMedidaResponse>> listar() {
    return ResponseEntity.ok(service.listarAtivos());
  }

  @GetMapping("/{id}")
  public ResponseEntity<UnidadeMedidaResponse> buscarPorId(@PathVariable Integer id) {
    return ResponseEntity.ok(service.buscarPorId(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<UnidadeMedidaResponse> atualizar(@PathVariable Integer id,
      @Valid @RequestBody UnidadeMedidaRequest request) {
    return ResponseEntity.ok(service.atualizar(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deletar(@PathVariable Integer id) {
    service.deletar(id);
    return ResponseEntity.noContent().build();
  }
}
