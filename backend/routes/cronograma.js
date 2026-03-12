const express = require('express');
const cronogramaService = require('../services/cronogramaService');

const router = express.Router();

router.get('/macro', async (req, res) => {
  try {
    const data = await cronogramaService.getMacro();
    res.json(data);
  } catch (err) {
    console.error('GET /api/cronograma/macro', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar cronograma macro' });
  }
});

router.get('/diario', async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ error: 'Parâmetro date (YYYY-MM-DD) é obrigatório' });
    }
    const data = await cronogramaService.getDiario(date);
    res.json(data);
  } catch (err) {
    console.error('GET /api/cronograma/diario', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar cronograma diário' });
  }
});

router.post('/gerar', async (req, res) => {
  try {
    const result = await cronogramaService.gerar();
    if (result.success === false && result.conflicts && result.conflicts.length > 0) {
      return res.status(400).json({ ok: false, error: 'Conflitos de horário detectados', conflicts: result.conflicts });
    }
    res.json(result);
  } catch (err) {
    console.error('POST /api/cronograma/gerar', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar cronograma' });
  }
});

router.get('/previsao-comercial', async (req, res) => {
  try {
    const data = await cronogramaService.getPrevisaoComercial();
    res.json(data);
  } catch (err) {
    console.error('GET /api/cronograma/previsao-comercial', err);
    res.json([]);
  }
});

module.exports = router;
