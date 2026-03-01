package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponse> processarPedido(@Valid @RequestBody PedidoRequest request) {
        PedidoResponse response = pedidoService.processarPedido(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<CursorResponse<PedidoResponse>> listar(
            @RequestParam(required = false) Integer cursor,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(pedidoService.listarTodos(cursor, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponse> buscar(@PathVariable Integer id) {
        return ResponseEntity.ok(pedidoService.buscarPorId(id));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Integer id) {
        pedidoService.cancelarPedido(id);
        return ResponseEntity.noContent().build();
    }
}