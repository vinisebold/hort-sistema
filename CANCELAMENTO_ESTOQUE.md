# Cancelamento de Pedidos e Estoque

## Como funciona o cancelamento

### Fluxo Completo (Backend)

Quando um pedido é cancelado através do endpoint `POST /api/pedidos/{id}/cancelar`, o sistema executa as seguintes etapas:

#### 1. Validação Inicial
```java
// PedidoService.java:227-233
if ("CANCELADO".equalsIgnoreCase(pedido.getStatus())) {
    throw new IllegalStateException("Pedido já está cancelado.");
}
```
- Verifica se o pedido já foi cancelado anteriormente
- Previne múltiplos cancelamentos do mesmo pedido

#### 2. Estorno FIFO (Para pedidos com valor unitário)

##### Pedidos de ENTRADA (Compras)
```java
// PedidoService.java:242-244
if (natureza.getExigeValorUnitario()) {
    fifoService.estornarLoteCompra(item);
}
```

O sistema verifica se o lote pode ser removido:
```java
// FifoService.java:98-100
if (lote.getQuantidadeDisponivel().compareTo(lote.getQuantidadeOriginal()) != 0) {
    throw new IllegalStateException("Não é possível cancelar esta compra pois parte dos produtos já foi vendida. Cancele as vendas primeiro.");
}
```

**Regra importante**: Uma compra só pode ser cancelada se **NENHUMA** unidade foi vendida. Caso contrário, é necessário primeiro cancelar as vendas que consumiram esse lote.

##### Pedidos de SAÍDA (Vendas)
```java
// PedidoService.java:246-248
if (natureza.getExigeValorUnitario()) {
    fifoService.estornarVendaFifo(item);
}
```

O estorno de venda funciona assim:
```java
// FifoService.java:106-118
for (LoteSaida consumo : consumos) {
    LoteEntrada lote = consumo.getLoteEntrada();
    lote.setQuantidadeDisponivel(lote.getQuantidadeDisponivel().add(consumo.getQuantidadeConsumida()));
    if (lote.getIsEsgotado()) {
        lote.setIsEsgotado(false);
    }
    loteEntradaRepository.save(lote);
}
```

- Devolve as quantidades aos lotes de origem (FIFO reverso)
- Reativa lotes que estavam marcados como esgotados
- Permite que essas quantidades sejam vendidas novamente

#### 3. Estorno de Estoque Físico

```java
// EstoqueService.java:59-82
public void estornarMovimentacao(Produto produto, NaturezaOperacao natureza, Pedido pedido, BigDecimal quantidade) {
    BigDecimal novoEstoque;
    
    if (TipoMovimento.ENTRADA.equals(natureza.getTipoMovimento())) {
        // Entrada: subtrai do estoque (reverso)
        novoEstoque = produto.getEstoqueAtual().subtract(quantidade);
    } else {
        // Saída: adiciona de volta ao estoque
        novoEstoque = produto.getEstoqueAtual().add(quantidade);
    }
    
    // Cria movimentação com quantidade NEGATIVA para auditoria
    mov.setQuantidade(quantidade.negate());
    mov.setEstoqueAposMovimentacao(novoEstoque);
}
```

**Movimentações de estorno na timeline:**
- A quantidade é armazenada como **negativa** (`quantidade.negate()`)
- Isso permite identificar visualmente que foi um estorno
- O pedido original continua associado à movimentação de estorno
- Auditoria completa: é possível rastrear o que foi cancelado e quando

#### 4. Atualização do Status
```java
// PedidoService.java:254-255
pedido.setStatus("CANCELADO");
pedidoRepository.save(pedido);
```

### Fluxo Completo (Frontend)

#### Cancelamento pela tela de Pedidos

1. Usuário clica no menu "..." do pedido
2. Seleciona "Cancelar"
3. Confirma no diálogo de aviso:
   ```
   "Esta ação irá estornar o estoque e reverter os lotes FIFO associados a este pedido.
    Esta operação não pode ser desfeita."
   ```
4. Sistema chama `POST /api/pedidos/{id}/cancelar`
5. Lista de pedidos é recarregada
6. Pedido aparece com chip vermelho "CANCELADO"

#### Visualização no Estoque

**Antes do cancelamento:**
```
Produto: Tomate
Estoque Atual: 100 kg

Movimentações:
- Data: 01/03/2026 | Natureza: Compra | Tipo: ENTRADA | Qtd: +50 | Estoque: 50
- Data: 02/03/2026 | Natureza: Venda | Tipo: SAÍDA | Qtd: -20 | Estoque: 30
- Data: 03/03/2026 | Natureza: Compra | Tipo: ENTRADA | Qtd: +70 | Estoque: 100
```

