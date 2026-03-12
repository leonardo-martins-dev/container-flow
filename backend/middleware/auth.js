const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'container-flow-secret-change-in-production' : null);

function isPublicPath(req) {
  if (req.path === '/health' && req.method === 'GET') return true;
  if (req.path === '/auth/login' && req.method === 'POST') return true;
  return false;
}

function authMiddleware(req, res, next) {
  if (isPublicPath(req)) return next();

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET não configurado. Defina em produção.' });
  }
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    return res.status(401).json({ error: err.message || 'Não autorizado' });
  }
}

module.exports = authMiddleware;
