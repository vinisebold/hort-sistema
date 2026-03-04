# Painel de Detalhe do Cliente - Gerenciamento de Dívidas

## 📋 Visão Geral

O **Painel de Detalhe do Cliente** é uma nova funcionalidade que permite visualizar e gerenciar as dívidas de clientes individuais de forma intuitiva e eficiente. O sistema utiliza a estratégia **FIFO (First In, First Out)** para processar pagamentos, abatendo sempre os pedidos mais antigos primeiro.

## 🎯 Funcionalidades Principais

### 1. **Visualização de Dados Financeiros**
- **Dívida Total**: Soma de todos os pedidos com status PENDENTE
- **Dívida do Mês Atual**: Soma dos pedidos PENDENTE emitidos no mês atual
- **Dívida do Mês Anterior**: Soma dos pedidos PENDENTE emitidos no mês anterior
- **Crédito Disponível**: Saldo de crédito acumulado do cliente

### 2. **Sistema de Abatimento de Dívida (FIFO)**
O cliente pode registrar um pagamento informando o valor. O sistema:
1. Busca todos os pedidos PENDENTES ordenados cronologicamente (mais antigos primeiro)
2. Abate sequencialmente cada pedido até que o valor se esgote
3. Se o valor for insuficiente para quitar um pedido, o saldo vira crédito
4. Esse crédito é automaticamente utilizado no próximo pagamento

**Exemplo:**
```
Pedido 1: R$ 1.500 (01/01)
Pedido 2: R$ 500 (15/01)
Pedido 3: R$ 2.000 (01/02)

Pagamento: R$ 2.800

Resultado:
- Pedido 1 → PAGO (R$ 1.500)
- Pedido 2 → PAGO (R$ 500)
- Pedido 3 → PENDENTE (usa R$ 800 do crédito)
- Saldo de crédito: R$ 0
```

### 3. **Histórico Completo de Pedidos**
Tabela exibindo:
- Número do pedido (ID)
- Data de emissão
- Documento de referência
- Valor total
- Status (PAGO/PENDENTE)
- Ação rápida para marcar como pago individualmente

### 4. **Marcar Pedido Manualmente como Pago**
É possível clicar em qualquer pedido PENDENTE e marcá-lo como PAGO sem seguir a ordem FIFO, útil para:
- Ajustes manuais
- Informações incorretas no sistema
- Pagamentos já realizados não registrados

## 🔗 Acesso à Funcionalidade

### Via Menu Principal
1. Abra o menu lateral
2. Acesse **Cadastros → Clientes**
3. Na tabela de clientes, clique no ícone de **olho** (Visibility) para ver detalhes

### URL Direta
```
http://localhost:3000/clientes/{id}
```
Onde `{id}` é o ID numérico do cliente.

## 📊 Estrutura de Dados

### Cliente (Modelo)
Novo campo adicionado:
```java
@Column(precision = 10, scale = 2)
private BigDecimal saldoCredito = BigDecimal.ZERO;
```

### DTOs de Request/Response

#### `ClienteFinanceiroResponse`
```json
{
  "cliente": { /* ClienteResponse */ },
  "dividaTotal": 6000.00,
  "dividaMesAtual": 4000.00,
  "dividaMesAnterior": 2000.00,
  "saldoCredito": 200.00,
  "totalPedidosPendentes": 3,
  "totalPedidosPagos": 5,
  "historicoPedidos": [ /* array de PedidoResponse */ ]
}
```

#### `AbaterDividaRequest`
```json
{
  "valorPago": 2800.00
}
```

#### `AbaterDividaResponse`
```json
{
  "pedidosQuitados": [1, 2],
  "valorUtilizado": 2800.00,
  "creditoAdicionado": 0.00,
  "novoSaldoCredito": 0.00,
  "novaDividaTotal": 2000.00
}
```

## 🔌 API Endpoints

### GET `/api/clientes/{clienteId}/financeiro`
Retorna o resumo financeiro completo do cliente.

**Resposta:** `ClienteFinanceiroResponse`

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/clientes/1/financeiro \
  -H "Authorization: Bearer {token}"
```

### POST `/api/clientes/{clienteId}/abater-divida`
Processa um pagamento utilizando a estratégia FIFO.

**Body:** `AbaterDividaRequest`
```json
{
  "valorPago": 2800.00
}
```

**Resposta:** `AbaterDividaResponse`

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/clientes/1/abater-divida \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"valorPago": 2800.00}'
```

### POST `/api/pedidos/{pedidoId}/marcar-pago`
Marca um pedido específico como PAGO (ignora FIFO).

**Resposta:** `PedidoResponse`

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/pedidos/123/marcar-pago \
  -H "Authorization: Bearer {token}"
