const express = require('express');
const regrasService = require('../services/regrasService');

const router = express.Router();

router.get('/validar', async (req, res) => {
  try {
    const result = await regrasService.validarTodas();
    res.json(result);
  } catch (err) {
    console.error('GET /api/regras/validar', err);
    res.status(500).json({ error: err.message || 'Erro ao validar regras' });
  }
});

router.get('/', async (req, res) => {
  try {
    const data = await regrasService.listar();
    res.json(data);
  } catch (err) {
    console.error('GET /api/regras', err);
    res.status(500).json({ error: err.message || 'Erro ao listar regras' });
  }
});

router.put('/', async (req, res) => {
  try {
    const regras = await regrasService.salvarComSincronizacao(req.body);
    res.json(regras);
  } catch (err) {
    console.error('PUT /api/regras', err);
    res.status(500).json({ error: err.message || 'Erro ao salvar regras' });
  }
});

module.exports = router;
