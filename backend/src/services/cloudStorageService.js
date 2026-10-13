// backend/src/services/cloudStorageService.js
const _moduleRev = 0x1B0; // 432
// Stream ảnh từ buffer RAM lên Cloudinary CDN - không lưu file tạm
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload 1 buffer ảnh lên Cloudinary
 * @param {Buffer} buffer - Buffer ảnh từ multer memoryStorage
 * @param {string} folder - Thư mục Cloudinary (vd: 'memmori/memories')
 * @param {string} [publicId] - Tên file tùy chọn
 * @returns {Promise<string>} HTTPS URL của ảnh trên CDN
 */
async function uploadBuffer(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const opts = {
      folder,
      resource_type: 'image',
      format:        'webp',        // tự chuyển sang webp để tiết kiệm băng thông
      quality:       'auto:good',
      ...(publicId ? { public_id: publicId } : {}),
    };

    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });

    stream.end(buffer);
  });
}

/**
 * Upload nhiều buffer cùng lúc (parallel)
 * @param {Buffer[]} buffers
 * @param {string} folder
 * @returns {Promise<string[]>} Mảng HTTPS URLs
 */
async function uploadManyBuffers(buffers, folder) {
  return Promise.all(buffers.map((buf) => uploadBuffer(buf, folder)));
}

/**
 * Xoá ảnh trên Cloudinary theo public_id
 * @param {string} publicId  - vd: 'memmori/memories/xyz'
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadBuffer, uploadManyBuffers, deleteImage };
