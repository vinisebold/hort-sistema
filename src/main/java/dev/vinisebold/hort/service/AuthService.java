package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.LoginRequest;
import dev.vinisebold.hort.dto.request.SetupRequest;
import dev.vinisebold.hort.dto.response.AuthResponse;
import dev.vinisebold.hort.model.ConfiguracoesSistema;
import dev.vinisebold.hort.repository.ConfiguracoesSistemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ConfiguracoesSistemaRepository configuracoesSistemaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public boolean verificarPrimeiroAcesso() {
        return configuracoesSistemaRepository.findAll().isEmpty();
    }

    @Transactional
    public AuthResponse setup(SetupRequest request) {
        if (!verificarPrimeiroAcesso()) {
            throw new IllegalStateException("O sistema já foi configurado.");
        }

        ConfiguracoesSistema config = new ConfiguracoesSistema();
        config.setSenhaMasterHash(passwordEncoder.encode(request.getSenha()));
        config.setNomeNegocio(request.getNomeNegocio());
        configuracoesSistemaRepository.save(config);

        String token = jwtService.generateToken();
        return AuthResponse.builder()
                .token(token)
                .primeiroAcesso(false)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        if (verificarPrimeiroAcesso()) {
            throw new IllegalStateException("O sistema ainda não foi configurado.");
        }

        if (!verificarSeSenhaCorreta(request.getSenha())) {
            throw new IllegalArgumentException("Senha incorreta.");
        }

        String token = jwtService.generateToken();
        return AuthResponse.builder()
                .token(token)
                .primeiroAcesso(false)
                .build();
    }

    public boolean verificarSeSenhaCorreta(String senha) {
        return configuracoesSistemaRepository.findAll()
                .stream()
                .findFirst()
                .map(config -> passwordEncoder.matches(senha, config.getSenhaMasterHash()))
                .orElse(false);
    }
}
