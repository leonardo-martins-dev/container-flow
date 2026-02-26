const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();
let propostasMissingLogged = false;

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
    if (err.number === 208 || (err.message && err.message.includes('Invalid object name'))) {
      if (!propostasMissingLogged) {
        propostasMissingLogged = true;
        console.warn('GET /api/propostas: tabela PROPOSTAS não existe (restaure o backup BancoTAM para dados reais). Retornando [].');
      }
      return res.json([]);
    }
    console.error('GET /api/propostas', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar propostas' });
  }
});

module.exports = router;
