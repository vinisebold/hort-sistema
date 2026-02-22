package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.PedidoRequest;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}