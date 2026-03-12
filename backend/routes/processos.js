const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

function rowToProcess(r) {
  return {
    id: r.id,
    name: r.nome,
    averageTimeMinutes: r.avg_minutos ?? 60,
    order: r.ordem ?? r.id,
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nome, avg_minutos, ordem FROM container_flow.processos ORDER BY ordem, id`
    );
    const rows = result.recordset || [];
    res.json(rows.map(rowToProcess));
  } catch (err) {
    console.error('GET /api/processos', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar processos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, averageTimeMinutes, order } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }
    const avgMinutos = Math.max(0, parseInt(averageTimeMinutes, 10) || 60);
    const ordem = order != null ? parseInt(order, 10) : null;

    const nextResult = await query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM container_flow.processos`
    );
    const nextId = nextResult.recordset?.[0]?.nextId ?? 1;

    await query(
      `INSERT INTO container_flow.processos (id, nome, avg_minutos, ordem) VALUES (@id, @nome, @avg_minutos, @ordem)`,
      { id: nextId, nome: name.trim(), avg_minutos: avgMinutos, ordem: ordem ?? nextId }
    );

    const process = { id: nextId, name: name.trim(), averageTimeMinutes: avgMinutos, order: ordem ?? nextId };
    res.status(201).json(process);
  } catch (err) {
    console.error('POST /api/processos', err);
    res.status(500).json({ error: err.message || 'Erro ao criar processo' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const { name, averageTimeMinutes, order } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name inválido' });
      updates.nome = name.trim();
    }
    if (averageTimeMinutes !== undefined) {
      updates.avg_minutos = Math.max(0, parseInt(averageTimeMinutes, 10) || 60);
    }
    if (order !== undefined) {
      updates.ordem = order == null ? null : parseInt(order, 10);
    }

    if (Object.keys(updates).length === 0) {
      const getResult = await query(
        `SELECT id, nome, avg_minutos, ordem FROM container_flow.processos WHERE id = @id`,
        { id }
      );
      const row = getResult.recordset?.[0];
      if (!row) return res.status(404).json({ error: 'Processo não encontrado' });
      return res.json(rowToProcess(row));
    }

    const setClauses = Object.keys(updates).map((k) => `${k} = @${k}`);
    const sql = `UPDATE container_flow.processos SET ${setClauses.join(', ')} WHERE id = @id`;
    const params = { ...updates, id };
    const updateResult = await query(sql, params);
    if (updateResult.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const getResult = await query(
      `SELECT id, nome, avg_minutos, ordem FROM container_flow.processos WHERE id = @id`,
      { id }
    );
    const row = getResult.recordset?.[0];
    res.json(rowToProcess(row));
  } catch (err) {
    console.error('PUT /api/processos/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar processo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const result = await query(`DELETE FROM container_flow.processos WHERE id = @id`, { id });
    if (result.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/processos/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao remover processo' });
  }
});

router.get('/delays', async (req, res) => {
  try {
    const result = await query(
      `SELECT process_id AS processId, delay_minutos AS delayMinutos FROM container_flow.processos_delay`
    );
    res.json(result.recordset || []);
  } catch (err) {
    console.error('GET /api/processos/delays', err);
    res.json([]);
  }
});

router.put('/delays', async (req, res) => {
  try {
    const body = req.body || {};
    const processId = parseInt(body.processId, 10);
    const delayMinutos = Math.max(0, parseInt(body.delayMinutos, 10) || 0);
    if (Number.isNaN(processId)) return res.status(400).json({ error: 'processId inválido' });

    const up = await query(
      `UPDATE container_flow.processos_delay SET delay_minutos = @delayMinutos WHERE process_id = @processId`,
      { processId, delayMinutos }
    );
    if (up.rowsAffected?.[0] === 0) {
      await query(
        `INSERT INTO container_flow.processos_delay (process_id, delay_minutos) VALUES (@processId, @delayMinutos)`,
        { processId, delayMinutos }
      );
    }
    res.json({ processId, delayMinutos });
  } catch (err) {
    console.error('PUT /api/processos/delays', err);
    res.status(500).json({ error: err.message || 'Erro ao salvar delay' });
  }
});

module.exports = router;
