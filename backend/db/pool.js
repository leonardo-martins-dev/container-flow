const sql = require('mssql');
const config = require('./config');

let pool = null;

async function getPool() {
  if (pool) return pool;
  const cfg = {
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    options: config.options,
    pool: config.pool,
  };
  pool = await sql.connect(cfg);
  return pool;
}

async function query(q, params = {}) {
  const p = await getPool();
  const req = p.request();
  Object.keys(params).forEach((key) => {
    req.input(key, params[key]);
  });
  const result = await req.query(q);
  return result;
}

module.exports = { getPool, query, sql };
