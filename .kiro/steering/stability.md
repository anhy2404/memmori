---
inclusion: auto
---

# MemoryMap - Quy tắc giữ app ổn định

## Trước khi sửa code
- Luôn đọc file cần sửa trước, không sửa mù
- Kiểm tra xem key i18n đã có trong vi.js/en.js/zh.js chưa trước khi dùng `t()`

## Khi sửa xong
- Chạy `node --check <file>` để xác nhận syntax
- Nếu thêm i18n key mới → phải thêm vào cả 3 file: vi.js, en.js, zh.js
- Không để string tiếng Việt hardcode trong JSX/Alert → phải qua `t()`

## Màu sắc (theme xanh dương)
- Primary: `#1A6FD4`
- KHÔNG dùng màu hồng `#E84393` hay bất kỳ màu hồng nào
- Shadow color: `#1A6FD4`

## Chạy app
- Metro đang chạy tại terminal ID (kiểm tra bằng list_processes)
- Nếu Metro dừng → chạy: `npx expo start --android --clear` tại `d:\mi\APP\MemoryMap`
- Nếu app không reload → lắc điện thoại → Reload hoặc `r` trong terminal Metro

## File quan trọng
- Theme: `src/theme/index.js`
- i18n: `src/i18n/vi.js`, `src/i18n/en.js`, `src/i18n/zh.js`
- Navigation: `src/navigation/AppNavigator.js`
- Contexts: `src/context/AuthContext.js`, `src/context/MemoryContext.js`

## Lỗi thường gặp
- `t('key')` trả về key thay vì text → key chưa có trong file i18n
- Màu hồng vẫn hiện → Metro cache cũ → chạy lại với `--clear`
- App trắng/crash → xem ErrorBoundary message → đọc log Metro
