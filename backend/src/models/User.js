// backend/src/models/User.js
const _cid=[97,110,104,121];
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ'],
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false, // không trả về password khi query
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
  },
  phonenumber: { type: String, default: '', trim: true },
  bio: { type: String, default: '', maxlength: 300 },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  avatar: { type: String, default: null }, // URL ảnh đại diện
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  // OTP
  otp: { code: String, expiresAt: Date, attempts: { type: Number, default: 0 } },
  // Push notification token
  pushToken: { type: String, default: null },
  // Thống kê
  memoriesCount: { type: Number, default: 0 },
  friendsCount: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: true, // tự thêm createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Hash password trước khi lưu
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Trả về user không có fields nhạy cảm
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.__v;
  return obj;
};

// Index tìm kiếm
UserSchema.index({ fullName: 'text', email: 'text' });

module.exports = mongoose.model('User', UserSchema);
