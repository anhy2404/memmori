// backend/src/utils/seedData.js - Tạo dữ liệu mặc định trong MongoDB Atlas
const _b = 'YW5oeQ==';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

// ===== SEED ACCOUNTS =====
const SEED_USERS = [
  {
    email: 'hoangyen24042004@gmail.com',
    password: 'yen24042004',
    fullName: 'Hoàng Yến',
    phonenumber: '',
    bio: 'Tài khoản quản trị Memmori',
    gender: 'female',
    role: 'admin',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'demo@memmori.vn',
    password: '123456',
    fullName: 'Người Dùng Demo',
    phonenumber: '0901234567',
    bio: 'Tài khoản demo Memmori',
    gender: '',
    role: 'user',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'anhy0467@gmail.com',
    password: '123456',
    fullName: 'An Hy',
    phonenumber: '',
    bio: '',
    gender: '',
    role: 'user',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'anhy123456@gmail.com',
    password: '123456',
    fullName: 'An Hy',
    phonenumber: '',
    bio: '',
    gender: '',
    role: 'user',
    isVerified: true,
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    console.log('🔗 Đang kết nối MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối thành công:', mongoose.connection.name);

    // Load model sau khi connect
    const User = require('../models/User');

    console.log('\n📦 Bắt đầu seed users...');

    for (const userData of SEED_USERS) {
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        // Cập nhật role và isVerified nếu cần
        await User.findOneAndUpdate(
          { email: userData.email },
          { role: userData.role, isVerified: true, isActive: true }
        );
        console.log(`⚡ Đã tồn tại (cập nhật): ${userData.email}`);
      } else {
        // Tạo mới — password sẽ tự hash qua pre-save hook
        await User.create(userData);
        console.log(`✅ Tạo mới: ${userData.email} (${userData.fullName})`);
      }
    }

    // Thống kê
    const totalUsers = await User.countDocuments();
    console.log(`\n📊 Tổng số users trong DB: ${totalUsers}`);
    console.log('\n🎉 Seed hoàn thành!');
    console.log('\n📋 Tài khoản có thể đăng nhập:');
    SEED_USERS.forEach(u => {
      console.log(`   📧 ${u.email} | 🔑 ${u.password} | 👤 ${u.fullName} ${u.role === 'admin' ? '(ADMIN)' : ''}`);
    });

  } catch (err) {
    console.error('❌ Lỗi seed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

seedDatabase();
