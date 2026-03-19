-- V1: Schema inicial do Hort-Sistema
-- Gerado a partir dos modelos JPA — compatível com SQLite

CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    senha_master_hash TEXT    NOT NULL,
    nome_negocio     TEXT
);

CREATE TABLE IF NOT EXISTS usuario (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT    NOT NULL UNIQUE,
    senha_hash   TEXT    NOT NULL,
    cnpj         TEXT    NOT NULL UNIQUE,
    razao_social TEXT    NOT NULL,
    nome_fantasia TEXT   NOT NULL,
    is_active    INTEGER NOT NULL DEFAULT 1,
    criado_em    TEXT    NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT   NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS unidade_medida (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    sigla     TEXT    NOT NULL UNIQUE,
    descricao TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS natureza_operacao (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao                 TEXT    NOT NULL,
    tipo_movimento            TEXT    NOT NULL,
    exige_cliente             INTEGER NOT NULL DEFAULT 0,
    propriedade_cliente       TEXT             DEFAULT 'DESATIVADO',
    exige_valor_unitario      INTEGER NOT NULL DEFAULT 1,
    propriedade_valor_unitario TEXT            DEFAULT 'OBRIGATORIO',
    exige_status              INTEGER NOT NULL DEFAULT 0,
    propriedade_status        TEXT             DEFAULT 'DESATIVADO'
);

CREATE TABLE IF NOT EXISTS cliente (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_pessoa   TEXT    NOT NULL,
    documento     TEXT    UNIQUE,
    razao_social  TEXT    NOT NULL,
    nome_fantasia TEXT,
    endereco      TEXT,
    contato       TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    saldo_credito REAL             DEFAULT 0.00,
    created_at    TEXT             DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produto (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT    NOT NULL UNIQUE,
    descricao       TEXT    NOT NULL,
    unidade_medida_id INTEGER NOT NULL,
    estoque_atual   REAL             DEFAULT 0.000,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT             DEFAULT (datetime('now')),
    FOREIGN KEY (unidade_medida_id) REFERENCES unidade_medida(id)
);

CREATE TABLE IF NOT EXISTS pedido (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    natureza_operacao_id  INTEGER NOT NULL,
    cliente_id            INTEGER,
    documento_referencia  TEXT,
    valor_total           REAL    NOT NULL,
    status                TEXT,
    data_emissao          TEXT             DEFAULT (datetime('now')),
    FOREIGN KEY (natureza_operacao_id) REFERENCES natureza_operacao(id),
    FOREIGN KEY (cliente_id)           REFERENCES cliente(id)
);

CREATE TABLE IF NOT EXISTS item_pedido (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id       INTEGER NOT NULL,
    produto_id      INTEGER NOT NULL,
    quantidade      REAL    NOT NULL,
    valor_unitario  REAL    NOT NULL,
    custo_unitario  REAL    NOT NULL DEFAULT 0.00,
    valor_total     REAL    NOT NULL,
    FOREIGN KEY (pedido_id)  REFERENCES pedido(id),
    FOREIGN KEY (produto_id) REFERENCES produto(id)
);

CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id                INTEGER NOT NULL,
    natureza_operacao_id      INTEGER NOT NULL,
    pedido_id                 INTEGER,
    quantidade                REAL    NOT NULL,
    estoque_apos_movimentacao REAL    NOT NULL,
    data_movimentacao         TEXT             DEFAULT (datetime('now')),
    FOREIGN KEY (produto_id)           REFERENCES produto(id),
    FOREIGN KEY (natureza_operacao_id) REFERENCES natureza_operacao(id),
    FOREIGN KEY (pedido_id)            REFERENCES pedido(id)
);

CREATE TABLE IF NOT EXISTS lote_entrada (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    item_pedido_id       INTEGER NOT NULL,
    produto_id           INTEGER NOT NULL,
    quantidade_original  REAL    NOT NULL,
    quantidade_disponivel REAL   NOT NULL,
    custo_unitario       REAL    NOT NULL,
    data_entrada         TEXT    NOT NULL,
    is_esgotado          INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (item_pedido_id) REFERENCES item_pedido(id),
    FOREIGN KEY (produto_id)     REFERENCES produto(id)
);

CREATE TABLE IF NOT EXISTS lote_saida (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_entrada_id      INTEGER NOT NULL,
    item_pedido_venda_id INTEGER NOT NULL,
    quantidade_consumida REAL    NOT NULL,
    custo_unitario       REAL    NOT NULL,
    FOREIGN KEY (lote_entrada_id)      REFERENCES lote_entrada(id),
    FOREIGN KEY (item_pedido_venda_id) REFERENCES item_pedido(id)
);
