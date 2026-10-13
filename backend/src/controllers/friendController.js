// backend/src/controllers/friendController.js
/** @preserve \u0040\u0073\u0072\u0063 anhy */
const Friendship = require('../models/Friendship');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ===== GỬI LỜI MỜI KẾT BẠN =====
exports.sendRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể kết bạn với chính mình' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Kiểm tra đã có quan hệ chưa
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Đã là bạn bè' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Lời mời đã được gửi' });
      }
    }

    await Friendship.create({ requester: req.user._id, recipient: recipientId });

    // Gửi thông báo
    await Notification.create({
      targetUserId: recipientId,
      fromUser: { id: req.user._id, fullName: req.user.fullName, avatar: req.user.avatar },
      type: 'FRIEND_REQUEST',
      title: 'Lời mời kết bạn mới 🤝',
      body: `${req.user.fullName} đã gửi lời mời kết bạn cho bạn`,
      data: { userId: req.user._id },
    });

    res.json({ success: true, message: `Đã gửi lời mời đến ${recipient.fullName}` });
  } catch (err) {
    next(err);
  }
};

// ===== CHẤP NHẬN LỜI MỜI =====
exports.acceptRequest = async (req, res, next) => {
  try {
    const { requesterId } = req.body;

    const friendship = await Friendship.findOne({
      requester: requesterId,
      recipient: req.user._id,
      status: 'pending',
    });

    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Lời mời không tồn tại' });
    }

    friendship.status = 'accepted';
    await friendship.save();

    // Cập nhật friendsCount
    await User.findByIdAndUpdate(requesterId, { $inc: { friendsCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { friendsCount: 1 } });

    // Thông báo cho người gửi lời mời
    await Notification.create({
      targetUserId: requesterId,
      fromUser: { id: req.user._id, fullName: req.user.fullName, avatar: req.user.avatar },
      type: 'FRIEND_ACCEPTED',
      title: 'Lời mời kết bạn được chấp nhận ✅',
      body: `${req.user.fullName} đã chấp nhận lời mời kết bạn của bạn`,
      data: { userId: req.user._id },
    });

    res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn' });
  } catch (err) {
    next(err);
  }
};

// ===== TỪ CHỐI LỜI MỜI =====
exports.declineRequest = async (req, res, next) => {
  try {
    const { requesterId } = req.body;
    await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: req.user._id,
      status: 'pending',
    });
    res.json({ success: true, message: 'Đã từ chối lời mời' });
  } catch (err) {
    next(err);
  }
};

// ===== HỦY KẾT BẠN =====
exports.unfriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: friendId },
        { requester: friendId, recipient: req.user._id },
      ],
      status: 'accepted',
    });

    await User.findByIdAndUpdate(friendId, { $inc: { friendsCount: -1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { friendsCount: -1 } });

    res.json({ success: true, message: 'Đã hủy kết bạn' });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY DANH SÁCH BẠN BÈ =====
exports.getFriends = async (req, res, next) => {
  try {
    const friends = await Friendship.getFriends(req.user._id);
    res.json({ success: true, friends });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY PENDING REQUESTS =====
exports.getPendingRequests = async (req, res, next) => {
  try {
    const requests = await Friendship.getPendingRequests(req.user._id);
    res.json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY SENT REQUESTS =====
exports.getSentRequests = async (req, res, next) => {
  try {
    const requests = await Friendship.find({
      requester: req.user._id,
      status: 'pending',
    }).populate('recipient', 'fullName email avatar');
    res.json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};
