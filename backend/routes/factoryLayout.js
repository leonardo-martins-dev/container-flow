const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

function rowToSlot(r) {
  return {
    id: r.slot_id,
    name: r.name,
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    containerId: r.container_id ?? null,
    nameX: r.name_x ?? undefined,
    nameY: r.name_y ?? undefined,
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT floor, slot_id, name, x, y, width, height, container_id, name_x, name_y
       FROM container_flow.factory_slots ORDER BY floor, slot_id`
    );
    const rows = result.recordset || [];
    const floor1 = rows.filter((r) => r.floor === 1).map(rowToSlot);
    const floor2 = rows.filter((r) => r.floor === 2).map(rowToSlot);
    res.json({ floor1, floor2 });
  } catch (err) {
    console.error('GET /api/factory-layout', err);
    res.status(500).json({ error: err.message || 'Erro ao carregar layout' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { floor1 = [], floor2 = [] } = req.body || {};
    const slots1 = Array.isArray(floor1) ? floor1 : [];
    const slots2 = Array.isArray(floor2) ? floor2 : [];

    await query(`DELETE FROM container_flow.factory_slots`);

    const insertOne = async (floor, slot) => {
      const id = slot.id ?? slot.slot_id ?? '';
      const name = slot.name ?? '';
      const x = Number(slot.x) || 0;
      const y = Number(slot.y) || 0;
      const width = Number(slot.width) || 180;
      const height = Number(slot.height) || 80;
      const containerId = slot.containerId ?? slot.container_id ?? null;
      const nameX = slot.nameX ?? slot.name_x ?? null;
      const nameY = slot.nameY ?? slot.name_y ?? null;
      await query(
        `INSERT INTO container_flow.factory_slots (floor, slot_id, name, x, y, width, height, container_id, name_x, name_y)
         VALUES (@floor, @slot_id, @name, @x, @y, @width, @height, @container_id, @name_x, @name_y)`,
        {
          floor,
          slot_id: id,
          name,
          x,
          y,
          width,
          height,
          container_id: containerId,
          name_x: nameX,
          name_y: nameY,
        }
      );
    };

    for (const slot of slots1) await insertOne(1, slot);
    for (const slot of slots2) await insertOne(2, slot);

    const result = await query(
      `SELECT floor, slot_id, name, x, y, width, height, container_id, name_x, name_y
       FROM container_flow.factory_slots ORDER BY floor, slot_id`
    );
    const rows = result.recordset || [];
    const out1 = rows.filter((r) => r.floor === 1).map(rowToSlot);
    const out2 = rows.filter((r) => r.floor === 2).map(rowToSlot);
    res.json({ floor1: out1, floor2: out2 });
  } catch (err) {
    console.error('PUT /api/factory-layout', err);
    res.status(500).json({ error: err.message || 'Erro ao salvar layout' });
  }
});

module.exports = router;
