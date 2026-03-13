-- V2: Dados padrão do sistema
-- Naturezas de operação e unidades de medida iniciais
-- Idempotente: usa INSERT OR IGNORE para não duplicar

INSERT OR IGNORE INTO natureza_operacao (id, descricao, tipo_movimento, exige_cliente, propriedade_cliente, exige_valor_unitario, propriedade_valor_unitario, exige_status, propriedade_status)
VALUES
    (1, 'Venda de Mercadoria',  'SAIDA',   1, 'OBRIGATORIO', 1, 'OBRIGATORIO', 1, 'OBRIGATORIO'),
    (2, 'Compra de Mercadoria', 'ENTRADA', 0, 'DESATIVADO',  1, 'OBRIGATORIO', 0, 'DESATIVADO'),
    (3, 'Quebra de Mercadoria', 'SAIDA',   0, 'DESATIVADO',  0, 'DESATIVADO',  0, 'DESATIVADO'),
    (4, 'Ajuste de Entrada',    'ENTRADA', 0, 'DESATIVADO',  0, 'DESATIVADO',  0, 'DESATIVADO');

INSERT OR IGNORE INTO unidade_medida (id, sigla, descricao, is_active)
VALUES
    (1, 'KG',   'Quilograma', 1),
    (2, 'SACO', 'Saco',       1),
    (3, 'UN',   'Unidade',    1);
