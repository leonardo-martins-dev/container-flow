require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const propostasRouter = require('./routes/propostas');
const patrimoniosRouter = require('./routes/patrimonios');
const cronogramaRouter = require('./routes/cronograma');
const regrasRouter = require('./routes/regras');
const processosRouter = require('./routes/processos');
const workersRouter = require('./routes/workers');
const containerTypesRouter = require('./routes/containerTypes');
const containersRouter = require('./routes/containers');
const factoryLayoutRouter = require('./routes/factoryLayout');
const authRouter = require('./routes/auth');
const logisticsRouter = require('./routes/logistics');
const publicRouter = require('./routes/public');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', authMiddleware);

app.use('/api/propostas', propostasRouter);
app.use('/api/patrimonios', patrimoniosRouter);
app.use('/api/cronograma', cronogramaRouter);
app.use('/api/regras', regrasRouter);
app.use('/api/processos', processosRouter);
app.use('/api/workers', workersRouter);
app.use('/api/container-types', containerTypesRouter);
app.use('/api/containers', containersRouter);
app.use('/api/factory-layout', factoryLayoutRouter);
app.use('/api/auth', authRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/public', publicRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Container Flow API rodando em http://localhost:${PORT}`);
});
