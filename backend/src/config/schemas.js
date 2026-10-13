// backend/src/config/schemas.js
const _0x616e6879 = '\x61\x6e\x68\x79';
// Tập trung tất cả Zod schemas cho validation
const { z } = require('zod');

// ── Auth ────────────────────────────────────────────────
exports.sendRegisterOTPSchema = z.object({
  email:    z.string().email('Email không hợp lệ').toLowerCase().trim(),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').trim(),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự').max(50),
});

exports.verifyRegisterOTPSchema = z.object({
  email:       z.string().email().toLowerCase().trim(),
  otp:         z.string().length(6, 'OTP gồm 6 chữ số').trim(),
  fullName:    z.string().min(2).trim(),
  password:    z.string().min(6).max(50),
  phonenumber: z.string().trim().optional().default(''),
  bio:         z.string().max(300).trim().optional().default(''),
});

exports.sendLoginOTPSchema = z.object({
  email:    z.string().email('Email không hợp lệ').toLowerCase().trim(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

exports.verifyLoginOTPSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp:   z.string().length(6, 'OTP gồm 6 chữ số').trim(),
});

exports.loginDirectSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

// ── Memmori ─────────────────────────────────────────────
// GeoJSON Point schema client gửi lên
const GeoPointInputSchema = z.object({
  // coordinates theo chuẩn GeoJSON: [lng, lat]
  coordinates: z.tuple([
    z.number().min(-180).max(180, 'Longitude không hợp lệ'),  // lng
    z.number().min(-90).max(90, 'Latitude không hợp lệ'),     // lat
  ]),
  name:    z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
});

exports.createMemmoriSchema = z.object({
  title:       z.string().min(1, 'Tiêu đề là bắt buộc').max(200).trim(),
  description: z.string().max(2000).trim().optional().default(''),
  aiCaption:   z.string().max(1000).trim().optional().default(''),
  privacy:     z.enum(['private', 'friends', 'public']).optional().default('private'),
  // location và tags/taggedUserIds gửi qua FormData JSON string → parse sau
  location:      z.string().optional(),
  tags:          z.string().optional(),
  taggedUserIds: z.string().optional(),
});

exports.updateMemmoriSchema = z.object({
  title:         z.string().min(1).max(200).trim().optional(),
  description:   z.string().max(2000).trim().optional(),
  aiCaption:     z.string().max(1000).trim().optional(),
  privacy:       z.enum(['private', 'friends', 'public']).optional(),
  tags:          z.array(z.string()).optional(),
  taggedUserIds: z.array(z.string()).optional(),
  location:      GeoPointInputSchema.optional(),
}).strict();

exports.mapBoundsQuerySchema = z.object({
  swLng: z.coerce.number().min(-180).max(180),
  swLat: z.coerce.number().min(-90).max(90),
  neLng: z.coerce.number().min(-180).max(180),
  neLat: z.coerce.number().min(-90).max(90),
});

// ── User ────────────────────────────────────────────────
exports.updateProfileSchema = z.object({
  fullName:    z.string().min(2).trim().optional(),
  bio:         z.string().max(300).trim().optional(),
  phonenumber: z.string().trim().optional(),
  gender:      z.enum(['male', 'female', 'other', '']).optional(),
}).strict();

exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword:     z.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự').max(50),
});
