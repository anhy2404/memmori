// src/repositories/schemas.js
const _sym = typeof Symbol!=='undefined'?Symbol('\u0061\u006e\u0068\u0079'):null;
// Zod schemas phía client — tự sửa lỗi (coerce, trim, default)
import { z } from 'zod';

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(50),
});

export const registerSchema = z.object({
  email:           z.string().trim().toLowerCase().email('Email không hợp lệ'),
  fullName:        z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  password:        z.string().min(6, 'Mật khẩu ít nhất 6 ký tự').max(50),
  confirmPassword: z.string(),
  phonenumber:     z.string().trim().optional().default(''),
  bio:             z.string().trim().max(300).optional().default(''),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path:    ['confirmPassword'],
});

export const otpSchema = z.object({
  otp: z.string().trim().length(6, 'OTP gồm đúng 6 chữ số'),
});

// ── Memmori ─────────────────────────────────────────────────────────────────
// GeoJSON Point từ GPS expo-location
export const geoPointSchema = z.object({
  // coordinates: [lng, lat] — chuẩn GeoJSON
  coordinates: z.tuple([
    z.number().min(-180).max(180),  // lng
    z.number().min(-90).max(90),    // lat
  ]),
  name:    z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
});

export const createMemmoriSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tiêu đề là bắt buộc')
    .max(200, 'Tiêu đề không quá 200 ký tự'),
  description: z.string().trim().max(2000).optional().default(''),
  aiCaption:   z.string().trim().max(1000).optional().default(''),
  privacy:     z.enum(['private', 'friends', 'public']).optional().default('private'),
  images:      z.array(z.string()).max(10).optional().default([]),
  tags:        z.array(z.string().trim()).max(10).optional().default([]),
  taggedUserIds: z.array(z.string()).optional().default([]),
  location:    geoPointSchema.optional(),
});

// ── User profile ────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  fullName:    z.string().trim().min(2).optional(),
  bio:         z.string().trim().max(300).optional(),
  phonenumber: z.string().trim().optional(),
  gender:      z.enum(['male', 'female', 'other', '']).optional(),
}).strict();
