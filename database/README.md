# 🗄️ Database PostgreSQL - Container Flow

## 📋 Estrutura do Banco de Dados

Este diretório contém a estrutura completa do banco de dados PostgreSQL para o sistema de gestão de containers.

### Arquivos

- **`schema.sql`** - Schema completo com todas as tabelas, índices, triggers e relacionamentos
- **`seed.sql`** - Dados iniciais (tipos, trabalhadores, clientes, regras)
- **`migration_guide.md`** - Guia para migrar dados do SQL Server para PostgreSQL

---

## 🚀 Quick Start

### 1. Instalar PostgreSQL

**Windows:**
```bash
# Download: https://www.postgresql.org/download/windows/
# Ou via Chocolatey:
choco install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
```

**Mac:**
```bash
brew install postgresql
```

### 2. Criar o Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE container_flow;

# Conectar ao banco
\c container_flow
```

### 3. Executar o Schema

```bash
# Via linha de comando
psql -U postgres -d container_flow -f schema.sql

# Ou dentro do psql
\i schema.sql
```

### 4. Popular com Dados Iniciais

```bash
# Via linha de comando
psql -U postgres -d container_flow -f seed.sql

# Ou dentro do psql
\i seed.sql
```

---

## 📊 Estrutura das Tabelas

### Principais Entidades

```
clientes
├── id (PK)
├── codigo (UNIQUE)
├── razao_social
├── cnpj
└── ...

tipos_container
├── id (PK)
├── codigo (UNIQUE)
├── nome
├── tamanho ('20', '40')
└── tipo ('DRY', 'REEFER', 'FLAT')

containers
├── id (PK)
├── codigo (UNIQUE)
├── tipo_container_id (FK)
├── cliente_id (FK)
├── status
└── localizacao

tipos_processo
├── id (PK)
├── codigo (UNIQUE)
├── nome
├── tempo_estimado_horas
└── requer_especializacao

trabalhadores
├── id (PK)
├── codigo (UNIQUE)
├── nome_completo
├── especializacoes (ARRAY)
└── ...

ordens_servico
├── id (PK)
├── numero (UNIQUE)
├── cliente_id (FK)
├── container_id (FK)
├── status
└── valor_total

processos
├── id (PK)
├── ordem_servico_id (FK)
├── tipo_processo_id (FK)
├── container_id (FK)
├── trabalhador_id (FK)
├── sequencia
├── status
└── progresso

regras_sequenciamento
├── id (PK)
├── tipo_processo_origem_id (FK)
├── tipo_processo_destino_id (FK)
├── tipo_regra
└── obrigatorio

layout_fabrica
├── id (PK)
├── container_id (FK)
├── posicao_x
├── posicao_y
└── slot
```

---

## 🔗 Relacionamentos

```
clientes (1) ──→ (N) containers
clientes (1) ──→ (N) ordens_servico

tipos_container (1) ──→ (N) containers

containers (1) ──→ (N) ordens_servico
containers (1) ──→ (N) processos
containers (1) ──→ (1) layout_fabrica

ordens_servico (1) ──→ (N) processos

tipos_processo (1) ──→ (N) processos
tipos_processo (1) ──→ (N) regras_sequenciamento (origem)
tipos_processo (1) ──→ (N) regras_sequenciamento (destino)

trabalhadores (1) ──→ (N) processos
trabalhadores (1) ──→ (1) usuarios
```

---

## 🎯 Dados Iniciais (Seed)

Após executar o seed, você terá:

- ✅ **9 tipos de container** (20', 40', Reefer, Flat, etc.)
- ✅ **10 tipos de processo** (Limpeza, Pintura, Solda, etc.)
- ✅ **10 trabalhadores** (baseados no banco real)
- ✅ **5 clientes** de exemplo
- ✅ **5 containers** de exemplo
- ✅ **8 regras de sequenciamento**
- ✅ **2 usuários** (admin/manager)

---

## 🔐 Usuários Padrão

| Username | Senha | Role | Descrição |
|----------|-------|------|-----------|
| admin | admin123 | ADMIN | Administrador completo |
| manager | admin123 | MANAGER | Gerente de operações |

**⚠️ IMPORTANTE:** Altere as senhas em produção!

---

## 📝 Queries Úteis

### Ver todas as tabelas
```sql
\dt
```

### Ver estrutura de uma tabela
```sql
\d containers
```

### Listar containers disponíveis
```sql
SELECT c.codigo, tc.nome as tipo, cl.razao_social as cliente, c.status
FROM containers c
JOIN tipos_container tc ON c.tipo_container_id = tc.id
JOIN clientes cl ON c.cliente_id = cl.id
WHERE c.status = 'DISPONIVEL';
```

### Listar processos de uma ordem
```sql
SELECT 
    p.sequencia,
    tp.nome as processo,
    p.status,
    t.nome_completo as trabalhador,
    p.progresso
FROM processos p
JOIN tipos_processo tp ON p.tipo_processo_id = tp.id
LEFT JOIN trabalhadores t ON p.trabalhador_id = t.id
WHERE p.ordem_servico_id = 1
ORDER BY p.sequencia;
```

### Ver regras de sequenciamento
```sql
SELECT 
    tp1.nome as processo_origem,
    rs.tipo_regra,
    tp2.nome as processo_destino,
    rs.obrigatorio,
    rs.descricao
FROM regras_sequenciamento rs
JOIN tipos_processo tp1 ON rs.tipo_processo_origem_id = tp1.id
JOIN tipos_processo tp2 ON rs.tipo_processo_destino_id = tp2.id
WHERE rs.ativo = true;
```

---

## 🔄 Backup e Restore

### Fazer backup
```bash
pg_dump -U postgres -d container_flow -F c -f backup_container_flow.dump
```

### Restaurar backup
```bash
pg_restore -U postgres -d container_flow -c backup_container_flow.dump
```

---

## 🛠️ Manutenção

### Recriar banco do zero
```bash
# Dropar banco existente
psql -U postgres -c "DROP DATABASE IF EXISTS container_flow;"

# Criar novo
psql -U postgres -c "CREATE DATABASE container_flow;"

# Executar schema e seed
psql -U postgres -d container_flow -f schema.sql
psql -U postgres -d container_flow -f seed.sql
```

### Limpar dados mantendo estrutura
```sql
TRUNCATE TABLE 
    historico_processos,
    layout_fabrica,
    processos,
    ordens_servico,
    containers,
    regras_sequenciamento,
    trabalhadores,
    tipos_processo,
    tipos_container,
    clientes,
    usuarios
CASCADE;
```

---

## 📚 Próximos Passos

1. ✅ Schema criado
2. ✅ Seed com dados iniciais
3. 🔄 Migrar dados do BancoTAM (ver `migration_guide.md`)
4. 🔄 Desenvolver API REST (Node.js/Express ou Python/FastAPI)
5. 🔄 Integrar com frontend React
6. 🔄 Implementar autenticação JWT
7. 🔄 Deploy em produção

---

## 🐛 Troubleshooting

### Erro: "role postgres does not exist"
```bash
createuser -s postgres
```

### Erro: "database container_flow already exists"
```bash
psql -U postgres -c "DROP DATABASE container_flow;"
```

### Erro de permissão
```bash
# Dar permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE container_flow TO postgres;
```

---

## 📞 Suporte

Para dúvidas sobre:
- **Schema**: Ver comentários no `schema.sql`
- **Dados**: Ver `seed.sql`
- **Migração**: Ver `migration_guide.md`
- **PostgreSQL**: https://www.postgresql.org/docs/
