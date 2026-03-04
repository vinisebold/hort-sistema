package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.ConsultaCnpjResponse;
import dev.vinisebold.hort.service.BrasilApiService;
import dev.vinisebold.hort.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;
    private final BrasilApiService brasilApiService;

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
    public ResponseEntity<ClienteResponse> atualizar(@PathVariable Integer id, @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        clienteService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/consulta-cnpj/{cnpj}")
    public ResponseEntity<ConsultaCnpjResponse> consultarCnpj(@PathVariable String cnpj) {
        return ResponseEntity.ok(brasilApiService.consultarCnpj(cnpj));
    }

    @GetMapping("/buscar-ou-criar-pf")
    public ResponseEntity<ClienteResponse> buscarOuCriarClientePF(@RequestParam String nome) {
        return ResponseEntity.ok(clienteService.buscarOuCriarClientePF(nome));
    }
}