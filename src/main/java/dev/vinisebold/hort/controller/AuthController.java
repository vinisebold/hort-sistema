package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.request.LoginRequest;
import dev.vinisebold.hort.dto.request.RegisterRequest;
import dev.vinisebold.hort.dto.request.SetupRequest;
import dev.vinisebold.hort.dto.response.AuthResponse;
import dev.vinisebold.hort.service.AuthService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> status() {
    Map<String, Object> response = new HashMap<>();
    response.put("primeiroAcesso", authService.verificarPrimeiroAcesso());
    return ResponseEntity.ok(response);
  }

  @SuppressWarnings("squid:S5144")
  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(authService.register(request));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/setup")
  public ResponseEntity<AuthResponse> setup(@Valid @RequestBody SetupRequest request) {
    return ResponseEntity.ok(authService.setup(request));
  }
}
