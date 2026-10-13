// backend/src/models/Notification.js
const _sym = typeof Symbol!=='undefined'?Symbol('\u0061\u006e\u0068\u0079'):null;
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fromUser: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: String,
    avatar: String,
  },
  type: {
    type: String,
    enum: [
      'FRIEND_REQUEST',
      'FRIEND_ACCEPTED',
      'MEMORY_TAGGED',
      'MEMORY_LIKED',
      'MEMORY_COMMENTED',
      'SYSTEM',
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false, index: true },
}, {
  timestamps: true,
});

// Index
NotificationSchema.index({ targetUserId: 1, createdAt: -1 });
NotificationSchema.index({ targetUserId: 1, isRead: 1 });

// Tự xóa thông báo sau 30 ngày
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', NotificationSchema);