**Após cancelar a venda (Pedido #2):**
```
Produto: Tomate
Estoque Atual: 120 kg

Movimentações:
- Data: 01/03/2026 | Natureza: Compra | Tipo: ENTRADA | Qtd: +50 | Estoque: 50
- Data: 02/03/2026 | Natureza: Venda | Tipo: SAÍDA | Qtd: -20 | Estoque: 30
- Data: 03/03/2026 | Natureza: Compra | Tipo: ENTRADA | Qtd: +70 | Estoque: 100
- Data: 04/03/2026 | Natureza: Venda | Tipo: SAÍDA | Qtd: +20 | Estoque: 120 ← ESTORNO
                                                          ^^^
                                                        POSITIVO!
```

Note que a quantidade do estorno aparece como **positiva** na visualização (pois é o módulo da quantidade negativa armazenada).

### Navegação Estoque → Pedidos

A partir da tela de Estoque, o usuário pode:

1. Expandir um produto para ver suas movimentações
2. Na coluna "Pedido", clicar no ícone 🔗 (Launch) de qualquer movimentação
3. Ser redirecionado para a tela de Pedidos
4. O sistema automaticamente:
   - Rola a página até o pedido específico (scroll suave)
   - Destaca o pedido com background azul claro
   - Remove o destaque após 4 segundos com fade

**Código implementado:**

```typescript
// EstoquePage.tsx - Botão de navegação
<IconButton onClick={() => handleNavigateToPedido(mov.pedidoId!)}>
  <Launch fontSize="small" />
</IconButton>

// PedidosPage.tsx - Scroll e highlight automático
useEffect(() => {
  const state = location.state as { highlightPedidoId?: number }
  if (state?.highlightPedidoId && pedidos.length > 0) {
    const pedidoId = state.highlightPedidoId
    setHighlightedId(pedidoId)
    
    setTimeout(() => {
      const rowElement = pedidoRefs.current[pedidoId]
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    
    setTimeout(() => {
      setHighlightedId(null)
    }, 4000)
  }
}, [pedidos, location.state])
```

## Regras de Negócio

### ✅ Pode cancelar:
- Pedido de venda (sempre, pois devolve ao estoque)
- Pedido de compra que **não foi** vendido (lote totalmente disponível)
- Pedidos com status "PENDENTE" ou "PAGO"

### ❌ Não pode cancelar:
- Pedido já cancelado (status "CANCELADO")
- Pedido de compra cujo lote foi parcial ou totalmente vendido
  - Mensagem de erro: _"Não é possível cancelar esta compra pois parte dos produtos já foi vendida. Cancele as vendas primeiro."_

### Ordem de cancelamento recomendada:
1. Cancelar vendas primeiro (mais recentes)
2. Depois cancelar compras (mais antigas)
3. Seguir a ordem inversa do FIFO

## Exemplos Práticos

### Exemplo 1: Cancelamento Permitido

**Situação:**
- Compra #1: 100 kg de tomate (lote disponível: 100 kg)
- Venda #2: 30 kg de tomate (consumiu do lote #1, restam 70 kg)

**Ação:** Cancelar Venda #2
- ✅ **Permitido**: Devolve 30 kg ao lote #1
- Novo estoque: 100 kg
- Lote #1 disponível: 100 kg

### Exemplo 2: Cancelamento Bloqueado

**Situação:**
- Compra #1: 100 kg de tomate
- Venda #2: 30 kg de tomate (consumiu do lote #1)

**Ação:** Cancelar Compra #1
- ❌ **Bloqueado**: "Não é possível cancelar esta compra pois parte dos produtos já foi vendida. Cancele as vendas primeiro."

**Solução:**
1. Primeiro cancelar Venda #2 → devolve 30 kg ao lote
2. Depois cancelar Compra #1 → remove lote completo

### Exemplo 3: Múltiplas Vendas de um Lote

**Situação:**
- Compra #1: 100 kg de tomate
- Venda #2: 30 kg (consumiu do lote #1)
- Venda #3: 20 kg (consumiu do lote #1)
- Lote #1 disponível: 50 kg

**Ordem correta de cancelamento:**
1. Cancelar Venda #3 → lote disponível: 70 kg
2. Cancelar Venda #2 → lote disponível: 100 kg
3. Cancelar Compra #1 → remove lote

## Auditoria e Rastreabilidade

Todas as movimentações de estorno são registradas:
- **Mantém referência ao pedido original** (`pedidoId`)
- **Quantidade negativa** indica que foi estorno
- **Data de movimentação** registra quando o cancelamento ocorreu
- **Estoque após movimentação** permite reconstruir o histórico

Isso garante:
- ✅ Auditoria completa de todas as operações
- ✅ Possibilidade de gerar relatórios de cancelamentos
- ✅ Rastreamento de quando e por quem foi cancelado (via timestamp)
- ✅ Histórico imutável (não deleta movimentações originais)

## Melhorias Futuras Sugeridas

1. **Permissões de cancelamento**
   - Apenas gerentes podem cancelar pedidos
   - Adicionar campo `canceladoPor` no banco

2. **Motivo de cancelamento**
   - Campo opcional para justificar cancelamento
   - Útil para análise e auditoria

3. **Cancelamento parcial**
   - Permitir cancelar apenas alguns itens do pedido
   - Mais flexibilidade operacional

4. **Notificações**
   - Alertar time financeiro sobre cancelamentos
   - Email/notificação para cliente em vendas

5. **Relatório de cancelamentos**
   - Dashboard com estatísticas de cancelamentos
   - Análise de motivos recorrentes
