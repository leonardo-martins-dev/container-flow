-- ============================================================================
-- SEED DATA - Dados iniciais para o sistema
-- ============================================================================

-- ============================================================================
-- TIPOS DE CONTAINER
-- ============================================================================
INSERT INTO tipos_container (codigo, nome, descricao, tamanho, tipo, capacidade_m3, peso_maximo_kg) VALUES
('20DRY', 'Container 20 Dry', 'Container padrão 20 pés seco', '20', 'DRY', 33.2, 28180),
('40DRY', 'Container 40 Dry', 'Container padrão 40 pés seco', '40', 'DRY', 67.7, 28600),
('40HC', 'Container 40 High Cube', 'Container 40 pés alto', '40', 'DRY', 76.4, 28600),
('20REEF', 'Container 20 Reefer', 'Container refrigerado 20 pés', '20', 'REEFER', 28.3, 27400),
('40REEF', 'Container 40 Reefer', 'Container refrigerado 40 pés', '40', 'REEFER', 59.3, 27700),
('20FLAT', 'Container 20 Flat Rack', 'Container plataforma 20 pés', '20', 'FLAT', 0, 28180),
('40FLAT', 'Container 40 Flat Rack', 'Container plataforma 40 pés', '40', 'FLAT', 0, 40000),
('20OPEN', 'Container 20 Open Top', 'Container topo aberto 20 pés', '20', 'OPEN TOP', 32.5, 27600),
('20TANK', 'Container 20 Tank', 'Container tanque 20 pés', '20', 'TANK', 21.0, 30480);

-- ============================================================================
-- TIPOS DE PROCESSO
-- ============================================================================
INSERT INTO tipos_processo (codigo, nome, descricao, cor, icone, tempo_estimado_horas, requer_especializacao) VALUES
('LIMP', 'Limpeza', 'Limpeza interna e externa do container', 'blue', 'Sparkles', 4, false),
('LAVA', 'Lavagem', 'Lavagem com alta pressão', 'cyan', 'Droplets', 3, false),
('SOLD', 'Solda', 'Serviços de solda e reparo estrutural', 'orange', 'Flame', 8, true),
('PINT-INT', 'Pintura Interna', 'Pintura da parte interna', 'green', 'Paintbrush', 6, true),
('PINT-EXT', 'Pintura Externa', 'Pintura da parte externa', 'green', 'Paintbrush', 8, true),
('PINT-COMP', 'Pintura Completa', 'Pintura interna e externa', 'green', 'Paintbrush', 12, true),
('MANU', 'Manutenção', 'Manutenção geral e reparos', 'yellow', 'Wrench', 6, false),
('INSP', 'Inspeção', 'Inspeção técnica e certificação', 'purple', 'ClipboardCheck', 2, true),
('REPA', 'Reparo Estrutural', 'Reparos estruturais complexos', 'red', 'HardHat', 16, true),
('SAND', 'Jateamento', 'Jateamento de areia para remoção de ferrugem', 'gray', 'Wind', 10, true);

-- ============================================================================
-- TRABALHADORES (baseado nos nomes encontrados no banco)
-- ============================================================================
INSERT INTO trabalhadores (codigo, nome_completo, cargo, especializacoes, data_admissao, ativo) VALUES
('T001', 'Antonio Jarbas Martins Miranda', 'Soldador Especializado', ARRAY['SOLD', 'REPA'], '2020-01-15', true),
('T002', 'Alexandre Eduardo Miranda', 'Pintor', ARRAY['PINT-INT', 'PINT-EXT', 'PINT-COMP'], '2020-03-20', true),
('T003', 'Sergio Luiz Pereira Vieira', 'Técnico de Manutenção', ARRAY['MANU', 'INSP'], '2019-06-10', true),
('T004', 'Welson Carlos Dionisio', 'Operador de Jateamento', ARRAY['SAND', 'LIMP'], '2021-02-01', true),
('T005', 'Antonio Biserra', 'Ajudante Geral', ARRAY['LIMP', 'LAVA'], '2021-08-15', true),
('T006', 'José Carlos Silva', 'Soldador', ARRAY['SOLD'], '2020-11-20', true),
('T007', 'Paulo Roberto Alves', 'Pintor', ARRAY['PINT-INT', 'PINT-EXT'], '2021-01-10', true),
('T008', 'Ricardo Martins', 'Inspetor', ARRAY['INSP'], '2019-03-15', true),
('T009', 'Fernando Oliveira', 'Operador de Lavagem', ARRAY['LAVA', 'LIMP'], '2021-05-20', true),
('T010', 'Carlos Eduardo Santos', 'Técnico de Manutenção', ARRAY['MANU', 'REPA'], '2020-07-01', true);

-- ============================================================================
-- CLIENTES
-- ============================================================================
INSERT INTO clientes (codigo, razao_social, nome_fantasia, cnpj, email, telefone, cidade, estado, ativo) VALUES
('CLI001', 'Transportadora ABC Ltda', 'ABC Transportes', '12.345.678/0001-90', 'contato@abctransportes.com.br', '(11) 3456-7890', 'São Paulo', 'SP', true),
('CLI002', 'Logística XYZ S.A.', 'XYZ Log', '98.765.432/0001-10', 'comercial@xyzlog.com.br', '(21) 2345-6789', 'Rio de Janeiro', 'RJ', true),
('CLI003', 'Comércio Exterior Brasil Ltda', 'CE Brasil', '11.222.333/0001-44', 'contato@cebrasil.com.br', '(11) 4567-8901', 'Santos', 'SP', true),
('CLI004', 'Importadora Global S.A.', 'Global Import', '55.666.777/0001-88', 'vendas@globalimport.com.br', '(48) 3234-5678', 'Itajaí', 'SC', true),
('CLI005', 'Exportadora Sul Ltda', 'Sul Export', '99.888.777/0001-66', 'export@sulexport.com.br', '(51) 3345-6789', 'Porto Alegre', 'RS', true);

