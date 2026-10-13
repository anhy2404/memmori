// backend/src/controllers/memoryController.js
const _moduleRev = 0x1B0; // 432
// Luồng: JWT verify → Zod validate → Cloudinary upload → MongoDB GeoJSON insert
const Memmori      = require('../models/Memory');
const Friendship   = require('../models/Friendship');
const Notification = require('../models/Notification');
const { uploadManyBuffers } = require('../services/cloudStorageService');

// Helper: parse JSON string an toàn
function safeParse(str, fallback) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

// ── TẠO MEMMORI ─────────────────────────────────────────────────────────
// POST /api/v1/memmoris
exports.createMemmori = async (req, res, next) => {
  try {
    const { title, description, aiCaption, privacy } = req.body;

    // Parse JSON fields từ FormData
    const locationRaw     = safeParse(req.body.location, null);
    const tags            = safeParse(req.body.tags, []);
    const taggedUserIds   = safeParse(req.body.taggedUserIds, []);

    // Build GeoJSON Point: coordinates = [lng, lat]
    let geoPoint   = null;
    let locationMeta = { name: '', address: '' };

    if (locationRaw?.coordinates?.length === 2) {
      // Client đã gửi đúng GeoJSON format { coordinates: [lng, lat], name, address }
      geoPoint = { type: 'Point', coordinates: locationRaw.coordinates };
      locationMeta = {
        name:    locationRaw.name    || '',
        address: locationRaw.address || '',
      };
    } else if (locationRaw?.lat != null && locationRaw?.lng != null) {
      // Client cũ gửi { lat, lng } → tự chuyển sang GeoJSON
      geoPoint = { type: 'Point', coordinates: [locationRaw.lng, locationRaw.lat] };
      locationMeta = {
        name:    locationRaw.name    || '',
        address: locationRaw.address || '',
      };
    }

    // Upload ảnh lên Cloudinary (stream buffer — không lưu disk)
    let imageUrls = [];
    if (req.files?.length > 0) {
      const buffers = req.files.map(f => f.buffer);
      imageUrls = await uploadManyBuffers(buffers, 'memmori/memories');
    }

    const memmori = await Memmori.create({
      userId:       req.user._id,
      ownerName:    req.user.fullName,
      title:        title.trim(),
      description:  description?.trim() || '',
      aiCaption:    aiCaption || '',
      privacy:      privacy || 'private',
      images:       imageUrls,
      location:     geoPoint,
      locationMeta,
      tags,
      taggedUserIds,
    });

    // Thông báo tag người dùng
    if (taggedUserIds.length > 0) {
      const notifPromises = taggedUserIds.map(uid =>
        Notification.create({
          targetUserId: uid,
          fromUser:     { id: req.user._id, fullName: req.user.fullName, avatar: req.user.avatar },
          type:         'MEMORY_TAGGED',
          title:        'Bạn được gắn thẻ trong kỷ niệm 🏷️',
          body:         `${req.user.fullName} đã gắn thẻ bạn trong "${title.trim()}"`,
          data:         { memmoriId: memmori._id },
        })
      );
      await Promise.allSettled(notifPromises);
    }

    res.status(201).json({ success: true, memmori });
  } catch (err) {
    next(err);
  }
};

// ── LẤY MEMMORIS CỦA MÌNH ────────────────────────────────────────────────
// GET /api/v1/memmoris/my
exports.getMyMemmoris = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const skip   = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    const query = { userId: req.user._id, isDeleted: false };

    if (filter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
    } else if (filter === 'week') {
      query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (filter === 'month') {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
    }

    const [memmoris, total] = await Promise.all([
      Memmori.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Memmori.countDocuments(query),
    ]);

    res.json({ success: true, memmoris, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// ── LẤY MARKERS TRONG BOUNDING BOX (BẢN ĐỒ) ────────────────────────────
// GET /api/v1/memmoris/map-bounds?swLng=&swLat=&neLng=&neLat=
// Query GeoJSON $geoWithin $box — sử dụng 2dsphere index
exports.getMapBounds = async (req, res, next) => {
  try {
    const { swLng, swLat, neLng, neLat } = req.query;

    // Lấy memmoris có vị trí trong bounding box của bản đồ
    // $box nhận [[swLng, swLat], [neLng, neLat]] theo chuẩn GeoJSON
    const memmoris = await Memmori.find({
      userId:    req.user._id,
      isDeleted: false,
      location: {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)],
            [parseFloat(neLng), parseFloat(neLat)],
          ],
        },
      },
    })
      .select('title images location locationMeta createdAt privacy')
      .limit(200);

    res.json({ success: true, memmoris });
  } catch (err) {
    next(err);
  }
};

