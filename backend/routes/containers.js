const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

const PROPOSTAS_QUERY = `
  SELECT ID, Ordem_Prod, Empresa, Data_Firmada, NumeroFicha, Cliente, Cidade, Produto,
    [Descrição], Patrimonio, IDPatrim, Valor, InformacoesAdicionais, TIPO_PROD
  FROM PROPOSTAS
  WHERE Finalizacao IS NULL
    AND Ordem_Prod IS NOT NULL
    AND Patrimonio IS NULL
    AND Cancelamento_Ficha IS NULL
  ORDER BY ID
`;

function parseProcessStages(val) {
  if (val == null || val === '') return [];
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function rowToContainer(r) {
  return {
    id: r.id,
    number: r.numero,
    type: r.type || '',
    cliente: r.cliente || '',
    deliveryDeadline: r.delivery_deadline ? new Date(r.delivery_deadline).toISOString().slice(0, 10) : '',
    startDate: r.start_date ? new Date(r.start_date).toISOString().slice(0, 10) : '',
    currentStatus: (r.current_status || 'pending').toLowerCase(),
    processStages: parseProcessStages(r.process_stages),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, numero, type, cliente, delivery_deadline, start_date, current_status, process_stages, created_at, proposta_id
       FROM container_flow.containers ORDER BY id`
    );
    const rows = result.recordset || [];
    res.json(rows.map(rowToContainer));
  } catch (err) {
    console.error('GET /api/containers', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar containers' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { number, type, cliente, deliveryDeadline, startDate, currentStatus, processStages } = req.body || {};
    const numero = (number != null ? String(number) : '').trim() || 'SEM-NUM';
    const typeStr = (type != null ? String(type) : '').trim() || '-';
    const clienteStr = cliente != null ? String(cliente).trim() : '';
    const delivery = deliveryDeadline ? new Date(deliveryDeadline).toISOString().slice(0, 10) : null;
    const start = startDate ? new Date(startDate).toISOString().slice(0, 10) : null;
    const status = (currentStatus && ['pending', 'in_progress', 'completed', 'cancelled'].includes(String(currentStatus).toLowerCase()))
      ? String(currentStatus).toLowerCase() : 'pending';
    const stagesJson = Array.isArray(processStages) ? JSON.stringify(processStages) : null;

    const insertResult = await query(
      `INSERT INTO container_flow.containers (numero, type, cliente, delivery_deadline, start_date, current_status, process_stages)
       OUTPUT INSERTED.id, INSERTED.numero, INSERTED.type, INSERTED.cliente, INSERTED.delivery_deadline, INSERTED.start_date, INSERTED.current_status, INSERTED.process_stages, INSERTED.created_at
       VALUES (@numero, @type, @cliente, @delivery_deadline, @start_date, @current_status, @process_stages)`,
      {
        numero,
        type: typeStr,
        cliente: clienteStr,
        delivery_deadline: delivery,
        start_date: start,
        current_status: status,
        process_stages: stagesJson,
      }
    );
    const row = insertResult.recordset?.[0];
    if (!row) return res.status(500).json({ error: 'Falha ao criar container' });
    res.status(201).json(rowToContainer(row));
  } catch (err) {
    console.error('POST /api/containers', err);
    res.status(500).json({ error: err.message || 'Erro ao criar container' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const { number, type, cliente, deliveryDeadline, startDate, currentStatus, processStages } = req.body || {};
    const updates = {};
    if (number !== undefined) updates.numero = String(number).trim() || 'SEM-NUM';
    if (type !== undefined) updates.type = String(type).trim() || '-';
    if (cliente !== undefined) updates.cliente = String(cliente).trim();
    if (deliveryDeadline !== undefined) updates.delivery_deadline = deliveryDeadline ? new Date(deliveryDeadline).toISOString().slice(0, 10) : null;
    if (startDate !== undefined) updates.start_date = startDate ? new Date(startDate).toISOString().slice(0, 10) : null;
    if (currentStatus !== undefined) {
      const s = String(currentStatus).toLowerCase();
      updates.current_status = ['pending', 'in_progress', 'completed', 'cancelled'].includes(s) ? s : 'pending';
    }
    if (processStages !== undefined) updates.process_stages = Array.isArray(processStages) ? JSON.stringify(processStages) : null;

    if (Object.keys(updates).length === 0) {
      const getResult = await query(
        `SELECT id, numero, type, cliente, delivery_deadline, start_date, current_status, process_stages, created_at FROM container_flow.containers WHERE id = @id`,
        { id }
      );
      const row = getResult.recordset?.[0];
      if (!row) return res.status(404).json({ error: 'Container não encontrado' });
      return res.json(rowToContainer(row));
    }

    const setClauses = Object.keys(updates).map((k) => `${k} = @${k}`);
    const sql = `UPDATE container_flow.containers SET ${setClauses.join(', ')} WHERE id = @id`;
    const params = { ...updates, id };
    const updateResult = await query(sql, params);
    if (updateResult.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Container não encontrado' });
    }

    const getResult = await query(
      `SELECT id, numero, type, cliente, delivery_deadline, start_date, current_status, process_stages, created_at FROM container_flow.containers WHERE id = @id`,
      { id }
    );
    const row = getResult.recordset?.[0];
    res.json(rowToContainer(row));
  } catch (err) {
    console.error('PUT /api/containers/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar container' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido' });

    const result = await query(`DELETE FROM container_flow.containers WHERE id = @id`, { id });
    if (result.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Container não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/containers/:id', err);
    res.status(500).json({ error: err.message || 'Erro ao remover container' });
  }
});

router.post('/sync-from-propostas', async (req, res) => {
  try {
    let propostas = [];
    try {
      const result = await query(PROPOSTAS_QUERY);
      propostas = result.recordset || [];
    } catch (err) {
      if (err.number === 208 || (err.message && err.message.includes('Invalid object name'))) {
        return res.json({ synced: 0, message: 'Tabela PROPOSTAS não existe. Restaure o backup BancoTAM.' });
      }
      throw err;
    }

    let synced = 0;
    for (const p of propostas) {
      const numero = (p.Patrimonio || p.Ordem_Prod || String(p.ID)).trim();
      const typeStr = (p.TIPO_PROD || p.Produto || '-').trim();
      const clienteStr = (p.Cliente || '-').trim();
      const delivery = p.Data_Firmada ? new Date(p.Data_Firmada).toISOString().slice(0, 10) : null;

      const existing = await query(
        `SELECT id FROM container_flow.containers WHERE proposta_id = @proposta_id`,
        { proposta_id: p.ID }
      );
      if (existing.recordset && existing.recordset.length > 0) {
        await query(
          `UPDATE container_flow.containers SET numero = @numero, type = @type, cliente = @cliente, delivery_deadline = @delivery_deadline
           WHERE proposta_id = @proposta_id`,
          { numero, type: typeStr, cliente: clienteStr, delivery_deadline: delivery, proposta_id: p.ID }
        );
      } else {
        await query(
          `INSERT INTO container_flow.containers (numero, type, cliente, delivery_deadline, current_status, proposta_id)
           VALUES (@numero, @type, @cliente, @delivery_deadline, 'pending', @proposta_id)`,
          { numero, type: typeStr, cliente: clienteStr, delivery_deadline: delivery, proposta_id: p.ID }
        );
      }
      synced++;
    }

    res.json({ synced, total: propostas.length });
  } catch (err) {
    console.error('POST /api/containers/sync-from-propostas', err);
    res.status(500).json({ error: err.message || 'Erro ao sincronizar' });
  }
});

module.exports = router;
