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
    status: (r.status || 'presente').toLowerCase(),
    coringa: !!(r.coringa),
    atrasoMinutos: r.atraso_minutos ?? null,
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nome, nivel, specialty_process_ids, status, coringa, atraso_minutos FROM container_flow.workers ORDER BY id`
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
    const { name, level, specialtyProcessIds, coringa } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }
    const nivel = (level === 'senior' || level === 'junior' ? level : 'junior').toLowerCase();
    const ids = Array.isArray(specialtyProcessIds) ? specialtyProcessIds : [];
    const specialtyJson = JSON.stringify(ids);
    const isCoringa = !!coringa;

    const nextResult = await query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM container_flow.workers`
    );
    const nextId = nextResult.recordset?.[0]?.nextId ?? 1;

    await query(
      `INSERT INTO container_flow.workers (id, nome, nivel, specialty_process_ids, status, coringa) VALUES (@id, @nome, @nivel, @specialty_process_ids, 'presente', @coringa)`,
      { id: nextId, nome: name.trim(), nivel, specialty_process_ids: specialtyJson, coringa: isCoringa }
    );

    const worker = { id: nextId, name: name.trim(), level: nivel, specialtyProcessIds: ids, status: 'presente', coringa: isCoringa, atrasoMinutos: null };
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

    const { name, level, specialtyProcessIds, status, atrasoMinutos, coringa, presenceDate, logPresence } = req.body || {};
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
    if (status !== undefined) {
      const s = String(status).toLowerCase();
      updates.status = ['presente', 'ausente', 'atrasado', 'falta', 'substituido'].includes(s) ? s : 'presente';
    }
    if (atrasoMinutos !== undefined) updates.atraso_minutos = atrasoMinutos == null ? null : Math.max(0, parseInt(atrasoMinutos, 10));
    if (coringa !== undefined) updates.coringa = !!coringa;

    if (Object.keys(updates).length === 0) {
      const getResult = await query(`SELECT id, nome, nivel, specialty_process_ids, status, coringa, atraso_minutos FROM container_flow.workers WHERE id = @id`, { id });
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

    // Registrar histórico de presença, se solicitado
    if (logPresence && status && (status === 'ausente' || status === 'atrasado')) {
      const dateStr = presenceDate && typeof presenceDate === 'string' && presenceDate.length >= 10
        ? presenceDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const presStatus = String(status).toLowerCase();
      const presAtraso = atrasoMinutos == null ? null : Math.max(0, parseInt(atrasoMinutos, 10) || 0);
      await query(
        `INSERT INTO container_flow.worker_presencas (worker_id, data, status, atraso_minutos)
         VALUES (@worker_id, @data, @status, @atraso_minutos)`,
        { worker_id: id, data: dateStr, status: presStatus, atraso_minutos: presAtraso }
      );
    }

    const getResult = await query(`SELECT id, nome, nivel, specialty_process_ids, status, coringa, atraso_minutos FROM container_flow.workers WHERE id = @id`, { id });
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

router.get('/:id/presencas', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const month = String(req.query.month || '').trim();
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Parâmetro month (YYYY-MM) é obrigatório' });
    }
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    if (Number.isNaN(year) || Number.isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Parâmetro month inválido' });
    }
    const startDate = `${yearStr}-${monthStr}-01`;
    const endDate = new Date(year, m, 0).toISOString().slice(0, 10);

    const result = await query(
      `SELECT data, status, atraso_minutos
       FROM container_flow.worker_presencas
       WHERE worker_id = @worker_id
         AND data >= @startDate
         AND data <= @endDate
       ORDER BY data`,
      { worker_id: id, startDate, endDate }
    );
    const rows = result.recordset || [];
    let totalFaltas = 0;
    let totalAtrasos = 0;
    let totalMinutosAtraso = 0;
    const presencas = rows.map((r) => {
      const s = (r.status || '').toLowerCase();
      if (s === 'ausente') totalFaltas += 1;
      if (s === 'atrasado') {
        totalAtrasos += 1;
        totalMinutosAtraso += r.atraso_minutos || 0;
      }
      return {
        date: r.data instanceof Date ? r.data.toISOString().slice(0, 10) : String(r.data).slice(0, 10),
        status: s,
        atrasoMinutos: r.atraso_minutos ?? null,
      };
    });

    res.json({ totalFaltas, totalAtrasos, totalMinutosAtraso, presencas });
  } catch (err) {
    console.error('GET /api/workers/:id/presencas', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar histórico de presença' });
  }
});

module.exports = router;
