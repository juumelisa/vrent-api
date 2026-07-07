const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hashPassword = (password) => bcrypt.hash(password, 10);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

// jti keeps tokens unique even when issued for the same user within the same second
// (jwt's iat has second precision), since sessions.token has a UNIQUE constraint.
const signToken = (userId) =>
  jwt.sign({ sub: String(userId), jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: '7d' });

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { hashPassword, comparePassword, signToken, verifyToken, TOKEN_TTL_MS };
