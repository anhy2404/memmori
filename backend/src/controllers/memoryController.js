// backend/src/controllers/memoryController.js
const Memory = require('../models/Memory');
const Friendship = require('../models/Friendship');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

// ===== TẠO MEMORY =====
exports.createMemory = async (req, res, next) => {
  try {
    const { title, description, location, tags, aiCaption, privacy, taggedUsers } = req.body;

    // Xử lý ảnh upload
    const photos = req.files?.map(f => `${process.env.BASE_URL}/uploads/memories/${f.filename}`) || [];

    // Parse JSON fields từ FormData
    let parsedLocation = null;
    let parsedTags = [];
    let parsedTaggedUsers = [];

    try { parsedLocation = location ? JSON.parse(location) : null; } catch {}
    try { parsedTags = tags ? JSON.parse(tags) : []; } catch {}
    try { parsedTaggedUsers = taggedUsers ? JSON.parse(taggedUsers) : []; } catch {}

    const memory = await Memory.create({
      userId: req.user._id,
      ownerName: req.user.fullName,
      title: title.trim(),
      description: description?.trim() || '',
      photos,
      location: parsedLocation,
      tags: parsedTags,
      aiCaption: aiCaption || '',
      privacy: privacy || 'private',
      taggedUsers: parsedTaggedUsers,
    });

    // Gửi thông báo cho những người được tag
    if (parsedTaggedUsers.length > 0) {
      const notifPromises = parsedTaggedUsers.map(userId =>
        Notification.create({
          targetUserId: userId,
          fromUser: { id: req.user._id, fullName: req.user.fullName, avatar: req.user.avatar },
          type: 'MEMORY_TAGGED',
          title: 'Bạn được gắn thẻ trong kỷ niệm 🏷️',
          body: `${req.user.fullName} đã gắn thẻ bạn trong "${title.trim()}"`,
          data: { memoryId: memory._id },
        })
      );
      await Promise.allSettled(notifPromises);
    }

    res.status(201).json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY MEMORIES CỦA MÌNH =====
exports.getMyMemories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    const query = { userId: req.user._id, isDeleted: false };

    // Lọc theo thời gian
    if (filter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
    } else if (filter === 'week') {
      query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (filter === 'month') {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
    }

    const [memories, total] = await Promise.all([
      Memory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Memory.countDocuments(query),
    ]);

    res.json({ success: true, memories, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY MEMORIES CÓ VỊ TRÍ =====
exports.getMemoriesWithLocation = async (req, res, next) => {
  try {
    const memories = await Memory.find({
      userId: req.user._id,
      isDeleted: false,
      'location.lat': { $ne: null },
      'location.lng': { $ne: null },
    }).select('title photos location createdAt privacy');

    res.json({ success: true, memories });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY MEMORIES PUBLIC (Discover / Feed) =====
exports.getPublicMemories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Lấy memories public + memories của bạn bè (friends privacy)
    const friends = await Friendship.getFriends(req.user._id);
    const friendIds = friends.map(f => f._id);

    const memories = await Memory.find({
      isDeleted: false,
      $or: [
        { privacy: 'public' },
        { privacy: 'friends', userId: { $in: friendIds } },
        { userId: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName avatar');

    res.json({ success: true, memories });
  } catch (err) {
    next(err);
  }
};

// ===== LẤY 1 MEMORY THEO ID =====
exports.getMemoryById = async (req, res, next) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, isDeleted: false })
      .populate('userId', 'fullName avatar')
      .populate('taggedUsers', 'fullName avatar');

    if (!memory) {
      return res.status(404).json({ success: false, message: 'Kỷ niệm không tồn tại' });
    }

    // Kiểm tra quyền xem
    const isOwner = memory.userId._id.equals(req.user._id);
    const isFriend = await Friendship.areFriends(req.user._id, memory.userId._id);
    if (!isOwner && memory.privacy === 'private') {
      return res.status(403).json({ success: false, message: 'Không có quyền xem' });
    }
    if (!isOwner && memory.privacy === 'friends' && !isFriend) {
      return res.status(403).json({ success: false, message: 'Chỉ bạn bè mới xem được' });
    }

    res.json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

// ===== CẬP NHẬT MEMORY =====
exports.updateMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, isDeleted: false });
    if (!memory) {
      return res.status(404).json({ success: false, message: 'Kỷ niệm không tồn tại' });
    }
    if (!memory.userId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa' });
    }

    const allowed = ['title', 'description', 'tags', 'aiCaption', 'privacy', 'location', 'taggedUsers'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) memory[field] = req.body[field];
    });

    await memory.save();
    res.json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

// ===== XÓA MEMORY =====
exports.deleteMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, isDeleted: false });
    if (!memory) {
      return res.status(404).json({ success: false, message: 'Kỷ niệm không tồn tại' });
    }

    const isOwner = memory.userId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    }

    // Soft delete
    memory.isDeleted = true;
    await memory.save();

    // Xóa file ảnh
    memory.photos.forEach(photoUrl => {
      const filename = path.basename(photoUrl);
      const filePath = path.join(__dirname, '../../uploads/memories', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    res.json({ success: true, message: 'Đã xóa kỷ niệm' });
  } catch (err) {
    next(err);
  }
};

// ===== THỐNG KÊ =====
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [total, thisMonth, withLocation] = await Promise.all([
      Memory.countDocuments({ userId, isDeleted: false }),
      Memory.countDocuments({ userId, isDeleted: false, createdAt: { $gte: monthStart } }),
      Memory.countDocuments({ userId, isDeleted: false, 'location.lat': { $ne: null } }),
    ]);

    // Unique locations
    const locationDocs = await Memory.find({ userId, isDeleted: false, 'location.name': { $ne: '' } })
      .select('location.name');
    const uniqueLocations = new Set(locationDocs.map(m => m.location?.name)).size;

    res.json({ success: true, stats: { total, thisMonth, locations: uniqueLocations, withLocation } });
  } catch (err) {
    next(err);
  }
};
