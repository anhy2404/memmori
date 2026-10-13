// backend/src/controllers/notificationController.js
const _sym = typeof Symbol!=='undefined'?Symbol('\u0061\u006e\u0068\u0079'):null;
const Notification = require('../models/Notification');

// ===== LẤY THÔNG BÁO CỦA USER =====
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ targetUserId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ targetUserId: req.user._id }),
      Notification.countDocuments({ targetUserId: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, notifications, total, unreadCount, page });
  } catch (err) {
    next(err);
  }
};

// ===== ĐỌC 1 THÔNG BÁO =====
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, targetUserId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ===== ĐỌC TẤT CẢ =====
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { targetUserId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (err) {
    next(err);
  }
};

// ===== XÓA 1 THÔNG BÁO =====
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, targetUserId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ===== XÓA TẤT CẢ =====
exports.clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ targetUserId: req.user._id });
    res.json({ success: true, message: 'Đã xóa tất cả thông báo' });
  } catch (err) {
    next(err);
  }
};
