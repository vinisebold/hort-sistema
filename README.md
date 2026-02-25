# Documento de Requisitos de Produto: Hort Sistema

## 1. Visão Geral

O **Hort Sistema** é uma plataforma de tracking digital, gestão financeira e controle de estoque. O foco principal é a versatilidade e a facilidade de uso, entregando uma interface intuitiva que simplifica a operação diária do usuário, eliminando a complexidade de ERPs tradicionais.

## 2. O Problema

Atualmente, a gestão financeira e de estoque do público-alvo é realizada de forma manual (papel ou planilhas isoladas), o que resulta em falta de precisão nos dados. 

* **Impacto:** Perda de tempo operacional, alta incidência de erro humano e falta de base analítica para tomadas de decisão (compras mal planejadas ou vendas não registradas).

## 3. Objetivos do Sistema

* **Centralização:** Consolidar todos os dados de tracking numa única interface.
* **Visibilidade:** Consulta em tempo real do status de vendas, saúde financeira e movimentação de mercadorias.
* **Confiabilidade:** Garantir que o estoque físico corresponda ao digital através de logs rigorosos. 
* **Local-First:** Operação local para garantir privacidade e velocidade de acesso aos dados.

## 4. Personas

* **Administrador:** Proprietário ou gerente que possui acesso total ao sistema, desde cadastros base até relatórios estratégicos de lucratividade.

## 5. Requisitos Funcionais

### RF01: Autenticação

* O sistema deve ser executado localmente (instalação em desktop).
* Login simplificado e seguro para proteção dos dados locais.

### RF02: Modulo de Cadastros

Permitir a criação, edição e visualização de:

* Cadastro de Produtos (Codigo do produto (gerado automatico por padrao com possibilidade de mudar), descricao (O nome do produto), unidade de medida).
* Cadastro de Clientes (Tipo de cadastro: Pessoa Juridica | Fisica, CNPJ ou CPF, Nome/ Razao Social, Nome Fantasia. Endereco, Outras informacoes: E-mail |Telefone | Site )
* Cadastro de Unidades de Medida (KG, UN, CX, SACO, etc..)
* Cadastro Naturezas de operacao (Venda de Mercadoria, Compra de Mercadoria, Devolução, Ajuste de Estoque)

### RF03: Modulo de Operação

* Resumo (Dashboard)
* Pedidos de Venda/Compra

### RF05: Modulo de Operação/Resumo

* Possibilidade de utilizar filtro de periodo: Exibindo: ( Hoje | Ultimos 7 dias | Ultimo mes | Mes anterior | Este ano | Ano anterior )
* Card: Produto mais vendido e quantidade de vendas.
* Card: Cliente mais fiel e quantidade de compras realizadas.
* Card: Total vendido.
* Vendas no periodo, possibilidade de vizualizar 'por dia' ou 'por mes'.
* Card: Top 10 produtos mais vendidos.
* Card: Top 10 produtos mais lucrativos (pizza graph).
* Card: Top 10 clientes mais fieis.
* Card: Top 10 clientes mais lucrativos (pizza graph).

### RF06: Modulo de Operação/Pedidos de Venda/Compra

* Serie/Numero da venda
* Data de emissao da venda.
* Destinatario (Cliente)
* Valor (R$)
* Status (Pago | Pendente)
* Modalidade (A vista | Fiado | Compra de mercadoria)
* Resumo dos itens comprados
* Possibilidades de ver detalhes dos itens comprados ao clicar.

### RF07: Modulo de Estoque

* Deve calcular o estoque atual com base nas compras e nas vendas dos produtos
* Timeline do Produto: Ao selecionar um produto, exibir um histórico cronológico de todas as movimentações.
* Rastreabilidade Reversa: Ao clicar em algum dos registros na timeline deve redirecionar para a pagina de vendas/compras e destacar o lugar do registro. O usuário deve ser redirecionado para o pedido original (Venda ou Compra) com o item destacado.
* Navegação Inteligente: Botão "Voltar" que retorna o usuário exatamente para a posição anterior na timeline de estoque.

## 6. Requisitos Não Funcionais

* **Segurança:** Criptografia de senhas e proteção do banco de dados local.
* **Disponibilidade:** Funcionamento offline (armazenamento local).
* **Interface:** Design limpo, responsivo (mesmo sendo local) e focado em UX (poucos cliques para completar tarefas).
* **Performance:** Consultas de devem responder em menos de 2 segundos.

