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

## 9. Roadmap

- [ ] Estrutura de Banco de Dados e Cadastros Base (RF02)
- [ ] Motor de Vendas/Compras e Lógica de Estoque (RF03 e RF05).
- [ ] Dashboard Analítico e Interface de Timeline (RF04).
