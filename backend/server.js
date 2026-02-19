require('dotenv').config();
const express = require('express');
const cors = require('cors');

const propostasRouter = require('./routes/propostas');
const patrimoniosRouter = require('./routes/patrimonios');
const cronogramaRouter = require('./routes/cronograma');
const regrasRouter = require('./routes/regras');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/propostas', propostasRouter);
app.use('/api/patrimonios', patrimoniosRouter);
app.use('/api/cronograma', cronogramaRouter);
app.use('/api/regras', regrasRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Container Flow API rodando em http://localhost:${PORT}`);
});