## 7. Regras de Negócio

* [RN01]: Soft Delete: Nenhum registro (produto, cliente ou venda) deve ser excluído fisicamente do banco de dados. Devem apenas ser marcados como "inativos" ou "ocultos" para preservar a integridade do histórico financeiro.
* [RN02]: Maioria das informacoes no cadastro de clientes devem ser puxadas por meio de uma API gratuita de consulta.
* [RN03] Integridade de Timeline:** Toda alteração de estoque deve estar obrigatoriamente vinculada a uma Natureza de Operação.

## 8. Stack

* Backend: Spring Framework, Spring Boot, Maven | GraalVM.
* Database: SQLite(3?), com algumas libs adicionais.
* Frontend: Tauri (React?)

## 9. Database
```markdown
Table configuracoes_sistema {
id integer [primary key]
senha_master_hash varchar [not null]
nome_negocio varchar
}

Table unidades_medida {
id integer [primary key, increment]
sigla varchar [unique, not null]
descricao varchar
is_active boolean [default: true]
}

Table clientes {
id integer [primary key, increment]
tipo_pessoa varchar [not null]
documento varchar [unique]
razao_social varchar [not null]
nome_fantasia varchar
endereco varchar
telefone varchar
is_active boolean [default: true]
created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table produtos {
id integer [primary key, increment]
codigo varchar [unique, not null]
descricao varchar [not null, note: 'Ex: Tomate Longa Vida, Batata Lavada']
unidade_medida_id integer [not null]
estoque_atual decimal(10,3) [default: 0]
is_active boolean [default: true]
created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table naturezas_operacao {
id integer [primary key]
descricao varchar [not null, note: 'Ex: 1-Venda, 2-Compra, 3-Descarte/Perda, 4-Ajuste Entrada']
tipo_movimento varchar [not null, note: 'ENTRADA ou SAIDA']
gera_financeiro boolean [default: true, note: 'Se false (ex: Descarte), não exige pagamento']
}

Table formas_pagamento {
id integer [primary key, increment]
descricao varchar [not null, note: 'Ex: À Vista, Fiado, PIX']
exige_cliente boolean [default: false]
exige_documento_referencia boolean [default: false]
is_active boolean [default: true]
}

Table pedidos {
id integer [primary key, increment]
natureza_operacao_id integer [not null]

cliente_id integer

forma_pagamento_id integer [not null]

documento_referencia varchar

valor_total decimal(10,2) [not null]
status_pagamento varchar [not null]
data_emissao timestamp [default: `CURRENT_TIMESTAMP`]
}

Table itens_pedido {
id integer [primary key, increment]
pedido_id integer [not null]
produto_id integer [not null]
quantidade decimal(10,3) [not null]
valor_unitario decimal(10,2) [not null]
custo_unitario decimal(10,2) [not null, default: 0, note: 'Calculado via FIFO apenas em Vendas. Sempre 0 em Compras']
valor_total decimal(10,2) [not null]
}

Table movimentacoes_estoque {
id integer [primary key, increment]
produto_id integer [not null]
natureza_operacao_id integer [not null]
pedido_id integer [note: 'Nulo se for apenas um descarte ou ajuste manual']
quantidade decimal(10,3) [not null]
estoque_apos_movimentacao decimal(10,3) [not null]
data_movimentacao timestamp [default: `CURRENT_TIMESTAMP`]
}

Table lotes_entrada {
id integer [primary key, increment]
item_pedido_id integer [not null, note: 'O item de compra que originou este lote']
produto_id integer [not null]
quantidade_original decimal(10,3) [not null]
quantidade_disponivel decimal(10,3) [not null, note: 'Começa igual a quantidade_original, vai a zero conforme vendas consomem']
custo_unitario decimal(10,2) [not null, note: 'O custo exato desta compra, congelado para sempre']
data_entrada timestamp [not null, note: 'Ordena o FIFO. Lote mais antigo sai primeiro']
is_esgotado boolean [default: false, note: 'Flag de conveniência para ignorar lotes zerados nas queries']
}

Table lotes_saidas {
id integer [primary key, increment]
lote_fifo_id integer [not null]
item_pedido_venda_id integer [not null, note: 'O item de venda que gerou este consumo']
quantidade_consumida decimal(10,3) [not null]
custo_unitario decimal(10,2) [not null, note: 'Cópia do custo do lote no momento do consumo']
}

Ref: lotes_entrada.item_pedido_id > itens_pedido.id
Ref: lotes_entrada.produto_id > produtos.id
Ref: lotes_saidas.lote_fifo_id > lotes_entrada.id
Ref: lotes_saidas.item_pedido_venda_id > itens_pedido.id
Ref: pedidos.natureza_operacao_id > naturezas_operacao.id
Ref: pedidos.forma_pagamento_id > formas_pagamento.id
Ref: produtos.unidade_medida_id > unidades_medida.id
Ref: pedidos.cliente_id > clientes.id
Ref: itens_pedido.pedido_id > pedidos.id
Ref: itens_pedido.produto_id > produtos.id
Ref: movimentacoes_estoque.produto_id > produtos.id
Ref: movimentacoes_estoque.natureza_operacao_id > naturezas_operacao.id
Ref: movimentacoes_estoque.pedido_id > pedidos.id

---

## 10. Roadmap de Implementação

### Fase 1 - Backend Core (Prioridade Alta)

#### 1.1 Autenticação (RF01)
- [x] Criar `AuthController` e `AuthService`
- [x] Implementar hash de senha (BCrypt)
- [x] Criar endpoint de login `/api/auth/login`
- [x] Implementar proteção de endpoints (Spring Security ou filtro customizado)
- [x] Criar tabela `configuracoes_sistema` via migration/seed
- [x] Endpoint para configurar senha master no primeiro acesso

#### 1.2 Completar CRUDs
- [x] Adicionar PUT em `ProdutoController`
- [x] Adicionar PUT em `UnidadeMedidaController`
- [x] Adicionar PUT em `FormaPagamentoController`
- [x] Adicionar PUT em `NaturezaOperacaoController`
- [x] Adicionar GET by ID onde faltar

#### 1.3 Dashboard/Resumo (RF05)
- [x] Implementar `DashboardService` com queries
- [x] Endpoint: Card produto mais vendido + quantidade
- [x] Endpoint: Card cliente mais fiel + compras
- [x] Endpoint: Card total vendido no período
- [x] Endpoint: Vendas por dia/mês (gráfico)
- [x] Endpoint: Top 10 produtos mais vendidos
- [x] Endpoint: Top 10 produtos mais lucrativos
- [x] Endpoint: Top 10 clientes mais fiéis
- [x] Endpoint: Top 10 clientes mais lucrativos
- [x] Implementar filtro de período (hoje, 7 dias, mês, ano)

### Fase 2 - Módulo de Estoque (RF07)

- [x] Implementar `EstoqueController`
- [x] Endpoint: Listar produtos com estoque atual
- [x] Endpoint: Timeline de movimentações por produto
- [x] Endpoint: Detalhes da movimentação (link para pedido)
- [x] Implementar Rastreabilidade Reversa
- [x] Criar lógica de navegação "Voltar" para timeline

### Fase 3 - Integrações e Regras de Negócio

- [ ] Integrar API externa para consulta de CPF/CNPJ (RN02)
- [ ] Implementar service de consulta de documento
- [ ] Endpoint: `/api/clientes/consulta-cpf/{cpf}`
- [ ] Endpoint: `/api/clientes/consulta-cnpj/{cnpj}`
- [ ] Popular tabelas de domínio (seed data):
  - [ ] Naturezas de operação padrão
  - [ ] Formas de pagamento padrão
  - [ ] Unidades de medida padrão

### Fase 4 - Frontend (Tauri + React)

- [ ] Inicializar projeto Tauri
- [ ] Configurar React + TypeScript
- [ ] Criar estrutura de pastas frontend
- [ ] Tela de Login
- [ ] Tela de Dashboard com cards e gráficos
- [ ] Telas de Cadastro (Produtos, Clientes, etc.)
- [ ] Tela de Pedidos de Venda/Compra
- [ ] Tela de Estoque com Timeline
- [ ] Implementar navegação inteligente

### Fase 5 - Testes e Qualidade

- [ ] Testes unitários para Services
- [ ] Testes de integração para Controllers
- [ ] Testes do sistema FIFO
- [ ] Validar performance (< 2s por requisito não funcional)
