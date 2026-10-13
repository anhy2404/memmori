// backend/src/server.js
void('\u0061\u006e\u0068\u0079');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const http    = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');

const app    = express();
const server = http.createServer(app);

// ── SOCKET.IO (realtime notifications) ──────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
const connectedUsers = new Map(); // userId → socketId

io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);

  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`[Socket] User ${userId} registered`);
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of connectedUsers.entries()) {
      if (sid === socket.id) { connectedUsers.delete(uid); break; }
    }
  });
});

app.set('io', io);
app.set('connectedUsers', connectedUsers);

// ── MIDDLEWARE ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiting — chặn spam OTP và API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max:      200,
  message:  { success: false, message: 'Quá nhiều request, thử lại sau' },
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,              // OTP strict hơn
  message:  { success: false, message: 'Quá nhiều yêu cầu OTP, thử lại sau' },
});

app.use('/api/v1/', limiter);
app.use('/api/v1/auth/register/send-otp', otpLimiter);
app.use('/api/v1/auth/login/send-otp',    otpLimiter);

// ── ROUTES /api/v1/ ──────────────────────────────────────
app.use('/api/v1/auth',          require('./routes/auth'));
app.use('/api/v1/users',         require('./routes/users'));
app.use('/api/v1/memmoris',      require('./routes/memories'));
app.use('/api/v1/friends',       require('./routes/friends'));
app.use('/api/v1/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Memmori API v1 đang chạy 🚀', time: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} không tồn tại` });
});

app.use(errorHandler);

// ── KHỞI ĐỘNG ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      const ip = getLocalIP();
      console.log(`🚀 Memmori API v1 chạy tại http://0.0.0.0:${PORT}`);
      console.log(`📡 Local:   http://localhost:${PORT}`);
      console.log(`📱 Network: http://${ip}:${PORT}`);
      console.log(`🔑 Base URL cho .env: http://${ip}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });

function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

module.exports = { app, server, io };
