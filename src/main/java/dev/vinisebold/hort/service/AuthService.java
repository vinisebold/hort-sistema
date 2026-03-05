package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.LoginRequest;
import dev.vinisebold.hort.dto.request.RegisterRequest;
import dev.vinisebold.hort.dto.request.SetupRequest;
import dev.vinisebold.hort.dto.response.AuthResponse;
import dev.vinisebold.hort.model.ConfiguracoesSistema;
import dev.vinisebold.hort.model.Usuario;
import dev.vinisebold.hort.repository.ConfiguracoesSistemaRepository;
import dev.vinisebold.hort.repository.UsuarioRepository;
import dev.vinisebold.hort.validator.CnpjValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final ConfiguracoesSistemaRepository configuracoesSistemaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BrasilApiService brasilApiService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validar CNPJ
        String cnpjLimpo = request.getCnpj().replaceAll("\\D", "");
        if (!CnpjValidator.isValid(cnpjLimpo)) {
            throw new IllegalArgumentException("CNPJ inválido.");
        }

        // Validar email único
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado.");
        }

        // Validar CNPJ único
        if (usuarioRepository.existsByCnpj(cnpjLimpo)) {
            throw new IllegalArgumentException("CNPJ já cadastrado.");
        }

        // Buscar dados da empresa na API
        var empresaData = brasilApiService.consultarCnpj(cnpjLimpo);

        // Criar novo usuário
        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setSenhaHash(passwordEncoder.encode(request.getSenha()));
        usuario.setCnpj(cnpjLimpo);
        usuario.setRazaoSocial(empresaData.getRazaoSocial());
        usuario.setNomeFantasia(empresaData.getNomeFantasia());
        usuario.setIsActive(true);

        usuario = usuarioRepository.save(usuario);

        String token = jwtService.generateToken();
        return AuthResponse.builder()
                .token(token)
                .usuarioId(usuario.getId())
                .email(usuario.getEmail())
                .cnpj(usuario.getCnpj())
                .nomeFantasia(usuario.getNomeFantasia())
                .razaoSocial(usuario.getRazaoSocial())
                .primeiroAcesso(false)
                .build();
    }

     public AuthResponse login(LoginRequest request) {
         // Buscar usuário pelo email
         Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                 .orElseThrow(() -> new IllegalArgumentException("Email ou senha incorretos."));
 
         // Validar senha
         if (!passwordEncoder.matches(request.getSenha(), usuario.getSenhaHash())) {
             throw new IllegalArgumentException("Email ou senha incorretos.");
         }
 
         String token = jwtService.generateToken();
         return AuthResponse.builder()
                 .token(token)
                 .usuarioId(usuario.getId())
                 .email(usuario.getEmail())
                 .cnpj(usuario.getCnpj())
                 .nomeFantasia(usuario.getNomeFantasia())
                 .razaoSocial(usuario.getRazaoSocial())
                 .primeiroAcesso(false)
                 .build();
     }
 
     public boolean verificarPrimeiroAcesso() {
         return configuracoesSistemaRepository.findAll().isEmpty();
     }
 
     @Transactional
     public AuthResponse setup(SetupRequest request) {
         // Verificar se já existe configuração
         if (!verificarPrimeiroAcesso()) {
             throw new IllegalStateException("O sistema já foi configurado.");
         }
 
         // Criar nova configuração
         ConfiguracoesSistema config = new ConfiguracoesSistema();
         config.setSenhaMasterHash(passwordEncoder.encode(request.getSenha()));
         config.setNomeNegocio(request.getNomeNegocio());
         configuracoesSistemaRepository.save(config);
 
         // Gerar token
         String token = jwtService.generateToken();
         return AuthResponse.builder()
                 .token(token)
                 .primeiroAcesso(false)
                 .build();
     }
 
     public boolean verificarSeSenhaCorreta(String senha) {
         var configs = configuracoesSistemaRepository.findAll();
         if (configs.isEmpty()) {
             return false;
         }
 
         ConfiguracoesSistema config = configs.get(0);
         return passwordEncoder.matches(senha, config.getSenhaMasterHash());
     }
 }

