const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

const FALLBACK_TYPES = [
  { id: 1, name: '20ft Standard', description: 'Contêiner padrão de 20 pés', dimensions: '20x8x8.5 ft' },
  { id: 2, name: '40ft Standard', description: 'Contêiner padrão de 40 pés', dimensions: '40x8x8.5 ft' },
  { id: 3, name: '40ft HC', description: 'Contêiner High Cube de 40 pés', dimensions: '40x8x9.5 ft' },
  { id: 4, name: '45ft HC', description: 'Contêiner High Cube de 45 pés', dimensions: '45x8x9.5 ft' },
  { id: 5, name: '53ft Standard', description: 'Contêiner padrão de 53 pés', dimensions: '53x8x8.5 ft' },
];

function rowToType(r) {
  return {
    id: r.id,
    name: r.nome,
    description: r.descricao ?? '',
    dimensions: r.dimensoes ?? '',
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nome, descricao, dimensoes FROM container_flow.container_types ORDER BY id`
    );
    const rows = result.recordset || [];
    if (rows.length === 0) return res.json(FALLBACK_TYPES);
    res.json(rows.map(rowToType));
  } catch (err) {
    console.error('GET /api/container-types', err);
    res.json(FALLBACK_TYPES);
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, dimensions } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }

    const nextResult = await query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM container_flow.container_types`
    );
    const nextId = nextResult.recordset?.[0]?.nextId ?? 1;

    await query(
      `INSERT INTO container_flow.container_types (id, nome, descricao, dimensoes) VALUES (@id, @nome, @descricao, @dimensoes)`,
      {
        id: nextId,
        nome: name.trim(),
        descricao: (description != null && typeof description === 'string') ? description.trim() : null,
        dimensoes: (dimensions != null && typeof dimensions === 'string') ? dimensions.trim() : null,
      }
    );

    const type = {
      id: nextId,
      name: name.trim(),
      description: (description != null && typeof description === 'string') ? description.trim() : '',
      dimensions: (dimensions != null && typeof dimensions === 'string') ? dimensions.trim() : '',
    };
    res.status(201).json(type);
  } catch (err) {
    console.error('POST /api/container-types', err);
    res.status(500).json({ error: err.message || 'Erro ao criar tipo' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const { name, description, dimensions } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name inválido' });
      updates.nome = name.trim();
    }
    if (description !== undefined) updates.descricao = description == null ? null : String(description).trim();
    if (dimensions !== undefined) updates.dimensoes = dimensions == null ? null : String(dimensions).trim();

    if (Object.keys(updates).length === 0) {
      const getResult = await query(
        `SELECT id, nome, descricao, dimensoes FROM container_flow.container_types WHERE id = @id`,
        { id }
      );
      const row = getResult.recordset?.[0];
      if (!row) return res.status(404).json({ error: 'Tipo não encontrado' });
      return res.json(rowToType(row));
    }

    const setClauses = Object.keys(updates).map((k) => `${k} = @${k}`);
    const sql = `UPDATE container_flow.container_types SET ${setClauses.join(', ')} WHERE id = @id`;
    const params = { ...updates, id };
    const updateResult = await query(sql, params);
    if (updateResult.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Tipo não encontrado' });
    }

    const getResult = await query(
      `SELECT id, nome, descricao, dimensoes FROM container_flow.container_types WHERE id = @id`,
      { id }
    );
    const row = getResult.recordset?.[0];
    res.json(rowToType(row));
  } catch (err) {
    console.error('PUT /api/container-types/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar tipo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const result = await query(`DELETE FROM container_flow.container_types WHERE id = @id`, { id });
    if (result.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Tipo não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/container-types/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao remover tipo' });
  }
});

module.exports = router;
