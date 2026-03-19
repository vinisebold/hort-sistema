package dev.vinisebold.hort.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  private static final String BEARER_SCHEME = "Bearer";

  @Bean
  public OpenAPI openAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Hort-Sistema API")
            .description(
                "API REST do sistema ERP para hortifruti. Gerencia estoque, pedidos, clientes e financeiro.")
            .version("v1")
            .contact(new Contact()
                .name("Vini Sebold")
                .url("https://github.com/vinisebold")))
        .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
        .components(new Components()
            .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                .name(BEARER_SCHEME)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Informe o token JWT obtido em /api/auth/login ou /api/auth/setup")));
  }
}
