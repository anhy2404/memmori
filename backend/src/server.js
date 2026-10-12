// backend/src/server.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');

const app = express();
const server = http.createServer(app);

// ===== SOCKET.IO (realtime notifications) =====
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
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// Export để dùng trong controllers
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// ===== MIDDLEWARE =====
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200,
  message: { success: false, message: 'Quá nhiều request, thử lại sau' },
});
app.use('/api/', limiter);

// Static files (ảnh upload)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/memories', require('./routes/memories'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Memmori API đang chạy 🚀', time: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} không tồn tại` });
});

// Error handler
app.use(errorHandler);

// ===== KẾT NỐI MONGODB =====
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Memmori API chạy tại http://0.0.0.0:${PORT}`);
      console.log(`📡 Local:   http://localhost:${PORT}`);
      console.log(`📱 Network: http://${getLocalIP()}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });

// Lấy IP local để mobile kết nối
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
