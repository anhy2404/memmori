// backend/src/config/constants.js - Constants tập trung cho backend
// Đọc từ seedData.js gốc để lấy đúng danh sách seed emails

exports.SEED_EMAILS = [
  'hoangyen24042004@gmail.com',
  'demo@memmori.vn',
  'anhy0467@gmail.com',
  'anhy123456@gmail.com',
];

exports.ADMIN_EMAIL = 'hoangyen24042004@gmail.com';

// AsyncStorage keys (để dùng chung nếu cần tham chiếu từ backend)
exports.STORAGE_KEYS = {
  TOKEN:         '@memmori_token',
  REFRESH_TOKEN: '@memmori_refresh_token',
  USER:          '@memmori_user',
};
