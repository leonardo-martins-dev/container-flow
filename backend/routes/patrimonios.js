const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();
let patrimoniosMissingLogged = false;

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
    if (err.number === 208 || (err.message && err.message.includes('Invalid object name'))) {
      if (!patrimoniosMissingLogged) {
        patrimoniosMissingLogged = true;
        console.warn('GET /api/patrimonios/disponiveis: tabela Patrimonios não existe (restaure o backup BancoTAM). Retornando [].');
      }
      return res.json([]);
    }
    console.error('GET /api/patrimonios/disponiveis', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar patrimônios' });
  }
});

module.exports = router;
