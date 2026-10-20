// backend/src/controllers/userController.js
const _cid=[97,110,104,121];
const User = require('../models/User');
const Memory = require('../models/Memory');

// ===== CẬP NHẬT HỒ SƠ =====
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phonenumber', 'bio', 'gender', 'pushToken'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ===== ĐỔI MẬT KHẨU =====
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    next(err);
  }
};

// ===== UPLOAD AVATAR =====
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file ảnh' });
    }

    // Stream buffer thẳng lên Cloudinary (memoryStorage — không có filename trên disk)
    const { uploadBuffer } = require('../services/cloudStorageService');
    const avatarUrl = await uploadBuffer(req.file.buffer, 'memmori/avatars');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({ success: true, avatar: avatarUrl, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ===== TÌM KIẾM USER =====
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      $or: [
        { fullName: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
      isActive: true,
    }).select('fullName email avatar bio').limit(20);

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY PROFILE USER KHÁC =====
exports.getUserProfile = async (req, res, next) => {
  try {
    // Guard: tránh "me" bị parse thành userId (CastError)
    if (req.params.userId === 'me') {
      return res.status(400).json({ success: false, message: 'Dùng GET /auth/me để lấy profile của bạn' });
    }

    const user = await User.findById(req.params.userId).select('-otp -password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Đếm memories public
    const publicMemoriesCount = await Memory.countDocuments({
      userId: user._id,
      privacy: 'public',
      isDeleted: false,
    });

    res.json({ success: true, user: { ...user.toPublic(), publicMemoriesCount } });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY TẤT CẢ USERS (admin) =====
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-otp -password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
