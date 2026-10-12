// backend/src/models/Memory.js
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  address: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
}, { _id: false });

const MemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  ownerName: { type: String, default: '' },
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
  },
  description: { type: String, default: '', maxlength: 2000 },
  photos: [{ type: String }],       // mảng URL ảnh
  video: { type: String, default: null }, // URL video
  location: { type: LocationSchema, default: null },
  tags: [{ type: String }],          // hashtags
  aiCaption: { type: String, default: '' },
  privacy: {
    type: String,
    enum: ['private', 'friends', 'public'],
    default: 'private',
  },
  taggedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index
MemorySchema.index({ userId: 1, createdAt: -1 });
MemorySchema.index({ privacy: 1, createdAt: -1 });
MemorySchema.index({ 'location.lat': 1, 'location.lng': 1 });
MemorySchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Memory', MemorySchema);
