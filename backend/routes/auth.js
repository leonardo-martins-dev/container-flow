const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'container-flow-secret-change-in-production' : null);
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

async function ensureAdminExists() {
  try {
    const res = await query(`SELECT COUNT(1) AS cnt FROM container_flow.usuarios`);
    const cnt = res.recordset?.[0]?.cnt ?? 0;
    if (cnt > 0) return;
  } catch (err) {
    const message = String(err.message || err);
    if (message.includes("Invalid object name 'container_flow.usuarios'") || message.includes("container_flow.usuarios")) {
      await query(`
        IF NOT EXISTS (
          SELECT * FROM sys.tables t
          JOIN sys.schemas s ON t.schema_id = s.schema_id
          WHERE s.name = 'container_flow' AND t.name = 'usuarios'
        )
        BEGIN
            CREATE TABLE container_flow.usuarios (
                id INT IDENTITY(1,1) PRIMARY KEY,
                nome NVARCHAR(100) NOT NULL,
                email NVARCHAR(255) NOT NULL,
                senha_hash NVARCHAR(255) NOT NULL,
                role NVARCHAR(30) NOT NULL DEFAULT 'lider',
                ativo BIT NOT NULL DEFAULT 1,
                created_at DATETIME2 DEFAULT GETUTCDATE(),
                updated_at DATETIME2 DEFAULT GETUTCDATE()
            );
            CREATE UNIQUE INDEX IX_usuarios_email ON container_flow.usuarios(email);
        END
      `);
    } else {
      throw err;
    }
  }
  const hash = await bcrypt.hash('admin123', 10);
  await query(
    `IF NOT EXISTS (SELECT 1 FROM container_flow.usuarios WHERE email = @email)
      INSERT INTO container_flow.usuarios (nome, email, senha_hash, role, ativo)
      VALUES (@nome, @email, @senha_hash, 'admin', 1)`,
    { nome: 'Administrador', email: 'admin@containerflow.local', senha_hash: hash }
  );
}

router.post('/login', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET não configurado. Defina em produção.' });
    }
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    await ensureAdminExists();
    const result = await query(
      `SELECT id, nome, email, senha_hash, role FROM container_flow.usuarios WHERE email = @email AND ativo = 1`,
      { email: String(email).trim().toLowerCase() }
    );
    const user = result.recordset?.[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const valid = await bcrypt.compare(String(password), user.senha_hash || '');
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const role = (user.role || 'lider').toLowerCase();
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    console.error('POST /api/auth/login', err);
    res.status(500).json({ error: err.message || 'Erro ao fazer login' });
  }
});

router.get('/me', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET não configurado. Defina em produção.' });
    }
    const auth = req.headers.authorization;
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token ausente' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      `SELECT id, nome, email, role FROM container_flow.usuarios WHERE id = @id AND ativo = 1`,
      { id: decoded.id }
    );
    const user = result.recordset?.[0];
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: (user.role || 'lider').toLowerCase(),
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    console.error('GET /api/auth/me', err);
    res.status(500).json({ error: err.message || 'Erro ao validar token' });
  }
});

module.exports = router;
