package dev.vinisebold.hort.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Origens permitidas em desenvolvimento
    configuration.setAllowedOrigins(List.of(
        "http://localhost:5173", // Vite dev server
        "http://localhost:3000", // Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"));

    // Métodos permitidos
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

    // Headers permitidos
    configuration.setAllowedHeaders(List.of("*"));

    // Permitir envio de cookies/authorization
    configuration.setAllowCredentials(true);

    // Tempo de cache preflight
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);

    return source;
  }
}
