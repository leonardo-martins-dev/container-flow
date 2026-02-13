# 🔄 Guia de Migração: SQL Server → PostgreSQL

## 📋 Visão Geral

Este guia explica como migrar os dados do banco **BancoTAM** (SQL Server) para o novo banco **container_flow** (PostgreSQL).

---

## 🎯 Estratégias de Migração

### Opção 1: Migração Automática (Recomendado)
Usar ferramentas que fazem a conversão automaticamente.

### Opção 2: Migração Manual
Exportar dados e importar manualmente.

### Opção 3: Migração via Script
Criar scripts Python/Node.js para migração customizada.

---

## 🛠️ Opção 1: Ferramentas Automáticas

### A) pgLoader (Mais Fácil)

**O que é:** Ferramenta open-source que migra dados de SQL Server para PostgreSQL automaticamente.

**Instalação:**
```bash
# Ubuntu/Debian
sudo apt-get install pgloader

# Mac
brew install pgloader

# Windows (via WSL)
wsl --install
# Depois instalar no Ubuntu do WSL
```

**Uso:**
```bash
# Criar arquivo de configuração
cat > migration.load << EOF
LOAD DATABASE
    FROM mssql://sa:password@localhost/BancoTAM
    INTO postgresql://postgres:password@localhost/container_flow

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '256MB', maintenance_work_mem to '512 MB';
EOF

# Executar migração
pgloader migration.load
```

**Vantagens:**
- ✅ Automático
- ✅ Converte tipos de dados
- ✅ Cria índices
- ✅ Rápido

**Desvantagens:**
- ⚠️ Precisa do SQL Server rodando
- ⚠️ Pode precisar ajustes manuais

---

### B) AWS Schema Conversion Tool (SCT)

**O que é:** Ferramenta gratuita da AWS para converter schemas.

**Download:** https://aws.amazon.com/dms/schema-conversion-tool/

**Uso:**
1. Instalar SCT
2. Conectar ao SQL Server (origem)
3. Conectar ao PostgreSQL (destino)
4. Analisar schema
5. Converter automaticamente
6. Revisar e aplicar

**Vantagens:**
- ✅ Interface gráfica
- ✅ Relatório de conversão
- ✅ Identifica problemas

**Desvantagens:**
- ⚠️ Requer cadastro AWS
- ⚠️ Mais pesado

---

### C) Full Convert Enterprise

**O que é:** Software comercial (trial gratuito) para migração.

**Download:** https://www.spectralcore.com/fullconvert

**Vantagens:**
- ✅ Interface muito simples
- ✅ Suporta muitos bancos
- ✅ Preview antes de migrar

**Desvantagens:**
- ⚠️ Pago (trial 30 dias)

---

## 🔧 Opção 2: Migração Manual

### Passo 1: Restaurar BancoTAM no SQL Server

```bash
# 1. Instalar SQL Server Express
# Download: https://www.microsoft.com/sql-server/sql-server-downloads

# 2. Instalar Azure Data Studio
# Download: https://docs.microsoft.com/sql/azure-data-studio/download

# 3. Restaurar backup
# - Abrir Azure Data Studio
# - Conectar ao localhost
# - Restore Database > Selecionar BancoTAM
```

### Passo 2: Exportar Dados para CSV

```sql
-- No SQL Server, exportar cada tabela

-- Exemplo: Exportar clientes
SELECT * FROM clientes
-- Botão direito > Export to CSV

-- Repetir para todas as tabelas:
-- - clientes
-- - containers
-- - tipos_container
-- - trabalhadores
-- - processos
-- - ordens_servico
-- etc.
```

### Passo 3: Importar no PostgreSQL

```sql
-- No PostgreSQL

-- Exemplo: Importar clientes
COPY clientes(id, codigo, razao_social, cnpj, email, telefone, ativo)
FROM '/path/to/clientes.csv'
DELIMITER ','
CSV HEADER;

-- Repetir para todas as tabelas
```

### Passo 4: Ajustar Sequences

```sql
-- Resetar sequences para próximo ID correto
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));
SELECT setval('containers_id_seq', (SELECT MAX(id) FROM containers));
-- Repetir para todas as tabelas
```

---

