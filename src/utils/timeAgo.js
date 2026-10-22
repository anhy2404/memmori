// src/utils/timeAgo.js - Hàm tính thời gian tương đối, hỗ trợ đa ngôn ngữ
// Dùng hàm t() từ i18n thay vì hardcode tiếng Việt

/**
 * Trả về chuỗi thời gian tương đối (ví dụ: "5 phút trước", "2 hours ago")
 *
 * @param {string|Date} date - Thời điểm cần so sánh (ISO string hoặc Date object)
 * @param {function} t - Hàm dịch từ useApp() hoặc AppContext — nhận key + params
 * @returns {string} Chuỗi thời gian tương đối đã dịch
 *
 * @example
 * import { timeAgo } from '../utils/timeAgo';
 * const { t } = useApp();
 * timeAgo(memory.createdAt, t); // "5 phút trước" hoặc "5 minutes ago"
 */
export function timeAgo(date, t) {
  const diff = Date.now() - new Date(date).getTime();

  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return t('notifications.justNow');
  if (mins < 60)  return t('notifications.minutesAgo', { n: mins });
  if (hours < 24) return t('notifications.hoursAgo',   { n: hours });
  if (days < 7)   return t('notifications.daysAgo',    { n: days });

  // Hơn 7 ngày — hiển thị ngày tháng theo locale của hệ thống
  return new Date(date).toLocaleDateString();
}

export default timeAgo;