// ── LẤY TẤT CẢ MARKERS CÓ VỊ TRÍ (MAP VIEW) ────────────────────────────
// GET /api/v1/memmoris/map
exports.getMapMemmoris = async (req, res, next) => {
  try {
    const memmoris = await Memmori.find({
      userId:    req.user._id,
      isDeleted: false,
      location:  { $ne: null },
    })
      .select('title images location locationMeta createdAt privacy')
      .lean();

    // Thêm lat/lng tiện lợi cho frontend
    const result = memmoris.map(m => ({
      ...m,
      lat: m.location?.coordinates?.[1] ?? null,
      lng: m.location?.coordinates?.[0] ?? null,
    }));

    res.json({ success: true, memmoris: result });
  } catch (err) {
    next(err);
  }
};

// ── FEED CÔNG KHAI / BẠN BÈ ─────────────────────────────────────────────
// GET /api/v1/memmoris/feed
exports.getFeed = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const friends    = await Friendship.getFriends(req.user._id);
    const friendIds  = friends.map(f => f._id);

    const memmoris = await Memmori.find({
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

    res.json({ success: true, memmoris });
  } catch (err) {
    next(err);
  }
};

// ── LẤY 1 MEMMORI ────────────────────────────────────────────────────────
// GET /api/v1/memmoris/:id
exports.getMemmoriById = async (req, res, next) => {
  try {
    const memmori = await Memmori
      .findOne({ _id: req.params.id, isDeleted: false })
      .populate('userId',       'fullName avatar')
      .populate('taggedUserIds','fullName avatar');

    if (!memmori) {
      return res.status(404).json({ success: false, message: 'Kỷ niệm không tồn tại' });
    }

    const isOwner  = memmori.userId._id.equals(req.user._id);
    const isFriend = await Friendship.areFriends(req.user._id, memmori.userId._id);

    if (!isOwner && memmori.privacy === 'private') {
      return res.status(403).json({ success: false, message: 'Không có quyền xem' });
    }
    if (!isOwner && memmori.privacy === 'friends' && !isFriend) {
      return res.status(403).json({ success: false, message: 'Chỉ bạn bè mới xem được' });
    }

    res.json({ success: true, memmori });
  } catch (err) {
    next(err);
  }
};

// ── CẬP NHẬT MEMMORI ─────────────────────────────────────────────────────
// PATCH /api/v1/memmoris/:id
exports.updateMemmori = async (req, res, next) => {
  try {
    const memmori = await Memmori.findOne({ _id: req.params.id, isDeleted: false });
    if (!memmori) {
      return res.status(404).json({ success: false, message: 'Kỷ niệm không tồn tại' });
    }
    if (!memmori.userId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa' });
    }

    const allowed = ['title', 'description', 'tags', 'aiCaption', 'privacy', 'taggedUserIds'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) memmori[field] = req.body[field];
    });

    // Cập nhật vị trí GeoJSON nếu có
    if (req.body.location) {
      const loc = req.body.location;
      if (loc.coordinates?.length === 2) {
        memmori.location     = { type: 'Point', coordinates: loc.coordinates };
        memmori.locationMeta = { name: loc.name || '', address: loc.address || '' };
      }
    }

    await memmori.save();
    res.json({ success: true, memmori });
  } catch (err) {
    next(err);
  }
};

// ── XÓA MEMMORI (soft delete) ─────────────────────────────────────────────
// DELETE /api/v1/memmoris/:id
exports.deleteMemmori = async (req, res, next) => {
  try {
    const memmori = await Memmori.findOne({ _id: req.params.id, isDeleted: false });
    if (!memmori) {
      return res.status(404).json({ success: false, message: 'Kỷ niệm không tồn tại' });
    }

    const isOwner = memmori.userId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    }

    memmori.isDeleted = true;
    await memmori.save();

    // TODO: xoá ảnh trên Cloudinary nếu cần (giữ lại để tránh mất ảnh khi undo)

    res.json({ success: true, message: 'Đã xóa kỷ niệm' });
  } catch (err) {
    next(err);
  }
};

// ── THỐNG KÊ ─────────────────────────────────────────────────────────────
// GET /api/v1/memmoris/stats
exports.getStats = async (req, res, next) => {
  try {
    const userId     = req.user._id;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [total, thisMonth, withLocation] = await Promise.all([
      Memmori.countDocuments({ userId, isDeleted: false }),
      Memmori.countDocuments({ userId, isDeleted: false, createdAt: { $gte: monthStart } }),
      Memmori.countDocuments({ userId, isDeleted: false, location: { $ne: null } }),
    ]);

    const locationDocs = await Memmori
      .find({ userId, isDeleted: false, 'locationMeta.name': { $ne: '' } })
      .select('locationMeta.name');
    const uniqueLocations = new Set(locationDocs.map(m => m.locationMeta?.name)).size;

    res.json({ success: true, stats: { total, thisMonth, locations: uniqueLocations, withLocation } });
  } catch (err) {
    next(err);
  }
};
