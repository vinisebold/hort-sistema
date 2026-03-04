# 🧪 Guia Rápido de Testes - Painel de Detalhe do Cliente

## ⚡ Começando em 5 Minutos

### 1. Acessar a Feature
```
1. Abra o navegador: http://localhost:3000
2. Acesse Cadastros → Clientes
3. Clique no ícone de olho (👁️) em qualquer cliente
4. Você verá o painel de detalhe completo
```

### 2. Testar Visualização de Dados
```
✓ Confirme os 4 cards com valores financeiros:
  - Dívida Total (vermelho)
  - Dívida Este Mês (laranja)
  - Dívida Mês Anterior (roxo)
  - Crédito Disponível (verde)

✓ Verifique tabela com histórico de pedidos
✓ Confirme que está em ordem cronológica (mais antigos primeiro)
✓ Verifique status dos pedidos (PAGO em verde, PENDENTE em amarelo)
```

### 3. Testar Sistema FIFO de Pagamento

#### Teste A: Pagamento completo de um pedido
```
Cenário:
- Cliente tem 3 pedidos pendentes
- Pedido 1: R$ 1.000
- Pedido 2: R$ 500
- Pedido 3: R$ 2.000

Ação:
1. Digite "1000" no campo de pagamento
2. Clique "ABATER DÍVIDA"
3. Observe a notificação (snackbar verde)

Esperado:
✓ Pedido 1 muda para PAGO
✓ Mensagem: "Pagamento registrado! 1 pedido(s) quitado(s)."
✓ Dívida Total reduz para R$ 2.500
✓ Campo de pagamento é limpo
```

#### Teste B: Pagamento com múltiplos pedidos
```
Cenário:
- Mesmos 3 pedidos

Ação:
1. Digite "1800" no campo de pagamento
2. Clique "ABATER DÍVIDA"

Esperado:
✓ Pedido 1 → PAGO (R$ 1.000)
✓ Pedido 2 → PAGO (R$ 500)
✓ Pedido 3 → PENDENTE (usa R$ 300 de crédito)
✓ Mensagem: "2 pedido(s) quitado(s)."
✓ Crédito Disponível mostra R$ 300
```

#### Teste C: Pagamento insuficiente (gera crédito)
```
Cenário:
- 1 pedido de R$ 1.000

Ação:
1. Digite "500" no campo de pagamento
2. Clique "ABATER DÍVIDA"

Esperado:
✓ Pedido continua PENDENTE
✓ Crédito Disponível: R$ 500
✓ Mensagem: "0 pedido(s) quitado(s)."
✓ Próximo pagamento de R$ 600 quitará o pedido
```

#### Teste D: Usar crédito acumulado
```
Cenário:
- Tem R$ 500 de crédito acumulado
- 1 pedido de R$ 1.000

Ação:
1. Digite "600" no campo de pagamento
2. Clique "ABATER DÍVIDA"

Esperado:
✓ Total disponível: R$ 1.100 (600 + 500 crédito)
✓ Pedido muda para PAGO
✓ Novo crédito: R$ 100
```

### 4. Testar Marcar Manualmente como Pago

```
Ação:
1. Localize um pedido com status PENDENTE na tabela
2. Clique no botão "MARCAR PAGO" na coluna Ação
3. Confirme na janela de diálogo

Esperado:
✓ Pedido muda para PAGO imediatamente
✓ Cor da linha muda em tempo real
✓ Dívida Total é atualizada
✓ Snackbar verde: "Pedido marcado como pago"
✓ Não precisa seguir ordem FIFO
```

### 5. Testar Navegação

```
✓ Clique no botão "Voltar" (seta ← no topo)
✓ Retorna para lista de clientes
✓ Selecione outro cliente
✓ Dados do novo cliente carregam corretamente
```

### 6. Testar Responsividade

#### Desktop (> 960px)
```
✓ 4 cards em uma linha
✓ Tabela completa com todas as colunas
✓ Sem scroll horizontal
```

#### Tablet (600-960px)
```
✓ 2 cards por linha
✓ Tabela com scroll horizontal conforme necessário
```

#### Mobile (< 600px)
```
✓ 1 card por linha
✓ Tabela compacta com scroll
✓ Buttons adaptem ao tamanho da tela
```

## 🔍 Testes de Validação

### Campo de Pagamento
```
❌ Digite "abc" → Não deixa enviar
❌ Digite "0" → Snackbar: "Informe um valor válido"
❌ Digite "-100" → Não deixa enviar
✅ Digite "1250.50" → Processa normalmente
```

