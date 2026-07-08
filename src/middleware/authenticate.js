const pool = require('../db');
const { verifyToken } = require('../auth');
const { toBigInt } = require('../utils/bigint');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = verifyToken(token);

    const [sessions] = await pool.query(
      'SELECT id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (sessions.length === 0) {
      return res.status(401).json({ message: 'Session expired or logged out' });
    }

    req.userId = toBigInt(payload.sub);
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
