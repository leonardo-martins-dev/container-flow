const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

router.get('/solicitacoes', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, container_id AS containerId, CONVERT(NVARCHAR(10), data, 120) AS data, hora, tipo FROM container_flow.solicitacoes_logistica ORDER BY data, hora`
    );
    const rows = result.recordset || [];
    res.json(rows);
  } catch (err) {
    console.error('GET /api/logistics/solicitacoes', err);
    res.json([]);
  }
});

router.post('/solicitacoes', async (req, res) => {
  try {
    const { containerId, data, hora, tipo } = req.body || {};
    if (!containerId || !data) {
      return res.status(400).json({ error: 'containerId e data são obrigatórios' });
    }
    await query(
      `INSERT INTO container_flow.solicitacoes_logistica (container_id, data, hora, tipo) VALUES (@containerId, @data, @hora, @tipo)`,
      {
        containerId: Number(containerId),
        data: String(data).slice(0, 10),
        hora: hora ? String(hora).slice(0, 10) : null,
        tipo: (tipo && ['entrega', 'retirada', 'movimentacao'].includes(String(tipo).toLowerCase())) ? String(tipo).toLowerCase() : 'movimentacao',
      }
    );
    const get = await query(`SELECT id, container_id AS containerId, CONVERT(NVARCHAR(10), data, 120) AS data, hora, tipo FROM container_flow.solicitacoes_logistica ORDER BY id DESC`);
    const row = get.recordset?.[0];
    res.status(201).json(row || {});
  } catch (err) {
    console.error('POST /api/logistics/solicitacoes', err);
    res.status(500).json({ error: err.message || 'Erro ao criar solicitação' });
  }
});

router.get('/tarefas-motorista', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, container_id AS containerId, CONVERT(NVARCHAR(10), data, 120) AS data, tipo, 'pendente' AS status FROM container_flow.solicitacoes_logistica ORDER BY data, hora`
    );
    const rows = (result.recordset || []).map((r) => ({ ...r, status: 'pendente' }));
    res.json(rows);
  } catch (err) {
    console.error('GET /api/logistics/tarefas-motorista', err);
    res.json([]);
  }
});

module.exports = router;
