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

router.get('/', async (req, res) => {
  try {
    const result = await query(PROPOSTAS_QUERY);
    res.json(result.recordset || []);
  } catch (err) {
    console.error('GET /api/propostas', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar propostas' });
  }
});

module.exports = router;
