const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../db/pool');

const router = express.Router();

function ensureAdmin(req, res) {
  const role = (req.user?.role || '').toLowerCase();
  if (role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem gerenciar usuários' });
    return false;
  }
  return true;
}

router.get('/', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const result = await query(
      `SELECT id, nome, email, role, ativo, created_at, updated_at
       FROM container_flow.usuarios
       ORDER BY nome`
    );
    res.json(result.recordset || []);
  } catch (err) {
    console.error('GET /api/users', err);
    res.status(500).json({ error: err.message || 'Erro ao listar usuários' });
  }
});

router.post('/', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { nome, email, senha, role = 'lider', ativo = true } = req.body || {};
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const hash = await bcrypt.hash(String(senha), 10);
    const result = await query(
      `INSERT INTO container_flow.usuarios (nome, email, senha_hash, role, ativo)
       OUTPUT INSERTED.id, INSERTED.nome, INSERTED.email, INSERTED.role, INSERTED.ativo, INSERTED.created_at, INSERTED.updated_at
       VALUES (@nome, @email, @senha_hash, @role, @ativo)`,
      {
        nome: String(nome).trim(),
        email: normalizedEmail,
        senha_hash: hash,
        role: String(role || 'lider').toLowerCase(),
        ativo: !!ativo,
      }
    );
    res.status(201).json(result.recordset?.[0]);
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.includes('IX_usuarios_email') || msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('email')) {
      return res.status(400).json({ error: 'Já existe um usuário com este email' });
    }
    console.error('POST /api/users', err);
    res.status(500).json({ error: err.message || 'Erro ao criar usuário' });
  }
});

router.put('/:id', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { nome, email, role, ativo } = req.body || {};
    if (!nome || !email || !role || typeof ativo === 'undefined') {
      return res.status(400).json({ error: 'Nome, email, role e ativo são obrigatórios' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await query(
      `UPDATE container_flow.usuarios
       SET nome = @nome,
           email = @email,
           role = @role,
           ativo = @ativo,
           updated_at = GETUTCDATE()
       OUTPUT INSERTED.id, INSERTED.nome, INSERTED.email, INSERTED.role, INSERTED.ativo, INSERTED.created_at, INSERTED.updated_at
       WHERE id = @id`,
      {
        id: Number(id),
        nome: String(nome).trim(),
        email: normalizedEmail,
        role: String(role || 'lider').toLowerCase(),
        ativo: !!ativo,
      }
    );
    const row = result.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(row);
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.includes('IX_usuarios_email') || msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('email')) {
      return res.status(400).json({ error: 'Já existe um usuário com este email' });
    }
    console.error('PUT /api/users/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar usuário' });
  }
});

router.patch('/:id/password', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { senha } = req.body || {};
    if (!senha) return res.status(400).json({ error: 'Nova senha é obrigatória' });
    const hash = await bcrypt.hash(String(senha), 10);
    const result = await query(
      `UPDATE container_flow.usuarios
       SET senha_hash = @senha_hash,
           updated_at = GETUTCDATE()
       OUTPUT INSERTED.id, INSERTED.nome, INSERTED.email, INSERTED.role, INSERTED.ativo, INSERTED.created_at, INSERTED.updated_at
       WHERE id = @id`,
      { id: Number(id), senha_hash: hash }
    );
    const row = result.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(row);
  } catch (err) {
    console.error('PATCH /api/users/:id/password', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar senha do usuário' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE container_flow.usuarios
       SET ativo = 0,
           updated_at = GETUTCDATE()
       OUTPUT INSERTED.id, INSERTED.nome, INSERTED.email, INSERTED.role, INSERTED.ativo, INSERTED.created_at, INSERTED.updated_at
       WHERE id = @id`,
      { id: Number(id) }
    );
    const row = result.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(row);
  } catch (err) {
    console.error('DELETE /api/users/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao desativar usuário' });
  }
});

module.exports = router;