### Erro de Cliente Inexistente
```
URL: http://localhost:3000/clientes/99999
Esperado:
✓ Mostra mensagem: "Cliente não encontrado"
✓ Sem dados exibidos
✓ Botão voltar funciona
```

## 📊 Testes de Dados

### Verificar Cálculos de Dívida Mensalmente
```
Abra DevTools (F12) → Network → Inspect Response

GET /api/clientes/{id}/financeiro

Verifique que:
✓ dividaMesAtual usa YearMonth.now()
✓ dividaMesAnterior usa YearMonth anterior
✓ Pedidos são filtrados por data corretamente
✓ Status PENDENTE é respeitado
✓ Status PAGO não aparece em dívida
```

### Verificar Crédito Persiste
```
1. Registre pagamento insuficiente (cria crédito de R$ 300)
2. Recarregue a página (F5)
3. Verifique que crédito ainda aparece como R$ 300
✓ Crédito foi salvo no banco de dados
```

## 🚨 Testes de Erro

### Erro de Rede
```
1. Abra DevTools (F12)
2. Vá para Network tab
3. Clique "Offline"
4. Tente registrar pagamento
Esperado:
✓ Snackbar vermelho com erro
✓ Página permanece utilizável
```

### Pedido Já Pago
```
1. Clique "Marcar Pago" em um pedido que já está PAGO
Esperado:
✓ Botão desabilitado (disabled)
✓ Ou snackbar: "Pedido já está pago"
```

## 📈 Testes de Performance

### Carregamento Inicial
```
Tempo esperado: < 2 segundos
✓ Dados carregam rapidamente
✓ Sem travamentos
✓ Tabela renderiza suavemente
```

### Interatividade
```
✓ Clicar em botões é imediato
✓ Snackbars aparecem sem delay
✓ Transições de cor são suaves
```

## 🎯 Casos Edge Case

### Cliente sem pedidos
```
1. Se tiver cliente sem nenhum pedido
2. Acesse o painel
Esperado:
✓ Todos os valores mostram 0
✓ Tabela mostra "Nenhum pedido encontrado"
✓ Sem erros no console
```

### Todos pedidos já pagos
```
1. Se cliente tiver todos pedidos PAGO
Esperado:
✓ Dívida Total: R$ 0
✓ Tabela mostra histórico mas nenhum PENDENTE
✓ Campo de pagamento permanece disponível
```

### Crédito muito grande
```
1. Registre múltiplos pagamentos insuficientes
2. Acumule R$ 10.000 de crédito
Esperado:
✓ Número é exibido corretamente formatado
✓ Sem erros de arredondamento
✓ Próximo pagamento usa crédito corretamente
```

## 🔧 Verificação de API (cURL)

### Teste Endpoint de Financeiro
```bash
curl -X GET http://localhost:8080/api/clientes/1/financeiro \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Resposta esperada: JSON com ClienteFinanceiroResponse

### Teste Endpoint de Abatimento
```bash
curl -X POST http://localhost:8080/api/clientes/1/abater-divida \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valorPago": 1500.00}'
```
Resposta esperada: JSON com AbaterDividaResponse

### Teste Endpoint de Marcar Pago
```bash
curl -X POST http://localhost:8080/api/pedidos/123/marcar-pago \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Resposta esperada: PedidoResponse atualizado

## 📝 Checklist de Testes Completos

### Funcionalidades
- [ ] Visualizar dados financeiros
- [ ] Sistema FIFO com pagamento
- [ ] Acumular crédito
- [ ] Usar crédito em próximos pagamentos
- [ ] Marcar manualmente como pago
- [ ] Histórico de pedidos
- [ ] Navegação para/de cliente

### Interface
- [ ] Cards com cores corretas
- [ ] Tabela ordena cronologicamente
- [ ] Status com chips coloridos
- [ ] Loading spinners funcionam
- [ ] Snackbars aparecem
- [ ] Responsividade mobile/tablet/desktop

### Validações
- [ ] Campo rejeita valores inválidos
- [ ] Mensagens de erro claras
- [ ] Transações atômicas
- [ ] Crédito persiste após reload

### Performance
- [ ] Carregamento < 2s
- [ ] Sem memory leaks
- [ ] Transições suaves
- [ ] Sem console errors

---

## 🎬 Teste Rápido (2 minutos)

```bash
# 1. Acesse a página de clientes
# 2. Clique no olho de um cliente
# 3. Registre pagamento de R$ 1000
# 4. Verifique snackbar verde
# 5. Volte para cliente
# 6. Abra novamente
# 7. Verifique dados atualizados
```

**Se tudo funcionou → ✅ Feature está pronta!**

---

Dúvidas? Consulte `CLIENTE_DETALHE_PANEL.md` para documentação completa.
