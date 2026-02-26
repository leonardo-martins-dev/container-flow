const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

function parseSpecialtyIds(val) {
  if (val == null || val === '') return [];
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function rowToWorker(r) {
  return {
    id: r.id,
    name: r.nome,
    level: (r.nivel || 'junior').toLowerCase(),
    specialtyProcessIds: parseSpecialtyIds(r.specialty_process_ids),
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nome, nivel, specialty_process_ids FROM container_flow.workers ORDER BY id`
    );
    const rows = result.recordset || [];
    res.json(rows.map(rowToWorker));
  } catch (err) {
    console.error('GET /api/workers', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar trabalhadores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, level, specialtyProcessIds } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }
    const nivel = (level === 'senior' || level === 'junior' ? level : 'junior').toLowerCase();
    const ids = Array.isArray(specialtyProcessIds) ? specialtyProcessIds : [];
    const specialtyJson = JSON.stringify(ids);

    const nextResult = await query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM container_flow.workers`
    );
    const nextId = nextResult.recordset?.[0]?.nextId ?? 1;

    await query(
      `INSERT INTO container_flow.workers (id, nome, nivel, specialty_process_ids) VALUES (@id, @nome, @nivel, @specialty_process_ids)`,
      { id: nextId, nome: name.trim(), nivel, specialty_process_ids: specialtyJson }
    );

    const worker = { id: nextId, name: name.trim(), level: nivel, specialtyProcessIds: ids };
    res.status(201).json(worker);
  } catch (err) {
    console.error('POST /api/workers', err);
    res.status(500).json({ error: err.message || 'Erro ao criar trabalhador' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const { name, level, specialtyProcessIds } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name inválido' });
      updates.nome = name.trim();
    }
    if (level !== undefined) {
      updates.nivel = (level === 'senior' || level === 'junior' ? level : 'junior').toLowerCase();
    }
    if (specialtyProcessIds !== undefined) {
      updates.specialty_process_ids = JSON.stringify(Array.isArray(specialtyProcessIds) ? specialtyProcessIds : []);
    }

    if (Object.keys(updates).length === 0) {
      const getResult = await query(`SELECT id, nome, nivel, specialty_process_ids FROM container_flow.workers WHERE id = @id`, { id });
      const row = getResult.recordset?.[0];
      if (!row) return res.status(404).json({ error: 'Trabalhador não encontrado' });
      return res.json(rowToWorker(row));
    }

    const setClauses = Object.keys(updates).map((k) => `${k} = @${k}`);
    const sql = `UPDATE container_flow.workers SET ${setClauses.join(', ')} WHERE id = @id`;
    const params = { ...updates, id };
    const updateResult = await query(sql, params);
    if (updateResult.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Trabalhador não encontrado' });
    }

    const getResult = await query(`SELECT id, nome, nivel, specialty_process_ids FROM container_flow.workers WHERE id = @id`, { id });
    const row = getResult.recordset?.[0];
    res.json(rowToWorker(row));
  } catch (err) {
    console.error('PUT /api/workers/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar trabalhador' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const result = await query(`DELETE FROM container_flow.workers WHERE id = @id`, { id });
    if (result.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Trabalhador não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/workers/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao remover trabalhador' });
  }
});

module.exports = router;