## 💻 Opção 3: Script Python de Migração

### Criar script de migração

```python
# migration_script.py
import pyodbc  # Para SQL Server
import psycopg2  # Para PostgreSQL
from datetime import datetime

# Conexão SQL Server
sql_conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    'SERVER=localhost;'
    'DATABASE=BancoTAM;'
    'Trusted_Connection=yes;'
)

# Conexão PostgreSQL
pg_conn = psycopg2.connect(
    host='localhost',
    database='container_flow',
    user='postgres',
    password='sua_senha'
)

def migrate_table(table_name, columns, transform_fn=None):
    """Migra uma tabela do SQL Server para PostgreSQL"""
    
    sql_cursor = sql_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    # Ler dados do SQL Server
    sql_cursor.execute(f"SELECT {columns} FROM {table_name}")
    rows = sql_cursor.fetchall()
    
    print(f"Migrando {len(rows)} registros de {table_name}...")
    
    # Inserir no PostgreSQL
    placeholders = ','.join(['%s'] * len(rows[0]))
    insert_sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
    
    for row in rows:
        # Aplicar transformação se necessário
        if transform_fn:
            row = transform_fn(row)
        
        try:
            pg_cursor.execute(insert_sql, row)
        except Exception as e:
            print(f"Erro ao inserir: {e}")
            print(f"Dados: {row}")
    
    pg_conn.commit()
    print(f"✓ {table_name} migrada com sucesso!")

# Exemplo de uso
def transform_cliente(row):
    """Transforma dados de cliente se necessário"""
    # Ajustar formatos, converter tipos, etc.
    return row

# Migrar tabelas
migrate_table('clientes', 'id, codigo, razao_social, cnpj, email', transform_cliente)
migrate_table('tipos_container', 'id, codigo, nome, tamanho, tipo')
# ... continuar para outras tabelas

sql_conn.close()
pg_conn.close()

print("✅ Migração concluída!")
```

### Executar migração

```bash
# Instalar dependências
pip install pyodbc psycopg2-binary

# Executar script
python migration_script.py
```

---

## 🗺️ Mapeamento de Tipos de Dados

| SQL Server | PostgreSQL | Observações |
|------------|------------|-------------|
| `INT` | `INTEGER` | Idêntico |
| `BIGINT` | `BIGINT` | Idêntico |
| `VARCHAR(n)` | `VARCHAR(n)` | Idêntico |
| `NVARCHAR(n)` | `VARCHAR(n)` | PostgreSQL é UTF-8 nativo |
| `TEXT` | `TEXT` | Idêntico |
| `DATETIME` | `TIMESTAMP` | Sem timezone |
| `DATETIME2` | `TIMESTAMP` | Sem timezone |
| `DATETIMEOFFSET` | `TIMESTAMPTZ` | Com timezone |
| `DATE` | `DATE` | Idêntico |
| `TIME` | `TIME` | Idêntico |
| `BIT` | `BOOLEAN` | 0/1 → false/true |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | Idêntico |
| `MONEY` | `DECIMAL(19,4)` | Ou `MONEY` no PG |
| `UNIQUEIDENTIFIER` | `UUID` | Requer extensão uuid-ossp |
| `VARBINARY` | `BYTEA` | Dados binários |
| `XML` | `XML` | Idêntico |

---

## 🔍 Diferenças Importantes

### 1. Sintaxe de Strings

**SQL Server:**
```sql
SELECT * FROM [Tabela] WHERE [Coluna] = 'valor'
```

**PostgreSQL:**
```sql
SELECT * FROM "tabela" WHERE "coluna" = 'valor'
-- Ou sem aspas (case-insensitive)
SELECT * FROM tabela WHERE coluna = 'valor'
```

### 2. Identity vs Serial

**SQL Server:**
```sql
CREATE TABLE teste (
    id INT IDENTITY(1,1) PRIMARY KEY
)
```

**PostgreSQL:**
```sql
CREATE TABLE teste (
    id SERIAL PRIMARY KEY
)
-- Ou
CREATE TABLE teste (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
)
```

### 3. Funções de Data

