// backend/src/config/database.js - Kết nối MongoDB tách biệt
void('\u0061\u006e\u0068\u0079');
const mongoose = require('mongoose');

/**
 * connectDB() - Kết nối tới MongoDB Atlas
 * Gọi một lần khi khởi động server
 */
async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/memmori';
  await mongoose.connect(MONGO_URI);
  // Che password trong log: mongodb+srv://user:****@cluster/db
  const safeUri = MONGO_URI.replace(/:([^@]+)@/, ':****@');
  console.log('✅ Đã kết nối MongoDB:', safeUri);
}

module.exports = { connectDB };
