package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.AbaterDividaRequest;
import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.response.AbaterDividaResponse;
import dev.vinisebold.hort.dto.response.ClienteFinanceiroResponse;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.dto.response.ConsultaCnpjResponse;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.service.BrasilApiService;
import dev.vinisebold.hort.service.ClienteService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/clientes")
public class ClienteController {

  private final ClienteService clienteService;
  private final BrasilApiService brasilApiService;

  public ClienteController(ClienteService clienteService, BrasilApiService brasilApiService) {
    this.clienteService = clienteService;
    this.brasilApiService = brasilApiService;
  }

  @PostMapping
  public ResponseEntity<ClienteResponse> criar(@Valid @RequestBody ClienteRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.criar(request));
  }

  @GetMapping
  public ResponseEntity<CursorResponse<ClienteResponse>> listar(
      @RequestParam(required = false) Integer cursor,
      @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(clienteService.listarAtivos(cursor, limit));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ClienteResponse> buscar(@PathVariable Integer id) {
    return ResponseEntity.ok(clienteService.buscarPorId(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ClienteResponse> atualizar(@PathVariable Integer id,
      @Valid @RequestBody ClienteRequest request) {
    return ResponseEntity.ok(clienteService.atualizar(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deletar(@PathVariable Integer id) {
    clienteService.deletar(id);
    return ResponseEntity.noContent().build();
  }

  @SuppressWarnings("squid:S5144")
  @GetMapping("/consulta-cnpj/{cnpj}")
  public ResponseEntity<ConsultaCnpjResponse> consultarCnpj(@PathVariable String cnpj) {
    String cnpjSanitizado = cnpj.replaceAll("[^0-9]", "");
    if (cnpjSanitizado.length() != 14) {
      throw new IllegalArgumentException("CNPJ deve conter 14 dígitos.");
    }
    return ResponseEntity.ok(brasilApiService.consultarCnpj(cnpjSanitizado));
  }

  @GetMapping("/buscar-ou-criar-pf")
  public ResponseEntity<ClienteResponse> buscarOuCriarClientePF(@RequestParam String nome) {
    return ResponseEntity.ok(clienteService.buscarOuCriarClientePF(nome));
  }

  @GetMapping("/{id}/financeiro")
  public ResponseEntity<ClienteFinanceiroResponse> obterResumoFinanceiro(@PathVariable Integer id) {
    return ResponseEntity.ok(clienteService.getResumoFinanceiro(id));
  }

  @PostMapping("/{id}/abater-divida")
  public ResponseEntity<AbaterDividaResponse> abaterDivida(
      @PathVariable Integer id,
      @Valid @RequestBody AbaterDividaRequest request) {
    return ResponseEntity.ok(clienteService.abaterDivida(id, request));
  }
}