-- ============================================================================
-- REGRAS DE SEQUENCIAMENTO
-- ============================================================================

-- Limpeza deve ser executada antes de Lavagem
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao) 
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'LIMP'),
    (SELECT id FROM tipos_processo WHERE codigo = 'LAVA'),
    'EXECUTA_DEPOIS',
    true,
    'Lavagem só pode ser feita após limpeza inicial'
);

-- Jateamento deve usar o mesmo trabalhador que Pintura
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'SAND'),
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-EXT'),
    'MESMO_TRABALHADOR',
    false,
    'Preferencialmente o mesmo trabalhador para garantir qualidade'
);

-- Solda deve ser executada antes de Pintura
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'SOLD'),
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-EXT'),
    'EXECUTA_DEPOIS',
    true,
    'Pintura só após conclusão de soldas'
);

-- Inspeção pode ser executada em paralelo com Limpeza
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'INSP'),
    (SELECT id FROM tipos_processo WHERE codigo = 'LIMP'),
    'PARALELO',
    false,
    'Inspeção inicial pode ocorrer durante limpeza'
);

-- Pintura Interna e Externa podem ser paralelas (trabalhadores diferentes)
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-INT'),
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-EXT'),
    'PARALELO',
    false,
    'Pinturas interna e externa podem ser simultâneas'
);

-- Lavagem deve ser executada antes de Pintura
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'LAVA'),
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-INT'),
    'EXECUTA_DEPOIS',
    true,
    'Container deve estar limpo antes de pintar'
);

-- Jateamento deve ser executado antes de Pintura Externa
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'SAND'),
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-EXT'),
    'EXECUTA_DEPOIS',
    true,
    'Superfície deve ser jateada antes de pintar'
);

-- Reparo Estrutural deve ser executado antes de Pintura
INSERT INTO regras_sequenciamento (tipo_processo_origem_id, tipo_processo_destino_id, tipo_regra, obrigatorio, descricao)
VALUES (
    (SELECT id FROM tipos_processo WHERE codigo = 'REPA'),
    (SELECT id FROM tipos_processo WHERE codigo = 'PINT-COMP'),
    'EXECUTA_DEPOIS',
    true,
    'Reparos estruturais devem ser concluídos antes da pintura'
);

-- ============================================================================
-- CONTAINERS DE EXEMPLO
-- ============================================================================
INSERT INTO containers (codigo, numero_serie, tipo_container_id, cliente_id, status, condicao, data_entrada) VALUES
('V-001', 'ABCU1234567', (SELECT id FROM tipos_container WHERE codigo = '20DRY'), (SELECT id FROM clientes WHERE codigo = 'CLI001'), 'DISPONIVEL', 'BOM', NOW() - INTERVAL '5 days'),
('V-002', 'XYZL9876543', (SELECT id FROM tipos_container WHERE codigo = '40DRY'), (SELECT id FROM clientes WHERE codigo = 'CLI002'), 'DISPONIVEL', 'REGULAR', NOW() - INTERVAL '3 days'),
('V-003', 'GLBU2468135', (SELECT id FROM tipos_container WHERE codigo = '40HC'), (SELECT id FROM clientes WHERE codigo = 'CLI003'), 'DISPONIVEL', 'BOM', NOW() - INTERVAL '2 days'),
('V-004', 'REEF1357924', (SELECT id FROM tipos_container WHERE codigo = '20REEF'), (SELECT id FROM clientes WHERE codigo = 'CLI004'), 'DISPONIVEL', 'RUIM', NOW() - INTERVAL '7 days'),
('V-005', 'FLAT9753186', (SELECT id FROM tipos_container WHERE codigo = '20FLAT'), (SELECT id FROM clientes WHERE codigo = 'CLI005'), 'DISPONIVEL', 'REGULAR', NOW() - INTERVAL '1 day');

-- ============================================================================
-- USUÁRIO ADMIN PADRÃO
-- ============================================================================
-- Senha: admin123 (hash bcrypt)
INSERT INTO usuarios (username, email, password_hash, nome_completo, role, ativo) VALUES
('admin', 'admin@containerflow.com', '$2a$10$rKZLvXZvXZvXZvXZvXZvXeO7KZLvXZvXZvXZvXZvXZvXZvXZvXZvX', 'Administrador do Sistema', 'ADMIN', true),
('manager', 'manager@containerflow.com', '$2a$10$rKZLvXZvXZvXZvXZvXZvXeO7KZLvXZvXZvXZvXZvXZvXZvXZvXZvX', 'Gerente de Operações', 'MANAGER', true);

-- ============================================================================
-- FIM DO SEED
-- ============================================================================

-- Exibir resumo
SELECT 'Seed concluído com sucesso!' as status;
SELECT COUNT(*) as total_tipos_container FROM tipos_container;
SELECT COUNT(*) as total_tipos_processo FROM tipos_processo;
SELECT COUNT(*) as total_trabalhadores FROM trabalhadores;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_containers FROM containers;
SELECT COUNT(*) as total_regras FROM regras_sequenciamento;
SELECT COUNT(*) as total_usuarios FROM usuarios;