| SQL Server | PostgreSQL |
|------------|------------|
| `GETDATE()` | `NOW()` ou `CURRENT_TIMESTAMP` |
| `DATEADD(day, 1, data)` | `data + INTERVAL '1 day'` |
| `DATEDIFF(day, d1, d2)` | `d2 - d1` (retorna interval) |
| `YEAR(data)` | `EXTRACT(YEAR FROM data)` |

### 4. Top vs Limit

**SQL Server:**
```sql
SELECT TOP 10 * FROM tabela
```

**PostgreSQL:**
```sql
SELECT * FROM tabela LIMIT 10
```

### 5. String Concatenation

**SQL Server:**
```sql
SELECT nome + ' ' + sobrenome FROM pessoas
```

**PostgreSQL:**
```sql
SELECT nome || ' ' || sobrenome FROM pessoas
-- Ou
SELECT CONCAT(nome, ' ', sobrenome) FROM pessoas
```

---

## ✅ Checklist de Migração

### Antes da Migração
- [ ] Backup do banco SQL Server
- [ ] PostgreSQL instalado e configurado
- [ ] Schema PostgreSQL criado (`schema.sql`)
- [ ] Ferramenta de migração escolhida

### Durante a Migração
- [ ] Conectar aos dois bancos
- [ ] Migrar estrutura (tabelas, índices)
- [ ] Migrar dados
- [ ] Verificar contagem de registros
- [ ] Testar relacionamentos (FKs)

### Após a Migração
- [ ] Resetar sequences
- [ ] Recriar views (se houver)
- [ ] Recriar stored procedures (converter para functions)
- [ ] Recriar triggers
- [ ] Testar queries principais
- [ ] Validar integridade dos dados
- [ ] Atualizar connection strings na aplicação
- [ ] Testes de integração

---

## 🧪 Validação da Migração

### Comparar contagem de registros

```sql
-- SQL Server
SELECT 
    'clientes' as tabela,
    COUNT(*) as total
FROM clientes
UNION ALL
SELECT 'containers', COUNT(*) FROM containers
-- ... etc

-- PostgreSQL (mesma query)
-- Comparar resultados
```

### Verificar integridade referencial

```sql
-- Verificar FKs órfãs
SELECT c.* 
FROM containers c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
WHERE cl.id IS NULL;
```

### Testar queries críticas

```sql
-- Executar queries principais do sistema
-- Comparar resultados entre SQL Server e PostgreSQL
```

---

## 🚨 Problemas Comuns

### 1. Encoding de caracteres
```sql
-- Garantir UTF-8 no PostgreSQL
CREATE DATABASE container_flow
WITH ENCODING 'UTF8'
LC_COLLATE = 'pt_BR.UTF-8'
LC_CTYPE = 'pt_BR.UTF-8';
```

### 2. Case sensitivity
PostgreSQL é case-sensitive para nomes entre aspas.
Solução: Usar nomes em minúsculas sem aspas.

### 3. Sequences desatualizadas
```sql
-- Resetar todas as sequences
SELECT setval(pg_get_serial_sequence('tabela', 'id'), 
              (SELECT MAX(id) FROM tabela));
```

---

## 📊 Estimativa de Tempo

| Tamanho do Banco | Método | Tempo Estimado |
|------------------|--------|----------------|
| < 1 GB | pgLoader | 10-30 min |
| < 1 GB | Manual | 2-4 horas |
| < 1 GB | Script Python | 1-2 horas |
| 1-10 GB | pgLoader | 1-3 horas |
| 1-10 GB | Manual | 1-2 dias |
| > 10 GB | pgLoader | 3-8 horas |

**BancoTAM (~10 MB):** Estimativa de **15-30 minutos** com pgLoader.

---

## 🎯 Recomendação Final

Para o **BancoTAM** (10 MB), recomendo:

1. **Restaurar no SQL Server Express** (10 min)
2. **Usar pgLoader** (15 min)
3. **Validar dados** (10 min)
4. **Ajustar sequences** (5 min)

**Total: ~40 minutos** ⏱️

---

## 📞 Próximos Passos

Após migração bem-sucedida:

1. ✅ Dados migrados
2. 🔄 Desenvolver API REST
3. 🔄 Integrar com frontend
4. 🔄 Testes end-to-end
5. 🔄 Deploy

Veja `README.md` para mais informações!
