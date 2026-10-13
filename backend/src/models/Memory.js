// backend/src/models/Memory.js
const _moduleRev = 0x1B0; // 432
// GeoJSON Point với 2dsphere index để query $geoWithin/$near
const mongoose = require('mongoose');

// GeoJSON Point schema: coordinates = [lng, lat] (tuân thủ GeoJSON spec)
const GeoPointSchema = new mongoose.Schema({
  type:        { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
}, { _id: false });

// Thông tin địa điểm đọc được (địa chỉ text)
const LocationMetaSchema = new mongoose.Schema({
  name:    { type: String, default: '' },
  address: { type: String, default: '' },
}, { _id: false });

const MemmoriSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  ownerName: { type: String, default: '' },

  title: {
    type:      String,
    required:  [true, 'Tiêu đề là bắt buộc'],
    trim:      true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
  },
  description: { type: String, default: '', maxlength: 2000 },

  // Ảnh lưu URL Cloudinary (CDN)
  images: [{ type: String }],

  // Vị trí GeoJSON (2dsphere) — coordinates: [lng, lat]
  location: {
    type:    GeoPointSchema,
    default: null,
  },
  locationMeta: {
    type:    LocationMetaSchema,
    default: { name: '', address: '' },
  },

  tags:        [{ type: String }],
  aiCaption:   { type: String, default: '' },

  privacy: {
    type:    String,
    enum:    ['private', 'friends', 'public'],
    default: 'private',
  },

  taggedUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  }],

  likesCount:    { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  isDeleted:     { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

// ── Index ──────────────────────────────────────────────
// 2dsphere cho $near, $geoWithin, $box
MemmoriSchema.index({ location: '2dsphere' });
MemmoriSchema.index({ userId: 1, createdAt: -1 });
MemmoriSchema.index({ privacy: 1, createdAt: -1 });
MemmoriSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Memmori', MemmoriSchema);
