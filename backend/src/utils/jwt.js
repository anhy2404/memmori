// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'memmori_secret_key_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '90d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, signRefreshToken, verifyToken };
