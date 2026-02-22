package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.NaturezaOperacaoRequest;
import dev.vinisebold.hort.dto.response.NaturezaOperacaoResponse;
import dev.vinisebold.hort.service.NaturezaOperacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/naturezas-operacao")
@RequiredArgsConstructor
public class NaturezaOperacaoController {

    private final NaturezaOperacaoService service;

    @PostMapping
    public ResponseEntity<NaturezaOperacaoResponse> criar(@Valid @RequestBody NaturezaOperacaoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @GetMapping
    public ResponseEntity<List<NaturezaOperacaoResponse>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }
}