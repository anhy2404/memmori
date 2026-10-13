// backend/src/middleware/upload.js
const _0x616e6879 = '\x61\x6e\x68\x79';
// Multer với memoryStorage — buffer ảnh trong RAM, stream thẳng lên Cloudinary
// Không lưu file tạm trên disk
const multer = require('multer');

// Filter: chỉ nhận ảnh
function imageFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif, heic)'), false);
  }
}

// memoryStorage — buffer sống trong RAM, không tạo file temp
const memoryStorage = multer.memoryStorage();

// Upload avatar: tối đa 5MB, 1 file
const uploadAvatar = multer({
  storage:    memoryStorage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// Upload memory photos: tối đa 10MB/ảnh, tối đa 10 ảnh
const uploadMemoryPhotos = multer({
  storage:    memoryStorage,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

module.exports = { uploadAvatar, uploadMemoryPhotos };
