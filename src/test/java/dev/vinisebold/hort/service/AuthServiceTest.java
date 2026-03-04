package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.LoginRequest;
import dev.vinisebold.hort.dto.request.SetupRequest;
import dev.vinisebold.hort.dto.response.AuthResponse;
import dev.vinisebold.hort.model.ConfiguracoesSistema;
import dev.vinisebold.hort.repository.ConfiguracoesSistemaRepository;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Disabled
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private ConfiguracoesSistemaRepository configuracoesSistemaRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private ConfiguracoesSistema criarConfigExistente() {
        ConfiguracoesSistema config = new ConfiguracoesSistema();
        config.setId(1);
        config.setSenhaMasterHash("hashed-password");
        config.setNomeNegocio("Minha Loja");
        return config;
    }

    private SetupRequest criarSetupRequest(String senha, String nomeNegocio) {
        SetupRequest request = new SetupRequest();
        request.setSenha(senha);
        request.setNomeNegocio(nomeNegocio);
        return request;
    }

    private LoginRequest criarLoginRequest(String senha) {
        LoginRequest request = new LoginRequest();
        request.setSenha(senha);
        return request;
    }

    // ---------------------------------------------------------------------------
    // verificarPrimeiroAcesso
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("verificarPrimeiroAcesso")
    class VerificarPrimeiroAcesso {

        @Test
        @DisplayName("Deve retornar true quando nenhuma configuracao existir")
        void deveRetornarTrue_quandoRepositorioVazio() {
            when(configuracoesSistemaRepository.findAll()).thenReturn(Collections.emptyList());

            boolean resultado = authService.verificarPrimeiroAcesso();

            assertThat(resultado).isTrue();
            verify(configuracoesSistemaRepository).findAll();
        }

        @Test
        @DisplayName("Deve retornar false quando ja existir configuracao")
        void deveRetornarFalse_quandoJaExistirConfiguracao() {
            when(configuracoesSistemaRepository.findAll())
                    .thenReturn(List.of(criarConfigExistente()));

            boolean resultado = authService.verificarPrimeiroAcesso();

            assertThat(resultado).isFalse();
            verify(configuracoesSistemaRepository).findAll();
        }
    }

    // ---------------------------------------------------------------------------
    // setup
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("setup")
    class Setup {

        @Test
        @DisplayName("Deve criar configuracao e retornar token no primeiro acesso")
        void deveCriarConfigERetornarToken_noPrimeiroAcesso() {
            when(configuracoesSistemaRepository.findAll()).thenReturn(Collections.emptyList());
            when(passwordEncoder.encode("minhaSenha123")).thenReturn("encoded-hash");
            when(jwtService.generateToken()).thenReturn("jwt-token-gerado");

            SetupRequest request = criarSetupRequest("minhaSenha123", "Hortifruti do Ze");

            AuthResponse response = authService.setup(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token-gerado");
            assertThat(response.isPrimeiroAcesso()).isFalse();

            ArgumentCaptor<ConfiguracoesSistema> captor = ArgumentCaptor.forClass(ConfiguracoesSistema.class);
            verify(configuracoesSistemaRepository).save(captor.capture());

            ConfiguracoesSistema configSalva = captor.getValue();
            assertThat(configSalva.getSenhaMasterHash()).isEqualTo("encoded-hash");
            assertThat(configSalva.getNomeNegocio()).isEqualTo("Hortifruti do Ze");

            verify(passwordEncoder).encode("minhaSenha123");
            verify(jwtService).generateToken();
        }

        @Test
        @DisplayName("Deve lancar IllegalStateException quando sistema ja estiver configurado")
        void deveLancarExcecao_quandoSistemaJaConfigurado() {
            when(configuracoesSistemaRepository.findAll())
                    .thenReturn(List.of(criarConfigExistente()));

            SetupRequest request = criarSetupRequest("senha", "Loja");

            assertThatThrownBy(() -> authService.setup(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("O sistema já foi configurado.");

            verify(configuracoesSistemaRepository, never()).save(any());
            verify(jwtService, never()).generateToken();
        }
    }

    // ---------------------------------------------------------------------------
    // login
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("Deve retornar token quando credenciais estiverem corretas")
        void deveRetornarToken_quandoSenhaCorreta() {
            ConfiguracoesSistema config = criarConfigExistente();
            when(configuracoesSistemaRepository.findAll()).thenReturn(List.of(config));
            when(passwordEncoder.matches("senhaCorreta", config.getSenhaMasterHash()))
                    .thenReturn(true);
            when(jwtService.generateToken()).thenReturn("jwt-token-login");

            LoginRequest request = criarLoginRequest("senhaCorreta");

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token-login");
            assertThat(response.isPrimeiroAcesso()).isFalse();

            verify(jwtService).generateToken();
        }

        @Test
        @DisplayName("Deve lancar IllegalStateException quando sistema nao estiver configurado")
        void deveLancarExcecao_quandoSistemaNaoConfigurado() {
            when(configuracoesSistemaRepository.findAll()).thenReturn(Collections.emptyList());

            LoginRequest request = criarLoginRequest("qualquerSenha");

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("O sistema ainda não foi configurado.");

            verify(jwtService, never()).generateToken();
        }

        @Test
        @DisplayName("Deve lancar IllegalArgumentException quando senha estiver incorreta")
        void deveLancarExcecao_quandoSenhaIncorreta() {
            ConfiguracoesSistema config = criarConfigExistente();
            when(configuracoesSistemaRepository.findAll()).thenReturn(List.of(config));
            when(passwordEncoder.matches("senhaErrada", config.getSenhaMasterHash()))
                    .thenReturn(false);

            LoginRequest request = criarLoginRequest("senhaErrada");

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Senha incorreta.");

            verify(jwtService, never()).generateToken();
        }
    }

    // ---------------------------------------------------------------------------
    // verificarSeSenhaCorreta
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("verificarSeSenhaCorreta")
    class VerificarSeSenhaCorreta {

        @Test
        @DisplayName("Deve retornar true quando a senha corresponder ao hash")
        void deveRetornarTrue_quandoSenhaCorresponder() {
            ConfiguracoesSistema config = criarConfigExistente();
            when(configuracoesSistemaRepository.findAll()).thenReturn(List.of(config));
            when(passwordEncoder.matches("senhaCorreta", "hashed-password")).thenReturn(true);

            boolean resultado = authService.verificarSeSenhaCorreta("senhaCorreta");

            assertThat(resultado).isTrue();
            verify(passwordEncoder).matches("senhaCorreta", "hashed-password");
        }

        @Test
        @DisplayName("Deve retornar false quando a senha nao corresponder ao hash")
        void deveRetornarFalse_quandoSenhaNaoCorresponder() {
            ConfiguracoesSistema config = criarConfigExistente();
            when(configuracoesSistemaRepository.findAll()).thenReturn(List.of(config));
            when(passwordEncoder.matches("senhaErrada", "hashed-password")).thenReturn(false);

            boolean resultado = authService.verificarSeSenhaCorreta("senhaErrada");

            assertThat(resultado).isFalse();
            verify(passwordEncoder).matches("senhaErrada", "hashed-password");
        }

        @Test
        @DisplayName("Deve retornar false quando nao existir configuracao no repositorio")
        void deveRetornarFalse_quandoNenhumaConfiguracaoExistir() {
            when(configuracoesSistemaRepository.findAll()).thenReturn(Collections.emptyList());

            boolean resultado = authService.verificarSeSenhaCorreta("qualquerSenha");

            assertThat(resultado).isFalse();
            verify(passwordEncoder, never()).matches(anyString(), anyString());
        }
    }
}
