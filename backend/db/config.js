require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost,1433',
  database: process.env.DB_NAME || 'BancoTAM',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: null,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

function parseServer(server) {
  const [host, port] = (server || 'localhost,1433').split(',');
  return { server: host.trim(), port: port ? parseInt(port, 10) : 1433 };
}

const { server: host, port } = parseServer(config.server);

module.exports = {
  ...config,
  server: host,
  port,
};
