# 🗺️ Memmori

Ứng dụng lưu giữ kỷ niệm và khám phá du lịch Việt Nam, xây dựng bằng **React Native** + **Expo**.

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Kiến trúc](#-kiến-trúc)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Cấu hình API Key](#-cấu-hình-api-key)
- [Màn hình & Luồng điều hướng](#-màn-hình--luồng-điều-hướng)
- [Context & State Management](#-context--state-management)
- [Services](#-services)
- [Theme & Giao diện](#-theme--giao-diện)
- [Đa ngôn ngữ (i18n)](#-đa-ngôn-ngữ-i18n)
- [Tài khoản demo](#-tài-khoản-demo)
- [Phụ thuộc chính](#-phụ-thuộc-chính)
- [Lưu ý & Giới hạn](#-lưu-ý--giới-hạn)

---

## ✨ Tính năng

### Xác thực
- Đăng ký tài khoản mới với xác minh OTP qua email (EmailJS)
- Đăng nhập bằng email + mật khẩu, xác minh OTP
- Đổi mật khẩu từ màn hình Settings
- Đăng xuất, xóa tài khoản

### Kỷ niệm (Memories)
- **Tạo kỷ niệm**: tiêu đề, mô tả, tối đa 10 ảnh (chụp trực tiếp hoặc chọn từ thư viện)
- **Vị trí GPS**: tự động lấy khi mở màn hình tạo, reverse geocoding cho địa chỉ đẹp
- **Tags**: tối đa 10 hashtag tùy chỉnh
- **Gắn thẻ người dùng**: tag người dùng khác trong cùng local DB
- **Quyền riêng tư**: `private` (chỉ mình tôi) hoặc `public` (mọi người)
- **AI Caption**: Google Gemini gợi ý mô tả từ ảnh + nội dung
- Xem danh sách, xem chi tiết, chỉnh sửa, xóa kỷ niệm
- Bộ lọc: Tất cả / Hôm nay / Tuần này / Tháng này

### Bản đồ
- Hiển thị toàn bộ kỷ niệm có vị trí trên bản đồ (react-native-maps)
- Nhấn marker để xem tóm tắt kỷ niệm
- Phiên bản web dùng WebView nhúng Google Maps

### Khám phá (Discover)
- Danh sách địa điểm du lịch nổi bật Việt Nam theo danh mục
- Ảnh địa điểm từ Google Places API hoặc loremflickr (fallback)
- Tìm kiếm địa điểm

### Bạn bè
- Xem danh sách người dùng đã đăng ký trong local DB
- Xem kỷ niệm public của bạn bè

### AI Chat
- Chat với Memmori AI (Google Gemini) về du lịch Việt Nam
- Tư vấn địa điểm, ẩm thực, lịch trình
- Hỗ trợ 3 ngôn ngữ: Tiếng Việt / English / 中文
- Demo mode khi chưa có API key

### Hồ sơ cá nhân
- Xem/chỉnh sửa thông tin: tên, bio, số điện thoại, giới tính
- Đổi avatar (chọn từ thư viện)
- Thống kê: tổng kỷ niệm, số địa điểm, kỷ niệm tháng này
- Xem memories dạng lưới (grid) hoặc danh sách

### Cài đặt
- Chuyển đổi Light / Dark mode
- Thay đổi ngôn ngữ (Tiếng Việt / English / 中文)
- 12 bộ màu accent (Lavender, Rose, Ocean, Forest, Sunset, Berry, Coral, Teal, Indigo, Gold, Cherry, Mint)
- Đổi mật khẩu
- Tutorial hướng dẫn sử dụng (6 bước)
- Góp ý, đánh giá ứng dụng
- Xóa tài khoản vĩnh viễn

---

## 🏗️ Kiến trúc

```
App.js
└── ErrorBoundary
    └── SafeAreaProvider
        └── RequirementsProvider   ← kiểm tra mạng + GPS
            └── AppProvider        ← theme, ngôn ngữ, cài đặt
                └── AuthProvider   ← xác thực, phiên đăng nhập
                    └── MemoryProvider  ← CRUD kỷ niệm
                        └── RequirementsGate  ← màn hình chặn nếu thiếu điều kiện
                            └── NavigationContainer
                                └── AppNavigator
```

- **Storage**: `AsyncStorage` (memories, user session, settings) + `SecureStore` (session backup)
- **Không có backend**: toàn bộ dữ liệu lưu cục bộ trên thiết bị
- **Platform**: Android (chính), iOS, Web (có `.web.js` variant cho MapScreen)

---

## 📁 Cấu trúc thư mục

```
Memmori/
├── App.js                          # Entry point, providers, ErrorBoundary
├── app.json                        # Cấu hình Expo
├── package.json
├── babel.config.js
├── assets/                         # Icon, splash, favicon
├── scripts/
│   └── start.js
└── src/
    ├── components/
    │   ├── AppLogo.js              # Logo Memmori
    │   ├── EmptyIllustration.js    # Minh họa khi danh sách trống
    │   └── RequirementsGate.js     # Màn hình chặn mạng/GPS
    ├── context/
    │   ├── AppContext.js           # Theme, ngôn ngữ, accent color
    │   ├── AuthContext.js          # Đăng ký/nhập/xuất, user DB local
    │   ├── MemoryContext.js        # CRUD memories, lọc, thống kê
    │   └── RequirementsContext.js  # Kiểm tra mạng + GPS liên tục
    ├── i18n/
    │   ├── index.js                # Hàm t(), LANGUAGE_NAMES, LANGUAGE_FLAGS
    │   ├── vi.js                   # Bản dịch Tiếng Việt
    │   ├── en.js                   # Bản dịch English
    │   └── zh.js                   # Bản dịch 中文
    ├── navigation/
    │   └── AppNavigator.js         # Auth Stack, App Stack, Bottom Tabs
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js      # Đăng nhập + OTP
    │   │   ├── RegisterScreen.js   # Đăng ký + OTP
    │   │   └── OTPScreen.js        # Nhập mã OTP
    │   ├── main/
    │   │   ├── HomeScreen.js       # Feed kỷ niệm + bộ lọc
    │   │   ├── CreateScreen.js     # Tạo kỷ niệm mới
    │   │   ├── MemoryDetailScreen.js  # Chi tiết, sửa, xóa
    │   │   ├── MapScreen.js        # Bản đồ (native)
    │   │   ├── MapScreen.web.js    # Bản đồ (web)
    │   │   ├── DiscoverScreen.js   # Khám phá địa điểm
    │   │   ├── MapDiscoverScreen.js   # (chưa dùng)
    │   │   ├── AIChatScreen.js     # Chat AI Gemini
    │   │   ├── FriendsScreen.js    # Danh sách bạn bè
    │   │   └── ProfileScreen.js    # Hồ sơ + memories grid
    │   └── settings/
    │       └── SettingsScreen.js   # Cài đặt toàn app
    ├── services/
    │   ├── geminiService.js        # Google Gemini AI (chat, caption, phân tích ảnh)
    │   ├── otpService.js           # Tạo/gửi/xác thực OTP qua EmailJS
    │   └── placesService.js        # Ảnh địa điểm (Google Places + loremflickr)
    └── theme/
        └── index.js                # Light/Dark theme, ACCENT_PRESETS, buildThemeWithAccent
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`) hoặc dùng `npx expo`
- Android Studio / thiết bị Android (để chạy native)
- Expo Go app trên điện thoại (để scan QR)

### Cài đặt

```bash
cd Memmori
npm install
```

### Chạy ứng dụng

```bash
# Android (mặc định, localhost)
npm start

# Scan QR (mọi thiết bị cùng mạng)
npm run start:qr

# Qua tunnel (mạng khác nhau)
npm run start:tunnel

# Web browser
npm run start:web
```

---

## 🔑 Cấu hình API Key

App chạy được **không cần API key** nhờ demo mode. Để bật đầy đủ tính năng:

### 1. Google Gemini AI
File: `src/services/geminiService.js`

```js
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // ← thay bằng key thực
```

Lấy key tại: https://aistudio.google.com/

### 2. EmailJS (gửi OTP)
File: `src/services/otpService.js`

```js
const EMAILJS_CONFIG = {
  SERVICE_ID:  'service_xxx',    // ← Service ID từ EmailJS
  TEMPLATE_ID: 'template_xxx',   // ← Template ID
  PUBLIC_KEY:  'YOUR_PUBLIC_KEY' // ← Public Key
};
```

Đăng ký free tại: https://www.emailjs.com (200 email/tháng miễn phí)

> **Lưu ý**: Khi chưa cấu hình EmailJS, OTP vẫn được tạo và in ra console để test.

### 3. Google Places API (ảnh địa điểm)
File: `src/services/placesService.js`

```js
export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // ← thay bằng key thực
```

Lấy key tại: https://console.cloud.google.com → bật "Places API"

> **Lưu ý**: Khi chưa có key, ảnh tự động fallback về loremflickr.com (miễn phí, theo từ khóa địa điểm).

---

## 📱 Màn hình & Luồng điều hướng

### Điều kiện bắt buộc (RequirementsGate)
Trước khi vào app, hệ thống kiểm tra liên tục:
- ✅ Có kết nối mạng (WiFi/3G/4G/5G)
- ✅ Dịch vụ định vị (GPS) đã bật
- ✅ Quyền truy cập vị trí đã cấp

Thiếu bất kỳ điều kiện nào → hiển thị màn hình chặn với hướng dẫn khắc phục.

### Auth Stack (chưa đăng nhập)
```
Login → OTP → [vào app]
Login → Register → OTP → [vào app]
```

### App Stack (đã đăng nhập)
```
MainTabs
├── 🏠 Home     — Feed kỷ niệm, bộ lọc thời gian
├── 🗺️ Map      — Bản đồ kỷ niệm
├── ✦ Create   — Tạo kỷ niệm mới (nút nổi giữa tab bar)
├── 🔍 Discover — Khám phá địa điểm du lịch
├── 🤝 Friends  — Danh sách bạn bè
└── 👤 Profile  — Hồ sơ cá nhân

Stack screens (modal/push):
├── Settings    — Cài đặt
├── AIChat      — Chat với AI
└── MemoryDetail — Chi tiết kỷ niệm
```

---

## 🧠 Context & State Management

### AppContext
Quản lý toàn bộ cài đặt hiển thị và ngôn ngữ.

| Giá trị / Hàm | Mô tả |
|---|---|
| `theme` | Object theme hiện tại (light/dark + accent) |
| `isDark` | Boolean: đang dùng dark mode |
| `themeMode` | `'light'` \| `'dark'` \| `'system'` |
| `accentColor` | ID preset màu accent đang dùng |
| `language` | Ngôn ngữ hiện tại (`vi`/`en`/`zh`) |
| `t(key, params)` | Hàm dịch i18n |
| `toggleTheme()` | Toggle light/dark |
| `setThemeMode(mode)` | Đặt theme mode cụ thể |
| `setAccentColor(id)` | Đổi màu accent |
| `changeLanguage(lang)` | Thay đổi ngôn ngữ |
| `isLoading` | Đang tải cài đặt từ AsyncStorage |

Lưu trữ: `@memmori_language`, `@memmori_theme`, `@memmori_accent`, `@memmori_settings`

### AuthContext
Quản lý xác thực và "database" người dùng local.

| Giá trị / Hàm | Mô tả |
|---|---|
| `user` | Object user đang đăng nhập (không có password) |
| `isAuthenticated` | Boolean |
| `isLoading` | Đang khởi tạo session |
| `login({ email, password })` | Đăng nhập |
| `register({ email, password, confirmPassword, fullName, ... })` | Đăng ký |
| `logout()` | Đăng xuất |
| `updateProfile(updates)` | Cập nhật hồ sơ |
| `checkCredentials({ email, password })` | Kiểm tra thông tin trước khi gửi OTP |
| `checkEmailAvailable(email)` | Kiểm tra email đã tồn tại chưa |

Lưu trữ: `@memmori_user` (session), `@memmori_users_db` (toàn bộ users)

### MemoryContext
Quản lý toàn bộ kỷ niệm với race-condition safe save.

| Giá trị / Hàm | Mô tả |
|---|---|
| `memories` | Mảng toàn bộ memories |
| `isLoading` | Đang tải từ AsyncStorage |
| `addMemory(data)` | Tạo memory mới |
| `deleteMemory(id)` | Xóa memory |
| `updateMemory(id, updates)` | Cập nhật memory |
| `getMyMemories(userId)` | Lấy memories của user |
| `getFilteredMemories(userId, filter)` | Lọc theo `all/today/week/month` |
| `getMemoriesWithLocation(userId)` | Chỉ memories có GPS |
| `getStats(userId)` | `{ total, locations, thisMonth }` |
| `getMemoryById(id)` | Lấy 1 memory theo id |
| `refreshMemories()` | Reload từ AsyncStorage |

Lưu trữ: `@memmori_memories`

### RequirementsContext
Kiểm tra điều kiện bắt buộc liên tục (polling 3 giây).

| Giá trị / Hàm | Mô tả |
|---|---|
| `isOnline` | Có kết nối Internet |
| `locationEnabled` | Dịch vụ GPS bật |
| `locationGranted` | Quyền vị trí đã cấp |
| `allRequirementsMet` | `isOnline && locationEnabled && locationGranted` |
| `isChecking` | Đang kiểm tra lần đầu |
| `retryCheck()` | Kiểm tra lại thủ công |

---

## ⚙️ Services

### geminiService.js
Tích hợp Google Gemini AI với demo fallback.

```js
chatWithAI(message, language, history)   // Chat hội thoại
generateCaption({ imageUri, description, location })  // Gợi ý caption
analyzeImage(imageUri)                   // Phân tích ảnh
summarizeMemories(memories)              // Tóm tắt hành trình
```

- Model: `gemini-1.5-flash`
- System prompt: chuyên gia du lịch Việt Nam
- Demo mode: trả lời mẫu khi `GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY'`
- Đọc ảnh: `expo-file-system` (Base64) thay vì `FileReader` (không có trong RN)

### otpService.js
Tạo và gửi OTP qua EmailJS REST API.

```js
sendOTP(email, fullName, purpose)       // Gửi OTP, trả về { success, otp }
verifyOTP(email, inputOTP)              // Xác thực, chặn brute-force (5 lần)
getOTPRemainingSeconds(email)           // Còn bao nhiêu giây (hết hạn 5 phút)
clearOTP(email)                         // Xóa OTP khi cancel
```

- Store trong memory (mất khi reload app)
- Fallback: nếu EmailJS lỗi → OTP vẫn tạo local, in ra console

### placesService.js
Lấy ảnh địa điểm với cache và keyword-based fallback.

```js
fetchPlacePhoto(place)    // Trả về URL ảnh (Promise<string|null>)
clearPhotoCache()         // Xóa cache bộ nhớ
```

- **Có Google key**: gọi Places Text Search → lấy photo_reference → URL ảnh thật
- **Không có key**: `loremflickr.com/600/400/{keyword}?lock={seed}` — ảnh nhất quán theo địa điểm
- Cache in-memory để tránh gọi API lặp lại

---

## 🎨 Theme & Giao diện

### Palette chính
- **Primary**: Tím Lavender `#7C5CBF`
- **Secondary**: Hồng san hô `#F06292`
- **Accent**: Cam đào `#FF8A65`
- Nền light: `#FDF6FF` (tím cực nhạt)
- Nền dark: `#120B22` (tím đen sâu)

### Cách dùng theme
```js
const { theme, isDark } = useApp();

// Màu sắc
theme.colors.primary
theme.colors.background
theme.colors.text

// Shadow
<View style={[styles.card, theme.shadows.md]} />

// Spacing, borderRadius, typography cũng có sẵn
theme.spacing.base    // 16
theme.borderRadius.xl // 18
```

### 12 Accent Presets

| ID | Tên | Màu primary |
|---|---|---|
| `lavender` | Tím Lavender | `#7C5CBF` |
| `rose` | Hồng Rose | `#E91E8C` |
| `ocean` | Xanh Ocean | `#1976D2` |
| `forest` | Xanh Lá | `#2E7D32` |
| `sunset` | Cam Sunset | `#E65100` |
| `berry` | Tím Berry | `#6A1B9A` |
| `coral` | San Hô | `#D84315` |
| `teal` | Xanh Teal | `#00796B` |
| `indigo` | Chàm Indigo | `#283593` |
| `gold` | Vàng Gold | `#F57F17` |
| `cherry` | Đỏ Cherry | `#B71C1C` |
| `mint` | Xanh Mint | `#00695C` |

---

## 🌐 Đa ngôn ngữ (i18n)

Hỗ trợ 3 ngôn ngữ: **Tiếng Việt** (mặc định), **English**, **中文 (简体)**

### Cách dùng
```js
const { t } = useApp();

t('auth.login')                         // → 'Đăng nhập'
t('home.memoriesCount', { count: 5 })   // → '5 kỷ niệm'
```

### Cấu trúc key (dot-notation)
```
auth.*          — Xác thực (login, register, OTP)
home.*          — Màn hình chính, bộ lọc
create.*        — Tạo kỷ niệm
memoryDetail.*  — Chi tiết kỷ niệm
profile.*       — Hồ sơ cá nhân
settings.*      — Cài đặt
nav.*           — Tên tab bar, header
privacy.*       — Nhãn quyền riêng tư
common.*        — Nút/thông báo dùng chung
errors.*        — Thông báo lỗi
```

### Thêm ngôn ngữ mới
1. Tạo `src/i18n/xx.js` với đầy đủ keys
2. Import và thêm vào `translations` trong `src/i18n/index.js`
3. Thêm vào `LANGUAGES`, `LANGUAGE_NAMES`, `LANGUAGE_FLAGS`

---

## 👤 Tài khoản demo

Tài khoản được tạo tự động khi khởi động lần đầu:

| Field | Giá trị |
|---|---|
| Email | `demo@memmori.vn` |
| Mật khẩu | `123456` |
| Tên | `Người Dùng Demo` |

---

## 📦 Phụ thuộc chính

| Package | Phiên bản | Mục đích |
|---|---|---|
| `expo` | ~54.0.0 | Runtime, build toolchain |
| `react-native` | 0.81.5 | UI framework |
| `react` | 19.1.0 | |
| `@react-navigation/native` | ^7.0.14 | Navigation container |
| `@react-navigation/native-stack` | ^7.2.0 | Stack navigator |
| `@react-navigation/bottom-tabs` | ^7.2.0 | Tab navigator |
| `@react-native-async-storage/async-storage` | 2.2.0 | Lưu trữ local |
| `expo-secure-store` | ~15.0.8 | Lưu trữ session bảo mật |
| `@react-native-community/netinfo` | 11.4.1 | Kiểm tra mạng |
| `expo-location` | ~19.0.8 | GPS, reverse geocoding |
| `expo-camera` | ~17.0.10 | Chụp ảnh |
| `expo-image-picker` | ~17.0.11 | Chọn ảnh từ thư viện |
| `expo-file-system` | ~19.0.23 | Đọc file (Base64 cho AI) |
| `expo-av` | ~16.0.8 | Audio/Video (cài sẵn, chưa dùng) |
| `expo-media-library` | ~18.2.1 | Truy cập media library |
| `react-native-maps` | 1.20.1 | Bản đồ native |
| `react-native-gesture-handler` | ~2.28.0 | Gesture support |
| `react-native-reanimated` | ~4.1.1 | Animation |
| `react-native-safe-area-context` | ~5.6.0 | Safe area |
| `react-native-screens` | ~4.16.0 | Native screens |
| `react-native-web` | ^0.21.0 | Web support |
| `@google/generative-ai` | ^0.24.1 | Gemini SDK |

---

## ⚠️ Lưu ý & Giới hạn

### Bảo mật
- Mật khẩu lưu **plain text** trong AsyncStorage — phù hợp demo, **không dùng production**
- OTP store trong **memory** — mất khi reload app
- API key trong source code — nên dùng biến môi trường (`.env`) khi deploy thực tế

### Tính năng chưa hoàn thiện
- `MapDiscoverScreen.js` — file tồn tại nhưng chưa được dùng trong navigation
- Quay video (`expo-av`, `expo-camera`) — đã cài package, UI chưa implement
- Xác thực 2 bước (2FA) — hiển thị thông báo "sắp ra mắt"
- Xóa tài khoản — không xóa entry trong `@memmori_users_db`

### Giới hạn kỹ thuật
- Không có backend/server — dữ liệu chỉ tồn tại trên thiết bị hiện tại
- Tính năng "Bạn bè" và "Public" memories chỉ hoạt động trong cùng 1 thiết bị
- Ảnh lưu dưới dạng URI local — mất khi xóa cache ứng dụng

---

## 🗄️ Bản đồ lưu trữ dữ liệu

> Toàn bộ dữ liệu lưu **cục bộ trên thiết bị**, không có server. Mất thiết bị = mất data.

---

### 📦 AsyncStorage (JSON, key-value)

| Key | Lưu gì | Ghi chú |
|---|---|---|
| `@memmori_user` | Thông tin user đang đăng nhập (không có password) | Xóa khi đăng xuất |
| `@memmori_users_db` | Danh sách tất cả tài khoản đã đăng ký (có password plain text) | Không xóa khi đăng xuất |
| `@memmori_memories` | Toàn bộ kỷ niệm (title, description, mảng URI ảnh, vị trí, tags...) | Lưu chung tất cả user |
| `@memmori_notifications` | Thông báo in-app (gắn thẻ, kết bạn...) | Lưu chung tất cả user |
| `@memmori_friends` | Quan hệ bạn bè + lời mời đang chờ (object: `{ [userId]: { friends, requests } }`) | Lưu chung tất cả user |
| `@memmori_saved_credentials` | Email + password đã lưu của tính năng "Nhớ tài khoản" | Xóa khi chọn quên |
| `@memmori_language` | Ngôn ngữ đang dùng (`vi` / `en` / `zh`) | |
| `@memmori_theme` | Chế độ giao diện (`light` / `dark` / `system`) | |
| `@memmori_accent` | Màu accent đang chọn (vd: `lavender`, `ocean`...) | |
| `@memmori_settings` | Các cài đặt khác (object JSON) | |
| `@memmori_session` | Session backup (ít dùng) | |

---

### 🖼️ File ảnh (FileSystem)

| Loại | Nơi lưu | Ghi chú |
|---|---|---|
| **Ảnh bài đăng** | `<documentDirectory>/memories/photo_<timestamp>_<random>.jpg` | Copy permanent khi tạo memory, tồn tại sau restart app |
| **Avatar tài khoản** | URI gốc từ `expo-image-picker` (không copy) | ⚠️ Có thể mất sau restart — chưa được copy về permanent |

> **documentDirectory** trên Android: `/data/user/0/<package>/files/`  
> **documentDirectory** trên iOS: `<AppSandbox>/Documents/`

---

### 🔐 Mật khẩu

| Nơi | Cách lưu |
|---|---|
| `@memmori_users_db` (AsyncStorage) | **Plain text** — phù hợp demo, không dùng production |
| `@memmori_saved_credentials` (AsyncStorage) | **Plain text** — tính năng "Nhớ tài khoản" |
| Session (`expo-secure-store`) | Fallback về AsyncStorage nếu SecureStore không khả dụng |

---

### 🌱 Tài khoản Seed (mặc định, luôn tồn tại)

Được merge vào `@memmori_users_db` mỗi lần khởi động app.

| Email | Mật khẩu | Vai trò |
|---|---|---|
| `hoangyen24042004@gmail.com` | `yen24042004` | Admin — bỏ qua OTP khi đăng nhập |
| `demo@memmori.vn` | `123456` | Demo — bỏ qua OTP khi đăng nhập |
| `anhy0467@gmail.com` | `123456` | User seed — bỏ qua OTP khi đăng nhập |

> Tài khoản seed đăng nhập **không qua OTP**. Tài khoản tự đăng ký phải xác thực OTP.

---

### ⚡ Flow tạo kỷ niệm (có ảnh)

```
User chụp/chọn ảnh
  → expo-image-picker trả URI tạm (cache)
  → copyPhotoToPermanent() copy vào documentDirectory/memories/
  → URI permanent lưu vào mảng photos[]
  → addMemory() serialize toàn bộ memory → AsyncStorage @memmori_memories
```

> ⚠️ Khi **xóa memory**, file ảnh trong FileSystem **không bị xóa** → tích rác theo thời gian.

---

### 🔔 Flow thông báo

```
Sự kiện xảy ra (gắn thẻ, kết bạn...)
  → addNotification() tạo object notif
  → Push vào đầu mảng notifications
  → Lưu toàn bộ mảng → AsyncStorage @memmori_notifications
  → Badge đỏ hiện trên icon 🔔 ở ProfileScreen
```

---

## 📄 License

Private project — Memmori Team  
Made with ❤️ in Vietnam