```

## 🛠 Alterações Técnicas

### Backend
- **`Cliente.java`**: Adicionado campo `saldoCredito`
- **`ClienteService.java`**: 
  - `getResumoFinanceiro(Integer clienteId)`: Calcula dados financeiros
  - `abaterDivida(Integer clienteId, AbaterDividaRequest request)`: Processa FIFO
- **`PedidoService.java`**: 
  - `marcarComoPago(Integer pedidoId)`: Marca pedido como pago
- **`ClienteController.java`**: Novos endpoints para financeiro
- **`PedidoController.java`**: Novo endpoint para marcar como pago
- **`PedidoRepository.java`**: Novas queries para filtrar por cliente e status

### Frontend
- **`ClienteDetalhePage.tsx`**: Nova página completa do painel
- **`ClientesPage.tsx`**: Adicionado botão "Ver detalhes"
- **`App.tsx`**: Nova rota `/clientes/:id`
- **`api.ts`**: Novos métodos para chamar endpoints
- **`types/index.ts`**: Novos tipos TypeScript

## 🎨 Interface de Usuário

### Layout Responsivo
- **Desktop**: 4 cards em linha, tabela completa
- **Tablet**: 2 cards por linha, tabela com scroll horizontal
- **Mobile**: 1 card por linha, tabela compacta

### Cores
- **Dívida**: Vermelho (#c62828)
- **Mês Atual**: Laranja (#f57f17)
- **Mês Anterior**: Roxo (#6a1b9a)
- **Crédito**: Verde (#2e7d32)

### Estados de Carregamento
- Spinner durante carregamento de dados
- Desabilitar inputs durante processamento
- Snackbar com feedback de sucesso/erro

## ⚠️ Validações

1. **Valor do Pagamento**:
   - Deve ser maior que zero
   - Aceita números decimais
   - Valida no backend com `@Positive`

2. **Cliente**:
   - Deve existir no banco
   - Retorna erro 404 se não encontrado

3. **Pedidos**:
   - Apenas pedidos com status PENDENTE são considerados para FIFO
   - Pedidos CANCELADO são ignorados
   - Validação de transação atômica

## 📝 Exemplos de Uso

### Cenário 1: Cliente com múltiplos pedidos pendentes
```
Cliente: João Silva (ID: 5)
Pedidos Pendentes:
- Pedido #101: R$ 1.000 (01/01/2026)
- Pedido #102: R$ 500 (15/01/2026)
- Pedido #103: R$ 1.500 (01/02/2026)

Ação: Registra pagamento de R$ 1.200
Resultado:
- Pedido #101: PAGO (R$ 1.000)
- Pedido #102: PAGO (R$ 200)
- Pedido #103: PENDENTE (R$ 1.300)
- Crédito: R$ 0
```

### Cenário 2: Pagamento com crédito acumulado
```
Cliente já tem R$ 500 de crédito
Novo pagamento: R$ 1.000
Total disponível: R$ 1.500

Resultado: Processa R$ 1.500 em abatimentos sequenciais
```

### Cenário 3: Marcar manualmente como pago
```
Usuário clica em "Marcar Pago" no Pedido #102
Status muda para PAGO imediatamente
(Não segue ordem FIFO)
```

## 🚨 Tratamento de Erros

| Erro | Mensagem | Ação |
|------|----------|------|
| Cliente não encontrado | "Cliente não encontrado" | Retorna 404 |
| Valor inválido | "Valor deve ser maior que zero" | Snackbar warning |
| Pedido já pago | "Pedido já está pago" | Snackbar error |
| Erro de rede | "Erro ao processar pagamento" | Snackbar error |

## 🔐 Segurança

- Todos os endpoints requerem autenticação JWT
- Validação de ID do cliente (usuário só vê seus próprios clientes)
- Transações atômicas para abatimento de múltiplos pedidos
- Soft delete respeitado (clientes inativos ignorados)

## 📋 Checklist de Funcionalidades

- ✅ Visualização de dívida total
- ✅ Visualização de dívida por mês
- ✅ Visualização de crédito disponível
- ✅ Sistema FIFO de pagamento
- ✅ Acúmulo de crédito
- ✅ Histórico cronológico de pedidos
- ✅ Marcação individual de pagamento
- ✅ Formatação de moeda brasileira
- ✅ Formatação de datas em pt-BR
- ✅ Responsividade
- ✅ Tratamento de erros
- ✅ Feedback ao usuário (snackbars)
- ✅ Validações de entrada

## 🔄 Fluxo de Dados

```
ClienteDetalhePage
    ↓
    ├─→ useEffect (ao montar)
    │   ↓
    │   clientesApi.getResumoFinanceiro()
    │   ↓
    │   Backend: GET /api/clientes/{id}/financeiro
    │   ↓
    │   ClienteService.getResumoFinanceiro()
    │   ↓
    │   Retorna: ClienteFinanceiroResponse
    │
    ├─→ handleAbaterDivida()
    │   ↓
    │   clientesApi.abaterDivida()
    │   ↓
    │   Backend: POST /api/clientes/{id}/abater-divida
    │   ↓
    │   ClienteService.abaterDivida() [FIFO logic]
    │   ↓
    │   Retorna: AbaterDividaResponse
    │   ↓
    │   Reload: loadClienteFinanceiro()
    │
    └─→ handleMarcarComoPago()
        ↓
        pedidosApi.marcarComoPago()
        ↓
        Backend: POST /api/pedidos/{id}/marcar-pago
        ↓
        PedidoService.marcarComoPago()
        ↓
        Reload: loadClienteFinanceiro()
```

## 📚 Documentação Relacionada

- `PedidoService.java`: Lógica de pedidos
- `ClienteService.java`: Serviço de clientes
- `PedidosPage.tsx`: Página de pedidos (UI reference)
- `DashboardPage.tsx`: Dashboard financeiro

## 🤝 Contribuições

Para melhorias futuras considere:
1. Relatório em PDF com histórico de pagamentos
2. Gráfico temporal de dívida
3. Alertas de dívida vencida
4. Parcelamento automático
5. Exportação de dados em Excel
