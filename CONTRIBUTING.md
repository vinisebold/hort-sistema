# Guia de Contribuição — Hort-Sistema

## Configuração inicial

### 1. Pré-requisitos
- Java 25 (recomendado via [SDKMAN](https://sdkman.io/))
- Maven instalado localmente (`mvn`) para executar o backend

### 2. Clone e configure

```bash
git clone <repo>
cd hort-sistema

# Copie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite .env e preencha JWT_SECRET com uma chave segura

# Instale os git hooks locais
git config core.hooksPath .githooks
```

### 3. Executar o projeto

```bash
mvn -f backend/pom.xml spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

A documentação Swagger estará em `http://localhost:8080/swagger-ui/index.html`.

### 4. Rodar os testes

```bash
mvn -f backend/pom.xml test
```

### 5. Verificar cobertura de testes

```bash
mvn -f backend/pom.xml verify
# Relatório em: backend/target/site/jacoco/index.html
```

### 6. Formatar código automaticamente

```bash
mvn -f backend/pom.xml spotless:apply
```

### 7. Verificar estilo (sem corrigir)

```bash
mvn -f backend/pom.xml checkstyle:check
mvn -f backend/pom.xml spotless:check
```

## Git Hooks

Os hooks em `.githooks/` são ativados com:

```bash
git config core.hooksPath .githooks
```

| Hook | Quando executa | O que faz |
|---|---|---|
| `pre-commit` | A cada `git commit` | Verifica formatação (Spotless) + estilo (Checkstyle) |
| `pre-push` | A cada `git push` | Roda todos os testes |

## Padrão de commits

Use commits semânticos:

```
feat: adiciona endpoint de relatório financeiro
fix: corrige cálculo FIFO quando lote está esgotado
refactor: extrai lógica de CNPJ para util
test: adiciona testes para PedidoService
docs: atualiza README com instruções de deploy
```

## Estrutura do Projeto

```
backend/src/main/java/dev/vinisebold/hort/
├── config/        — Configurações Spring (Security, CORS, JWT filter, OpenAPI)
├── controller/    — Endpoints REST + GlobalExceptionHandler
├── dto/           — Request/Response DTOs
├── model/         — Entidades JPA
├── repository/    — Spring Data JPA repositories
├── service/       — Lógica de negócio
├── util/          — Utilitários (formatação CPF/CNPJ)
└── validator/     — Validadores customizados

backend/src/main/resources/
├── application.yaml          — Configuração principal
├── db/migration/             — Scripts Flyway (V1__, V2__, ...)
└── logback-spring.xml        — Configuração de logging
```
