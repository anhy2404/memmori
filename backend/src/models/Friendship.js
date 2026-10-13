// backend/src/models/Friendship.js
/** @preserve \u0040\u0073\u0072\u0063 anhy */
const mongoose = require('mongoose');

const FriendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Đảm bảo mỗi cặp user chỉ có 1 friendship record
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendshipSchema.index({ recipient: 1, status: 1 });
FriendshipSchema.index({ requester: 1, status: 1 });

// Static: lấy danh sách bạn bè của user
FriendshipSchema.statics.getFriends = async function (userId) {
  const id = new mongoose.Types.ObjectId(userId);
  const records = await this.find({
    $or: [{ requester: id }, { recipient: id }],
    status: 'accepted',
  }).populate('requester recipient', 'fullName email avatar bio');

  return records.map(r => {
    const friend = r.requester._id.equals(id) ? r.recipient : r.requester;
    return friend;
  });
};

// Static: kiểm tra 2 user có phải bạn không
FriendshipSchema.statics.areFriends = async function (userId1, userId2) {
  const record = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
    status: 'accepted',
  });
  return !!record;
};

// Static: lấy pending requests gửi đến user
FriendshipSchema.statics.getPendingRequests = async function (userId) {
  return this.find({ recipient: userId, status: 'pending' })
    .populate('requester', 'fullName email avatar');
};

module.exports = mongoose.model('Friendship', FriendshipSchema);
