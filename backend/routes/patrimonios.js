const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

const PATRIMONIOS_QUERY = `
  SELECT TIPO, GRUPO, Patrimonio, [Descrição], Id
  FROM Patrimonios
  WHERE [LOCALIZAÇÃO] = 'Disponível'
    AND RESERVA IS NULL
`;

router.get('/disponiveis', async (req, res) => {
  try {
    const result = await query(PATRIMONIOS_QUERY);
    res.json(result.recordset || []);
  } catch (err) {
    console.error('GET /api/patrimonios/disponiveis', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar patrimônios' });
  }
});

module.exports = router;
