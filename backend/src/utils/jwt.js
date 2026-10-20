// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

// Access token và refresh token dùng 2 secret riêng biệt
// Nếu 1 bị lộ, bên kia vẫn an toàn
const ACCESS_SECRET  = process.env.ACCESS_TOKEN_SECRET  || 'memmori_access_secret_key_2024';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'memmori_refresh_secret_key_2024';
const JWT_EXPIRES         = process.env.JWT_EXPIRES         || '30d';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '90d';

// Tạo access token (30d mặc định)
function signToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: JWT_EXPIRES });
}

// Tạo refresh token (90d mặc định) — secret KHÁC với access token
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
}

// Xác thực access token
function verifyToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Xác thực refresh token — dùng đúng secret của nó
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signToken, signRefreshToken, verifyToken, verifyRefreshToken };
