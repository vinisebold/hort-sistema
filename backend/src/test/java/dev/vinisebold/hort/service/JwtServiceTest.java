package dev.vinisebold.hort.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

  private static final String TEST_SECRET = "test-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256-algorithm";

  private JwtService jwtService;

  @BeforeEach
  void setUp() {
    jwtService = new JwtService();
    ReflectionTestUtils.setField(jwtService, "secret", TEST_SECRET);
  }

  // ---------------------------------------------------------------------------
  // generateToken
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("generateToken")
  class GenerateToken {

    @Test
    @DisplayName("Deve gerar um token JWT nao nulo e nao vazio")
    void deveGerarTokenNaoNulo() {
      String token = jwtService.generateToken();

      assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("Deve gerar um token no formato JWT (3 partes separadas por ponto)")
    void deveGerarTokenComFormatoJwt() {
      String token = jwtService.generateToken();

      String[] partes = token.split("\\.");
      assertThat(partes).hasSize(3);
    }

    @Test
    @DisplayName("Deve gerar tokens diferentes a cada chamada")
    void deveGerarTokensDiferentesACadaChamada() throws InterruptedException {
      String token1 = jwtService.generateToken();
      Thread.sleep(1100);
      String token2 = jwtService.generateToken();

      assertThat(token1).isNotEqualTo(token2);
    }
  }

  // ---------------------------------------------------------------------------
  // validateToken
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("validateToken")
  class ValidateToken {

    @Test
    @DisplayName("Deve retornar true para um token valido")
    void deveRetornarTrue_paraTokenValido() {
      String token = jwtService.generateToken();

      boolean resultado = jwtService.validateToken(token);

      assertThat(resultado).isTrue();
    }

    @Test
    @DisplayName("Deve retornar false para um token adulterado")
    void deveRetornarFalse_paraTokenAdulterado() {
      String token = jwtService.generateToken();
      String tokenAdulterado = token.substring(0, token.length() - 5) + "XXXXX";

      boolean resultado = jwtService.validateToken(tokenAdulterado);

      assertThat(resultado).isFalse();
    }

    @Test
    @DisplayName("Deve retornar false para uma string aleatoria")
    void deveRetornarFalse_paraStringAleatoria() {
      boolean resultado = jwtService.validateToken("isso-nao-e-um-token-jwt");

      assertThat(resultado).isFalse();
    }

    @Test
    @DisplayName("Deve retornar false para um token assinado com chave diferente")
    void deveRetornarFalse_paraTokenComChaveDiferente() {
      JwtService outroService = new JwtService();
      ReflectionTestUtils.setField(outroService, "secret",
          "outra-chave-secreta-completamente-diferente-com-256-bits-no-minimo");

      String tokenOutraChave = outroService.generateToken();

      boolean resultado = jwtService.validateToken(tokenOutraChave);

      assertThat(resultado).isFalse();
    }

    @Test
    @DisplayName("Deve retornar false para string vazia")
    void deveRetornarFalse_paraStringVazia() {
      boolean resultado = jwtService.validateToken("");

      assertThat(resultado).isFalse();
    }
  }

  // ---------------------------------------------------------------------------
  // extractSubject
  // ---------------------------------------------------------------------------

  @Nested
  @DisplayName("extractSubject")
  class ExtractSubject {

    @Test
    @DisplayName("Deve extrair 'master' como subject do token")
    void deveExtrairMasterComoSubject() {
      String token = jwtService.generateToken();

      String subject = jwtService.extractSubject(token);

      assertThat(subject).isEqualTo("master");
    }

    @Test
    @DisplayName("Deve extrair o mesmo subject de tokens diferentes")
    void deveExtrairMesmoSubjectDeTokensDiferentes() {
      String token1 = jwtService.generateToken();
      String token2 = jwtService.generateToken();

      assertThat(jwtService.extractSubject(token1)).isEqualTo("master");
      assertThat(jwtService.extractSubject(token2)).isEqualTo("master");
    }
  }
}
