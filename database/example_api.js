/**
 * Exemplo de API REST com Express + PostgreSQL
 * 
 * Instalação:
 * npm install express pg cors dotenv
 * 
 * Uso:
 * node example_api.js
 * 
 * Endpoints:
 * GET  /api/containers - Lista todos os containers
 * GET  /api/containers/:id - Busca container por ID
 * POST /api/containers - Cria novo container
 * PUT  /api/containers/:id - Atualiza container
 * DELETE /api/containers/:id - Remove container
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração do PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'container_flow',
  user: 'postgres',
  password: 'sua_senha_aqui', // ALTERE AQUI
});

// ============================================================================
// CONTAINERS
// ============================================================================

// GET /api/containers - Listar todos os containers
app.get('/api/containers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.codigo,
        c.numero_serie,
        tc.nome as tipo_container,
        cl.razao_social as cliente,
        c.status,
        c.condicao,
        c.localizacao,
        c.data_entrada,
        c.observacoes
      FROM containers c
      LEFT JOIN tipos_container tc ON c.tipo_container_id = tc.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.ativo = true
      ORDER BY c.codigo
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao buscar containers:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar containers'
    });
  }
});

// GET /api/containers/:id - Buscar container por ID
app.get('/api/containers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        tc.nome as tipo_container,
        cl.razao_social as cliente
      FROM containers c
      LEFT JOIN tipos_container tc ON c.tipo_container_id = tc.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = $1 AND c.ativo = true
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Container não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar container:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar container'
    });
  }
});

// POST /api/containers - Criar novo container
app.post('/api/containers', async (req, res) => {
  try {
    const {
      codigo,
      numero_serie,
      tipo_container_id,
      cliente_id,
      status,
      condicao,
      observacoes
    } = req.body;
    
    // Validações básicas
    if (!codigo || !tipo_container_id || !cliente_id) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: codigo, tipo_container_id, cliente_id'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO containers (
        codigo, numero_serie, tipo_container_id, cliente_id,
        status, condicao, observacoes, data_entrada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [
      codigo,
      numero_serie,
      tipo_container_id,
      cliente_id,
      status || 'DISPONIVEL',
      condicao || 'BOM',
      observacoes
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Container criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar container:', error);
    
    // Erro de código duplicado
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Código de container já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao criar container'
    });
  }
});

// PUT /api/containers/:id - Atualizar container
app.put('/api/containers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      condicao,
      localizacao,
      observacoes
    } = req.body;
    
    const result = await pool.query(`
      UPDATE containers
      SET 
        status = COALESCE($1, status),
        condicao = COALESCE($2, condicao),
        localizacao = COALESCE($3, localizacao),
        observacoes = COALESCE($4, observacoes),
        updated_at = NOW()
      WHERE id = $5 AND ativo = true
      RETURNING *
    `, [status, condicao, localizacao, observacoes, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Container não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Container atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar container:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar container'
    });
  }
});

// DELETE /api/containers/:id - Remover container (soft delete)
app.delete('/api/containers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE containers
      SET ativo = false, updated_at = NOW()
      WHERE id = $1 AND ativo = true
      RETURNING codigo
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Container não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: `Container ${result.rows[0].codigo} removido com sucesso`
    });
  } catch (error) {
    console.error('Erro ao remover container:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover container'
    });
  }
});

// ============================================================================
// TIPOS DE PROCESSO
// ============================================================================

// GET /api/tipos-processo - Listar tipos de processo
app.get('/api/tipos-processo', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM tipos_processo
      WHERE ativo = true
      ORDER BY nome
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar tipos de processo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar tipos de processo'
    });
  }
});

// ============================================================================
// TRABALHADORES
// ============================================================================

// GET /api/trabalhadores - Listar trabalhadores
app.get('/api/trabalhadores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM trabalhadores
      WHERE ativo = true
      ORDER BY nome_completo
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar trabalhadores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar trabalhadores'
    });
  }
});

// ============================================================================
// REGRAS DE SEQUENCIAMENTO
// ============================================================================

// GET /api/regras-sequenciamento - Listar regras
app.get('/api/regras-sequenciamento', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rs.*,
        tp1.nome as processo_origem,
        tp2.nome as processo_destino
      FROM regras_sequenciamento rs
      JOIN tipos_processo tp1 ON rs.tipo_processo_origem_id = tp1.id
      JOIN tipos_processo tp2 ON rs.tipo_processo_destino_id = tp2.id
      WHERE rs.ativo = true
      ORDER BY tp1.nome
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar regras:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar regras'
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'API e banco de dados funcionando',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao conectar ao banco de dados'
    });
  }
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
  console.log('🚀 API Container Flow iniciada!');
  console.log(`📡 Servidor rodando em http://localhost:${PORT}`);
  console.log('\n📋 Endpoints disponíveis:');
  console.log('  GET    /health');
  console.log('  GET    /api/containers');
  console.log('  GET    /api/containers/:id');
  console.log('  POST   /api/containers');
  console.log('  PUT    /api/containers/:id');
  console.log('  DELETE /api/containers/:id');
  console.log('  GET    /api/tipos-processo');
  console.log('  GET    /api/trabalhadores');
  console.log('  GET    /api/regras-sequenciamento');
  console.log('\n💡 Teste: curl http://localhost:3001/health\n');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('Erro não tratado:', error);
});
