-- ============================================================================
-- SCHEMA POSTGRESQL - Sistema de Gestão de Containers
-- Baseado na análise do banco BancoTAM
-- ============================================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELA: clientes
-- ============================================================================
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj VARCHAR(18) UNIQUE,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clientes_codigo ON clientes(codigo);
CREATE INDEX idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);

-- ============================================================================
-- TABELA: tipos_container
-- ============================================================================
CREATE TABLE tipos_container (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tamanho VARCHAR(10), -- '20', '40', etc
    tipo VARCHAR(50), -- 'DRY', 'REEFER', 'FLAT', 'TANK', 'OPEN TOP'
    capacidade_m3 DECIMAL(10,2),
    peso_maximo_kg DECIMAL(10,2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tipos_container_codigo ON tipos_container(codigo);

-- ============================================================================
-- TABELA: containers
-- ============================================================================
CREATE TABLE containers (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- Ex: V-001, V-002
    numero_serie VARCHAR(100),
    tipo_container_id INTEGER REFERENCES tipos_container(id),
    cliente_id INTEGER REFERENCES clientes(id),
    status VARCHAR(50) DEFAULT 'DISPONIVEL', -- DISPONIVEL, EM_PROCESSO, MANUTENCAO, FINALIZADO
    condicao VARCHAR(50), -- BOM, REGULAR, RUIM
    localizacao VARCHAR(100), -- Posição no grid da fábrica
    data_entrada TIMESTAMP,
    data_saida TIMESTAMP,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_containers_codigo ON containers(codigo);
CREATE INDEX idx_containers_tipo ON containers(tipo_container_id);
CREATE INDEX idx_containers_cliente ON containers(cliente_id);
CREATE INDEX idx_containers_status ON containers(status);

-- ============================================================================
-- TABELA: tipos_processo
-- ============================================================================
CREATE TABLE tipos_processo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(20), -- Para UI
    icone VARCHAR(50), -- Para UI
    tempo_estimado_horas DECIMAL(10,2),
    requer_especializacao BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tipos_processo_codigo ON tipos_processo(codigo);

-- ============================================================================
-- TABELA: trabalhadores
-- ============================================================================
CREATE TABLE trabalhadores (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome_completo VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    cargo VARCHAR(100),
    especializacoes TEXT[], -- Array de especializações
    data_admissao DATE,
    data_demissao DATE,
    salario DECIMAL(10,2),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trabalhadores_codigo ON trabalhadores(codigo);
CREATE INDEX idx_trabalhadores_cpf ON trabalhadores(cpf);
CREATE INDEX idx_trabalhadores_ativo ON trabalhadores(ativo);

-- ============================================================================
-- TABELA: ordens_servico
-- ============================================================================
CREATE TABLE ordens_servico (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    container_id INTEGER REFERENCES containers(id),
    data_abertura TIMESTAMP DEFAULT NOW(),
    data_prevista_conclusao TIMESTAMP,
    data_conclusao TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ABERTA', -- ABERTA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    prioridade VARCHAR(20) DEFAULT 'NORMAL', -- BAIXA, NORMAL, ALTA, URGENTE
    valor_total DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ordens_numero ON ordens_servico(numero);
CREATE INDEX idx_ordens_cliente ON ordens_servico(cliente_id);
CREATE INDEX idx_ordens_container ON ordens_servico(container_id);
CREATE INDEX idx_ordens_status ON ordens_servico(status);
CREATE INDEX idx_ordens_data_abertura ON ordens_servico(data_abertura);

-- ============================================================================
-- TABELA: processos
-- ============================================================================
CREATE TABLE processos (
    id SERIAL PRIMARY KEY,
    ordem_servico_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo_processo_id INTEGER REFERENCES tipos_processo(id),
    container_id INTEGER REFERENCES containers(id),
    sequencia INTEGER NOT NULL, -- Ordem de execução
    status VARCHAR(50) DEFAULT 'PENDENTE', -- PENDENTE, EM_ANDAMENTO, CONCLUIDO, CANCELADO
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    tempo_estimado_horas DECIMAL(10,2),
    tempo_real_horas DECIMAL(10,2),
    progresso INTEGER DEFAULT 0, -- 0-100%
    trabalhador_id INTEGER REFERENCES trabalhadores(id),
    valor DECIMAL(10,2),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_processos_ordem ON processos(ordem_servico_id);
CREATE INDEX idx_processos_tipo ON processos(tipo_processo_id);
CREATE INDEX idx_processos_container ON processos(container_id);
CREATE INDEX idx_processos_status ON processos(status);
CREATE INDEX idx_processos_trabalhador ON processos(trabalhador_id);

-- ============================================================================
-- TABELA: regras_sequenciamento
-- ============================================================================
CREATE TABLE regras_sequenciamento (
    id SERIAL PRIMARY KEY,
    tipo_processo_origem_id INTEGER REFERENCES tipos_processo(id),
    tipo_processo_destino_id INTEGER REFERENCES tipos_processo(id),
    tipo_regra VARCHAR(50) NOT NULL, -- EXECUTA_DEPOIS, MESMO_TRABALHADOR, PARALELO, BLOQUEIO
    obrigatorio BOOLEAN DEFAULT false,
    tempo_minimo_horas DECIMAL(10,2),
    tempo_maximo_horas DECIMAL(10,2),
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regras_origem ON regras_sequenciamento(tipo_processo_origem_id);
CREATE INDEX idx_regras_destino ON regras_sequenciamento(tipo_processo_destino_id);
CREATE INDEX idx_regras_tipo ON regras_sequenciamento(tipo_regra);

-- ============================================================================
-- TABELA: layout_fabrica
-- ============================================================================
CREATE TABLE layout_fabrica (
    id SERIAL PRIMARY KEY,
    container_id INTEGER REFERENCES containers(id),
    posicao_x INTEGER NOT NULL,
    posicao_y INTEGER NOT NULL,
    coluna INTEGER,
    linha INTEGER,
    slot VARCHAR(20), -- Ex: V-01, V-02
    data_alocacao TIMESTAMP DEFAULT NOW(),
    data_liberacao TIMESTAMP,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_layout_container ON layout_fabrica(container_id);
CREATE INDEX idx_layout_posicao ON layout_fabrica(posicao_x, posicao_y);
CREATE INDEX idx_layout_slot ON layout_fabrica(slot);

-- ============================================================================
-- TABELA: historico_processos
-- ============================================================================
CREATE TABLE historico_processos (
    id SERIAL PRIMARY KEY,
    processo_id INTEGER REFERENCES processos(id),
    usuario VARCHAR(100),
    acao VARCHAR(50), -- CRIADO, INICIADO, PAUSADO, RETOMADO, CONCLUIDO, CANCELADO
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_historico_processo ON historico_processos(processo_id);
CREATE INDEX idx_historico_data ON historico_processos(created_at);

-- ============================================================================
-- TABELA: usuarios (para autenticação)
-- ============================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(200),
    role VARCHAR(50) DEFAULT 'USER', -- ADMIN, MANAGER, USER, VIEWER
    trabalhador_id INTEGER REFERENCES trabalhadores(id),
    ultimo_acesso TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- ============================================================================
-- TRIGGERS para updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipos_container_updated_at BEFORE UPDATE ON tipos_container FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON containers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipos_processo_updated_at BEFORE UPDATE ON tipos_processo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trabalhadores_updated_at BEFORE UPDATE ON trabalhadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON processos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regras_sequenciamento_updated_at BEFORE UPDATE ON regras_sequenciamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layout_fabrica_updated_at BEFORE UPDATE ON layout_fabrica FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS nas tabelas (documentação)
-- ============================================================================

COMMENT ON TABLE clientes IS 'Cadastro de clientes da empresa';
COMMENT ON TABLE tipos_container IS 'Tipos de containers disponíveis (20, 40, Reefer, etc)';
COMMENT ON TABLE containers IS 'Containers individuais em gestão';
COMMENT ON TABLE tipos_processo IS 'Tipos de processos/serviços (Limpeza, Pintura, Solda, etc)';
COMMENT ON TABLE trabalhadores IS 'Funcionários da empresa';
COMMENT ON TABLE ordens_servico IS 'Ordens de serviço para containers';
COMMENT ON TABLE processos IS 'Processos individuais dentro de uma ordem de serviço';
COMMENT ON TABLE regras_sequenciamento IS 'Regras de sequenciamento entre processos';
COMMENT ON TABLE layout_fabrica IS 'Posicionamento físico dos containers na fábrica';
COMMENT ON TABLE historico_processos IS 'Histórico de mudanças nos processos';
COMMENT ON TABLE usuarios IS 'Usuários do sistema';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
