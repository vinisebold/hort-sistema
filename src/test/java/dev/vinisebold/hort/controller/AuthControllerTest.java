package dev.vinisebold.hort.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.vinisebold.hort.dto.request.LoginRequest;
import dev.vinisebold.hort.dto.request.SetupRequest;
import dev.vinisebold.hort.dto.response.AuthResponse;
import dev.vinisebold.hort.service.AuthService;
import dev.vinisebold.hort.service.JwtService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Disabled
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CorsConfigurationSource corsConfigurationSource;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private SetupRequest criarSetupRequest(String senha) {
        SetupRequest request = new SetupRequest();
        request.setSenha(senha);
        request.setNomeNegocio("Hortifruti do Ze");
        return request;
    }

    private LoginRequest criarLoginRequest(String senha) {
        LoginRequest request = new LoginRequest();
        request.setSenha(senha);
        return request;
    }

    // ---------------------------------------------------------------------------
    // GET /api/auth/status
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/auth/status")
    class Status {

        @Test
        @DisplayName("Deve retornar 200 com primeiroAcesso=true quando nenhuma configuracao existir")
        void deveRetornar200ComPrimeiroAcessoTrue() throws Exception {
            when(authService.verificarPrimeiroAcesso()).thenReturn(true);

            mockMvc.perform(get("/api/auth/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.primeiroAcesso").value(true));
        }

        @Test
        @DisplayName("Deve retornar 200 com primeiroAcesso=false quando sistema ja estiver configurado")
        void deveRetornar200ComPrimeiroAcessoFalse() throws Exception {
            when(authService.verificarPrimeiroAcesso()).thenReturn(false);

            mockMvc.perform(get("/api/auth/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.primeiroAcesso").value(false));
        }
    }

    // ---------------------------------------------------------------------------
    // POST /api/auth/setup
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/setup")
    class Setup {

        @Test
        @DisplayName("Deve retornar 200 com token ao realizar setup com sucesso")
        void deveRetornar200ComToken() throws Exception {
            AuthResponse response = AuthResponse.builder()
                    .token("jwt-token-setup")
                    .primeiroAcesso(false)
                    .build();

            when(authService.setup(any(SetupRequest.class))).thenReturn(response);

            SetupRequest request = criarSetupRequest("minhaSenha123");

            mockMvc.perform(post("/api/auth/setup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("jwt-token-setup"))
                    .andExpect(jsonPath("$.primeiroAcesso").value(false));
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha estiver em branco")
        void deveRetornar400QuandoSenhaEmBranco() throws Exception {
            SetupRequest request = criarSetupRequest("");

            mockMvc.perform(post("/api/auth/setup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha for nula")
        void deveRetornar400QuandoSenhaNula() throws Exception {
            SetupRequest request = criarSetupRequest(null);

            mockMvc.perform(post("/api/auth/setup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    // ---------------------------------------------------------------------------
    // POST /api/auth/login
    // ---------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("Deve retornar 200 com token ao realizar login com sucesso")
        void deveRetornar200ComToken() throws Exception {
            AuthResponse response = AuthResponse.builder()
                    .token("jwt-token-login")
                    .primeiroAcesso(false)
                    .build();

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            LoginRequest request = criarLoginRequest("senhaCorreta");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("jwt-token-login"))
                    .andExpect(jsonPath("$.primeiroAcesso").value(false));
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha estiver incorreta")
        void deveRetornar400QuandoSenhaIncorreta() throws Exception {
            when(authService.login(any(LoginRequest.class)))
                    .thenThrow(new IllegalArgumentException("Senha incorreta."));

            LoginRequest request = criarLoginRequest("senhaErrada");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Bad Request"))
                    .andExpect(jsonPath("$.message").value("Senha incorreta."));
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha estiver em branco")
        void deveRetornar400QuandoSenhaEmBranco() throws Exception {
            LoginRequest request = criarLoginRequest("");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Deve retornar 400 quando senha for nula")
        void deveRetornar400QuandoSenhaNula() throws Exception {
            LoginRequest request = criarLoginRequest(null);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").exists());
        }
    }
}
